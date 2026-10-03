// tests/monitoring-test.js
// ====================================================
// BỘ KIỂM THỬ ĐƠN VỊ: MODULE GIÁM SÁT SỰ CỐ MÁY CHỦ TELEGRAM 24/7
// ====================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  cleanTelegramToken, 
  cleanTelegramChatId, 
  escapeTelegramHtml, 
  getDeveloperTelegramConfig, 
  notifyServerError,
  notifyServerWarning,
  notifyServerStartup,
  testDeveloperServerAlert,
  getEnvDiagnosticInfo,
  resetErrorHistoryForTest 
} from '../server/monitoringBot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const DEV_ALERTS_PATH = path.join(ROOT_DIR, 'server', 'data', 'dev-alerts.json');

console.log('====================================================');
console.log('🤖 BẮT ĐẦU CHUỖI KIỂM THỬ BOT GIÁM SÁT DEVELOPER 24/7');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedTests++;
  }
}

// ----------------------------------------------------
// 1. KIỂM THỬ HÀM LÀM SẠCH TOKEN & CHAT ID
// ----------------------------------------------------
console.log('1️⃣ KIỂM TRA LÀM SẠCH BOT TOKEN & CHAT ID:');

assert(cleanTelegramToken('bot123456:ABC-DEF') === '123456:ABC-DEF', 'Loại bỏ tiền tố bot viết thường');
assert(cleanTelegramToken('BOT987654:XYZ-UVW') === '987654:XYZ-UVW', 'Loại bỏ tiền tố BOT viết hoa');
assert(cleanTelegramToken('  123456:ABC-DEF  ') === '123456:ABC-DEF', 'Cắt bỏ khoảng trắng thừa hai đầu');
assert(cleanTelegramToken('') === '', 'Xử lý chuỗi rỗng an toàn');
assert(cleanTelegramToken(null) === '', 'Xử lý null an toàn');
assert(cleanTelegramToken(undefined) === '', 'Xử lý undefined an toàn');

assert(cleanTelegramChatId('123456789') === '123456789', 'Xử lý chat ID chuỗi số dương');
assert(cleanTelegramChatId(987654321) === '987654321', 'Chuyển đổi số nguyên sang chuỗi chat ID');
assert(cleanTelegramChatId('-100123456789') === '-100123456789', 'Hỗ trợ chat ID nhóm Telegram (số âm)');
assert(cleanTelegramChatId('  -100987654321  ') === '-100987654321', 'Cắt bỏ khoảng trắng thừa trong chat ID');
assert(cleanTelegramChatId(null) === '', 'Xử lý null chat ID an toàn');

// ----------------------------------------------------
// 2. KIỂM THỬ ESCAPE HTML TELEGRAM
// ----------------------------------------------------
console.log('\n2️⃣ KIỂM TRA MÃ HÓA KÝ TỰ ĐẶC BIỆT HTML TELEGRAM:');

const rawHtml = '<script>alert("XSS & crash")</script>';
const escaped = escapeTelegramHtml(rawHtml);
assert(escaped === '&lt;script&gt;alert(&quot;XSS &amp; crash&quot;)&lt;/script&gt;', 'Mã hóa chính xác <, >, &, "');
assert(escapeTelegramHtml('') === '', 'Escape chuỗi rỗng an toàn');
assert(escapeTelegramHtml(null) === '', 'Escape null an toàn');
assert(escapeTelegramHtml(undefined) === '', 'Escape undefined an toàn');

// ----------------------------------------------------
// 3. KIỂM THỬ CÔ LẬP CẤU HÌNH (TÁCH BIỆT 2 BOT HOÀN TOÀN)
// ----------------------------------------------------
console.log('\n3️⃣ KIỂM TRA NGUYÊN TẮC TÁCH BIỆT CẤU HÌNH 2 BOT:');

// Lưu trạng thái env cũ
const origDevToken = process.env.DEV_ALERT_TELEGRAM_TOKEN;
const origDevChatId = process.env.DEV_ALERT_TELEGRAM_CHAT_ID;
const origShopToken = process.env.TELEGRAM_BOT_TOKEN;
const origShopChatId = process.env.TELEGRAM_CHAT_ID;

