// tests/api-security-test.js
// Kiểm thử bảo mật mức API: khởi động server trong tiến trình và gọi thật các route.
// Mỗi nhóm tái hiện một lỗi đã được xác nhận khi audit và chứng minh nó không còn.

import './_setup-env.js';
import crypto from 'crypto';

console.log('====================================================');
console.log('🔐 BẮT ĐẦU KIỂM THỬ BẢO MẬT API (AUDIT REGRESSION)');
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

const { default: app } = await import('../server/server.js');
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const call = async (method, url, { token, body, headers = {}, rawBody } = {}) => {
  const res = await fetch(base + url, {
    method,
    headers: {
      ...(rawBody === undefined && body === undefined && method === 'GET' ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: method === 'GET' ? undefined : rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* không phải JSON */ }
  return { status: res.status, json, text };
};

const login = await call('POST', '/api/auth/login', { body: { username: 'admin', password: process.env.ADMIN_PASSWORD } });
const token = login.json?.token;
assert(login.status === 200 && Boolean(token), 'Đăng nhập admin bằng thông tin test thành công');

// ----------------------------------------------------
console.log('\n1️⃣ GIỚI HẠN ĐĂNG NHẬP KHÔNG LÁCH ĐƯỢC BẰNG X-FORWARDED-FOR:');
// Mô phỏng Nginx: nó LUÔN thêm IP thật của client vào CUỐI header; phần client tự đặt nằm phía trước.
const pinStatuses = [];
for (let i = 1; i <= 9; i++) {
  const r = await call('POST', '/api/auth/login', {
    headers: { 'X-Forwarded-For': `10.0.0.${i}, 198.51.100.7` },
    body: { pin: `99999${i}` }
  });
  pinStatuses.push(r.status);
}
assert(pinStatuses.slice(0, 5).every(s => s === 401), 'Năm lần sai PIN đầu tiên trả 401', pinStatuses.join(','));
assert(pinStatuses.slice(5).every(s => s === 429), 'Từ lần sai thứ 6 bị khóa (429) dù mỗi lần đổi header giả IP', pinStatuses.join(','));

// ----------------------------------------------------
console.log('\n2️⃣ ROUTE LỘ DỮ LIỆU / GỬI TIN NHẮN PHẢI CÓ XÁC THỰC:');
const protectedCalls = [
  ['GET', '/api/orders'],
  ['PATCH', '/api/orders/FB-1/status'],
  ['POST', '/api/facebook/send-message'],
  ['POST', '/api/facebook/test-connection'],
  ['POST', '/api/notifications/telegram-get-chat-id'],
  ['POST', '/api/zalo/send-zns'],
  ['POST', '/api/auth/sse-ticket'],
  ['POST', '/api/products'],
  ['POST', '/api/settings']
];
for (const [method, url] of protectedCalls) {
  const r = await call(method, url, { body: {} });
  assert(r.status === 401, `${method} ${url} không đăng nhập => 401`, `status=${r.status}`);
}
const ordersAdmin = await call('GET', '/api/orders', { token });
assert(ordersAdmin.status === 200 && Array.isArray(ordersAdmin.json?.data), 'GET /api/orders với token admin => 200');

// ----------------------------------------------------
console.log('\n3️⃣ SSE CHỈ DÀNH CHO ADMIN (VÉ DÙNG MỘT LẦN):');
const noTicket = await call('GET', '/api/admin/events');
assert(noTicket.status === 401, 'Kết nối SSE không có vé => 401');
const fakeTicket = await call('GET', '/api/admin/events?ticket=abc123');
assert(fakeTicket.status === 401, 'Kết nối SSE với vé giả => 401');

const ticketRes = await call('POST', '/api/auth/sse-ticket', { token });
const ticket = ticketRes.json?.ticket;
assert(ticketRes.status === 200 && typeof ticket === 'string' && ticket.length >= 32, 'Admin xin được vé SSE');

const controller = new AbortController();
const sse = await fetch(`${base}/api/admin/events?ticket=${ticket}`, { signal: controller.signal });
assert(sse.status === 200 && (sse.headers.get('content-type') || '').includes('text/event-stream'), 'Vé hợp lệ mở được luồng SSE');
assert(sse.headers.get('x-accel-buffering') === 'no', 'SSE có header X-Accel-Buffering: no (Nginx không đệm luồng)');

const reused = await call('GET', `/api/admin/events?ticket=${ticket}`);
assert(reused.status === 401, 'Vé SSE chỉ dùng được một lần');

const reader = sse.body.getReader();
const decoder = new TextDecoder();
let sseText = '';
const readUntil = async (needle, ms) => {
  const deadline = Date.now() + ms;
  while (!sseText.includes(needle) && Date.now() < deadline) {
    const chunk = await Promise.race([
      reader.read(),
      new Promise(resolve => setTimeout(() => resolve({ timeout: true }), Math.max(50, deadline - Date.now())))
    ]);
    if (chunk.timeout || chunk.done) break;
    sseText += decoder.decode(chunk.value);
  }
  return sseText.includes(needle);
};
assert(await readUntil('CONNECTED', 2000), 'Luồng SSE gửi sự kiện CONNECTED');

// ----------------------------------------------------
console.log('\n4️⃣ ĐƠN HÀNG: ĐẶT CÔNG KHAI, TRA CỨU CẦN MÃ ĐƠN + SĐT, KHÔNG NHẬN TOKEN TỪ CLIENT:');
const phone = '0912345678';
const created = await call('POST', '/api/orders', {
  body: {
    orderCode: 'FB-12345',
    customerName: 'Khach That Nghiem',
    customerPhone: phone,
    receiverAddress: '1 Duong Kiem Thu',
    productName: 'Binh chua chay',
    totalAmount: 480000,
    proofPhotoUrl: 'https://evil.example/anh-gia.jpg',
    telegramBotToken: '123456:KE-TAN-CONG',
    telegramChatId: '1'
  }
});
assert(created.status === 201, 'Khách đặt đơn công khai thành công (201)', `status=${created.status}`);
const orderCode = created.json?.data?.orderCode;
assert(orderCode === 'FB-12345', 'Mã đơn đúng định dạng do client gửi được giữ lại');
assert(created.json?.data?.proofPhotoUrl === null, 'Khách không gắn được ảnh nghiệm thu giả vào đơn');

assert(await readUntil('NEW_ORDER', 2500), 'Admin nhận được sự kiện NEW_ORDER qua SSE');

const duplicate = await call('POST', '/api/orders', { body: { orderCode: 'FB-12345', customerName: 'Ke Gia Mao', customerPhone: '0900000009', productName: 'x' } });
assert(duplicate.status === 201 && duplicate.json?.data?.orderCode !== 'FB-12345', 'Mã đơn trùng bị bỏ qua, server tự cấp mã mới (không ghi đè đơn khác)');

const trackOk = await call('GET', `/api/orders/track?code=${orderCode}&phone=${phone}`);
assert(trackOk.status === 200 && trackOk.json?.data?.orderCode === orderCode, 'Tra cứu đúng mã đơn + SĐT => 200');
const trackWrongPhone = await call('GET', `/api/orders/track?code=${orderCode}&phone=0999999999`);
assert(trackWrongPhone.status === 404, 'Tra cứu đúng mã đơn nhưng sai SĐT => 404');
const trackNoPhone = await call('GET', `/api/orders/track?code=${orderCode}`);
assert(trackNoPhone.status === 400, 'Tra cứu thiếu SĐT => 400');

controller.abort();

// ----------------------------------------------------
console.log('\n5️⃣ CÀI ĐẶT CÔNG KHAI KHÔNG CHỨA BÍ MẬT:');
const saved = await call('POST', '/api/settings', {
  token,
  body: {
    telegramBotToken: '123456:SECRET-TELEGRAM-TOKEN-XYZ',
    telegramChatId: '555666777',
    facebookSettings: { pageId: 'trang-test', pageAccessToken: 'EAAGsecretPageToken123', verifyToken: 'verify-secret-abc', appSecret: 'app-secret-xyz', isEnabled: true },
    brandSettings: { brandName: 'Shop Test' }
  }
});
assert(saved.status === 200, 'Admin lưu cài đặt thành công', `status=${saved.status}`);

const publicSettings = await call('GET', '/api/settings');
const publicBlob = publicSettings.text;
assert(publicSettings.status === 200, 'GET /api/settings công khai => 200');
for (const secret of ['SECRET-TELEGRAM-TOKEN-XYZ', '555666777', 'EAAGsecretPageToken123', 'verify-secret-abc', 'app-secret-xyz']) {
  assert(!publicBlob.includes(secret), `Cài đặt công khai không lộ giá trị bí mật "${secret.slice(0, 12)}..."`);
}
assert(publicSettings.json?.data?.hasTelegramToken === true, 'Vẫn có cờ hasTelegramToken để giao diện biết đã cấu hình');
assert(publicSettings.json?.data?.facebookSettings?.pageId === 'trang-test', 'Trường công khai (pageId) vẫn được trả bình thường');
assert(publicSettings.json?.data?.brandSettings?.brandName === 'Shop Test', 'Thông tin thương hiệu công khai vẫn được trả');

const adminSettings = await call('GET', '/api/settings', { token });
assert(adminSettings.text.includes('SECRET-TELEGRAM-TOKEN-XYZ'), 'Admin vẫn xem được token đầy đủ để cấu hình');

// ----------------------------------------------------
console.log('\n6️⃣ ĐÁNH GIÁ CÔNG KHAI: CHỈ NHẬN TRƯỜNG HỢP LỆ:');
const noComment = await call('POST', '/api/reviews', { body: { customerName: 'A', rating: 5 } });
assert(noComment.status === 400, 'Đánh giá không có nội dung => 400');
const review = await call('POST', '/api/reviews', {
  body: { customerName: 'Khach', rating: 99, comment: 'Binh tot', verified: true, likes: 99999, isVisible: false, isAdmin: true, id: 'khong-hop-le' }
});
assert(review.status === 201, 'Gửi đánh giá hợp lệ => 201', `status=${review.status}`);
const r = review.json?.data || {};
assert(r.rating === 5, 'Điểm đánh giá bị giới hạn trong 1-5 (gửi 99 => 5)', `rating=${r.rating}`);
assert(r.verified === false && r.likes === 0, 'Khách không tự gắn được verified/likes', JSON.stringify({ v: r.verified, l: r.likes }));
assert(!('isAdmin' in r), 'Trường lạ do khách gửi bị loại bỏ (không mass-assignment)');
assert(/^REV-/.test(r.id) && r.id !== 'khong-hop-le', 'ID không hợp lệ bị thay bằng ID server cấp');

const hugeReview = await call('POST', '/api/reviews', { rawBody: JSON.stringify({ comment: 'x'.repeat(3 * 1024 * 1024) }) });
assert(hugeReview.status === 413, 'Body công khai quá 2MB bị từ chối (413)', `status=${hugeReview.status}`);

const badJson = await call('POST', '/api/auth/login', { rawBody: '{"username":' });
assert(badJson.status === 400 && badJson.json?.error === 'BAD_REQUEST', 'JSON hỏng trả 400 (không phải lỗi 500 gây báo động)', `status=${badJson.status}`);

// ----------------------------------------------------
console.log('\n7️⃣ WEBHOOK FACEBOOK: BỎ TOKEN MẶC ĐỊNH & XÁC MINH CHỮ KÝ:');
await call('POST', '/api/settings', { token, body: { facebookSettings: { verifyToken: '' } } });
const verifyDefault = await call('GET', '/api/facebook/webhook?hub.mode=subscribe&hub.verify_token=flameguard_webhook_secret_2026&hub.challenge=abc');
assert(verifyDefault.status === 403, 'Token mặc định cũ (flameguard_webhook_secret_2026) không còn được chấp nhận', `status=${verifyDefault.status}`);

await call('POST', '/api/settings', { token, body: { facebookSettings: { verifyToken: 'verify-token-moi-123' } } });
const verifyWrong = await call('GET', '/api/facebook/webhook?hub.mode=subscribe&hub.verify_token=sai&hub.challenge=abc');
assert(verifyWrong.status === 403, 'Verify token sai => 403');
const verifyRight = await call('GET', '/api/facebook/webhook?hub.mode=subscribe&hub.verify_token=verify-token-moi-123&hub.challenge=abc123');
assert(verifyRight.status === 200 && verifyRight.text === 'abc123', 'Verify token đúng => trả challenge');

delete process.env.FACEBOOK_APP_SECRET;
const eventBody = JSON.stringify({ object: 'page', entry: [] });
const noSecret = await call('POST', '/api/facebook/webhook', { rawBody: eventBody });
assert(noSecret.status === 403, 'Chưa cấu hình FACEBOOK_APP_SECRET => từ chối sự kiện webhook');

process.env.FACEBOOK_APP_SECRET = 'app-secret-test';
const goodSig = 'sha256=' + crypto.createHmac('sha256', 'app-secret-test').update(eventBody).digest('hex');
const badSig = 'sha256=' + crypto.createHmac('sha256', 'khac').update(eventBody).digest('hex');
const signedBad = await call('POST', '/api/facebook/webhook', { rawBody: eventBody, headers: { 'X-Hub-Signature-256': badSig } });
assert(signedBad.status === 403, 'Sự kiện webhook chữ ký sai => 403');
const signedGood = await call('POST', '/api/facebook/webhook', { rawBody: eventBody, headers: { 'X-Hub-Signature-256': goodSig } });
assert(signedGood.status === 200, 'Sự kiện webhook chữ ký đúng => 200', `status=${signedGood.status}`);

// ----------------------------------------------------
console.log('\n8️⃣ BÀI VIẾT NHÁP KHÔNG LỘ RA CÔNG KHAI:');
const draft = await call('POST', '/api/articles', { token, body: { title: 'Bai viet nhap thu nghiem', content: '<p>noi dung</p>', status: 'draft' } });
const draftSlug = draft.json?.data?.slug;
assert(draft.status === 201 && Boolean(draftSlug), 'Admin tạo được bài nháp', `status=${draft.status}`);
const draftPublic = await call('GET', `/api/articles/${draftSlug}`);
assert(draftPublic.status === 404, 'Khách vãng lai không đọc được bài nháp theo slug (404)', `status=${draftPublic.status}`);
const draftAdmin = await call('GET', `/api/articles/${draftSlug}`, { token });
assert(draftAdmin.status === 200, 'Admin đọc được bài nháp');
const listPublic = await call('GET', '/api/articles?status=all');
assert(!listPublic.json?.data?.some(a => a.slug === draftSlug), 'Danh sách công khai không chứa bài nháp');

// ----------------------------------------------------
console.log('\n9️⃣ ĐỔI MẬT KHẨU QUA API & THU HỒI PHIÊN:');
const weak = await call('POST', '/api/auth/change-password', { token, body: { currentPassword: process.env.ADMIN_PASSWORD, newPassword: 'ngan' } });
assert(weak.status === 400, 'Đổi sang mật khẩu yếu => 400');
const strong = await call('POST', '/api/auth/change-password', { token, body: { currentPassword: process.env.ADMIN_PASSWORD, newPassword: 'Mat-Khau-Moi-Rat-Dai-2026' } });
assert(strong.status === 200 && Boolean(strong.json?.token), 'Đổi mật khẩu mạnh thành công, trả token mới', `status=${strong.status}`);
const oldTokenUse = await call('GET', '/api/orders', { token });
assert(oldTokenUse.status === 401, 'Token cũ không còn dùng được sau khi đổi mật khẩu');
const newTokenUse = await call('GET', '/api/orders', { token: strong.json?.token });
assert(newTokenUse.status === 200, 'Token mới dùng được');

// ----------------------------------------------------
console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ BẢO MẬT API: ${passed} ĐẠT / ${passed + failed} BÀI TEST`);
console.log('====================================================');
process.exit(failed === 0 ? 0 : 1);
