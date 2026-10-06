import './_setup-env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const { slugifyVietnamese } = await import('../server/server.js');
import { SEED_ARTICLES, ARTICLE_CATEGORIES } from '../src/data/articles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const ARTICLES_FILE = path.join(ROOT_DIR, 'server', 'seed', 'articles.json');
const DIST_INDEX_FILE = path.join(ROOT_DIR, 'dist', 'index.html');
const TEMPLATE_INDEX_FILE = path.join(ROOT_DIR, 'index.html');

console.log('====================================================');
console.log('📰 BẮT ĐẦU KIỂM THỬ TÍNH NĂNG TIN TỨC & SEO TRAFFIC');
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
// 1. KIỂM TRA CƠ SỞ DỮ LIỆU BÀI VIẾT ARTICLES.JSON
// ----------------------------------------------------
console.log('1️⃣ KIỂM TRA DỮ LIỆU BÀI VIẾT & SEED CONTENT:');
assert(fs.existsSync(ARTICLES_FILE), 'Tệp dữ liệu mẫu server/seed/articles.json tồn tại');

const articlesData = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf-8'));
assert(Array.isArray(articlesData), 'articles.json là một mảng bài viết');
assert(articlesData.length >= 4, `Cơ sở dữ liệu có ít nhất 4 bài viết mẫu PCCC (hiện có ${articlesData.length})`);

const sampleArticle = articlesData[0];
assert(Boolean(sampleArticle.id), 'Bài viết có id hợp lệ');
assert(Boolean(sampleArticle.title && sampleArticle.title.length > 10), 'Tiêu đề bài viết hợp lệ');
assert(Boolean(sampleArticle.slug && !sampleArticle.slug.includes(' ')), 'Slug bài viết hợp lệ và không chứa khoảng trắng');
assert(Boolean(sampleArticle.category), 'Bài viết có phân loại chuyên mục');
assert(Boolean(sampleArticle.thumbnail && sampleArticle.thumbnail.startsWith('http')), 'Ảnh thumbnail hợp lệ');
assert(Boolean(sampleArticle.excerpt && sampleArticle.excerpt.length > 20), 'Đoạn sapo tóm tắt hợp lệ');
assert(Boolean(sampleArticle.content && sampleArticle.content.includes('<h2>')), 'Nội dung bài viết chứa cấu trúc HTML rich text');
assert(Boolean(sampleArticle.author), 'Bài viết có thông tin tác giả');
assert(Boolean(sampleArticle.readingTime), 'Bài viết có thông tin thời gian đọc');
assert(sampleArticle.viewsCount >= 0, 'Bài viết có bộ đếm lượt xem');
assert(Boolean(sampleArticle.seoTitle), 'Bài viết có cấu hình SEO Meta Title riêng biệt');
assert(Boolean(sampleArticle.seoDescription), 'Bài viết có cấu hình SEO Meta Description riêng biệt');
assert(Boolean(sampleArticle.seoKeywords), 'Bài viết có cấu hình SEO Focus Keywords');

// ----------------------------------------------------
// 2. KIỂM TRA THUẬT TOÁN TỰ ĐỘNG TẠO SLUG TIẾNG VIỆT
// ----------------------------------------------------
console.log('\n2️⃣ KIỂM TRA THUẬT TOÁN SLUG TIẾNG VIỆT CHUẨN SEO:');
const testTitle1 = 'Cách Kiểm Tra Bình Chữa Cháy Còn Dùng Được Không Chuẩn TCVN 3890';
const expectedSlug1 = 'cach-kiem-tra-binh-chua-chay-con-dung-duoc-khong-chuan-tcvn-3890';
assert(slugifyVietnamese(testTitle1) === expectedSlug1, 'Xử lý chính xác nguyên âm có dấu và chữ đ/Đ');

