// tests/categories-test.js
// Quản lý danh mục sản phẩm chính: thêm / sửa / xóa / sắp xếp, và việc xóa không bao giờ làm mất hay mồ côi sản phẩm.

import './_setup-env.js';
import fs from 'fs';
import path from 'path';
import {
  sanitizeCategoryInput,
  generateCategoryId,
  resolveProductCategoryId,
  planCategoryDeletion
} from '../server/categories.js';

console.log('====================================================');
console.log('🗂️ BẮT ĐẦU KIỂM THỬ QUẢN LÝ DANH MỤC SẢN PHẨM');
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

// ----------------------------------------------------
console.log('1️⃣ LOGIC THUẦN (server/categories.js):');
const cats = [
  { id: 'extinguishers', order: 0 },
  { id: 'rescue', order: 1 },
  { id: 'alarms', order: 2 }
];
assert(sanitizeCategoryInput({}).errors.length > 0, 'Thiếu tên ngắn bị từ chối');
assert(sanitizeCategoryInput({ shortName: 'A'.repeat(41) }).errors.length > 0, 'Tên ngắn quá 40 ký tự bị từ chối');
assert(sanitizeCategoryInput({ shortName: 'Camera', showcaseImg: 'data:image/png;base64,AAAA' }).errors.length > 0, 'Ảnh nhúng base64 bị từ chối (tránh phình dữ liệu công khai)');
assert(sanitizeCategoryInput({ shortName: 'Camera', showcaseImg: 'javascript:alert(1)' }).errors.length > 0, 'Đường dẫn ảnh javascript: bị từ chối');
assert(sanitizeCategoryInput({ shortName: 'Cuu nan', icon: 'svg:ladder' }).errors.length === 0 && sanitizeCategoryInput({ shortName: 'Cuu nan', icon: 'svg:rope-ladder' }).value.icon === 'svg:rope-ladder', 'Biểu tượng SVG hợp lệ (thang, thang dây) được chấp nhận');
for (const bad of ['svg:', 'svg:../x', 'svg:unknown', 'svg:<script>', 'svg:ladder<', 'svg: ladder']) {
  assert(sanitizeCategoryInput({ shortName: 'Cuu nan', icon: bad }).errors.length > 0, `Biểu tượng SVG không có trong danh sách bị từ chối: "${bad}"`);
}
assert(sanitizeCategoryInput({ shortName: 'Cuu nan', icon: '🦺' }).errors.length === 0, 'Emoji thường vẫn được chấp nhận');
assert(sanitizeCategoryInput({ shortName: 'Cuu nan', icon: '123456789' }).errors.length > 0, 'Chuỗi icon thường quá 8 ký tự vẫn bị từ chối');
assert(sanitizeCategoryInput({ shortName: 'Camera', showcaseImg: '/images/../../etc/passwd' }).errors.length > 0, 'Đường dẫn ảnh có ".." bị từ chối');
{
  const ok = sanitizeCategoryInput({ shortName: '  Camera An Ninh  ', showcaseImg: 'https://example.com/a.jpg' });
  assert(ok.errors.length === 0 && ok.value.shortName === 'Camera An Ninh' && ok.value.label === 'Camera An Ninh' && ok.value.icon === '📦', 'Dữ liệu hợp lệ được làm sạch và gán giá trị mặc định (nhãn, biểu tượng)');
}
assert(sanitizeCategoryInput({ label: 'x' }, { partial: true }).errors.length === 0, 'Cập nhật một phần không bắt buộc đủ mọi trường');
assert(sanitizeCategoryInput({ shortName: '' }, { partial: true }).errors.length > 0, 'Cập nhật không được để trống tên ngắn');
assert(generateCategoryId('Camera An Ninh', [], t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '-')) === 'camera-an-ninh', 'Sinh id từ tên ngắn');
assert(generateCategoryId('Rescue', ['rescue'], t => t.toLowerCase()) === 'rescue-2', 'Id trùng được thêm hậu tố -2');
assert(generateCategoryId('All', [], t => t.toLowerCase()) !== 'all', 'Id trùng từ khóa đặc biệt "all" bị tránh');
assert(generateCategoryId('!!!', [], () => '') === 'danh-muc', 'Tên không tạo được id => dùng "danh-muc"');
assert(resolveProductCategoryId({ category: 'rescue' }, cats) === 'rescue', 'Sản phẩm có category hợp lệ giữ nguyên');
assert(resolveProductCategoryId({ colorTone: 'alarm' }, cats) === 'alarms', 'Dữ liệu cũ thiếu category suy ra từ công nghệ dập lửa');
assert(resolveProductCategoryId({ category: 'da-xoa' }, cats) === 'extinguishers', 'Category không còn tồn tại => về danh mục đầu tiên (không mồ côi)');