try {
  // Giả lập env có cấu hình Developer
  process.env.DEV_ALERT_TELEGRAM_TOKEN = 'bot111222:DEV-TOKEN-TEST';
  process.env.DEV_ALERT_TELEGRAM_CHAT_ID = '999888777';
  process.env.TELEGRAM_BOT_TOKEN = 'bot333444:SHOP-TOKEN-TEST';
  process.env.TELEGRAM_CHAT_ID = '555666777';

  const devConfig = getDeveloperTelegramConfig();
  assert(devConfig.token === '111222:DEV-TOKEN-TEST', 'Lấy đúng token Developer từ DEV_ALERT_TELEGRAM_TOKEN');
  assert(devConfig.chatId === '999888777', 'Lấy đúng chat ID Developer từ DEV_ALERT_TELEGRAM_CHAT_ID');
  assert(devConfig.token !== '333444:SHOP-TOKEN-TEST', 'Tuyệt đối không bị nhầm lẫn với Bot Khách hàng (TELEGRAM_BOT_TOKEN)');
  assert(devConfig.isConfigured === true, 'Xác định trạng thái isConfigured = true');

  // Kiểm tra khi dev env trống nhưng có dev-alerts.json
  delete process.env.DEV_ALERT_TELEGRAM_TOKEN;
  delete process.env.DEV_ALERT_TELEGRAM_CHAT_ID;

  fs.writeFileSync(DEV_ALERTS_PATH, JSON.stringify({
    telegramBotToken: 'bot888999:FILE-DEV-TOKEN',
    telegramChatId: '777666'
  }));

  const fileConfig = getDeveloperTelegramConfig();
  assert(fileConfig.token === '888999:FILE-DEV-TOKEN', 'Đọc fallback cấu hình từ server/data/dev-alerts.json thành công');
  assert(fileConfig.chatId === '777666', 'Đọc chat ID từ server/data/dev-alerts.json thành công');

} finally {
  // Dọn dẹp file dev-alerts.json tạm
  if (fs.existsSync(DEV_ALERTS_PATH)) {
    fs.unlinkSync(DEV_ALERTS_PATH);
  }
  // Khôi phục env ban đầu
  if (origDevToken) process.env.DEV_ALERT_TELEGRAM_TOKEN = origDevToken;
  else delete process.env.DEV_ALERT_TELEGRAM_TOKEN;

  if (origDevChatId) process.env.DEV_ALERT_TELEGRAM_CHAT_ID = origDevChatId;
  else delete process.env.DEV_ALERT_TELEGRAM_CHAT_ID;

  if (origShopToken) process.env.TELEGRAM_BOT_TOKEN = origShopToken;
  else delete process.env.TELEGRAM_BOT_TOKEN;

  if (origShopChatId) process.env.TELEGRAM_CHAT_ID = origShopChatId;
  else delete process.env.TELEGRAM_CHAT_ID;
}

// ----------------------------------------------------
// 4. KIỂM THỬ CƠ CHẾ CHỐNG SPAM (ANTI-SPAM THROTTLING)
// ----------------------------------------------------
console.log('\n4️⃣ KIỂM TRA CƠ CHẾ CHỐNG SPAM / THROTTLING 60 GIÂY:');

async function testThrottling() {
  resetErrorHistoryForTest();

  // Đặt env giả lập để kích hoạt hàm
  process.env.DEV_ALERT_TELEGRAM_TOKEN = '123456:MOCK-DEV-TOKEN';
  process.env.DEV_ALERT_TELEGRAM_CHAT_ID = '987654321';

  // Lưu fetch gốc và mock fetch
  const originalFetch = global.fetch;
  let fetchCallCount = 0;

  global.fetch = async (_url) => {
    fetchCallCount++;
    return {
      json: async () => ({ ok: true, result: { message_id: 1000 + fetchCallCount } })
    };
  };

  try {
    const mockError = new Error('Database connection pool exhausted');
    mockError.name = 'DatabaseError';

    // Lần 1: Lỗi mới phát sinh -> Cho phép gửi ngay lập tức
    const res1 = await notifyServerError(mockError, { endpoint: '/api/products', source: 'test' });
    assert(res1.success === true, 'Lần 1: Gửi cảnh báo lỗi thành công');
    assert(res1.throttled === false, 'Lần 1: Không bị throttle (được gửi ngay)');
    assert(fetchCallCount === 1, 'Lần 1: Telegram API fetch được gọi 1 lần');

    // Lần 2: Cùng 1 lỗi xuất hiện ngay sau đó (< 60s) -> Phải bị Throttle
    const res2 = await notifyServerError(mockError, { endpoint: '/api/products', source: 'test' });
    assert(res2.success === true, 'Lần 2: Xử lý thành công trong cơ chế throttle');
    assert(res2.throttled === true, 'Lần 2: Đã kích hoạt Throttle chống spam');
    assert(res2.count === 2, 'Lần 2: Đếm số lần lỗi lặp lại = 2');
    assert(fetchCallCount === 1, 'Lần 2: Không gọi thêm request Telegram mới');

    // Lần 3: Lỗi đó lại xuất hiện lần nữa
    const res3 = await notifyServerError(mockError, { endpoint: '/api/products', source: 'test' });
    assert(res3.throttled === true, 'Lần 3: Tiếp tục bị Throttle');
    assert(res3.count === 3, 'Lần 3: Đếm số lần lỗi lặp lại = 3');
    assert(fetchCallCount === 1, 'Lần 3: Vẫn giữ nguyên 1 request Telegram gửi đi');

    // Lỗi khác: Lỗi mới có signature khác -> Vẫn được gửi ngay!
    const diffError = new Error('Disk space full');
    const resDiff = await notifyServerError(diffError, { endpoint: '/api/orders', source: 'test' });
    assert(resDiff.throttled === false, 'Lỗi khác signature: Được gửi ngay lập tức');
    assert(fetchCallCount === 2, 'Lỗi khác signature: Telegram API fetch được gọi cho lỗi mới');

    resetErrorHistoryForTest();
  } finally {
    global.fetch = originalFetch;
    delete process.env.DEV_ALERT_TELEGRAM_TOKEN;
    delete process.env.DEV_ALERT_TELEGRAM_CHAT_ID;
  }
}

