// server/inlineImages.js
// Chuyển ảnh base64 nhúng trong dữ liệu JSON (logo, ảnh sản phẩm, ảnh nghiệm thu...) thành tệp /uploads/<tên>.
// Lý do: base64 làm /api/settings, /api/products, /api/orders nặng hàng MB, tải ở MỌI lượt mở trang và không cache được.
// Chỉ dùng module có sẵn của Node (script chạy được ngay trong container).

import { saveImageDataUrl } from './uploads.js';

const MIN_INLINE_LENGTH = 20 * 1024; // chuỗi nhỏ hơn mức này (icon nhỏ) giữ nguyên
const INLINE_IMAGE = /^data:image\/(png|jpe?g|webp);base64,/i;

// Duyệt đệ quy, thay mọi chuỗi data:image lớn bằng URL tệp. `save(dataUrl, đườngDẫnTrườngDữLiệu)` => { ok, url } | { ok:false, message } (có thể async).
// Trả về số liệu để báo cáo; dữ liệu được sửa tại chỗ.
export const externalizeInlineImages = async (root, save = saveImageDataUrl) => {
  const stats = { replaced: 0, skipped: 0, bytesBefore: 0, details: [] };
  const cache = new Map(); // cùng một ảnh xuất hiện nhiều nơi chỉ lưu một tệp

  // Trả về URL mới nếu `value` là ảnh nhúng cần chuyển, ngược lại undefined
  const convert = async (value, here) => {
    if (typeof value !== 'string' || value.length < MIN_INLINE_LENGTH || !INLINE_IMAGE.test(value)) return undefined;
    let url = cache.get(value);
    if (!url) {
      // data:image/jpg không phải MIME chuẩn: quy về image/jpeg để uploads.js nhận
      const result = await save(value.replace(/^data:image\/jpg;/i, 'data:image/jpeg;'), here);
      if (!result.ok) {
        stats.skipped++;
        stats.details.push(`${here}: bỏ qua (${result.message})`);
        return undefined;
      }
      url = result.url;
      cache.set(value, url);
    }
    stats.bytesBefore += value.length;
    stats.replaced++;
    stats.details.push(`${here}: ${Math.round(value.length / 1024)}KB -> ${url}`);
    return url;
  };

  const visit = async (node, trail) => {
    const entries = Array.isArray(node) ? node.map((v, i) => [i, v]) : Object.entries(node);
    for (const [key, value] of entries) {
      const here = Array.isArray(node) ? `${trail}[${key}]` : (trail ? `${trail}.${key}` : key);
      if (typeof value === 'string') {
        const url = await convert(value, here);
        if (url) node[key] = url;
      } else if (value && typeof value === 'object') {
        await visit(value, here);
      }
    }
  };

  if (root && typeof root === 'object') await visit(root, '');
  return stats;
};

export const DATA_FILES_WITH_IMAGES = ['settings.json', 'products.json', 'orders.json', 'reviews.json', 'articles.json', 'categories.json'];
