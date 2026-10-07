// src/utils/conflictResolution.js
// Đồng bộ danh sách sản phẩm giữa trình duyệt và máy chủ. MÁY CHỦ LÀ NGUỒN SỰ THẬT.

export const getDeletedProductIds = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('flameguard_deleted_product_ids') : null;
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {}
  return new Set();
};

export const markProductDeletedLocal = (productId) => {
  try {
    const deletedSet = getDeletedProductIds();
    deletedSet.add(productId);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('flameguard_deleted_product_ids', JSON.stringify(Array.from(deletedSet)));
    }
  } catch (e) {}
};

export const unmarkProductDeletedLocal = (productId) => {
  try {
    const deletedSet = getDeletedProductIds();
    deletedSet.delete(productId);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('flameguard_deleted_product_ids', JSON.stringify(Array.from(deletedSet)));
    }
  } catch (e) {}
};

// Sản phẩm vừa tạo/sửa trên máy này có thể chưa kịp xuất hiện trong phản hồi của máy chủ
export const PENDING_GRACE_MS = 15000;

// Kết quả = đúng danh sách của máy chủ. Quy tắc:
//  - Sản phẩm máy chủ không có thì KHÔNG được giữ lại (đã xóa ở nơi khác, hoặc là dữ liệu mẫu/cache cũ),
//    trừ sản phẩm local vừa tạo trong vòng PENDING_GRACE_MS (đang chờ lưu lên máy chủ).
//  - Sản phẩm cả hai bên đều có: bản nào có updatedAt mới hơn thì thắng (local chỉ thắng khi mới hơn hẳn).
//  - Sản phẩm vừa bị xóa trên máy này (đang chờ máy chủ xác nhận) tạm thời được ẩn.
export const mergeProductsWithConflictResolution = (localProducts, serverProducts, now = Date.now()) => {
  const safeLocal = Array.isArray(localProducts) ? localProducts : [];
  const safeServer = Array.isArray(serverProducts) ? serverProducts : [];

  const deletedIds = getDeletedProductIds();
  const localById = new Map();
  safeLocal.forEach(lp => {
    if (lp && lp.id) localById.set(lp.id, lp);
  });

  const result = [];
  const serverIds = new Set();

  safeServer.forEach(sp => {
    if (!sp || !sp.id || deletedIds.has(sp.id)) return;
    serverIds.add(sp.id);

    const lp = localById.get(sp.id);
    if (!lp) {
      result.push(sp);
      return;
    }
    const localTime = lp.updatedAt ? new Date(lp.updatedAt).getTime() : 0;
    const serverTime = sp.updatedAt ? new Date(sp.updatedAt).getTime() : 0;
    // Local mới hơn hẳn => giữ bản local (người dùng vừa sửa); còn lại máy chủ thắng
    result.push(localTime > 0 && localTime > serverTime ? lp : sp);
  });

  safeLocal.forEach(lp => {
    if (!lp || !lp.id || serverIds.has(lp.id) || deletedIds.has(lp.id)) return;
    const localTime = lp.updatedAt ? new Date(lp.updatedAt).getTime() : 0;
    if (localTime > 0 && now - localTime >= 0 && now - localTime < PENDING_GRACE_MS) {
      result.push(lp);
    }
  });

  return result;
};
