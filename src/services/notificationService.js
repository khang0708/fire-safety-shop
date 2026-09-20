// src/services/notificationService.js
// Quản lý thông báo màn hình hệ điều hành (Browser Push Notification) & BroadcastChannel

const BROADCAST_CHANNEL_NAME = 'flameguard_admin_notifications';
let broadcastChannel = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported:', e);
  }
}

/**
 * Xin quyền hiển thị thông báo trình duyệt
 */
export const requestBrowserNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Lỗi xin quyền thông báo:', err);
    return 'denied';
  }
};

/**
 * Kiểm tra trạng thái quyền thông báo hiện tại
 */
export const getBrowserNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * Đẩy thông báo ra màn hình hệ thống (macOS, Windows, Android)
 */
export const showBrowserOrderNotification = (order) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const title = `🧯 ĐƠN HÀNG PCCC MỚI #${order.orderCode || order.id}!`;
    const customer = order.customerName || 'Cơ sở / Khách hàng';
    const amount = Number(order.totalAmount || 0).toLocaleString('vi-VN') + 'đ';
    const slot = order.deliverySlot || 'Giao trong ngày';
    const product = order.productName || 'Thiết bị PCCC';

    const options = {
      body: `${customer} vừa đặt "${product}" (${amount}). Hình thức giao: ${slot}.`,
      icon: '/images/abc-powder-4kg.jpg',
      badge: '/images/abc-powder-4kg.jpg',
      tag: `order-${order.id}`,
      renotify: true,
      requireInteraction: true,
    };

    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch {
    // Ignore notification errors in unsupported browsers
  }
};

/**
 * Phát sự kiện đơn mới qua các tab trình duyệt khác
 */
export const broadcastNewOrderToTabs = (order) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'NEW_ORDER', order });
  }
};

/**
 * Phát sự kiện cập nhật đơn hàng (ảnh chụp thật, trạng thái) qua các tab khác
 */
export const broadcastOrderUpdateToTabs = (orderId, updates) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'UPDATE_ORDER', orderId, updates });
  }
};

/**
 * Phát sự kiện cập nhật thông tin thiết bị PCCC qua các tab khác
 */
export const broadcastProductUpdateToTabs = (product) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'PRODUCT_UPDATED', product });
  }
};

/**
 * Phát sự kiện thêm thiết bị PCCC mới qua các tab khác
 */
export const broadcastProductAddToTabs = (product) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'PRODUCT_ADDED', product });
  }
};

/**
 * Phát sự kiện xóa thiết bị PCCC qua các tab khác
 */
export const broadcastProductDeleteToTabs = (productId) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'PRODUCT_DELETED', productId });
  }
};

/**
 * Lắng nghe sự kiện đơn mới, cập nhật đơn & thay đổi thiết bị PCCC từ các tab khác
 */
export const listenToCrossTabOrders = (onNewOrder, onUpdateOrder, productHandlers = {}) => {
  if (!broadcastChannel) return () => {};
  const handler = (event) => {
    if (!event.data) return;
    if (event.data.type === 'NEW_ORDER' && event.data.order) {
      if (typeof onNewOrder === 'function') onNewOrder(event.data.order);
    }
    if (event.data.type === 'UPDATE_ORDER' && event.data.orderId) {
      if (typeof onUpdateOrder === 'function') onUpdateOrder(event.data.orderId, event.data.updates);
    }
    if (event.data.type === 'PRODUCT_UPDATED' && event.data.product) {
      if (typeof productHandlers.onProductUpdated === 'function') {
        productHandlers.onProductUpdated(event.data.product);
      }
    }
    if (event.data.type === 'PRODUCT_ADDED' && event.data.product) {
      if (typeof productHandlers.onProductAdded === 'function') {
        productHandlers.onProductAdded(event.data.product);
      }
    }
    if (event.data.type === 'PRODUCT_DELETED' && event.data.productId) {
      if (typeof productHandlers.onProductDeleted === 'function') {
        productHandlers.onProductDeleted(event.data.productId);
      }
    }
  };
  broadcastChannel.addEventListener('message', handler);
  return () => {
    broadcastChannel.removeEventListener('message', handler);
  };
};

