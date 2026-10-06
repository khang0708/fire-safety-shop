// tests/data-safety-test.js
// Kiểm thử các lỗi mất dữ liệu: ghi atomic, bản .bak, file hỏng không bị ghi đè bằng dữ liệu rỗng,
// và sản phẩm do admin thêm (id fl-...) không còn bị tự động xóa.

import './_setup-env.js';
import fs from 'fs';
import path from 'path';
import {
  DATA_DIR,
  SEED_DIR,
  StorageCorruptError,
  atomicWriteFileSync,
  readJsonFileSync,
  writeJsonFileSync
} from '../server/storage.js';

console.log('====================================================');
console.log('💾 BẮT ĐẦU KIỂM THỬ AN TOÀN DỮ LIỆU (STORAGE & DATA LOSS)');
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

const listDir = () => fs.readdirSync(DATA_DIR);

// ----------------------------------------------------
console.log('1️⃣ GHI FILE ATOMIC & BẢN SAO LƯU .BAK:');
writeJsonFileSync('t-atomic.json', [{ id: 1 }]);
assert(JSON.stringify(readJsonFileSync('t-atomic.json', null)) === '[{"id":1}]', 'Ghi rồi đọc lại đúng nội dung');
assert(!listDir().some(f => f.endsWith('.tmp')), 'Không để lại file .tmp sau khi ghi');

writeJsonFileSync('t-atomic.json', [{ id: 2 }]);
const bak1 = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 't-atomic.json.bak'), 'utf-8'));
assert(bak1[0].id === 1, 'Lần ghi thứ 2 giữ lại bản trước đó trong .bak');

// Mô phỏng tiến trình bị kill giữa chừng: lỗi khi ghi KHÔNG được làm hỏng file đích
const target = path.join(DATA_DIR, 't-atomic.json');
const before = fs.readFileSync(target, 'utf-8');
let threw = false;
try {
  atomicWriteFileSync(path.join(DATA_DIR, '\0bad.json'), 'x');
} catch {
  threw = true;
}
assert(threw, 'Ghi vào đường dẫn không hợp lệ ném lỗi (không báo thành công giả)');
assert(fs.readFileSync(target, 'utf-8') === before, 'File đích giữ nguyên khi một lần ghi khác thất bại');

// ----------------------------------------------------
console.log('\n2️⃣ FILE HỎNG KHÔNG ĐƯỢC TRẢ VỀ DỮ LIỆU RỖNG:');
// 2a. Hỏng nhưng còn .bak hợp lệ -> dùng bản .bak
fs.writeFileSync(target, '[{"id":2},{"id":3'); // cắt cụt
const recovered = readJsonFileSync('t-atomic.json', []);
assert(Array.isArray(recovered) && recovered[0]?.id === 1, 'File hỏng + có .bak hợp lệ => đọc từ .bak, không phải mảng rỗng');

// 2b. Ghi tiếp khi file chính đang hỏng không được đè bản .bak tốt bằng bản hỏng
writeJsonFileSync('t-atomic.json', [{ id: 9 }]);
const bakAfter = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 't-atomic.json.bak'), 'utf-8'));
assert(bakAfter[0].id === 1, 'Bản .bak tốt không bị đè bằng nội dung file đã hỏng');

// 2c. Hỏng và KHÔNG có .bak -> ném lỗi, không trả [] và không rơi về dữ liệu mẫu
const noBakFile = path.join(DATA_DIR, 'orders.json');
fs.writeFileSync(noBakFile, '[{"id":"A"},{"id":"B"');
let corruptError = null;
let corruptResult;
try {
  corruptResult = readJsonFileSync('orders.json', []);
} catch (err) {
  corruptError = err;
}
assert(corruptError instanceof StorageCorruptError, 'File hỏng không có .bak => ném StorageCorruptError', String(corruptResult));
assert(fs.readFileSync(noBakFile, 'utf-8').startsWith('[{"id":"A"}'), 'File hỏng được giữ nguyên để có thể khôi phục thủ công');
fs.unlinkSync(noBakFile);

