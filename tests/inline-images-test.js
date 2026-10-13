import './_setup-env.js';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { externalizeInlineImages } from '../server/inlineImages.js';
import { UPLOAD_DIR } from '../server/uploads.js';

let failed = 0;
const assert = (cond, msg) => { console.log(`  ${cond ? '✅ [PASS]' : '❌ [FAIL]'} ${msg}`); if (!cond) failed++; };
console.log('🖼️ KIỂM THỬ CHUYỂN ẢNH BASE64 NHÚNG THÀNH TỆP\n');

// PNG hợp lệ tối thiểu (header + đệm) đủ lớn để vượt ngưỡng 20KB
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(30 * 1024, 7)]);
const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
const data = {
  brandSettings: { logoUrl: dataUrl, seoImage: '/uploads/da-co.jpg' },
  products: [{ id: 1, image: dataUrl, gallery: ['/images/a.jpg', dataUrl] }, { id: 2, image: 'data:image/png;base64,AAAA' }],
  fakeImage: 'data:image/png;base64,' + Buffer.alloc(30 * 1024, 1).toString('base64')
};
const stats = externalizeInlineImages(data);
assert(stats.replaced === 3 && stats.skipped === 1, `Thay 3 chỗ, bỏ qua 1 ảnh giả không đúng định dạng (${stats.replaced}/${stats.skipped})`);
assert(/^\/uploads\/\d{13}-[a-f0-9]{16}\.png$/.test(data.brandSettings.logoUrl), 'Logo thành đường dẫn /uploads/...');
assert(data.brandSettings.logoUrl === data.products[0].image && data.products[0].gallery[1] === data.brandSettings.logoUrl, 'Cùng một ảnh chỉ lưu một tệp');
assert(data.products[0].gallery[0] === '/images/a.jpg' && data.brandSettings.seoImage === '/uploads/da-co.jpg', 'Đường dẫn sẵn có giữ nguyên');
assert(data.products[1].image === 'data:image/png;base64,AAAA', 'Chuỗi base64 nhỏ giữ nguyên');
assert(fs.existsSync(path.join(UPLOAD_DIR, path.basename(data.brandSettings.logoUrl))), 'Tệp ảnh đã được ghi vào DATA_DIR/uploads');

// Script: dry-run không ghi, --apply ghi và sao lưu
fs.writeFileSync(path.join(process.env.DATA_DIR, 'settings.json'), JSON.stringify({ brandSettings: { logoUrl: dataUrl } }));
const run = (...args) => execFileSync('node', ['scripts/migrate-inline-images.js', ...args], { env: process.env, encoding: 'utf-8' });
run();
assert(JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, 'settings.json'), 'utf-8')).brandSettings.logoUrl.startsWith('data:'), 'Dry-run không sửa dữ liệu');
run('--apply');
const after = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, 'settings.json'), 'utf-8'));
assert(after.brandSettings.logoUrl.startsWith('/uploads/'), '--apply thay ảnh nhúng bằng đường dẫn tệp');
assert(fs.existsSync(path.join(process.env.DATA_DIR, 'settings.json.pre-image-migration.bak')), '--apply sao lưu tệp gốc trước khi sửa');

console.log(failed ? `\n❌ ${failed} test thất bại` : '\n✅ Tất cả đạt');
process.exit(failed ? 1 : 0);
