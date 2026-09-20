// src/services/zaloService.js
// Module hỗ trợ cả Zalo Cá Nhân (Personal Zalo) và Zalo Doanh Nghiệp (Zalo OA)

import { getUserInfo, getPhoneNumber } from 'zmp-sdk/apis';

export const isRunningInZalo = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /zalo/i.test(userAgent) || Boolean(window.ZLP) || Boolean(window.ZMP);
};

// 1. Mở Chat Zalo Cá Nhân qua Số Điện Thoại (Có hỗ trợ copy tin nhắn mẫu)
export const openPersonalZaloChat = (phone = '0843066604', prefilledText = '') => {
  const cleanPhone = (phone || '0843066604').replace(/\D/g, '');
  
  if (prefilledText && typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      navigator.clipboard.writeText(prefilledText);
    } catch (e) {}
  }
  
  // Link chuẩn của Zalo cá nhân
  const zaloUrl = `https://zalo.me/${cleanPhone}`;
  
  // Mở tab Zalo thật
  window.open(zaloUrl, '_blank');
};

// 2. Kỹ sư kiểm định mở Zalo cá nhân để nhắn tin + gửi ảnh áp suất vạch xanh cho Khách Hàng
export const openPersonalZaloToCustomer = (customerPhone, orderCode, photoUrl, customerName) => {
  const cleanPhone = customerPhone.replace(/\D/g, '');
  const message = `Chào ${customerName || 'Quý khách'}, Trung tâm kiểm định PCCC FLAMEGUARD gửi bạn ảnh chụp đồng hồ đo áp suất vạch xanh & tem BCA của đơn hàng #${orderCode} vừa hoàn tất nghiệm thu xuất kho: ${photoUrl}`;
  
  // Copy nội dung tin nhắn vào clipboard để kỹ sư chỉ việc Paste (Ctrl+V) vào Zalo
  if (navigator.clipboard) {
    navigator.clipboard.writeText(message);
  }

  const zaloUrl = `https://zalo.me/${cleanPhone}`;
  window.open(zaloUrl, '_blank');

  return message;
};

// 3. Lấy Profile từ ZMP SDK (Khi chạy trong Zalo Mini App)
export const fetchZaloUserProfile = async () => {
  try {
    const { userInfo } = await getUserInfo({});
    if (userInfo) {
      return {
        isRealZalo: true,
        name: userInfo.name || 'Người dùng Zalo',
        avatar: userInfo.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
        id: userInfo.id,
      };
    }
  } catch (err) {
    console.warn("Zalo Native Auth Notice:", err.message);
  }

  return {
    isRealZalo: false,
    name: 'Nguyễn Văn Zalo (Test User)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    id: 'zalo_test_9988',
  };
};

// 4. Lấy Số điện thoại 1-Chạm qua Token
export const fetchZaloPhoneNumber = async () => {
  try {
    const data = await getPhoneNumber({});
    if (data?.token) {
      return {
        success: true,
        token: data.token,
        phone: '0901234567 (Zalo Token)',
      };
    }
  } catch (err) {
    console.warn("Zalo GetPhone Notice:", err.message);
  }

  return {
    success: true,
    token: 'test_token_zalo_2026',
    phone: '0909 888 999',
  };
};

// 5. Gửi thông báo ZNS (Dành cho Zalo OA Doanh Nghiệp)
export const sendTestZaloNotification = async ({
  phone = '0909123456',
  customerName = 'Quý khách',
  orderCode = 'FG-89241',
  photoUrl = 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
  oaId = '',
  accessToken = ''
}) => {
  const payload = {
    phone: phone.replace(/\s+/g, ''),
    template_id: "318492",
    template_data: {
      customer_name: customerName,
      order_code: orderCode,
      photo_url: photoUrl,
      status: "Đã đo kiểm áp suất & dán tem BCA - Chờ bạn duyệt",
      time: new Date().toLocaleTimeString('vi-VN'),
    },
    tracking_id: `zns_${orderCode}_${Date.now()}`
  };

  if (accessToken && oaId) {
    try {
      const res = await fetch('https://business.openapi.zalo.me/message/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': accessToken
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return { success: true, isRealApi: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  return {
    success: true,
    isRealApi: false,
    message: `Đã mô phỏng gửi ZNS đến SĐT ${phone}`,
    payload
  };
};
