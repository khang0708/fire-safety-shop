// src/services/zaloService.js
// Module hỗ trợ cả Zalo Cá Nhân (Personal Zalo) và Zalo Doanh Nghiệp (Zalo OA)

import { getUserInfo, getPhoneNumber } from 'zmp-sdk/apis';

export const isRunningInZalo = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /zalo/i.test(userAgent) || Boolean(window.ZLP) || Boolean(window.ZMP);
};

// Hàm định dạng thông tin sản phẩm chi tiết để gửi kèm qua Zalo
export const formatProductZaloMessage = (product, specs = {}, selectedSize = null) => {
  if (!product) return '';
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://fire-safety-shop.vercel.app';
  const sizeText = selectedSize?.name ? ` [Quy cách: ${selectedSize.name}]` : '';
  const price = selectedSize?.price || product.price || 0;
  
  let msg = `🧯 [YÊU CẦU TƯ VẤN THIẾT BỊ PCCC]\n`;
  msg += `• Thiết bị: ${product.name}${sizeText}\n`;
  msg += `• Giá kiểm định xuất xưởng: ${Number(price).toLocaleString('vi-VN')}đ\n`;
  
  if (specs.agent) msg += `• Chất chữa cháy: ${specs.agent}\n`;
  if (specs.fireClass) msg += `• Đám cháy phù hợp: ${specs.fireClass}\n`;
  if (specs.range) msg += `• Tầm phun hiệu quả: ${specs.range}\n`;
  if (specs.bulkPrice) msg += `• Giá sỉ / dự án: ${specs.bulkPrice}\n`;
  
  msg += `• Tiêu chuẩn: 100% Tem kiểm định Bộ Công An • Chuẩn TCVN 3890:2023\n`;
  msg += `• Link xem sản phẩm: ${currentUrl}/#catalog\n\n`;
  msg += `Chào kỹ sư FLAMEGUARD PRO, vui lòng tư vấn chi tiết và thời gian giao thiết bị này giúp tôi!`;
  
  return msg;
};

// 1. Mở Chat Zalo Cá Nhân qua Số Điện Thoại (Có hỗ trợ copy tin nhắn mẫu kèm nội dung sản phẩm)
export const openPersonalZaloChat = (phone = '0843066604', prefilledText = '', onCopied = null) => {
  const cleanPhone = (phone || '0843066604').replace(/\D/g, '');
  
  if (prefilledText && typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      navigator.clipboard.writeText(prefilledText);
      if (typeof onCopied === 'function') {
        onCopied(prefilledText);
      }
    } catch (e) {
      console.warn('Clipboard write error:', e);
      if (typeof onCopied === 'function') {
        onCopied(prefilledText);
      }
    }
  } else if (typeof onCopied === 'function') {
    onCopied(prefilledText);
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
