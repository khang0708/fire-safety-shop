// tests/uploads-test.js
// Tải ảnh banner lên: chỉ admin, chỉ ảnh thật (PNG/JPG/WEBP), có giới hạn dung lượng,
// lưu thành tệp trong DATA_DIR/uploads và phục vụ lại an toàn.

import './_setup-env.js';
import fs from 'fs';
import path from 'path';
import { saveImageDataUrl, resolveUploadFile, UPLOAD_DIR, UPLOAD_MAX_BYTES } from '../server/uploads.js';
import { sanitizeCategoryInput } from '../server/categories.js';

console.log('====================================================');
console.log('🖼️ BẮT ĐẦU KIỂM THỬ TẢI ẢNH BANNER LÊN');
console.log('====================================================\n');

let passed = 0;
let failed = 0;
function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.log(`  ❌ [FAIL] ${message}${details ? ' -> ' + details : ''}`);
    failed++;
  }
}

// Ảnh tối thiểu hợp lệ theo "magic bytes"
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, 1)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32, 2)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x20, 0, 0, 0]), Buffer.from('WEBP'), Buffer.alloc(32, 3)]);
const dataUrl = (mime, buf) => `data:${mime};base64,${buf.toString('base64')}`;

// ----------------------------------------------------
console.log('1️⃣ LOGIC LƯU ẢNH (server/uploads.js):');
const okPng = saveImageDataUrl(dataUrl('image/png', PNG));
assert(okPng.ok && /^\/uploads\/[0-9]{13}-[a-f0-9]{16}\.png$/.test(okPng.url), 'PNG hợp lệ được lưu, tên tệp do server sinh', okPng.url || okPng.message);
const okJpg = saveImageDataUrl(dataUrl('image/jpeg', JPG));
assert(okJpg.ok && okJpg.url.endsWith('.jpg'), 'JPEG hợp lệ được lưu (đuôi .jpg)');
const okWebp = saveImageDataUrl(dataUrl('image/webp', WEBP));
assert(okWebp.ok && okWebp.url.endsWith('.webp'), 'WEBP hợp lệ được lưu');
assert(fs.existsSync(path.join(UPLOAD_DIR, path.basename(okPng.url))), 'Tệp thực sự nằm trong DATA_DIR/uploads');
assert(fs.readFileSync(path.join(UPLOAD_DIR, path.basename(okPng.url))).equals(PNG), 'Nội dung tệp đã lưu khớp từng byte');

const svg = saveImageDataUrl(`data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString('base64')}`);
assert(!svg.ok && svg.status === 415, 'SVG (có thể chứa script) bị từ chối');
const html = saveImageDataUrl(dataUrl('image/png', Buffer.from('<html><script>alert(1)</script></html>')));
assert(!html.ok && html.status === 415, 'HTML giả danh .png (sai magic bytes) bị từ chối');
const mismatch = saveImageDataUrl(dataUrl('image/png', JPG));
assert(!mismatch.ok && mismatch.status === 415, 'Khai báo PNG nhưng nội dung là JPEG bị từ chối');
const big = saveImageDataUrl(dataUrl('image/jpeg', Buffer.concat([JPG, Buffer.alloc(UPLOAD_MAX_BYTES + 1024, 7)])));
assert(!big.ok && big.status === 413, 'Ảnh vượt giới hạn dung lượng bị từ chối (413)');
assert(!saveImageDataUrl('not a data url').ok, 'Chuỗi không phải data URL bị từ chối');
assert(!saveImageDataUrl(undefined).ok && !saveImageDataUrl(null).ok && !saveImageDataUrl({}).ok, 'Thiếu / sai kiểu dữ liệu bị từ chối');
assert(!saveImageDataUrl('data:image/png;base64,@@@@').ok, 'Base64 chứa ký tự lạ bị từ chối');
assert(!saveImageDataUrl('data:image/png;charset=utf-8,abc').ok, 'Data URL không phải base64 bị từ chối');
assert(!saveImageDataUrl('data:image/png;base64,').ok, 'Ảnh rỗng bị từ chối');