await testThrottling();

// ----------------------------------------------------
// 5. KIỂM THỬ XỬ LÝ AN TOÀN KHI CHƯA CẤU HÌNH BOT DEVELOPER
// ----------------------------------------------------
console.log('\n5️⃣ KIỂM TRA TÍNH AN TOÀN KHI CHƯA CẤU HÌNH BOT (GRACEFUL FALLBACK):');

delete process.env.DEV_ALERT_TELEGRAM_TOKEN;
delete process.env.DEV_ALERT_TELEGRAM_CHAT_ID;

const unconfiguredErrRes = await notifyServerError(new Error('Test unconfigured'));
assert(unconfiguredErrRes.success === false, 'notifyServerError trả về success: false khi chưa cấu hình');
assert(unconfiguredErrRes.error === 'DEV_TELEGRAM_NOT_CONFIGURED', 'Báo mã lỗi DEV_TELEGRAM_NOT_CONFIGURED');

const unconfiguredWarnRes = await notifyServerWarning('Warning Test', 'No dev bot configured');
assert(unconfiguredWarnRes.success === false, 'notifyServerWarning không làm crash server khi chưa có bot');

const unconfiguredStartupRes = await notifyServerStartup();
assert(unconfiguredStartupRes.success === false, 'notifyServerStartup chạy an toàn khi chưa có bot');

const testAlertRes = await testDeveloperServerAlert('', '');
assert(testAlertRes.success === false, 'testDeveloperServerAlert từ chối khi thiếu token/chatId');

// ----------------------------------------------------
// 6. KIỂM THỬ TÍNH NĂNG NẠP CẤU HÌNH & CHẨN ĐOÁN ENV
// ----------------------------------------------------
console.log('\n6️⃣ KIỂM TRA TỰ ĐỘNG NẠP VÀ CHẨN ĐOÁN ENV:');

const diag = getEnvDiagnosticInfo();
assert(Array.isArray(diag.checkedFiles), 'getEnvDiagnosticInfo trả về danh sách checkedFiles');
assert(Array.isArray(diag.foundFiles), 'getEnvDiagnosticInfo trả về danh sách foundFiles');
assert(typeof diag.devAlertsJsonExists === 'boolean', 'getEnvDiagnosticInfo trả về trạng thái devAlertsJsonExists');

// ----------------------------------------------------
// KẾT QUẢ KIỂM THỬ
// ----------------------------------------------------
resetErrorHistoryForTest();

console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ MONITORING BOT: ${passedTests} ĐẠT / ${passedTests + failedTests} BÀI TEST`);
if (failedTests > 0) {
  console.error(`💥 CÓ ${failedTests} BÀI TEST BỊ THẤT BẠI!`);
  process.exit(1);
} else {
  console.log('🔒 TẤT CẢ TIÊU CHUẨN GIÁM SÁT 24/7 & CÔ LẬP BOT ĐÃ ĐẠT CHUẨN HOÀN TOÀN!');
  console.log('====================================================\n');
  process.exit(0);
}
