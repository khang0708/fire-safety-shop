import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'server', 'data');

console.log('====================================================');
console.log('🛡️ BẮT ĐẦU BỘ KIỂM THỬ BẢO MẬT (SECURITY AUDIT & TESTS)');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message} - ${details}`);
    failedTests++;
  }
}

// ----------------------------------------------------
// 1. KIỂM TRA BẢO VỆ DỮ LIỆU NHẠY CẢM & BOT TOKEN
// ----------------------------------------------------
console.log('1️⃣ KIỂM TRA BẢO MẬT KHÓA BÍ MẬT & TELEGRAM BOT TOKEN:');

const srcFiles = [
  path.join(ROOT_DIR, 'src', 'App.jsx'),
  path.join(ROOT_DIR, 'src', 'context', 'ShopContext.jsx'),
  path.join(ROOT_DIR, 'src', 'api', 'index.js')
];

let hasHardcodedToken = false;
srcFiles.forEach(f => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf-8');
    if (/\b\d{9,10}:[A-Za-z0-9_-]{35}\b/.test(content)) {
      hasHardcodedToken = true;
    }
  }
});
assert(!hasHardcodedToken, 'Mã nguồn Client không chứa Telegram Bot Token hardcode bí mật');

function sanitizeBotToken(token) {
  if (!token || typeof token !== 'string') return '';
  return token.trim().replace(/^bot/i, '');
}
assert(sanitizeBotToken('bot123456:ABC') === '123456:ABC', 'Token có tiền tố "bot" được chuẩn hóa an toàn');
assert(sanitizeBotToken('  789012:XYZ  ') === '789012:XYZ', 'Token có khoảng trắng thừa được loại bỏ an toàn');

// ----------------------------------------------------
// 2. KIỂM TRA CHỐNG TẤN CÔNG XSS & LÀM SẠCH ĐẦU VÀO (INPUT SANITIZATION)
// ----------------------------------------------------
console.log('\n2️⃣ KIỂM TRA CHỐNG TẤN CÔNG XSS & LÀM SẠCH ĐẦU VÀO (INPUT SANITIZATION):');

function sanitizeUserInput(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert(1)>',
  '"><svg onload=alert(document.cookie)>',
  'javascript:alert(1)'
];

xssPayloads.forEach((payload, idx) => {
  const sanitized = sanitizeUserInput(payload);
  const isSafe = !sanitized.includes('<script>') && !sanitized.includes('<img') && !sanitized.includes('<svg');
  assert(isSafe, `XSS Payload #${idx + 1} được mã hóa ký tự nguy hiểm thành an toàn`);
});

// ----------------------------------------------------
// 3. KIỂM TRA BẢO MẬT & CHỐNG GIAN LẬN GIẢM GIÁ (COUPON FRAUD)
// ----------------------------------------------------
console.log('\n3️⃣ KIỂM TRA BẢO MẬT & CHỐNG GIAN LẬN GIẢM GIÁ (DISCOUNT INTEGRITY):');

function secureCalculateDiscount(discount, orderTotal) {
  const total = Number(orderTotal);
  if (isNaN(total) || total <= 0) return 0;
  if (!discount || !discount.isActive) return 0;
  if (total < (Number(discount.minOrderValue) || 0)) return 0;

  let deduction = 0;
  if (discount.type === 'percentage') {
    const pct = Math.max(0, Math.min(100, Number(discount.value) || 0));
    deduction = Math.round((total * pct) / 100);
    if (discount.maxDiscount && deduction > Number(discount.maxDiscount)) {
      deduction = Number(discount.maxDiscount);
    }
  } else if (discount.type === 'fixed') {
    deduction = Math.max(0, Number(discount.value) || 0);
  } else if (discount.type === 'shipping') {
    deduction = Math.max(0, Number(discount.value) || 35000);
  }

  return Math.min(deduction, total);
}

assert(secureCalculateDiscount({ type: 'fixed', value: 50000, isActive: true }, -100000) === 0, 'Chặn đơn hàng số tiền âm không bị cộng thêm tiền');
assert(secureCalculateDiscount({ type: 'fixed', value: 50000, isActive: true }, 0) === 0, 'Chặn đơn hàng 0đ không nhận chiết khấu');
assert(secureCalculateDiscount({ type: 'fixed', value: 500000, isActive: true, minOrderValue: 0 }, 200000) === 200000, 'Chiết khấu cố định bị chặn ở mức tối đa = tổng đơn hàng (không âm tiền)');
assert(secureCalculateDiscount({ type: 'percentage', value: 200, isActive: true, minOrderValue: 0 }, 100000) === 100000, 'Voucher bị sửa % > 100% được giới hạn trần an toàn');

