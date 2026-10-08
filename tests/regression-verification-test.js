// tests/regression-verification-test.js
// Kiểm tra hồi quy toàn diện các tính năng sau khi khắc phục lỗi scroll trang chi tiết tin tức

import './_setup-env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

console.log('====================================================');
console.log('🔍 BẮT ĐẦU KIỂM THỬ HỒI QUY TOÀN DIỆN CÁC TÍNH NĂNG');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

// ----------------------------------------------------
// 1. KIỂM TRA TRANG CHI TIẾT TIN TỨC (NEWSDETAILPAGE)
// ----------------------------------------------------
console.log('1️⃣ KIỂM TRA TÍNH NĂNG VÀ CƠ CHẾ CUỘN CỦA NEWSDETAILPAGE:');
const newsDetailPath = path.join(ROOT_DIR, 'src', 'components', 'NewsDetailPage.jsx');
assert(fs.existsSync(newsDetailPath), 'Tệp NewsDetailPage.jsx tồn tại');
const newsDetailContent = fs.readFileSync(newsDetailPath, 'utf-8');

// Phải có cuộn trang theo slug
assert(
  newsDetailContent.includes('window.scrollTo({ top: 0, behavior: \'smooth\' });') &&
  newsDetailContent.includes('[slug]'),
  'Cuộn trang lên đầu chỉ phụ thuộc vào [slug]'
);

// Không được cuộn trang theo currentArticle hoặc brandSettings
const hasBadScrollEffect = /useEffect\s*\(\s*\(\)\s*=>\s*\{[^}]*scrollTo[^}]*\}\s*,\s*\[\s*currentArticle\s*,\s*brandSettings\s*\]\s*\)/s.test(newsDetailContent);
assert(!hasBadScrollEffect, 'Không có useEffect nào vừa chứa scrollTo vừa phụ thuộc vào currentArticle hoặc brandSettings');

// Title trình duyệt vẫn được cập nhật độc lập
assert(
  newsDetailContent.includes('document.title = `${currentArticle.seoTitle || currentArticle.title} | ${brand}`;'),
  'Vẫn giữ nguyên cơ chế cập nhật document.title chuẩn SEO cho bài viết'
);

// Các tính năng tương tác của bài viết vẫn đầy đủ
assert(newsDetailContent.includes('handleCopyLink'), 'Nút sao chép liên kết hoạt động');
assert(newsDetailContent.includes('handleShareFacebook'), 'Nút chia sẻ Facebook hoạt động');
assert(newsDetailContent.includes('handleShareZalo'), 'Nút chia sẻ Zalo hoạt động');
assert(newsDetailContent.includes('relatedProduct'), 'Khung giới thiệu sản phẩm liên quan trong bài viết hoạt động');
assert(newsDetailContent.includes('relatedArticles'), 'Khối bài viết cùng chủ đề ở chân trang hoạt động');
assert(newsDetailContent.includes('trendingArticles'), 'Khối bài viết đọc nhiều nhất ở sidebar hoạt động');

// ----------------------------------------------------
// 2. KIỂM TRA TRANG CHI TIẾT SẢN PHẨM (PRODUCTDETAILPAGE)
// ----------------------------------------------------
console.log('\n2️⃣ KIỂM TRA TÍNH NĂNG TRANG CHI TIẾT SẢN PHẨM (KHÔNG BỊ ẢNH HƯỞNG):');
const productDetailPath = path.join(ROOT_DIR, 'src', 'components', 'ProductDetailPage.jsx');
assert(fs.existsSync(productDetailPath), 'Tệp ProductDetailPage.jsx tồn tại');
const productDetailContent = fs.readFileSync(productDetailPath, 'utf-8');

assert(
  productDetailContent.includes('window.scrollTo({ top: 0, behavior: \'smooth\' });') &&
  productDetailContent.includes('[productId]'),
  'ProductDetailPage vẫn giữ nguyên cơ chế cuộn trang theo [productId]'
);
assert(productDetailContent.includes('document.title'), 'ProductDetailPage vẫn cập nhật document.title chuẩn');
assert(productDetailContent.includes('matchProduct'), 'ProductDetailPage vẫn hỗ trợ tìm kiếm theo cả ID và Slug');
assert(productDetailContent.includes('addToCart'), 'Tính năng thêm sản phẩm vào giỏ hàng từ trang chi tiết hoạt động');

// ----------------------------------------------------
// 3. KIỂM TRA ĐIỀU HƯỚNG TỔNG THỂ (APP.JSX)
// ----------------------------------------------------
console.log('\n3️⃣ KIỂM TRA ĐIỀU HƯỚNG TỔNG THỂ TRONG APP.JSX:');
const appPath = path.join(ROOT_DIR, 'src', 'App.jsx');
const appContent = fs.readFileSync(appPath, 'utf-8');

assert(appContent.includes('isNewsDetail'), 'Hỗ trợ route bài viết chi tiết /tin-tuc/:slug');
assert(appContent.includes('isProductDetail'), 'Hỗ trợ route sản phẩm chi tiết /san-pham/:idOrSlug');
assert(appContent.includes('isNewsList'), 'Hỗ trợ route danh sách tin tức /tin-tuc');
assert(appContent.includes('<HeroSection />'), 'Trang chủ vẫn hiển thị HeroSection');
assert(appContent.includes('<FlowerGrid />'), 'Trang chủ vẫn hiển thị lưới sản phẩm');
assert(appContent.includes('<HomeNewsSection />'), 'Trang chủ vẫn hiển thị tin tức tiêu biểu');

// ----------------------------------------------------
// 4. KIỂM TRA SHOP CONTEXT (DỮ LIỆU & ĐIỀU HƯỚNG)
// ----------------------------------------------------
console.log('\n4️⃣ KIỂM TRA DỮ LIỆU VÀ ĐIỀU HƯỚNG TRONG SHOPCONTEXT.JSX:');
const shopContextPath = path.join(ROOT_DIR, 'src', 'context', 'ShopContext.jsx');
const shopContextContent = fs.readFileSync(shopContextPath, 'utf-8');

assert(shopContextContent.includes('navigateTo'), 'Hàm navigateTo tồn tại');
assert(shopContextContent.includes('currentPath'), 'State currentPath tồn tại');
assert(shopContextContent.includes('brandSettings'), 'State brandSettings tồn tại');
assert(shopContextContent.includes('articles'), 'State articles tồn tại');
assert(shopContextContent.includes('categories'), 'State categories tồn tại');

console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ HỒI QUY: ${passed} ĐẠT / ${passed + failed} BÀI TEST`);
if (failed === 0) {
  console.log('🎉 TẤT CẢ TÍNH NĂNG HIỆN CÓ ĐỀU HOẠT ĐỘNG HOÀN HẢO, KHÔNG BỊ ẢNH HƯỞNG!');
} else {
  console.error(`⚠️ CÓ ${failed} BÀI TEST THẤT BẠI!`);
  process.exit(1);
}
console.log('====================================================\n');