// ----------------------------------------------------
console.log('\n3️⃣ DỮ LIỆU MẪU (SEED) CHỈ LÀ DỰ PHÒNG LẦN ĐẦU:');
assert(fs.existsSync(path.join(SEED_DIR, 'products.json')), 'Có dữ liệu mẫu server/seed/products.json');
const seedProducts = readJsonFileSync('products.json', []);
assert(Array.isArray(seedProducts) && seedProducts.length > 0, 'Chưa có file trong DATA_DIR => dùng dữ liệu mẫu');
assert(readJsonFileSync('khong-co-file.json', 'MAC_DINH') === 'MAC_DINH', 'Không có ở đâu cả => trả giá trị mặc định');
assert(!fs.existsSync(path.join(DATA_DIR, 'products.json')), 'Đọc dữ liệu mẫu không tự ghi gì vào DATA_DIR');

// ----------------------------------------------------
console.log('\n4️⃣ API: SẢN PHẨM ADMIN THÊM KHÔNG BỊ TỰ XÓA & FILE HỎNG KHÔNG BỊ GHI ĐÈ:');
const { default: app } = await import('../server/server.js');
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const call = async (method, url, { token, body } = {}) => {
  const res = await fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch { /* không phải JSON */ }
  return { status: res.status, json };
};

const login = await call('POST', '/api/auth/login', { body: { username: 'admin', password: process.env.ADMIN_PASSWORD } });
const token = login.json?.token;
assert(login.status === 200 && Boolean(token), 'Đăng nhập admin bằng thông tin test thành công');

const created = await call('POST', '/api/products', { token, body: { id: 'fl-1790000000001', name: 'Bình chữa cháy thêm từ admin', price: 350000 } });
assert(created.status === 201, 'Thêm sản phẩm với id fl-... thành công (201)');
for (let i = 1; i <= 3; i++) {
  const list = await call('GET', '/api/products');
  assert(list.json?.data?.some(p => p.id === 'fl-1790000000001'), `Sản phẩm fl-... vẫn còn sau lần tải danh sách #${i}`);
}
const onDisk = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'products.json'), 'utf-8'));
assert(onDisk.some(p => p.id === 'fl-1790000000001'), 'Sản phẩm fl-... đã được ghi vào DATA_DIR');
assert(!fs.existsSync(path.join(DATA_DIR, 'products.json.tmp')) && !listDir().some(f => f.endsWith('.tmp')), 'Không còn file .tmp trong DATA_DIR');

// File đơn hàng bị hỏng trước khi server đọc lần nào => API phải lỗi rõ ràng, không được ghi đè
const ordersPath = path.join(DATA_DIR, 'orders.json');
fs.writeFileSync(ordersPath, '[{"id":"FB-1","customerName":"Khach that"},{"id":"FB-2"');
const ordersRes = await call('GET', '/api/orders', { token });
assert(ordersRes.status === 500, 'GET /api/orders khi file hỏng trả 500 (không phải success với danh sách rỗng)', `status=${ordersRes.status}`);
const newOrder = await call('POST', '/api/orders', { body: { customerName: 'Khach moi', customerPhone: '0900000002', productName: 'Binh', totalAmount: 100000 } });
assert(newOrder.status === 500, 'Tạo đơn mới khi file đơn hàng hỏng trả 500, không ghi đè', `status=${newOrder.status}`);
assert(fs.readFileSync(ordersPath, 'utf-8').includes('Khach that'), 'Dữ liệu đơn hàng cũ trong file hỏng vẫn còn nguyên để khôi phục');

server.close();

// ----------------------------------------------------
console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ AN TOÀN DỮ LIỆU: ${passed} ĐẠT / ${passed + failed} BÀI TEST`);
console.log('====================================================');
process.exit(failed === 0 ? 0 : 1);