const products = [
  { id: 'p1', category: 'rescue' },
  { id: 'p2', category: 'rescue' },
  { id: 'p3', colorTone: 'escape' }, // cũ, không có category => thuộc rescue
  { id: 'p4', category: 'alarms' }
];
const inUse = planCategoryDeletion({ categories: cats, products, id: 'rescue' });
assert(!inUse.ok && inUse.error === 'CATEGORY_IN_USE' && inUse.productCount === 3, 'Xóa danh mục đang có 3 sản phẩm (kể cả dữ liệu cũ) => yêu cầu chuyển', JSON.stringify(inUse));
assert(!planCategoryDeletion({ categories: cats, products, id: 'rescue', reassignTo: 'rescue' }).ok, 'Không được chuyển sản phẩm sang chính danh mục đang xóa');
assert(!planCategoryDeletion({ categories: cats, products, id: 'rescue', reassignTo: 'khong-co' }).ok, 'Không được chuyển sang danh mục không tồn tại');
{
  const good = planCategoryDeletion({ categories: cats, products, id: 'rescue', reassignTo: 'alarms' });
  assert(good.ok && good.affected.length === 3 && good.reassignTo === 'alarms', 'Xóa kèm chuyển sang danh mục khác hợp lệ');
}
assert(planCategoryDeletion({ categories: cats, products: [], id: 'rescue' }).ok, 'Danh mục rỗng xóa được ngay không cần chuyển');
assert(planCategoryDeletion({ categories: [cats[0]], products: [], id: 'extinguishers' }).error === 'LAST_CATEGORY', 'Không xóa được danh mục cuối cùng');

// ----------------------------------------------------
console.log('\n2️⃣ API:');
const { default: app } = await import('../server/server.js');
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const call = async (method, url, { token, body } = {}) => {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: method === 'GET' || body === undefined ? undefined : JSON.stringify(body)
  });
  let json = null;
  try { json = await res.json(); } catch { /* không phải JSON */ }
  return { status: res.status, json };
};

const login = await call('POST', '/api/auth/login', { body: { username: 'admin', password: process.env.ADMIN_PASSWORD } });
const token = login.json?.token;
assert(Boolean(token), 'Đăng nhập admin test thành công');

const publicList = await call('GET', '/api/categories');
assert(publicList.status === 200 && publicList.json.data.map(c => c.id).join(',') === 'extinguishers,rescue,alarms', 'GET /api/categories công khai trả 3 danh mục mặc định đúng thứ tự');
assert(publicList.json.data.every(c => c.shortName && c.label && c.icon), 'Danh mục mặc định đủ tên, nhãn, biểu tượng');

for (const [method, url] of [['POST', '/api/categories'], ['PUT', '/api/categories/rescue'], ['PUT', '/api/categories/order'], ['DELETE', '/api/categories/rescue']]) {
  const r = await call(method, url, { body: {} });
  assert(r.status === 401, `${method} ${url} không đăng nhập => 401`, `status=${r.status}`);
}

