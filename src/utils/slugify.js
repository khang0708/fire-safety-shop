/**
 * Bộ tiện ích chuẩn hóa Slug tiếng Việt chuẩn SEO cho Sản phẩm & Bài viết
 * flameguard-fire-safety
 */

/**
 * Chuyển đổi chuỗi tiếng Việt có dấu, ký tự đặc biệt thành Slug URL chuẩn SEO
 * @param {string} text Chuỗi văn bản đầu vào (Tên sản phẩm, tiêu đề bài viết...)
 * @returns {string} Slug URL chuẩn SEO (vd: 'binh-chua-chay-bot-abc-4kg-mfzl4')
 */
export const slugifyVietnamese = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu thanh tiếng Việt
    .replace(/[đĐ]/g, 'd')           // Chuyển đ/Đ thành d
    .replace(/([^0-9a-z-\s])/g, '')   // Loại bỏ ký tự đặc biệt ngoại trừ chữ, số, dấu cách, gạch nối
    .replace(/\s+/g, '-')            // Chuyển khoảng trắng thành gạch nối
    .replace(/-+/g, '-')             // Gộp nhiều dấu gạch nối liên tiếp
    .replace(/^-+|-+$/g, '');        // Cắt bỏ gạch nối ở đầu và cuối chuỗi
};

/**
 * Lấy Slug chuẩn SEO cho sản phẩm, ưu tiên theo slug đã lưu hoặc tự tạo theo tên sản phẩm
 * @param {object} product Đối tượng sản phẩm
 * @returns {string} Slug URL sản phẩm
 */
export const getProductSlug = (product) => {
  if (!product) return '';
  if (product.slug && typeof product.slug === 'string' && product.slug.trim()) {
    return slugifyVietnamese(product.slug.trim());
  }
  if (product.name && typeof product.name === 'string' && product.name.trim()) {
    const fromName = slugifyVietnamese(product.name.trim());
    if (fromName) return fromName;
  }
  return String(product.id || '');
};

/**
 * Tạo đường dẫn URL đầy đủ hoặc tương đối cho sản phẩm chuẩn SEO & Chạy Ads
 * @param {object} product Đối tượng sản phẩm
 * @param {string} [origin=''] Domain gốc (nếu truyền vào vd: https://flameguard.vn)
 * @returns {string} URL chi tiết sản phẩm chuẩn SEO
 */
export const getProductUrl = (product, origin = '') => {
  const slug = getProductSlug(product);
  const path = `/san-pham/${slug}`;
  if (!origin) return path;
  return `${origin.replace(/\/+$/, '')}${path}`;
};

/**
 * Tìm kiếm sản phẩm trong danh sách theo slug chuẩn SEO hoặc theo id
 * Hỗ trợ khớp cả slug tiếng Việt, id gốc và các biến thể URL
 * @param {Array} products Danh sách sản phẩm
 * @param {string} idOrSlug Mã định danh hoặc slug từ URL
 * @returns {object|null} Sản phẩm tìm thấy hoặc null
 */
export const matchProduct = (products, idOrSlug) => {
  if (!Array.isArray(products) || !products.length || !idOrSlug) return null;
  const target = String(idOrSlug).trim().toLowerCase();

  // 1. Khớp chính xác trường slug của sản phẩm
  let found = products.find(p => p.slug && p.slug.toLowerCase() === target);
  if (found) return found;

  // 2. Khớp chính xác slug tạo từ tên sản phẩm
  found = products.find(p => {
    const generated = slugifyVietnamese(p.name);
    return generated && generated.toLowerCase() === target;
  });
  if (found) return found;

  // 3. Khớp chính xác ID sản phẩm
  found = products.find(p => String(p.id).toLowerCase() === target);
  if (found) return found;

  // 4. Khớp fallback nếu slug kết thúc bằng id (vd: binh-bot-fire-01)
  found = products.find(p => {
    const pId = String(p.id).toLowerCase();
    return target.endsWith(`-${pId}`);
  });
  if (found) return found;

  return null;
};
