/**
 * Test Suite: Kiểm thử Trang Chi Tiết Sản Phẩm & Hệ Thống Slug Chuẩn SEO cho Link Chạy Ads
 * flameguard-fire-safety
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { slugifyVietnamese, getProductSlug, getProductUrl, matchProduct } from '../src/utils/slugify.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function runTest(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✅ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Chi tiết lỗi: ${err.message}`);
  }
}

console.log('====================================================');
console.log('🧯 BẮT ĐẦU KIỂM THỬ TRANG CHI TIẾT SẢN PHẨM & SEO SLUG CHUẨN ADS');
console.log('====================================================\n');

// 1. Kiểm tra thuật toán Slugify tiếng Việt chuẩn SEO
console.log('1️⃣ KIỂM TRA THUẬT TOÁN TẠO SLUG TIẾNG VIỆT CHUẨN SEO:');
runTest('slugifyVietnamese xử lý chuẩn tên sản phẩm có dấu tiếng Việt và đ/Đ', () => {
  const slug1 = slugifyVietnamese('Bình Chữa Cháy Bột ABC 4kg MFZL4');
  assert.strictEqual(slug1, 'binh-chua-chay-bot-abc-4kg-mfzl4');

  const slug2 = slugifyVietnamese('Đầu Báo Khói Độc Lập Không Dây Chuông 85dB');
  assert.strictEqual(slug2, 'dau-bao-khoi-doc-lap-khong-day-chuong-85db');
});

runTest('slugifyVietnamese loại bỏ ký tự đặc biệt (!:°x.) và chuẩn hóa khoảng trắng', () => {
  const slug = slugifyVietnamese('Chăn Dập Lửa Sợi Thủy Tinh Chống Cháy 1.8m x 1.8m (550°C)');
  assert.strictEqual(slug, 'chan-dap-lua-soi-thuy-tinh-chong-chay-18m-x-18m-550c');
});

runTest('slugifyVietnamese xử lý an toàn chuỗi rỗng và null', () => {
  assert.strictEqual(slugifyVietnamese(''), '');
  assert.strictEqual(slugifyVietnamese(null), '');
  assert.strictEqual(slugifyVietnamese(undefined), '');
});

// 2. Kiểm tra hàm getProductSlug và getProductUrl (Ưu tiên tên sản phẩm cho SEO)
console.log('\n2️⃣ KIỂM TRA ƯU TIÊN SLUG THEO TÊN SẢN PHẨM CHO SEO & ADS:');
runTest('getProductSlug ưu tiên slug tùy chỉnh nếu có', () => {
  const prod = { id: 'fire-01', name: 'Bình Bột ABC 4kg', slug: 'binh-bot-abc-4kg-chuan-bca' };
  assert.strictEqual(getProductSlug(prod), 'binh-bot-abc-4kg-chuan-bca');
});

runTest('getProductSlug tự động tạo slug từ tên sản phẩm khi chưa có slug', () => {
  const prod = { id: 'fire-02', name: 'Bình Cứu Hỏa Khí CO2 3kg MT3' };
  assert.strictEqual(getProductSlug(prod), 'binh-cuu-hoa-khi-co2-3kg-mt3');
});

runTest('getProductSlug fallback về product.id khi name bị rỗng', () => {
  const prod = { id: 'fire-99' };
  assert.strictEqual(getProductSlug(prod), 'fire-99');
});

runTest('getProductUrl tạo URL chuẩn SEO dạng /san-pham/:slug', () => {
  const prod = { id: 'fire-01', name: 'Bình Chữa Cháy Bột ABC 4kg MFZL4' };
  assert.strictEqual(getProductUrl(prod), '/san-pham/binh-chua-chay-bot-abc-4kg-mfzl4');
});

runTest('getProductUrl kèm origin tạo URL tuyệt đối để gắn vào Facebook/Google Ads', () => {
  const prod = { id: 'fire-01', name: 'Bình Chữa Cháy Bột ABC 4kg MFZL4' };
  const fullUrl = getProductUrl(prod, 'https://pcccphatantam.com');
  assert.strictEqual(fullUrl, 'https://pcccphatantam.com/san-pham/binh-chua-chay-bot-abc-4kg-mfzl4');
});

// 3. Kiểm tra khả năng tìm kiếm sản phẩm linh hoạt (matchProduct)
console.log('\n3️⃣ KIỂM TRA TÌM KIẾM SẢN PHẨM (MATCHPRODUCT):');
const mockProducts = [
  { id: 'fire-01', name: 'Bình Chữa Cháy Bột ABC 4kg MFZL4', slug: 'binh-chua-chay-bot-abc-4kg-mfzl4' },
  { id: 'fire-02', name: 'Bình Cứu Hỏa Khí CO2 3kg MT3' }, // Không có trường slug, tự tạo theo tên
  { id: 'fire-03', name: 'Mặt Nạ Chống Khói Độc Thoát Hiểm TZL30', slug: 'mat-na-tzl30' }
];

runTest('matchProduct tìm thấy bằng slug chính xác', () => {
  const found = matchProduct(mockProducts, 'binh-chua-chay-bot-abc-4kg-mfzl4');
  assert.ok(found);
  assert.strictEqual(found.id, 'fire-01');
});

runTest('matchProduct tìm thấy khi sản phẩm chưa có slug nhờ tạo động theo tên', () => {
  const found = matchProduct(mockProducts, 'binh-cuu-hoa-khi-co2-3kg-mt3');
  assert.ok(found);
  assert.strictEqual(found.id, 'fire-02');
});

runTest('matchProduct tìm thấy bằng ID gốc (hỗ trợ backward-compatibility)', () => {
  const found = matchProduct(mockProducts, 'fire-03');
  assert.ok(found);
  assert.strictEqual(found.name, 'Mặt Nạ Chống Khói Độc Thoát Hiểm TZL30');
});

runTest('matchProduct xử lý không phân biệt hoa thường (case-insensitive)', () => {
  const found = matchProduct(mockProducts, 'BINH-CHUA-CHAY-BOT-ABC-4KG-MFZL4');
  assert.ok(found);
  assert.strictEqual(found.id, 'fire-01');
});

// 4. Kiểm tra mã nguồn các component giao diện
console.log('\n4️⃣ KIỂM TRA TÍCH HỢP TRONG GIAO DIỆN & ADMIN:');
runTest('ProductDetailPage.jsx sử dụng matchProduct và getProductUrl chuẩn SEO', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src', 'components', 'ProductDetailPage.jsx'), 'utf-8');
  assert.ok(content.includes('matchProduct'), 'ProductDetailPage thiếu matchProduct');
  assert.ok(content.includes('getProductUrl'), 'ProductDetailPage thiếu getProductUrl');
});

runTest('FlowerCard.jsx sử dụng getProductUrl cho liên kết chi tiết chuẩn SEO', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src', 'components', 'FlowerCard.jsx'), 'utf-8');
  assert.ok(content.includes('getProductUrl(flower)'), 'FlowerCard thiếu getProductUrl');
});

runTest('AdminDashboard.jsx copy link chạy Ads theo URL SEO slug', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src', 'components', 'AdminDashboard.jsx'), 'utf-8');
  assert.ok(content.includes('getProductUrl(prod, origin)'), 'AdminDashboard thiếu getProductUrl trong copy link');
  assert.ok(content.includes('slug:'), 'AdminDashboard thiếu trường slug trong form');
});

runTest('App.jsx hỗ trợ điều hướng /san-pham/:idOrSlug với decodeURIComponent', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src', 'App.jsx'), 'utf-8');
  assert.ok(content.includes("currentPath.startsWith('/san-pham/')"), 'App.jsx thiếu route /san-pham/');
  assert.ok(content.includes('decodeURIComponent'), 'App.jsx thiếu decodeURIComponent');
});

// 5. Kiểm tra Server SSR Dynamic Open Graph Meta Tags & Schema Product JSON-LD
console.log('\n5️⃣ KIỂM TRA SSR DYNAMIC META TAGS & SCHEMA PRODUCT:');
runTest('server/server.js xử lý route /san-pham/:idOrSlug và trỏ canonical/og:url về SEO slug', () => {
  const content = fs.readFileSync(path.join(rootDir, 'server', 'server.js'), 'utf-8');
  assert.ok(content.includes('/san-pham/') && content.includes('productDetailMatch'), 'server.js thiếu xử lý route /san-pham/:idOrSlug');
  assert.ok(content.includes('productSlug'), 'server.js thiếu tính toán productSlug cho canonical URL');
  assert.ok(content.includes('canonical'), 'Thiếu canonical URL');
  assert.ok(content.includes('"@type": "Product"') || content.includes('@type": "Product'), 'Thiếu Schema.org Product');
});

// Tổng kết
console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passedTests} ĐẠT / ${totalTests} BÀI TEST`);
if (passedTests === totalTests) {
  console.log('🎉 TẤT CẢ TÍNH NĂNG SLUG ƯU TIÊN TẠO THEO TÊN SẢN PHẨM ĐÃ ĐẠT CHUẨN HOÀN TOÀN!');
} else {
  console.error(`⚠️ CÓ ${totalTests - passedTests} BÀI TEST CHƯA ĐẠT.`);
  process.exit(1);
}
console.log('====================================================\n');