const created = await call('POST', '/api/categories', { token, body: { shortName: 'Camera An Ninh', label: 'Camera & Báo Trộm', icon: '📷', tagline: 'Giám sát 24/7', showcaseImg: '/images/hero-fire-safety.jpg', evil: 'x', id: 'hack' } });
assert(created.status === 201 && created.json.data.id === 'camera-an-ninh', 'Thêm danh mục mới => id sinh từ tên, bỏ qua id do client gửi', JSON.stringify(created.json));
assert(!('evil' in created.json.data), 'Trường lạ bị loại bỏ');
assert(created.json.data.order === 3, 'Danh mục mới xếp cuối');

const dup = await call('POST', '/api/categories', { token, body: { shortName: 'Camera An Ninh' } });
assert(dup.status === 201 && dup.json.data.id === 'camera-an-ninh-2', 'Thêm trùng tên => id có hậu tố -2');
const bad = await call('POST', '/api/categories', { token, body: { shortName: '' } });
assert(bad.status === 400, 'Thêm danh mục thiếu tên => 400');

const edited = await call('PUT', '/api/categories/camera-an-ninh', { token, body: { label: 'Camera Giám Sát', icon: '🎥', id: 'doi-id' } });
assert(edited.status === 200 && edited.json.data.label === 'Camera Giám Sát' && edited.json.data.id === 'camera-an-ninh', 'Sửa danh mục thành công, id không đổi', JSON.stringify(edited.json));
assert((await call('PUT', '/api/categories/khong-co', { token, body: { label: 'x' } })).status === 404, 'Sửa danh mục không tồn tại => 404');
assert((await call('PUT', '/api/categories/camera-an-ninh', { token, body: { showcaseImg: 'data:image/png;base64,AAA' } })).status === 400, 'Sửa ảnh banner bằng base64 => 400');

// Sắp xếp
const ordered = await call('PUT', '/api/categories/order', { token, body: { ids: ['camera-an-ninh', 'alarms', 'extinguishers', 'rescue', 'camera-an-ninh-2'] } });
assert(ordered.status === 200 && ordered.json.data[0].id === 'camera-an-ninh' && ordered.json.data[0].order === 0, 'Sắp xếp lại thứ tự thành công');
assert((await call('PUT', '/api/categories/order', { token, body: { ids: ['alarms'] } })).status === 400, 'Sắp xếp thiếu danh mục => 400');
assert((await call('PUT', '/api/categories/order', { token, body: { ids: ['alarms', 'alarms', 'rescue', 'extinguishers', 'camera-an-ninh'] } })).status === 400, 'Sắp xếp lặp danh mục => 400');
const afterOrder = await call('GET', '/api/categories');
assert(afterOrder.json.data.map(c => c.id).join(',') === 'camera-an-ninh,alarms,extinguishers,rescue,camera-an-ninh-2', 'GET trả đúng thứ tự mới');

// Sản phẩm và danh mục
const newProduct = await call('POST', '/api/products', { token, body: { name: 'Camera thử nghiệm', price: 900000, category: 'camera-an-ninh', colorTone: 'alarm' } });
assert(newProduct.status === 201 && newProduct.json.data.category === 'camera-an-ninh', 'POST sản phẩm LƯU trường category (lỗi cũ: bị bỏ mất)', JSON.stringify(newProduct.json?.data?.category));
assert((await call('POST', '/api/products', { token, body: { name: 'Sai danh mục', price: 1, category: 'khong-ton-tai' } })).status === 400, 'Tạo sản phẩm với danh mục không tồn tại => 400');
assert((await call('PUT', `/api/products/${newProduct.json.data.id}`, { token, body: { category: 'khong-ton-tai' } })).status === 400, 'Sửa sản phẩm sang danh mục không tồn tại => 400');
{
  const noCategory = await call('POST', '/api/products', { token, body: { name: 'Thiếu danh mục', price: 1, colorTone: 'escape' } });
  assert(noCategory.status === 201 && noCategory.json.data.category === 'rescue', 'Tạo sản phẩm không gửi category => suy ra từ công nghệ dập lửa (escape => rescue)', JSON.stringify(noCategory.json?.data?.category));
}

