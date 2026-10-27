import './_setup-env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let failed = 0;
const assert = (cond, msg) => { console.log(`  ${cond ? '✅ [PASS]' : '❌ [FAIL]'} ${msg}`); if (!cond) failed++; };
console.log('🗺️ KIỂM THỬ SITEMAP\n');

const { default: app, buildSitemapXml } = await import('../server/server.js');
const server = app.listen(0);
const port = server.address().port;
const res = await fetch(`http://127.0.0.1:${port}/sitemap.xml`);
const redirect = await fetch(`http://127.0.0.1:${port}/san-pham`, { redirect: 'manual' });

// Slug sản phẩm phải duy nhất khi tạo/sửa qua API
const login = await (await fetch(`http://127.0.0.1:${port}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: process.env.ADMIN_PASSWORD }) })).json();
const api = (method, url, body) => fetch(`http://127.0.0.1:${port}${url}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` }, body: JSON.stringify(body) }).then((r) => r.json());
const first = await api('POST', '/api/products', { name: 'Bình CO2 5kg MT5', price: 1000 });
const second = await api('POST', '/api/products', { name: 'Bình CO2 5kg MT5', price: 1000 });
const third = await api('POST', '/api/products', { name: 'Bình CO2 5kg MT5', price: 1000 });
const resaved = await api('PUT', `/api/products/${first.data.id}`, { name: 'Bình CO2 5kg MT5' });
const clash = await api('PUT', `/api/products/${third.data.id}`, { name: 'Bình CO2 5kg MT5', slug: second.data.slug });
const xml = await res.text();

assert(res.status === 200 && /application\/xml/.test(res.headers.get('content-type') || ''), 'GET /sitemap.xml => 200 application/xml');
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
assert(locs.includes('https://pcccphatantam.com/') && locs.includes('https://pcccphatantam.com/tin-tuc'), 'Có trang chủ và trang tin tức');
assert(locs.some((l) => l.includes('/san-pham/binh-chua-chay-bot-abc-4kg-mfzl4')), 'Có trang sản phẩm');
assert(locs.some((l) => l.includes('/tin-tuc/cach-kiem-tra-binh-chua-chay')), 'Có bài viết đã đăng');
assert(!locs.some((l) => l.includes('#') || l.endsWith('.txt')), 'Không còn URL dạng #fragment hay llms.txt');
const productLocs = locs.filter((l) => l.includes('/san-pham/'));
assert(productLocs.length === 8, `Đủ 8 sản phẩm trong dữ liệu mẫu (có ${productLocs.length})`);
assert(/<image:loc>https:\/\/pcccphatantam\.com\/images\/abc-powder-4kg\.jpg<\/image:loc>/.test(xml) || /<image:loc>https?:\/\/[^<]+<\/image:loc>/.test(xml), 'Có ảnh (image:image) với URL tuyệt đối');
assert(!/<image:loc>data:/.test(xml), 'Không đưa ảnh base64 vào sitemap');
assert(redirect.status === 301 && redirect.headers.get('location') === '/#catalog', '/san-pham (không kèm sản phẩm) chuyển hướng 301 tới /#catalog');
assert(new Set(locs).size === locs.length, 'Không trùng URL');

const custom = buildSitemapXml({
  products: [{ id: 'p1', name: 'Bình A & B', slug: '' }],
  articles: [{ slug: 'nhap', status: 'draft' }, { slug: 'dang', status: 'published', updatedAt: '2026-05-01T10:00:00Z' }]
});
assert(!custom.includes('/tin-tuc/nhap') && custom.includes('/tin-tuc/dang') && custom.includes('<lastmod>2026-05-01</lastmod>'), 'Bỏ bài nháp, giữ lastmod của bài đã đăng');
assert(custom.includes('/san-pham/binh-a-b'), 'Sản phẩm không có slug dùng slug sinh từ tên');

assert(first.data.slug === 'binh-co2-5kg-mt5' && second.data.slug === 'binh-co2-5kg-mt5-2' && third.data.slug === 'binh-co2-5kg-mt5-3', `Tạo sản phẩm trùng tên => slug được đánh số (${first.data.slug}, ${second.data.slug}, ${third.data.slug})`);
assert(resaved.data.slug === 'binh-co2-5kg-mt5', 'Lưu lại chính sản phẩm đó không làm đổi slug');
assert(clash.data.slug !== second.data.slug && clash.data.slug.startsWith('binh-co2-5kg-mt5'), `Sửa slug trùng sản phẩm khác => tự đổi (${clash.data.slug})`);

// Bài viết tạo động qua API (tin-tuc) phải hành xử như sản phẩm: slug duy nhất, vào sitemap khi đã đăng, nháp thì không
const art1 = await api('POST', '/api/articles', { title: 'Hướng dẫn dùng bình CO2 5kg', status: 'published', thumbnail: '/uploads/1700000000000-0123456789abcdef.jpg' });
const art2 = await api('POST', '/api/articles', { title: 'Hướng dẫn dùng bình CO2 5kg', status: 'published' });
const draft = await api('POST', '/api/articles', { title: 'Bai nhap bi mat', status: 'draft', seoTitle: 'TIEU-DE-NHAP-BI-MAT' });
const sitemap2 = await (await fetch(`http://127.0.0.1:${port}/sitemap.xml`)).text();
const locs2 = [...sitemap2.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
assert(art1.data.slug === 'huong-dan-dung-binh-co2-5kg' && art2.data.slug === 'huong-dan-dung-binh-co2-5kg-1', `Bài viết trùng tiêu đề => slug đánh số (${art1.data.slug}, ${art2.data.slug})`);
assert(locs2.includes(`https://pcccphatantam.com/tin-tuc/${art1.data.slug}`) && locs2.includes(`https://pcccphatantam.com/tin-tuc/${art2.data.slug}`), 'Bài viết mới đăng có trong sitemap');
assert(new RegExp(`/tin-tuc/${art1.data.slug}</loc>\\s*<lastmod>\\d{4}-\\d{2}-\\d{2}</lastmod>`).test(sitemap2), 'Bài viết có lastmod theo ngày cập nhật thật');
assert(sitemap2.includes('<image:loc>https://pcccphatantam.com/uploads/1700000000000-0123456789abcdef.jpg</image:loc>'), 'Ảnh đại diện /uploads của bài viết thành URL tuyệt đối trong sitemap');
assert(!locs2.some((l) => l.includes(draft.data.slug)), 'Bài nháp không có trong sitemap');
const toggled = await api('PATCH', `/api/articles/${draft.data.id}/toggle`);
const sitemap3 = await (await fetch(`http://127.0.0.1:${port}/sitemap.xml`)).text();
assert(toggled.data.status === 'published' && sitemap3.includes(`/tin-tuc/${draft.data.slug}</loc>`), 'Chuyển nháp -> đã đăng thì bài xuất hiện trong sitemap');
await api('PATCH', `/api/articles/${draft.data.id}/toggle`);
const sitemap4 = await (await fetch(`http://127.0.0.1:${port}/sitemap.xml`)).text();
assert(!sitemap4.includes(`/tin-tuc/${draft.data.slug}</loc>`), 'Chuyển lại thành nháp thì bài biến khỏi sitemap');
if (fs.existsSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.html'))) {
  const draftHtml = await (await fetch(`http://127.0.0.1:${port}/tin-tuc/${draft.data.slug}`)).text();
  assert(!draftHtml.includes('TIEU-DE-NHAP-BI-MAT') && !draftHtml.includes('Bai nhap bi mat'), 'Trang HTML của bài nháp không lộ tiêu đề/SEO');
  // Nội dung dự phòng cho bot: HTML ban đầu có văn bản và liên kết thật, không chỉ <div id="root"></div>
  const homeHtml = await (await fetch(`http://127.0.0.1:${port}/`)).text();
  assert(/<div id="root"><main><h1>/.test(homeHtml) && homeHtml.includes('href="/san-pham/binh-chua-chay-bot-abc-4kg-mfzl4"') && homeHtml.includes(`href="/tin-tuc/${art1.data.slug}"`), 'Trang chủ có sẵn liên kết <a href> tới sản phẩm và bài viết trong HTML ban đầu');
  assert(!homeHtml.includes(draft.data.slug), 'Liên kết dự phòng không chứa bài nháp');
  const prodRes = await fetch(`http://127.0.0.1:${port}/san-pham/binh-chua-chay-bot-abc-4kg-mfzl4`);
  const prodHtml = await prodRes.text();
  assert(prodRes.status === 200 && /<main><h1>[^<]*MFZL4/i.test(prodHtml), 'Trang sản phẩm có h1 và nội dung trong HTML ban đầu');
  const newsListHtml = await (await fetch(`http://127.0.0.1:${port}/tin-tuc`)).text();
  assert(newsListHtml.includes(`href="/tin-tuc/${art1.data.slug}"`), 'Trang /tin-tuc có sẵn liên kết tới các bài viết');
  const missingProd = await fetch(`http://127.0.0.1:${port}/san-pham/khong-ton-tai-xyz`);
  const missingNews = await fetch(`http://127.0.0.1:${port}/tin-tuc/khong-ton-tai-xyz`);
  const draftPage = await fetch(`http://127.0.0.1:${port}/tin-tuc/${draft.data.slug}`);
  assert(missingProd.status === 404 && missingNews.status === 404 && draftPage.status === 404, 'Sản phẩm/bài viết không tồn tại (hoặc là bản nháp) trả mã 404 thật, không phải 200 (soft 404)');
  const pubHtml = await (await fetch(`http://127.0.0.1:${port}/tin-tuc/${art1.data.slug}`)).text();
  assert(pubHtml.includes('Hướng dẫn dùng bình CO2 5kg'), 'Trang bài đã đăng có SEO riêng');
} else {
  console.log('  ℹ️ Bỏ qua kiểm tra HTML SEO (chưa có thư mục dist; chạy npm run build để kiểm tra)');
}

server.close();

console.log(failed ? `\n❌ ${failed} test thất bại` : '\n✅ Tất cả đạt');
process.exit(failed ? 1 : 0);