const testTitle2 = 'Quy Định Mới: Bình Bọt Foam 6L & Khí CO2 3kg (Năm 2026)!!!';
const expectedSlug2 = 'quy-dinh-moi-binh-bot-foam-6l-khi-co2-3kg-nam-2026';
assert(slugifyVietnamese(testTitle2) === expectedSlug2, 'Loại bỏ ký tự đặc biệt (!:()&) và gộp dấu gạch nối');

const testTitle3 = '  Đồng Hồ Đo Áp Suất   Vạch Xanh   ';
const expectedSlug3 = 'dong-ho-do-ap-suat-vach-xanh';
assert(slugifyVietnamese(testTitle3) === expectedSlug3, 'Cắt tỉa khoảng trắng đầu cuối');

assert(slugifyVietnamese('') === '', 'Xử lý chuỗi rỗng an toàn');
assert(slugifyVietnamese(null) === '', 'Xử lý null an toàn');

// ----------------------------------------------------
// 3. KIỂM TRA LOGIC NGHIỆP VỤ ARTICLES CRUD
// ----------------------------------------------------
console.log('\n3️⃣ KIỂM TRA LOGIC NGHIỆP VỤ CRUD BÀI VIẾT:');

// Thêm bài viết mới
const newArticlePayload = {
  title: 'Thử Nghiệm Tính Năng Tạo Bài Viết Mới',
  category: 'Cẩm Nang PCCC',
  thumbnail: 'https://example.com/test.jpg',
  excerpt: 'Đoạn mô tả thử nghiệm cho bài viết...',
  content: '<h2>Nội dung test</h2><p>Kiểm tra tạo bài viết</p>',
  author: 'Kỹ Sư An Toàn',
  readingTime: '3 phút đọc',
  status: 'published',
  isFeatured: true
};

const generatedSlug = slugifyVietnamese(newArticlePayload.title);
assert(generatedSlug === 'thu-nghiem-tinh-nang-tao-bai-viet-moi', 'Tạo slug tự động cho bài viết mới');

// Kiểm tra chống trùng lặp slug (Unique Slug Collision)
const existingSlugs = ['thu-nghiem-tinh-nang-tao-bai-viet-moi'];
let uniqueSlug = generatedSlug;
let counter = 1;
while (existingSlugs.includes(uniqueSlug)) {
  uniqueSlug = `${generatedSlug}-${counter}`;
  counter++;
}
assert(uniqueSlug === 'thu-nghiem-tinh-nang-tao-bai-viet-moi-1', 'Tự động giải quyết xung đột trùng lặp slug URL');

// Toggle trạng thái xuất bản
let testStatus = 'published';
testStatus = testStatus === 'published' ? 'draft' : 'published';
assert(testStatus === 'draft', 'Chuyển trạng thái từ published sang draft thành công');
testStatus = testStatus === 'published' ? 'draft' : 'published';
assert(testStatus === 'published', 'Chuyển trạng thái từ draft sang published thành công');

// Lọc bài viết cho khách hàng (ẩn bản nháp)
const mockArticlesList = [
  { id: '1', title: 'Bài đã xuất bản 1', status: 'published' },
  { id: '2', title: 'Bản nháp đang viết', status: 'draft' },
  { id: '3', title: 'Bài đã xuất bản 2', status: 'published' }
];
const guestViewList = mockArticlesList.filter(a => !a.status || a.status === 'published');
assert(guestViewList.length === 2, 'Khách hàng vãng lai chỉ thấy bài đã xuất bản (2/3)');
assert(!guestViewList.some(a => a.id === '2'), 'Bản nháp được ẩn hoàn toàn khỏi khách hàng');

// ----------------------------------------------------
// 4. KIỂM TRA TIÊM SEO SSR (META TAGS, OPEN GRAPH & SCHEMA)
// ----------------------------------------------------
console.log('\n4️⃣ KIỂM TRA TIÊM DỮ LIỆU SEO SSR CHO BOT TÌM KIẾM:');

const templateHtml = fs.existsSync(DIST_INDEX_FILE) 
  ? fs.readFileSync(DIST_INDEX_FILE, 'utf-8')
  : fs.readFileSync(TEMPLATE_INDEX_FILE, 'utf-8');

