// server/imageOptimize.js
// Thu nhỏ + nén ảnh phía máy chủ trước khi lưu thành tệp (dùng bởi scripts/migrate-inline-images.js).
// `sharp` được nạp khi cần; nếu thiếu thì giữ nguyên ảnh gốc và cảnh báo.

import { saveImageDataUrl } from './uploads.js';

let sharpPromise;
const loadSharp = () => {
  if (!sharpPromise) {
    sharpPromise = import('sharp').then((m) => m.default).catch(() => {
      console.warn('⚠️ Không nạp được "sharp": ảnh sẽ được lưu nguyên bản, KHÔNG nén. Chạy "npm install" rồi thử lại để nén ảnh.');
      return null;
    });
  }
  return sharpPromise;
};

// Logo hiển thị nhỏ nên giới hạn 600px; ảnh khác tối đa 1000px
const maxWidthFor = (fieldPath = '') => (/logo/i.test(fieldPath) ? 600 : 1000);

export const optimizeAndSaveDataUrl = async (dataUrl, fieldPath = '') => {
  const sharp = await loadSharp();
  if (!sharp) return saveImageDataUrl(dataUrl);

  try {
    const input = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
    const image = sharp(input, { failOn: 'none' }).rotate(); // .rotate() áp dụng hướng EXIF của ảnh chụp điện thoại
    const meta = await image.metadata();
    const resized = image.resize({ width: maxWidthFor(fieldPath), withoutEnlargement: true });
    // Ảnh có nền trong suốt (logo PNG) -> WebP giữ alpha; còn lại -> JPEG tương thích mọi nơi (kể cả crawler MXH)
    const output = meta.hasAlpha
      ? await resized.webp({ quality: 82 }).toBuffer()
      : await resized.jpeg({ quality: 80, progressive: true, mozjpeg: true }).toBuffer();
    // Chỉ dùng bản nén nếu thực sự nhẹ hơn bản gốc
    if (output.length >= input.length) return saveImageDataUrl(dataUrl);
    const mime = meta.hasAlpha ? 'image/webp' : 'image/jpeg';
    return saveImageDataUrl(`data:${mime};base64,${output.toString('base64')}`);
  } catch {
    // Không giải mã/nén được: vẫn đưa ảnh gốc ra tệp (nhẹ JSON) thay vì bỏ qua
    return saveImageDataUrl(dataUrl);
  }
};
