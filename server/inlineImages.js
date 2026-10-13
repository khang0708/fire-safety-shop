// server/inlineImages.js
// Chuyển ảnh base64 nhúng trong dữ liệu JSON (logo, ảnh sản phẩm, ảnh nghiệm thu...) thành tệp /uploads/<tên>.
// Lý do: base64 làm /api/settings, /api/products, /api/orders nặng hàng MB, tải ở MỌI lượt mở trang và không cache được.
// Chỉ dùng module có sẵn của Node (script chạy được ngay trong container).

import { saveImageDataUrl } from './uploads.js';

const MIN_INLINE_LENGTH = 20 * 1024; // chuỗi nhỏ hơn mức này (icon nhỏ) giữ nguyên
const INLINE_IMAGE = /^data:image\/(png|jpe?g|webp);base64,/i;
const EMBEDDED_IMAGE = /data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+/gi;

// Duyệt đệ quy, thay mọi chuỗi data:image lớn bằng URL tệp. `save(dataUrl, đườngDẫnTrườngDữLiệu)` => { ok, url } | { ok:false, message } (có thể async).
// Trả về số liệu để báo cáo; dữ liệu được sửa tại chỗ.
export const externalizeInlineImages = async (root, save = saveImageDataUrl) => {
  const stats = { replaced: 0, skipped: 0, bytesBefore: 0, details: [] };
  const cache = new Map(); // cùng một ảnh xuất hiện nhiều nơi chỉ lưu một tệp

  // Lưu một data URL (có cache để cùng ảnh chỉ lưu một tệp). Trả về URL, hoặc undefined nếu không lưu được.
  const store = async (dataUrl, here) => {
    let url = cache.get(dataUrl);
    if (url) return url;
    // data:image/jpg không phải MIME chuẩn: quy về image/jpeg để uploads.js nhận
    const result = await save(dataUrl.replace(/^data:image\/jpg;/i, 'data:image/jpeg;'), here);
    if (!result.ok) {
      stats.skipped++;
      stats.details.push(`${here}: bỏ qua (${result.message})`);
      return undefined;
    }
    cache.set(dataUrl, result.url);
    return result.url;
  };

  // Trả về chuỗi mới nếu `value` chứa ảnh nhúng cần chuyển (cả khi cả chuỗi là data URL lẫn khi nằm trong HTML bài viết), ngược lại undefined
  const convert = async (value, here) => {
    if (value.length < MIN_INLINE_LENGTH) return undefined;
    if (INLINE_IMAGE.test(value)) {
      const url = await store(value, here);
      if (!url) return undefined;
      stats.bytesBefore += value.length;
      stats.replaced++;
      stats.details.push(`${here}: ${Math.round(value.length / 1024)}KB -> ${url}`);
      return url;
    }
    if (!/data:image\/(?:png|jpe?g|webp);base64,/i.test(value)) return undefined;
    // Ảnh nhúng trong HTML (ví dụ <img src="data:image/png;base64,...">)
    let out = '';
    let last = 0;
    let changed = false;
    for (const m of value.matchAll(EMBEDDED_IMAGE)) {
      if (m[0].length < MIN_INLINE_LENGTH) continue;
      const url = await store(m[0], here);
      if (!url) continue;
      out += value.slice(last, m.index) + url;
      last = m.index + m[0].length;
      stats.bytesBefore += m[0].length;
      stats.replaced++;
      stats.details.push(`${here}: ảnh trong HTML ${Math.round(m[0].length / 1024)}KB -> ${url}`);
      changed = true;
    }
    return changed ? out + value.slice(last) : undefined;
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
