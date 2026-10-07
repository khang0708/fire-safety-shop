// server/categories.js
// Logic thuần (không phụ thuộc thư viện) cho danh mục sản phẩm chính: kiểm tra dữ liệu, tạo id,
// xác định danh mục của sản phẩm. Dữ liệu lưu ở categories.json (mẫu: server/seed/categories.json).

export const CATEGORY_LIMITS = {
  shortName: 40,
  label: 80,
  icon: 8,
  badge: 60,
  tagline: 120,
  showcaseBadge: 80,
  showcaseTitle: 100,
  showcaseDesc: 200,
  showcaseImg: 500
};

// Biểu tượng SVG vẽ sẵn cho thiết bị cứu nạn (emoji không có thang, thang dây, mặt nạ phòng độc...).
// Lưu dạng "svg:<khóa>" trong trường icon; giao diện vẽ ở src/components/CategoryIcon.jsx.
export const SVG_ICON_PREFIX = 'svg:';
export const CATEGORY_SVG_ICON_KEYS = ['ladder', 'rope-ladder', 'gas-mask', 'helmet', 'harness', 'rescue-rope', 'stretcher', 'exit-sign'];

// id dùng làm khóa lọc/URL, không được trùng các từ khóa đặc biệt của giao diện và đường dẫn API
export const RESERVED_CATEGORY_IDS = new Set(['all', 'order', 'new']);

const TEXT_FIELDS = ['shortName', 'label', 'icon', 'badge', 'tagline', 'showcaseBadge', 'showcaseTitle', 'showcaseDesc'];

const isSafeImageRef = (value) =>
  typeof value === 'string' &&
  value.length <= CATEGORY_LIMITS.showcaseImg &&
  !/\s/.test(value) &&
  !value.includes('..') &&
  (/^https?:\/\/[^\s]+$/i.test(value) ||
    /^\/images\/[A-Za-z0-9_./-]+$/.test(value) ||
    // Ảnh admin tải lên qua POST /api/uploads/image (tên tệp do server sinh)
    /^\/uploads\/[0-9]{13}-[a-f0-9]{16}\.(png|jpg|webp)$/.test(value));

// Kiểm tra và làm sạch dữ liệu nhập. `partial = true` cho cập nhật (chỉ kiểm tra trường có gửi lên).
export const sanitizeCategoryInput = (body, { partial = false } = {}) => {
  const input = body && typeof body === 'object' ? body : {};
  const value = {};
  const errors = [];

  for (const field of TEXT_FIELDS) {
    if (input[field] === undefined) continue;
    if (typeof input[field] !== 'string') {
      errors.push(`${field} phải là chuỗi ký tự.`);
      continue;
    }
    const text = input[field].trim();
    if (field === 'icon' && text.startsWith(SVG_ICON_PREFIX)) {
      if (CATEGORY_SVG_ICON_KEYS.includes(text.slice(SVG_ICON_PREFIX.length))) value.icon = text;
      else errors.push('Biểu tượng không hợp lệ.');
      continue;
    }
    if (text.length > CATEGORY_LIMITS[field]) {
      errors.push(`${field} tối đa ${CATEGORY_LIMITS[field]} ký tự.`);
      continue;
    }
    value[field] = text;
  }

  if (input.showcaseImg !== undefined) {
    const img = typeof input.showcaseImg === 'string' ? input.showcaseImg.trim() : '';
    if (img && !isSafeImageRef(img)) {
      errors.push('Ảnh banner phải là ảnh tải lên, đường dẫn https://... hoặc /images/... (không dùng ảnh nhúng base64).');
    } else {
      value.showcaseImg = img;
    }
  }

  if (!partial || input.shortName !== undefined) {
    if (!value.shortName) errors.push('Tên ngắn của danh mục không được để trống.');
  }
  if (!partial) {
    if (!value.label) value.label = value.shortName || '';
    if (!value.icon) value.icon = '📦';
  } else if (input.label !== undefined && !value.label) {
    errors.push('Tên đầy đủ của danh mục không được để trống.');
  }

  return { value, errors };
};

// Tạo id duy nhất từ tên ngắn: chữ thường, số và dấu gạch ngang.
export const generateCategoryId = (shortName, existingIds, slugify) => {
  const used = new Set(existingIds);
  let base = String(slugify ? slugify(shortName) : shortName || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
  if (!base) base = 'danh-muc';
  if (RESERVED_CATEGORY_IDS.has(base)) base = `${base}-muc`;

  let id = base;
  let counter = 2;
  while (used.has(id) || RESERVED_CATEGORY_IDS.has(id)) {
    id = `${base}-${counter}`;
    counter += 1;
  }
  return id;
};

export const sortCategories = (categories) =>
  [...categories].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

// Dữ liệu cũ có thể thiếu `category`: suy ra từ công nghệ dập lửa cho 3 danh mục mặc định, còn lại về danh mục đầu tiên.
const LEGACY_TONE_TO_CATEGORY = {
  powder: 'extinguishers',
  co2: 'extinguishers',
  foam: 'extinguishers',
  escape: 'rescue',
  alarm: 'alarms'
};

export const resolveProductCategoryId = (product, categories) => {
  const ids = new Set((categories || []).map(c => c.id));
  if (product && product.category && ids.has(product.category)) return product.category;
  const legacy = product ? LEGACY_TONE_TO_CATEGORY[product.colorTone] : undefined;
  if (legacy && ids.has(legacy)) return legacy;
  return categories && categories.length > 0 ? categories[0].id : null;
};

// Kết quả của việc xóa: sản phẩm nào cần chuyển và chuyển đi đâu.
export const planCategoryDeletion = ({ categories, products, id, reassignTo }) => {
  if (!categories.some(c => c.id === id)) {
    return { ok: false, status: 404, error: 'NOT_FOUND', message: 'Không tìm thấy danh mục.' };
  }
  if (categories.length <= 1) {
    return { ok: false, status: 409, error: 'LAST_CATEGORY', message: 'Phải còn ít nhất một danh mục; không thể xóa danh mục cuối cùng.' };
  }

  const affected = products.filter(p => resolveProductCategoryId(p, categories) === id);
  if (affected.length > 0) {
    const target = String(reassignTo || '');
    if (!target || target === id || !categories.some(c => c.id === target)) {
      return {
        ok: false,
        status: 409,
        error: 'CATEGORY_IN_USE',
        productCount: affected.length,
        message: `Danh mục đang có ${affected.length} sản phẩm. Hãy chọn danh mục khác để chuyển các sản phẩm sang trước khi xóa.`
      };
    }
  }
  return { ok: true, affected, reassignTo: affected.length > 0 ? String(reassignTo) : null };
};