const name = path.basename(okPng.url);
assert(resolveUploadFile(name) !== null, 'resolveUploadFile tìm thấy tệp hợp lệ');
for (const bad of ['../server.js', '..%2Fserver.js', 'a/b.png', '..\\x.png', '1234567890123-xyz.png', 'abc.png', '', 'x'.repeat(200)]) {
  assert(resolveUploadFile(bad) === null, `Tên tệp độc hại/không hợp lệ bị từ chối: "${bad.slice(0, 24)}"`);
}

// ----------------------------------------------------
console.log('\n2️⃣ DANH MỤC CHẤP NHẬN ẢNH ĐÃ TẢI LÊN:');
assert(sanitizeCategoryInput({ shortName: 'Camera', showcaseImg: okPng.url }).errors.length === 0, 'showcaseImg dạng /uploads/<tên-do-server-sinh> được chấp nhận');
assert(sanitizeCategoryInput({ shortName: 'Camera', showcaseImg: '/uploads/evil.png' }).errors.length > 0, '/uploads/ với tên tự đặt bị từ chối');
assert(sanitizeCategoryInput({ shortName: 'Camera', showcaseImg: '/uploads/../server/server.js' }).errors.length > 0, '/uploads/ chứa .. bị từ chối');

// ----------------------------------------------------
console.log('\n3️⃣ API THẬT (POST /api/uploads/image, GET /uploads/<tên>):');
const { default: app } = await import('../server/server.js');
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const call = async (method, url, { token, body } = {}) => {
  const res = await fetch(base + url, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const buf = Buffer.from(await res.arrayBuffer());
  let json = null;
  try { json = JSON.parse(buf.toString('utf8')); } catch { /* không phải JSON */ }
  return { status: res.status, json, buf, headers: res.headers };
};

const login = await call('POST', '/api/auth/login', { body: { username: 'admin', password: process.env.ADMIN_PASSWORD } });
const token = login.json?.token;
assert(login.status === 200 && Boolean(token), 'Đăng nhập admin test thành công');

const anon = await call('POST', '/api/uploads/image', { body: { dataUrl: dataUrl('image/png', PNG) } });
assert(anon.status === 401, 'Không đăng nhập thì KHÔNG tải ảnh lên được (401)', `status ${anon.status}`);

const up = await call('POST', '/api/uploads/image', { token, body: { dataUrl: dataUrl('image/jpeg', JPG) } });
assert(up.status === 201 && up.json?.success && /^\/uploads\//.test(up.json.url), 'Admin tải ảnh lên thành công (201)', JSON.stringify(up.json));

const served = await call('GET', up.json.url);
assert(served.status === 200 && served.buf.equals(JPG), 'GET ảnh đã tải trả đúng nội dung');
assert(served.headers.get('content-type') === 'image/jpeg', 'Content-Type đúng kiểu ảnh', served.headers.get('content-type'));
assert(served.headers.get('x-content-type-options') === 'nosniff', 'Có X-Content-Type-Options: nosniff');
assert(/immutable/.test(served.headers.get('cache-control') || ''), 'Cache dài hạn (tên tệp bất biến)');

const badUp = await call('POST', '/api/uploads/image', { token, body: { dataUrl: dataUrl('image/png', Buffer.from('<script>alert(1)</script>')) } });
assert(badUp.status === 415, 'Admin tải tệp không phải ảnh bị từ chối (415)', `status ${badUp.status}`);

const traversal = await call('GET', '/uploads/..%2F..%2Fpackage.json');
assert(traversal.status === 404, 'Đọc ngoài thư mục uploads bị chặn (404)', `status ${traversal.status}`);
const missing = await call('GET', '/uploads/1234567890123-0123456789abcdef.png');
assert(missing.status === 404, 'Ảnh không tồn tại trả 404');

const cat = await call('POST', '/api/categories', { token, body: { shortName: 'Camera Test', showcaseImg: up.json.url } });
assert(cat.status === 201 && cat.json?.data?.showcaseImg === up.json.url, 'Tạo danh mục với ảnh banner vừa tải lên thành công');

server.close();

console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ TẢI ẢNH: ${passed} ĐẠT / ${passed + failed} BÀI TEST`);
console.log('====================================================\n');
process.exit(failed > 0 ? 1 : 0);