// Xóa
const countBefore = (await call('GET', '/api/products')).json.data.length;
const inUseDelete = await call('DELETE', '/api/categories/camera-an-ninh', { token });
assert(inUseDelete.status === 409 && inUseDelete.json.error === 'CATEGORY_IN_USE' && inUseDelete.json.productCount === 1, 'Xóa danh mục đang có sản phẩm mà không chỉ định nơi chuyển => 409', JSON.stringify(inUseDelete.json));
assert((await call('GET', '/api/categories')).json.data.some(c => c.id === 'camera-an-ninh'), 'Danh mục vẫn còn sau khi xóa bị từ chối');
assert((await call('DELETE', '/api/categories/camera-an-ninh?reassignTo=camera-an-ninh', { token })).status === 409, 'Chuyển sang chính nó => 409');
assert((await call('DELETE', '/api/categories/camera-an-ninh?reassignTo=khong-co', { token })).status === 409, 'Chuyển sang danh mục không tồn tại => 409');

const rescueCountBefore = (await call('GET', '/api/products')).json.data.filter(p => p.category === 'rescue').length;
const okDelete = await call('DELETE', '/api/categories/camera-an-ninh?reassignTo=rescue', { token });
assert(okDelete.status === 200 && okDelete.json.movedProducts === 1 && okDelete.json.reassignedTo === 'rescue', 'Xóa kèm chuyển sản phẩm sang "rescue" thành công', JSON.stringify(okDelete.json));
const afterDelete = (await call('GET', '/api/products')).json.data;
assert(afterDelete.length === countBefore, 'Tổng số sản phẩm không đổi sau khi xóa danh mục (không mất sản phẩm nào)', `${countBefore} -> ${afterDelete.length}`);
assert(afterDelete.find(p => p.id === newProduct.json.data.id)?.category === 'rescue', 'Sản phẩm của danh mục đã xóa được chuyển sang danh mục thay thế');
assert(afterDelete.filter(p => p.category === 'rescue').length === rescueCountBefore + 1, 'Danh mục thay thế nhận thêm đúng 1 sản phẩm');
const afterDeleteCats = (await call('GET', '/api/categories')).json.data;
assert(!afterDeleteCats.some(c => c.id === 'camera-an-ninh') && afterDeleteCats.map(c => c.order).join(',') === '0,1,2,3', 'Danh mục đã bị xóa và thứ tự được đánh số lại liên tục');

// Xóa danh mục rỗng, rồi dồn về danh mục cuối cùng
assert((await call('DELETE', '/api/categories/camera-an-ninh-2', { token })).status === 200, 'Xóa danh mục rỗng không cần chuyển => 200');
assert((await call('DELETE', '/api/categories/alarms?reassignTo=rescue', { token })).status === 200, 'Xóa "alarms" chuyển sang "rescue"');
assert((await call('DELETE', '/api/categories/extinguishers?reassignTo=rescue', { token })).status === 200, 'Xóa "extinguishers" chuyển sang "rescue"');
const finalProducts = (await call('GET', '/api/products')).json.data;
assert(finalProducts.length === countBefore && finalProducts.every(p => p.category === 'rescue'), 'Dồn mọi sản phẩm về một danh mục vẫn không mất sản phẩm nào');
const last = await call('DELETE', '/api/categories/rescue?reassignTo=rescue', { token });
assert(last.status === 409 && last.json.error === 'LAST_CATEGORY', 'Không xóa được danh mục cuối cùng', JSON.stringify(last.json));

// Dữ liệu thật được ghi ra DATA_DIR (không phải seed)
const onDisk = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, 'categories.json'), 'utf-8'));
assert(onDisk.length === 1 && onDisk[0].id === 'rescue', 'categories.json được ghi vào DATA_DIR');

server.close();
console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ DANH MỤC: ${passed} ĐẠT / ${passed + failed} BÀI TEST`);
console.log('====================================================');
process.exit(failed === 0 ? 0 : 1);
