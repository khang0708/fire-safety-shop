// src/api/index.js
// Frontend API Client kết nối với Backend Express REST API & Telegram Direct Bridge

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('flameguard_admin_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_e) {
      throw new Error(`Máy chủ trả về phản hồi không hợp lệ: ${text.slice(0, 100)}`);
    }

    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/me') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('flameguard_admin_token');
        localStorage.removeItem('flameguard_admin_user');
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('flameguard:unauthorized'));
      }
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Lỗi yêu cầu API (${response.status})`);
    }
    return data;
  } catch (err) {
    console.warn(`API [${endpoint}] Notice:`, err.message);
    throw err;
  }
}

// ----------------------------------------------------
// 0. AUTH API (Xác Thực Quản Trị Viên)
// ----------------------------------------------------
export const authLoginApi = async ({ username, password, pin }) => {
  return await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, pin })
  });
};

export const authMeApi = async () => {
  return await request('/auth/me', {
    method: 'GET'
  });
};

export const authChangePasswordApi = async ({ currentPassword, newPassword, newPin }) => {
  return await request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword, newPin })
  });
};

export const authLogoutApi = async () => {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch (_e) {}
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('flameguard_admin_token');
    localStorage.removeItem('flameguard_admin_user');
  }
};

// ----------------------------------------------------
// 1. PRODUCTS API
// ----------------------------------------------------
export const fetchProductsApi = async () => {
  const res = await request('/products');
  return res.data;
};

export const createProductApi = async (productData) => {
  const res = await request('/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  });
  return res.data;
};

export const updateProductApi = async (productId, productData) => {
  const res = await request(`/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  });
  return res.data;
};

export const toggleProductApi = async (productId) => {
  const res = await request(`/products/${productId}/toggle`, {
    method: 'PATCH'
  });
  return res.data;
};

export const deleteProductApi = async (productId) => {
  const res = await request(`/products/${productId}`, {
    method: 'DELETE'
  });
  return res;
};

// ----------------------------------------------------
// 2. ORDERS API
// ----------------------------------------------------
export const fetchOrdersApi = async () => {
  const res = await request('/orders');
  return res.data;
};

// Khách tra cứu đơn của chính mình: phải khớp cả mã đơn lẫn số điện thoại đặt hàng.
export const trackOrderApi = async (code, phone) => {
  const res = await request(`/orders/track?code=${encodeURIComponent(code)}&phone=${encodeURIComponent(phone)}`);
  return res.data;
};

// Vé dùng một lần (30 giây) để admin mở luồng sự kiện thời gian thực /api/admin/events
export const getSseTicketApi = async () => {
  const res = await request('/auth/sse-ticket', { method: 'POST' });
  return res.ticket;
};

// ----------------------------------------------------
// DANH MỤC SẢN PHẨM CHÍNH
// ----------------------------------------------------
export const fetchCategoriesApi = async () => {
  const res = await request('/categories');
  return res.data;
};

// Tải ảnh (data URL JPEG/PNG/WEBP đã nén) lên máy chủ, trả về đường dẫn dạng /uploads/<tên>.jpg
export const uploadImageApi = async (dataUrl) => {
  const res = await request('/uploads/image', { method: 'POST', body: JSON.stringify({ dataUrl }) });
  return res.url;
};

export const createCategoryApi = async (data) => {
  const res = await request('/categories', { method: 'POST', body: JSON.stringify(data) });
  return res.data;
};

