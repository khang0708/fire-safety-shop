// src/utils/conflictResolution.js
// Quản lý giải quyết xung đột dữ liệu Local-First & Timestamp Reconciliation (Last-Write-Wins)

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

export const mergeProductsWithConflictResolution = (localProducts, serverProducts) => {
  const safeLocal = Array.isArray(localProducts) ? localProducts : [];
  const safeServer = Array.isArray(serverProducts) ? serverProducts : [];
  if (safeServer.length === 0 && safeLocal.length === 0) return [];

  const deletedIds = getDeletedProductIds();
  const productMap = new Map();

  // 1. Thêm các sản phẩm local còn hiệu lực vào map
  safeLocal.forEach(lp => {
    if (lp && lp.id && !deletedIds.has(lp.id)) {
      productMap.set(lp.id, lp);
    }
  });

  // 2. Duyệt qua sản phẩm từ server và đối chiếu timestamp (Last-Write-Wins)
  serverProducts.forEach(sp => {
    if (!sp || !sp.id || deletedIds.has(sp.id)) {
      return;
    }

    const lp = productMap.get(sp.id);
    if (!lp) {
      // Sản phẩm mới từ server mà máy khách chưa có -> thêm vào
      productMap.set(sp.id, sp);
    } else {
      // Cả 2 cùng có -> So sánh updatedAt
      const localTime = lp.updatedAt ? new Date(lp.updatedAt).getTime() : 0;
      const serverTime = sp.updatedAt ? new Date(sp.updatedAt).getTime() : 0;

      if (!lp.updatedAt || localTime === 0 || serverTime > localTime) {
        // Server có bản cập nhật mới hơn (từ máy khác) hoặc local là dữ liệu mẫu chưa sửa -> chấp nhận server
        productMap.set(sp.id, sp);
      } else {
        // Local có timestamp mới hơn hoặc bằng -> GIỮ NGUYÊN BẢN LOCAL!
        // Không ghi đè text và giá của user vừa sửa trên máy này!
      }
    }
  });

  return Array.from(productMap.values());
};
