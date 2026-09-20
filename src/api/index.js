// src/api/index.js
// Frontend API Client kết nối với Backend Express REST API & Telegram Direct Bridge

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Máy chủ trả về phản hồi không hợp lệ: ${text.slice(0, 100)}`);
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

export const escapeTelegramHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

export const sendTelegramOrderNotificationApi = async (botToken, chatId, order) => {
  const token = (botToken || '').trim().replace(/^bot/i, '');
  const targetChatId = String(chatId || '').trim();

  if (!token || !targetChatId || !order) {
    return { success: false, reason: 'Missing token or chatId' };
  }

  let itemsListText = '';
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsListText = '\n📋 <b>Chi tiết sản phẩm & quà kèm:</b>\n' +
      order.items.map((it, idx) => `  ${idx + 1}. ${escapeTelegramHtml(it.name)} (<b>${Number(it.price || 0).toLocaleString('vi-VN')}đ</b>)`).join('\n') + '\n';
  }

  const anonymousNotice = order.isAnonymous ? ' <i>(🕵️ Đơn gửi ẩn danh bí mật)</i>' : '';

  const htmlMessage = `🧯 <b>CÓ ĐƠN ĐẶT THIẾT BỊ PCCC MỚI!</b> (#${escapeTelegramHtml(order.orderCode || order.id)})\n\n` +
    `🏢 <b>Cơ sở / Người đặt:</b> ${escapeTelegramHtml(order.customerName || 'Khách hàng')}${anonymousNotice}\n` +
    `📞 <b>Hotline / SĐT:</b> ${escapeTelegramHtml(order.customerPhone || 'Chưa cung cấp')}\n` +
    `🧯 <b>Thiết bị chính:</b> ${escapeTelegramHtml(order.productName || 'Thiết bị PCCC kiểm định')}\n` +
    itemsListText +
    `💰 <b>Tổng thanh toán:</b> <b>${Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ</b>\n` +
    `⏱️ <b>Phương thức giao:</b> ${escapeTelegramHtml(order.deliverySlot || 'Trong ngày')}\n` +
    `📍 <b>Người nhận thiết bị:</b> ${escapeTelegramHtml(order.receiverName || '')} (${escapeTelegramHtml(order.receiverPhone || '')})\n` +
    `🏠 <b>Địa chỉ nghiệm thu:</b> ${escapeTelegramHtml(order.receiverAddress || 'Chưa cung cấp')}\n` +
    `📋 <b>Yêu cầu kỹ thuật:</b> <i>"${escapeTelegramHtml(order.cardMessage || 'TCVN 3890:2023 - Tem BCA')}"</i>\n\n` +
    `👉 <i>FLAMEGUARD PRO: Hãy mở Admin để đo kiểm áp suất vạch xanh và dán tem xuất kho!</i>`;

  try {
    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: htmlMessage,
        parse_mode: 'HTML'
      })
    });
    const data = await res.json();
    return { success: Boolean(data && data.ok), data: data?.result };
  } catch (err) {
    console.warn('Browser direct Telegram failed, attempting proxy fallback:', err.message);
    try {
      return await request('/notifications/telegram-test', {
        method: 'POST',
        body: JSON.stringify({ botToken: token, chatId: targetChatId, testOrder: order })
      });
    } catch (proxyErr) {
      return { success: false, error: err.message };
    }
  }
};