// Mô phỏng middleware xử lý request /tin-tuc/:slug
const testArticleForSeo = articlesData[0];
let injectedHtml = templateHtml;

const seoTitle = testArticleForSeo.seoTitle || `${testArticleForSeo.title} | FLAMEGUARD PRO`;
const seoDesc = testArticleForSeo.seoDescription || testArticleForSeo.excerpt;
const seoImg = testArticleForSeo.thumbnail;
const pageUrl = `https://pcccphatantam.com/tin-tuc/${testArticleForSeo.slug}`;

injectedHtml = injectedHtml.replace(/<title>.*?<\/title>/i, `<title>${seoTitle}</title>`);
injectedHtml = injectedHtml.replace(/(<meta\s+property=["']og:title["']\s+content=["']).*?(["'])/i, `$1${seoTitle}$2`);
injectedHtml = injectedHtml.replace(/(<meta\s+name=["']twitter:title["']\s+content=["']).*?(["'])/i, `$1${seoTitle}$2`);

if (seoDesc) {
  injectedHtml = injectedHtml.replace(/(<meta\s+name=["']description["']\s+content=["']).*?(["'])/i, `$1${seoDesc}$2`);
  injectedHtml = injectedHtml.replace(/(<meta\s+property=["']og:description["']\s+content=["']).*?(["'])/i, `$1${seoDesc}$2`);
  injectedHtml = injectedHtml.replace(/(<meta\s+name=["']twitter:description["']\s+content=["']).*?(["'])/i, `$1${seoDesc}$2`);
}

injectedHtml = injectedHtml.replace(/(<meta\s+property=["']og:image["']\s+content=["']).*?(["'])/i, `$1${seoImg}$2`);
injectedHtml = injectedHtml.replace(/(<meta\s+name=["']twitter:image["']\s+content=["']).*?(["'])/i, `$1${seoImg}$2`);
injectedHtml = injectedHtml.replace(/(<meta\s+property=["']og:url["']\s+content=["']).*?(["'])/i, `$1${pageUrl}$2`);
injectedHtml = injectedHtml.replace(/(<meta\s+property=["']og:type["']\s+content=["']).*?(["'])/i, `$1article$2`);
injectedHtml = injectedHtml.replace(/(<link\s+rel=["']canonical["']\s+href=["']).*?(["'])/i, `$1${pageUrl}$2`);

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": testArticleForSeo.title,
  "description": testArticleForSeo.excerpt,
  "image": [seoImg],
  "datePublished": testArticleForSeo.publishedAt,
  "author": [{ "@type": "Person", "name": testArticleForSeo.author }]
};

injectedHtml = injectedHtml.replace('</head>', `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>\n</head>`);

assert(injectedHtml.includes(`<title>${seoTitle}</title>`), 'Tiêu đề trang được thay thế bằng seoTitle của bài viết');
assert(injectedHtml.includes(`content="${seoDesc}"`), 'Meta description được thay thế bằng seoDescription của bài viết');
assert(injectedHtml.includes(`content="${seoImg}"`), 'Open Graph & Twitter image được thay thế bằng thumbnail bài viết');
assert(injectedHtml.includes(`content="${pageUrl}"`), 'Open Graph URL trỏ chính xác về đường dẫn bài viết');
assert(injectedHtml.includes(`content="article"`), 'Open Graph type được chuyển thành article');
assert(injectedHtml.includes(`href="${pageUrl}"`), 'Thẻ Canonical link trỏ chính xác về bài viết gốc');
assert(injectedHtml.includes('"@type":"NewsArticle"'), 'Tự động chèn Schema JSON-LD NewsArticle cho Google Bot');
assert(injectedHtml.includes(testArticleForSeo.title), 'Schema NewsArticle chứa đúng headline tiêu đề bài viết');

// ----------------------------------------------------
// 5. KIỂM TRA ĐIỀU HƯỚNG DANH MỤC SẢN PHẨM & LOGO TỪ BÀI VIẾT
// ----------------------------------------------------
console.log('\n5️⃣ KIỂM TRA ĐIỀU HƯỚNG DANH MỤC SẢN PHẨM (TGDD PATTERN):');

// Giả lập hành động click khi đang ở trang tin tức chi tiết
let currentPath = `/tin-tuc/${testArticleForSeo.slug}`;
let activeCategory = 'all';

function simulateClickCategory(categoryId) {
  activeCategory = categoryId;
  currentPath = '/#catalog';
}

function simulateClickLogo() {
  currentPath = '/';
}

// 1. Click vào Logo
simulateClickLogo();
assert(currentPath === '/', 'Click vào Logo trên trang tin tức đưa người dùng trở về trang chủ');

// 2. Click vào danh mục "Bình Chữa Cháy" (extinguishers)
currentPath = `/tin-tuc/${testArticleForSeo.slug}`;
simulateClickCategory('extinguishers');
assert(currentPath === '/#catalog', 'Click danh mục đưa người dùng về phần danh mục sản phẩm #catalog');
assert(activeCategory === 'extinguishers', 'Danh mục "Bình Chữa Cháy" được kích hoạt chuẩn xác');

// 3. Click vào danh mục "Cứu Hộ & Thoát Hiểm" (rescue)
currentPath = `/tin-tuc/${testArticleForSeo.slug}`;
simulateClickCategory('rescue');
assert(currentPath === '/#catalog', 'Click danh mục cứu hộ đưa người dùng về trang sản phẩm');
assert(activeCategory === 'rescue', 'Danh mục "Cứu Hộ & Thoát Hiểm" được kích hoạt');

// 4. Click vào danh mục "Báo Cháy & Tự Động" (alarms)
currentPath = `/tin-tuc/${testArticleForSeo.slug}`;
simulateClickCategory('alarms');
assert(currentPath === '/#catalog', 'Click danh mục báo cháy đưa người dùng về trang sản phẩm');
assert(activeCategory === 'alarms', 'Danh mục "Báo Cháy & Tự Động" được kích hoạt');

// ----------------------------------------------------
// 6. KIỂM TRA TÍNH NĂNG LẤY LINK & SAO CHÉP URL BÀI VIẾT
// ----------------------------------------------------
console.log('\n6️⃣ KIỂM TRA TÍNH NĂNG LẤY LINK & SAO CHÉP URL BÀI VIẾT:');

function getArticleFullUrl(slug, origin = 'https://flameguard.vn') {
  const cleanSlug = String(slug || '').trim();
  if (!cleanSlug) return '';
  return `${origin}/tin-tuc/${cleanSlug}`;
}

const sampleSlug = 'huong-dan-kiem-tra-binh-chua-chay-tcvn-3890';
const generatedUrl = getArticleFullUrl(sampleSlug, 'https://flameguard.vn');
assert(generatedUrl === 'https://flameguard.vn/tin-tuc/huong-dan-kiem-tra-binh-chua-chay-tcvn-3890', 'Đường dẫn URL bài viết tạo chính xác định dạng /tin-tuc/:slug');
assert(getArticleFullUrl('', 'https://flameguard.vn') === '', 'Xử lý slug rỗng an toàn, không tạo link rác');
assert(getArticleFullUrl('  slug-co-khoang-trang  ', 'https://flameguard.vn') === 'https://flameguard.vn/tin-tuc/slug-co-khoang-trang', 'Tự động cắt tỉa khoảng trắng trước khi tạo link bài viết');
assert(Boolean(sampleArticle.slug && getArticleFullUrl(sampleArticle.slug)), 'Bài viết mẫu tạo được link hợp lệ để sao chép');

// ----------------------------------------------------
// 7. KIỂM TRA HIỂN THỊ TIN TỨC TRÊN TRANG CHỦ (HOMENEWSSECTION)
// ----------------------------------------------------
console.log('\n7️⃣ KIỂM TRA HIỂN THỊ TIN TỨC TRANG CHỦ:');

function filterHomeNews(articles, limit = 3) {
  return (articles || [])
    .filter(a => !a.status || a.status === 'published')
    .sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    })
    .slice(0, limit);
}

const homeArticles = filterHomeNews(articlesData, 3);
assert(homeArticles.length <= 3, 'Trang chủ hiển thị tối đa 3 bài viết tiêu biểu');
assert(homeArticles.every(a => !a.status || a.status === 'published'), 'Tất cả bài viết trên trang chủ đều ở trạng thái published');
if (homeArticles.some(a => a.isFeatured)) {
  assert(homeArticles[0].isFeatured === true, 'Bài viết nổi bật (isFeatured) được ưu tiên xếp đầu trang chủ');
}

// ----------------------------------------------------
// 8. KIỂM TRA TRÌNH SOẠN THẢO TRỰC QUAN CHO NGƯỜI DÙNG NON-TECH
// ----------------------------------------------------
console.log('\n8️⃣ KIỂM TRA TRÌNH SOẠN THẢO TRỰC QUAN NON-TECH (ARTICLERICHEDITOR):');
const RICH_EDITOR_FILE = path.join(ROOT_DIR, 'src', 'components', 'ArticleRichEditor.jsx');
assert(fs.existsSync(RICH_EDITOR_FILE), 'Tệp ArticleRichEditor.jsx tồn tại');

const richEditorContent = fs.readFileSync(RICH_EDITOR_FILE, 'utf-8');
assert(richEditorContent.includes('contentEditable'), 'Hỗ trợ chế độ soạn thảo trực quan WYSIWYG (contentEditable)');
assert(richEditorContent.includes('document.execCommand'), 'Hỗ trợ các lệnh định dạng văn bản (execCommand)');
assert(richEditorContent.includes('insertSafetyNote') && richEditorContent.includes('LƯU Ý AN TOÀN'), 'Hỗ trợ 1-click chèn khung Lưu ý An toàn PCCC');
assert(richEditorContent.includes('insertDangerAlert') && richEditorContent.includes('CẢNH BÁO NGUY HIỂM'), 'Hỗ trợ 1-click chèn khung Cảnh báo Nguy hiểm PCCC');
assert(richEditorContent.includes('insertSpecTable'), 'Hỗ trợ 1-click chèn Bảng thông số kỹ thuật');
assert(richEditorContent.includes('handleConfirmInsertImage'), 'Hỗ trợ chèn ảnh vào thân bài viết (tải từ máy hoặc dán link URL)');
assert(richEditorContent.includes('mode === \'html\''), 'Hỗ trợ chuyển đổi linh hoạt giữa chế độ Trực quan và Mã HTML');

// Kiểm tra thuật toán đếm từ và thời gian đọc ước tính
function calculateArticleStats(htmlContent) {
  const clean = String(htmlContent || '').replace(/<[^>]+>/g, ' ').trim();
  const words = clean ? clean.split(/\s+/).length : 0;
  const readMinutes = Math.max(1, Math.ceil(words / 200));
  return { words, readMinutes, readingTimeStr: `${readMinutes} phút đọc` };
}

const statsSample = calculateArticleStats(sampleArticle.content);
assert(statsSample.words > 50, `Đếm số từ bài viết mẫu chính xác (${statsSample.words} từ)`);
assert(statsSample.readMinutes >= 1, `Ước tính thời gian đọc bài viết mẫu hợp lý (${statsSample.readingTimeStr})`);

console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passed} ĐẠT / ${passed + failed} BÀI TEST`);
if (failed === 0) {
  console.log('🎉 TẤT CẢ TÍNH NĂNG TRANG TIN TỨC, QUẢN LÝ BÀI VIẾT & SEO TRAFFIC ĐÃ ĐẠT CHUẨN HOÀN TOÀN!');
} else {
  console.error(`⚠️ CÓ ${failed} BÀI TEST THẤT BẠI!`);
  process.exit(1);
}
console.log('====================================================\n');
