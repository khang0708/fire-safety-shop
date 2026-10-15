import './_setup-env.js';

let failed = 0;
const assert = (cond, msg) => { console.log(`  ${cond ? '✅ [PASS]' : '❌ [FAIL]'} ${msg}`); if (!cond) failed++; };
console.log('🗺️ KIỂM THỬ SITEMAP\n');

const { default: app, buildSitemapXml } = await import('../server/server.js');
const server = app.listen(0);
const port = server.address().port;
const res = await fetch(`http://127.0.0.1:${port}/sitemap.xml`);
const redirect = await fetch(`http://127.0.0.1:${port}/san-pham`, { redirect: 'manual' });
const xml = await res.text();
server.close();

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

console.log(failed ? `\n❌ ${failed} test thất bại` : '\n✅ Tất cả đạt');
process.exit(failed ? 1 : 0);