export const sendTelegramTestApi = async (botToken, chatId, testOrder) => {
  const token = (botToken || '').trim().replace(/^bot/i, '');
  const targetChatId = String(chatId || '').trim();

  if (!token || !targetChatId) {
    throw new Error('Vui lòng nhập đầy đủ cả Bot Token và Chat ID');
  }

  // Thử gửi trực tiếp qua Telegram OpenAPI từ trình duyệt
  const order = testOrder || {
    orderCode: 'FB-TEST-2026',
    customerName: 'Anh Hoàng Nam',
    productName: 'Bó Hoa Juliet Nắng Ban Mai',
    totalAmount: 850000,
    deliverySlot: 'Hỏa tốc 60 phút',
    receiverAddress: 'Khu công nghệ cao TP. Thủ Đức'
  };

  const htmlMessage = `🧯 <b>CÓ ĐƠN ĐẶT THIẾT BỊ PCCC!</b> (#${escapeTelegramHtml(order.orderCode)})\n\n` +
    `🏢 <b>Cơ sở:</b> ${escapeTelegramHtml(order.customerName)}\n` +
    `🧯 <b>Thiết bị:</b> ${escapeTelegramHtml(order.productName)}\n` +
    `💰 <b>Tổng tiền:</b> ${Number(order.totalAmount).toLocaleString('vi-VN')}đ\n` +
    `⏱️ <b>Tiến độ:</b> ${escapeTelegramHtml(order.deliverySlot)}\n` +
    `📍 <b>Địa chỉ:</b> ${escapeTelegramHtml(order.receiverAddress)}\n\n` +
    `👉 <i>FLAMEGUARD PRO: Sẵn sàng đo kiểm áp suất vạch xanh & xuất xưởng!</i>`;

  try {
    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: htmlMessage,
        parse_mode: 'HTML'
      })
    });

    const data = await res.json();
    if (!data.ok) {
      if (data.error_code === 401 || data.description?.includes('Unauthorized')) {
        throw new Error('Bot Token không hợp lệ (401 Unauthorized): Chuỗi Token bị sai ký tự hoặc đã bị thu hồi. Hãy mở @BotFather gõ /mybots -> chọn bot -> API Token và copy lại.');
      }
      if (data.description?.includes('bot was blocked') || data.description?.includes('chat not found')) {
        throw new Error('Bạn chưa bấm START vào bot! Hãy mở Telegram, tìm đúng bot của bạn và bấm START trước nhé.');
      }
      throw new Error(`Lỗi từ Telegram: ${data.description}`);
    }

    return { success: true, message: '🎉 Thành công! Bot vừa gửi tin nhắn thông báo đến Telegram của bạn!', data: data.result };
  } catch (err) {
    // Nếu lỗi mạng direct, gọi fallback qua backend proxy
    try {
      return await request('/notifications/telegram-test', {
        method: 'POST',
        body: JSON.stringify({ botToken: token, chatId: targetChatId, testOrder: order })
      });
    } catch (proxyErr) {
      throw new Error(err.message || proxyErr.message);
    }
  }
};

export const getTelegramChatIdAutoApi = async (botToken) => {
  const token = (botToken || '').trim().replace(/^bot/i, '');
  if (!token) {
    throw new Error('Vui lòng dán chuỗi Bot Token vào ô trước khi dò tìm');
  }

  try {
    const updatesUrl = `https://api.telegram.org/bot${token}/getUpdates`;
    const res = await fetch(updatesUrl);
    const data = await res.json();

    if (!data.ok) {
      if (data.error_code === 401 || data.description?.includes('Unauthorized')) {
        throw new Error('Bot Token không hợp lệ (401 Unauthorized). Hãy kiểm tra lại chuỗi Token từ @BotFather.');
      }
      throw new Error(`Lỗi kết nối Telegram: ${data.description}`);
    }

    const updates = data.result || [];
    if (updates.length === 0) {
      throw new Error('Chưa có tin nhắn nào đến bot! Hãy mở Telegram, tìm bot của bạn, bấm START (hoặc gửi chữ "Hi") rồi bấm lại nút này nhé.');
    }

    const lastUpdate = updates[updates.length - 1];
    const message = lastUpdate.message || lastUpdate.channel_post || lastUpdate.callback_query?.message;

    if (!message || !message.chat) {
      throw new Error('Không tìm thấy thông tin chat. Hãy gửi 1 tin nhắn bất kỳ đến bot.');
    }

    return {
      success: true,
      chatId: String(message.chat.id),
      senderName: message.from?.first_name || message.chat?.first_name || 'Bạn',
      message: `Đã tìm thấy Chat ID: ${message.chat.id}`
    };
  } catch (err) {
    try {
      return await request('/notifications/telegram-get-chat-id', {
        method: 'POST',
        body: JSON.stringify({ botToken: token })
      });
    } catch (proxyErr) {
      throw new Error(err.message || proxyErr.message);
    }
  }
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