export const updateCategoryApi = async (id, data) => {
  const res = await request(`/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
  return res.data;
};

// Danh mục đang có sản phẩm: bắt buộc truyền reassignTo (danh mục nhận các sản phẩm)
export const deleteCategoryApi = async (id, reassignTo) => {
  const query = reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : '';
  return await request(`/categories/${encodeURIComponent(id)}${query}`, { method: 'DELETE' });
};

export const reorderCategoriesApi = async (ids) => {
  const res = await request('/categories/order', { method: 'PUT', body: JSON.stringify({ ids }) });
  return res.data;
};

export const createOrderApi = async (orderData) => {
  const res = await request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
  return res.data;
};

export const updateOrderStatusApi = async (orderId, statusData) => {
  const res = await request(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusData)
  });
  return res.data;
};

// ----------------------------------------------------
// 3. INVENTORY API
// ----------------------------------------------------
export const fetchInventoryApi = async () => {
  const res = await request('/inventory');
  return res.data;
};

export const updateInventoryApi = async (inventoryData) => {
  const res = await request('/inventory', {
    method: 'PUT',
    body: JSON.stringify(inventoryData)
  });
  return res.data;
};

// ----------------------------------------------------
// 4. AI FLORIST VISION API
// ----------------------------------------------------
export const analyzeFlowerWithAiApi = async (imageBase64) => {
  const res = await request('/ai/analyze-flower', {
    method: 'POST',
    body: JSON.stringify({ imageBase64 })
  });
  return res.data;
};

// ----------------------------------------------------
// 5. ZALO & TELEGRAM NOTIFICATION API (Hỗ trợ Direct Bridge)
// ----------------------------------------------------
export const sendZaloZnsApi = async (payload) => {
  const res = await request('/zalo/send-zns', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return res;
};

// Token Telegram nằm ở máy chủ: trình duyệt KHÔNG gọi api.telegram.org và không giữ token đầy đủ.
// `botToken` chỉ được gửi khi admin vừa dán token mới; để trống (hoặc bản che) thì máy chủ dùng token đã lưu.
const sendableToken = (botToken) => {
  const value = (botToken || '').trim().replace(/^bot/i, '');
  return value && !value.includes('...') ? value : undefined;
};

export const sendTelegramTestApi = async (botToken, chatId, testOrder) => {
  const targetChatId = String(chatId || '').trim();
  return await request('/notifications/telegram-test', {
    method: 'POST',
    body: JSON.stringify({ botToken: sendableToken(botToken), chatId: targetChatId || undefined, testOrder })
  });
};

export const getTelegramChatIdAutoApi = async (botToken) => {
  return await request('/notifications/telegram-get-chat-id', {
    method: 'POST',
    body: JSON.stringify({ botToken: sendableToken(botToken) })
  });
};

// ----------------------------------------------------
// 6. SETTINGS API
// ----------------------------------------------------
export const fetchSettingsApi = async () => {
  const res = await request('/settings');
  return res.data;
};

export const saveSettingsApi = async (settingsData) => {
  const res = await request('/settings', {
    method: 'POST',
    body: JSON.stringify(settingsData)
  });
  return res.data;
};

// ----------------------------------------------------
// 7. DISCOUNTS / VOUCHER API
// ----------------------------------------------------
export const fetchDiscountsApi = async () => {
  const res = await request('/discounts');
  return res.data;
};

export const validateDiscountApi = async (code, orderTotal) => {
  const res = await request('/discounts/validate', {
    method: 'POST',
    body: JSON.stringify({ code, orderTotal })
  });
  return res;
};

export const createDiscountApi = async (discountData) => {
  const res = await request('/discounts', {
    method: 'POST',
    body: JSON.stringify(discountData)
  });
  return res.data;
};

export const toggleDiscountApi = async (discountId) => {
  const res = await request(`/discounts/${discountId}/toggle`, {
    method: 'PATCH'
  });
  return res.data;
};

export const deleteDiscountApi = async (discountId) => {
  const res = await request(`/discounts/${discountId}`, {
    method: 'DELETE'
  });
  return res;
};

// ----------------------------------------------------
// 8. REVIEWS & CUSTOMER FEEDBACK API
// ----------------------------------------------------
export const fetchReviewsApi = async () => {
  const res = await request('/reviews');
  return res.data;
};

export const createReviewApi = async (reviewData) => {
  const res = await request('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData)
  });
  return res.data;
};

export const toggleReviewApi = async (reviewId) => {
  const res = await request(`/reviews/${reviewId}/toggle`, {
    method: 'PATCH'
  });
  return res.data;
};

export const deleteReviewApi = async (reviewId) => {
  const res = await request(`/reviews/${reviewId}`, {
    method: 'DELETE'
  });
  return res;
};

// ----------------------------------------------------
// 9. HEALTH CHECK API
// ----------------------------------------------------
export const checkHealthApi = async () => {
  const res = await request('/health');
  return res;
};

// ----------------------------------------------------
// 10. FACEBOOK MESSENGER API
// ----------------------------------------------------
export const sendFacebookTestApi = async (fbConfig) => {
  const res = await request('/facebook/test-connection', {
    method: 'POST',
    body: JSON.stringify(fbConfig)
  });
  return res;
};

export const sendFacebookMessageApi = async (payload) => {
  const res = await request('/facebook/send-message', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return res;
};

// ----------------------------------------------------
// 11. ARTICLES & SEO BLOG API (Tin Tức & Bài Viết SEO)
// ----------------------------------------------------
export const fetchArticlesApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.category) query.set('category', params.category);
  if (params.search) query.set('search', params.search);
  if (params.limit) query.set('limit', params.limit);
  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await request(`/articles${qs}`);
  return res.data || [];
};

export const fetchArticleBySlugApi = async (slugOrId, incrementView = true) => {
  const res = await request(`/articles/${slugOrId}${incrementView ? '' : '?view=false'}`);
  return res.data;
};

export const createArticleApi = async (articleData) => {
  const res = await request('/articles', {
    method: 'POST',
    body: JSON.stringify(articleData)
  });
  return res.data;
};

export const updateArticleApi = async (id, articleData) => {
  const res = await request(`/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(articleData)
  });
  return res.data;
};

export const deleteArticleApi = async (id) => {
  const res = await request(`/articles/${id}`, {
    method: 'DELETE'
  });
  return res;
};

export const toggleArticleApi = async (id) => {
  const res = await request(`/articles/${id}/toggle`, {
    method: 'PATCH'
  });
  return res.data;
};


