// scripts/migrate-inline-images.js
// Mỗi ảnh còn được thu nhỏ (tối đa 1000px, logo 600px) và nén lại (JPEG/WebP) nên nhẹ hơn nhiều so với bản gốc.
// Chuyển ảnh base64 đang nhúng trong dữ liệu thật (settings/products/orders/reviews/articles/categories) thành tệp trong DATA_DIR/uploads.
// Mặc định CHỈ BÁO CÁO (dry-run). Thêm --apply để ghi; mỗi tệp JSON được sao lưu thành <tên>.pre-image-migration.bak trước khi sửa.
//
// Docker:   docker exec -it flameguard-web node scripts/migrate-inline-images.js           (xem trước)
//           docker exec -it flameguard-web node scripts/migrate-inline-images.js --apply   (thực hiện)
// Không Docker: DATA_DIR=/var/lib/fire-safety-data node scripts/migrate-inline-images.js --apply

import fs from 'fs';
import path from 'path';
import { DATA_DIR, writeJsonFileSync } from '../server/storage.js';
import { externalizeInlineImages, DATA_FILES_WITH_IMAGES } from '../server/inlineImages.js';
import { optimizeAndSaveDataUrl } from '../server/imageOptimize.js';

const apply = process.argv.includes('--apply');
console.log(`Thư mục dữ liệu: ${DATA_DIR}`);
console.log(apply ? 'Chế độ: GHI (--apply)\n' : 'Chế độ: XEM TRƯỚC (thêm --apply để ghi)\n');

let totalReplaced = 0;
let totalBytes = 0;
for (const fileName of DATA_FILES_WITH_IMAGES) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) continue; // chưa tùy biến: đang dùng dữ liệu mẫu, không có gì để chuyển

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  // Xem trước: dùng hàm lưu giả để không tạo tệp
  const stats = await externalizeInlineImages(data, apply ? optimizeAndSaveDataUrl : () => ({ ok: true, url: '/uploads/<se-duoc-tao>' }));
  if (stats.replaced === 0 && stats.skipped === 0) {
    console.log(`✔ ${fileName}: không có ảnh nhúng`);
    continue;
  }

  console.log(`• ${fileName}: ${stats.replaced} ảnh (${(stats.bytesBefore / 1024 / 1024).toFixed(2)}MB base64)${stats.skipped ? `, bỏ qua ${stats.skipped}` : ''}`);
  stats.details.forEach((d) => console.log(`    ${d}`));
  totalReplaced += stats.replaced;
  totalBytes += stats.bytesBefore;

  if (apply && stats.replaced > 0) {
    fs.copyFileSync(filePath, `${filePath}.pre-image-migration.bak`);
    writeJsonFileSync(fileName, data);
  }
}

console.log(`\nTổng: ${totalReplaced} ảnh, giảm ${(totalBytes / 1024 / 1024).toFixed(2)}MB dữ liệu JSON.${apply ? '' : ' (chưa ghi gì)'}`);