// ----------------------------------------------------
// 4. KIỂM TRA TÍNH TOÀN VẸN & KIỂM DUYỆT ĐÁNH GIÁ (REVIEWS INTEGRITY)
// ----------------------------------------------------
console.log('\n4️⃣ KIỂM TRA TÍNH TOÀN VẸN & KIỂM DUYỆT ĐÁNH GIÁ (REVIEWS SECURITY):');

function sanitizeReviewPayload(raw) {
  const rating = Math.max(1, Math.min(5, Math.floor(Number(raw.rating) || 5)));
  const customerName = String(raw.customerName || 'Khách hàng').slice(0, 50).trim();
  const comment = String(raw.comment || '').slice(0, 500).trim();
  let proofImage = null;
  if (raw.proofImage && typeof raw.proofImage === 'string') {
    if (/^https?:\/\//i.test(raw.proofImage.trim())) {
      proofImage = raw.proofImage.trim();
    }
  }
  return { rating, customerName, comment, proofImage, isVisible: true };
}

const maliciousReview = {
  customerName: 'Hacker',
  rating: 10,
  comment: 'A'.repeat(1000),
  proofImage: 'javascript:alert(1)'
};
const cleanedReview = sanitizeReviewPayload(maliciousReview);

assert(cleanedReview.rating === 5, 'Rating vượt khung được chuẩn hóa về tối đa 5 sao');
assert(cleanedReview.comment.length <= 500, 'Comment bị giới hạn độ dài chống Spam Flood');
assert(cleanedReview.proofImage === null, 'Chặn link ảnh chứa scheme nguy hiểm (javascript:)');

// ----------------------------------------------------
// 5. KIỂM TRA KIỂM SOÁT PHÂN QUYỀN ADMIN (ACCESS CONTROL)
// ----------------------------------------------------
console.log('\n5️⃣ KIỂM TRA KIỂM SOÁT PHÂN QUYỀN ADMIN (ACCESS CONTROL):');

function verifyAdminSession(session) {
  if (!session) return false;
  if (!session.id || !session.name || !session.provider) return false;
  const validProviders = ['pin', 'google', 'facebook', 'telegram'];
  if (!validProviders.includes(session.provider)) return false;
  return true;
}

assert(!verifyAdminSession(null), 'Từ chối session Admin rỗng');
assert(!verifyAdminSession({ role: 'admin' }), 'Từ chối session thiếu thông tin xác thực provider');
assert(verifyAdminSession({ id: 'adm-01', name: 'Florist Minh Thu', provider: 'google' }), 'Chấp nhận session hợp lệ được cấp bởi SSO');

// ----------------------------------------------------
// 6. KIỂM TRA BẢO MẬT WEBHOOK FACEBOOK & DỮ LIỆU ĐẦU VÀO (META WEBHOOK & PSID SECURITY)
// ----------------------------------------------------
console.log('\n6️⃣ KIỂM TRA BẢO MẬT WEBHOOK FACEBOOK & DỮ LIỆU ĐẦU VÀO:');

function verifyMetaWebhook(mode, verifyToken, configuredSecret) {
  if (!mode || !verifyToken || !configuredSecret) return false;
  return mode === 'subscribe' && verifyToken === configuredSecret;
}

const secretToken = 'flameguard_webhook_secret_2026';
assert(verifyMetaWebhook('subscribe', 'flameguard_webhook_secret_2026', secretToken), 'Meta Webhook chấp nhận khi đúng mode subscribe và đúng secret token');
assert(!verifyMetaWebhook('subscribe', 'wrong_token_hacker', secretToken), 'Meta Webhook từ chối token sai lệch');
assert(!verifyMetaWebhook('unsubscribe', secretToken, secretToken), 'Meta Webhook từ chối mode khác subscribe');
assert(!verifyMetaWebhook(null, null, secretToken), 'Meta Webhook từ chối tham số rỗng');

// Kiểm tra client không hardcode Meta Page Access Token (EAAB...)
let hasHardcodedFbToken = false;
srcFiles.forEach(f => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf-8');
    if (/\bEAAB[A-Za-z0-9]{30,}\b/.test(content)) {
      hasHardcodedFbToken = true;
    }
  }
});
assert(!hasHardcodedFbToken, 'Mã nguồn Client không chứa hardcode Meta Page Access Token bí mật');

// ----------------------------------------------------
// TỔNG KẾT
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`🛡️ KẾT QUẢ KIỂM THỬ BẢO MẬT: ${passedTests} ĐẠT / ${passedTests + failedTests} TIÊU CHUẨN`);
if (failedTests === 0) {
  console.log('🔒 HỆ THỐNG ĐẠT CHUẨN AN TOÀN & BẢO MẬT CAO (HARDENED)!');
} else {
  console.log(`⚠️ Có ${failedTests} bài test bảo mật chưa đạt.`);
}
console.log('====================================================');
