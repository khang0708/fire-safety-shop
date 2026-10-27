import './_setup-env.js';
import fs from 'fs';
import path from 'path';

let failed = 0;
const assert = (cond, msg, d = '') => { console.log(`  ${cond ? '✅ [PASS]' : '❌ [FAIL]'} ${msg}${!cond && d ? ' -> ' + d : ''}`); if (!cond) failed++; };
console.log('⭐ KIỂM THỬ ẨN/XÓA ĐÁNH GIÁ (PHẢI LƯU Ở MÁY CHỦ, F5 KHÔNG HIỆN LẠI)\n');

const { default: app } = await import('../server/server.js');
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
const login = await (await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: process.env.ADMIN_PASSWORD }) })).json();
const call = async (method, url, { auth = true, body } = {}) => {
  const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${login.token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, json: await res.json().catch(() => null) };
};

const created = await call('POST', '/api/reviews', { auth: false, body: { customerName: 'Khách thử', comment: 'Đánh giá để thử ẩn và xóa', rating: 5 } });
const id = created.json?.data?.id;
const seedId = (await call('GET', '/api/reviews', { auth: false })).json.data.find((r) => r.id !== id)?.id;
assert(created.status === 201 && Boolean(id) && Boolean(seedId), 'Tạo được đánh giá thử, có đánh giá mẫu để thử');

assert((await call('PATCH', `/api/reviews/${id}/toggle`, { auth: false })).status === 401, 'Ẩn/hiện đánh giá không đăng nhập => 401');
assert((await call('DELETE', `/api/reviews/${id}`, { auth: false })).status === 401, 'Xóa đánh giá không đăng nhập => 401');

const hidden = await call('PATCH', `/api/reviews/${id}/toggle`);
assert(hidden.status === 200 && hidden.json?.data?.isVisible === false, 'Admin ẩn đánh giá => isVisible=false');
const publicAfterHide = (await call('GET', '/api/reviews', { auth: false })).json.data;
const adminAfterHide = (await call('GET', '/api/reviews')).json.data;
assert(!publicAfterHide.some((r) => r.id === id), 'Người ngoài không còn nhận đánh giá đã ẩn');
assert(adminAfterHide.some((r) => r.id === id && r.isVisible === false), 'Admin vẫn thấy đánh giá đã ẩn để hiện lại');
const shown = await call('PATCH', `/api/reviews/${id}/toggle`);
assert(shown.json?.data?.isVisible === true && (await call('GET', '/api/reviews', { auth: false })).json.data.some((r) => r.id === id), 'Bật lại thì hiện lại cho mọi người');

assert((await call('DELETE', `/api/reviews/${id}`)).status === 200, 'Admin xóa đánh giá => 200');
const afterDelete = (await call('GET', '/api/reviews', { auth: false })).json.data;
assert(!afterDelete.some((r) => r.id === id), 'Đánh giá đã xóa không còn trong danh sách (F5 không hiện lại)');
const onDisk = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, 'reviews.json'), 'utf-8'));
assert(!onDisk.some((r) => r.id === id), 'reviews.json trên đĩa không còn đánh giá đã xóa');
assert((await call('DELETE', `/api/reviews/${id}`)).status === 404 && (await call('PATCH', '/api/reviews/khong-co/toggle')).status === 404, 'Xóa/ẩn đánh giá không tồn tại => 404');

const seedDeleted = await call('DELETE', `/api/reviews/${seedId}`);
assert(seedDeleted.status === 200 && !(await call('GET', '/api/reviews', { auth: false })).json.data.some((r) => r.id === seedId), 'Xóa được cả đánh giá mẫu ban đầu và không hiện lại');

server.close();
console.log(failed ? `\n❌ ${failed} test thất bại` : '\n✅ Tất cả đạt');
process.exit(failed ? 1 : 0);
