import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FLOWERS_DATA } from '../data/flowers';
import { 
  fetchProductsApi, 
  createProductApi, 
  updateProductApi, 
  deleteProductApi, 
  toggleProductApi,
  fetchOrdersApi,
  createOrderApi,
  updateOrderStatusApi,
  fetchInventoryApi,
  checkHealthApi,
  sendTelegramTestApi,
  sendTelegramOrderNotificationApi,
  fetchSettingsApi,
  saveSettingsApi,
  fetchDiscountsApi,
  validateDiscountApi,
  createDiscountApi,
  toggleDiscountApi,
  deleteDiscountApi,
  fetchReviewsApi,
  createReviewApi,
  toggleReviewApi,
  deleteReviewApi
} from '../api';
import { playNewOrderChime } from '../services/soundService';
import { 
  showBrowserOrderNotification, 
  broadcastNewOrderToTabs, 
  broadcastOrderUpdateToTabs,
  broadcastProductUpdateToTabs,
  broadcastProductAddToTabs,
  broadcastProductDeleteToTabs,
  listenToCrossTabOrders 
} from '../services/notificationService';

const ShopContext = createContext();

const INITIAL_ORDERS = [
  {
    id: 'FG-89241',
    orderCode: 'FG-89241',
    customerName: 'Công Ty Cổ Phần Công Nghệ FPT',
    customerPhone: '0909 888 114',
    receiverName: 'Anh Tuấn - Trưởng Ban QL Tòa Nhà',
    receiverPhone: '0909 888 114',
    receiverAddress: 'Tầng 8, Tòa nhà FPT Tower, Số 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội',
    isAnonymous: false,
    productName: 'Bình Cứu Hỏa Khí CO2 3kg MT3 (Chuyên Dụng Phòng Server)',
    cardMessage: 'Yêu cầu kiểm tra kỹ van xả, đồng hồ áp suất và tem kiểm định Cục PCCC BCA trước khi bàn giao.',
    senderSign: 'Phòng Quản Trị Hạ Tầng IT',
    deliverySlot: 'Hỏa tốc 60 phút • Trong ngày hôm nay',
    totalAmount: 1440000,
    status: 'ARRANGING',
    florist: 'Kỹ sư kiểm định: Trần Đình Trọng (Xưởng PCCC 01)',
    floristAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    proofPhotoUrl: '/images/co2-extinguisher-3kg.jpg',
    isApproved: true,
    createdAt: '09:30',
    items: [
      {
        name: 'Bình Cứu Hỏa Khí CO2 3kg MT3 [Kèm Kệ Đặt Sàn Chống Gỉ] [Tem BCA] ×3',
        price: 1440000
      }
    ]
  },
  {
    id: 'FG-77215',
    orderCode: 'FG-77215',
    customerName: 'Nguyễn Hoàng Nam',
    customerPhone: '0912 345 678',
    receiverName: 'Chị Thảo (Căn hộ gia đình)',
    receiverPhone: '0988 765 432',
    receiverAddress: 'Căn hộ 1804, Chung cư Vinhomes Central Park, Bình Thạnh, TP.HCM',
    isAnonymous: false,
    productName: 'Combo An Toàn Chung Cư: 2 Bình Bột ABC 4kg + 2 Mặt Nạ Chống Khói TZL30',
    cardMessage: 'Trang bị an toàn cho gia đình nhỏ. Hướng dẫn các con cách giật chốt khi cần thiết.',
    senderSign: 'Gia đình an tâm',
    deliverySlot: 'Khung giờ vàng: 14:00 - 16:00',
    totalAmount: 920000,
    status: 'NEW',
    florist: 'Kỹ thuật viên trực ban: Lê Văn Hùng',
    floristAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    proofPhotoUrl: null,
    isApproved: false,
    createdAt: '10:15',
    items: [
      {
        name: 'Bình Chữa Cháy Bột ABC 4kg MFZL4 ×2 + Mặt Nạ Chống Khói Độc TZL30 ×2',
        price: 920000
      }
    ]
  },
  {
    id: 'FG-65102',
    orderCode: 'FG-65102',
    customerName: 'Nhà Hàng Lẩu Nướng Gyu-Kaku',
    customerPhone: '0933 222 114',
    receiverName: 'Bếp Trưởng Nguyễn Thành',
    receiverPhone: '0933 222 114',
    receiverAddress: 'Khu ẩm thực Tầng 4, TTTM Vincom Center, Quận 1, TP.HCM',
    isAnonymous: false,
    productName: 'Chăn Dập Lửa Sợi Thủy Tinh 1.8M + Bình Bọt Foam Sinh Học 6L',
    cardMessage: 'Bàn giao kèm biên bản hướng dẫn dập cháy dầu mỡ bếp ăn.',
    senderSign: 'Ban An Toàn Bếp',
    deliverySlot: 'Giao ngay trước 11:30 chuẩn bị giờ trưa',
    totalAmount: 840000,
    status: 'COMPLETED',
    florist: 'Kỹ sư kiểm định: Hoàng Minh',
    floristAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    proofPhotoUrl: '/images/foam-extinguisher-6l.jpg',
    isApproved: true,
    createdAt: '08:15',
    items: [
      {
        name: 'Bình Cứu Hỏa Bọt Foam Sinh Học 6L ×1 + Chăn Dập Lửa Sợi Thủy Tinh ×1',
        price: 840000
      }
    ]
  }
];

// ----------------------------------------------------
// LOCAL-FIRST & CONFLICT RESOLUTION UTILITIES
// Ngăn stale server container Vercel ghi đè dữ liệu mới
// ----------------------------------------------------
import { 
  getDeletedProductIds, 
  markProductDeletedLocal, 
  unmarkProductDeletedLocal, 
  mergeProductsWithConflictResolution 
} from '../utils/conflictResolution';

export { 
  getDeletedProductIds, 
  markProductDeletedLocal, 
  unmarkProductDeletedLocal, 
  mergeProductsWithConflictResolution 
};

// Tự động xóa sạch dữ liệu cache của project hoa cũ (flora_*) nếu chạy chung port localhost:5173
if (typeof localStorage !== 'undefined') {
  try {
    const legacyKeys = [
      'flora_products', 'flora_orders', 'flora_admin_user',
      'flora_deleted_product_ids', 'flora_settings_updated_at',
      'flora_shop_zalo_phone', 'flora_tg_token', 'flora_tg_chat_id',
      'flora_sound_enabled', 'flora_shipping_settings', 'flora_facebook_settings'
    ];
    legacyKeys.forEach(k => {
      if (localStorage.getItem(k) !== null) {
        localStorage.removeItem(k);
      }
    });
  } catch (e) {}
}

export const ShopProvider = ({ children }) => {
  // 1. Quản lý danh mục thiết bị PCCC (Ưu tiên cache LocalStorage để storefront cập nhật ngay, fallback FLOWERS_DATA)
  const [products, setProductsState] = useState(() => {
    try {
      const cached = localStorage.getItem('flameguard_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi đọc cache flameguard_products:', e);
    }
    return FLOWERS_DATA;
  });

  const updateProductsLocalAndBroadcast = useCallback((updater, broadcastAction = null) => {
    setProductsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('flameguard_products', JSON.stringify(next));
      } catch (e) {
        console.warn('Lỗi lưu flameguard_products vào localStorage:', e);
      }
      return next;
    });
    if (typeof broadcastAction === 'function') {
      broadcastAction();
    }
  }, []);

  const [isApiConnected, setIsApiConnected] = useState(false);

  // Helper quản lý mốc thời gian cập nhật cài đặt
  const updateSettingsTimestamp = () => {
    const now = new Date().toISOString();
    try {
      localStorage.setItem('flameguard_settings_updated_at', now);
    } catch (e) {}
    return now;
  };

  // 2. Cài đặt kết nối Zalo Cá Nhân / Telegram (Lưu bền vững vào LocalStorage & Backend Settings)
  const [shopZaloPhone, setShopZaloPhoneState] = useState(() => {
    return localStorage.getItem('flameguard_shop_zalo_phone') || '0843066604';
  });
  const [zaloModeType, setZaloModeType] = useState('personal');

  const [telegramBotToken, setTelegramBotTokenState] = useState(() => {
    return localStorage.getItem('flameguard_tg_token') || '';
  });
  const [telegramChatId, setTelegramChatIdState] = useState(() => {
    return localStorage.getItem('flameguard_tg_chat_id') || '';
  });

  const setShopZaloPhone = (val) => {
    const clean = (val || '').trim();
    const now = updateSettingsTimestamp();
    setShopZaloPhoneState(clean);
    localStorage.setItem('flameguard_shop_zalo_phone', clean);
    saveSettingsApi({ shopZaloPhone: clean, updatedAt: now }).catch(() => {});
  };

  const setTelegramBotToken = (val) => {
    const now = updateSettingsTimestamp();
    setTelegramBotTokenState(val);
    localStorage.setItem('flameguard_tg_token', val);
    saveSettingsApi({ telegramBotToken: val, updatedAt: now }).catch(() => {});
  };

  const setTelegramChatId = (val) => {
    const now = updateSettingsTimestamp();
    setTelegramChatIdState(val);
    localStorage.setItem('flameguard_tg_chat_id', val);
    saveSettingsApi({ telegramChatId: val, updatedAt: now }).catch(() => {});
  };

  // 3. Quản lý thông báo Admin Real-time
  const [isSoundEnabled, setIsSoundEnabledState] = useState(() => {
    return localStorage.getItem('flameguard_sound_enabled') !== 'false';
  });

  const setIsSoundEnabled = (val) => {
    const now = updateSettingsTimestamp();
    setIsSoundEnabledState(val);
    localStorage.setItem('flameguard_sound_enabled', String(val));
    saveSettingsApi({ isSoundEnabled: val, updatedAt: now }).catch(() => {});
  };

  // 3.1. Cấu hình Phí Vận Chuyển & Freeship (Xử lý linh hoạt qua Admin hoặc Tự Động)
  const [shippingSettings, setShippingSettingsState] = useState(() => {
    try {
      const cached = localStorage.getItem('flameguard_shipping_settings');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      shippingMode: 'admin_confirm', // 'admin_confirm' (Xưởng xác nhận báo ship) | 'auto' (Tự động theo bảng giá)
      standardFee: 35000,
      expressFee: 60000,
      freeShippingThreshold: 1000000,
      isFreeShippingEnabled: true,
      freeShippingNote: 'FLAMEGUARD PRO sẽ kiểm tra địa chỉ & xác nhận phí vận chuyển theo khối lượng/quãng đường qua Zalo/SĐT'
    };
  });

  const updateShippingSettings = (newSettings) => {
    const now = updateSettingsTimestamp();
    setShippingSettingsState(prev => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem('flameguard_shipping_settings', JSON.stringify(merged));
      } catch (e) {}
      saveSettingsApi({ shippingSettings: merged, updatedAt: now }).catch(() => {});
      return merged;
    });
  };

  // 3.2. Cấu hình Facebook Fanpage & Messenger
  const [facebookSettings, setFacebookSettingsState] = useState(() => {
    try {
      const cached = localStorage.getItem('flameguard_facebook_settings');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      pageId: 'flameguardpccc',
      pageName: 'FLAMEGUARD PRO - Thiết Bị PCCC & Cứu Nạn Cứu Hộ',
      pageAccessToken: '',
      verifyToken: 'flameguard_webhook_secret_2026',
      adminRecipientId: '',
      isEnabled: true,
      welcomeMessage: 'Chào bạn! FLAMEGUARD PRO sẵn sàng tư vấn giải pháp thiết bị PCCC chuẩn kiểm định Bộ Công An.',
      autoReplyEnabled: true
    };
  });

  const updateFacebookSettings = (newSettings) => {
    const now = updateSettingsTimestamp();
    setFacebookSettingsState(prev => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem('flameguard_facebook_settings', JSON.stringify(merged));
      } catch (e) {}
      saveSettingsApi({ facebookSettings: merged, updatedAt: now }).catch(() => {});
      return merged;
    });
  };

  // 3.3. Cấu hình Hiển Thị & Chạy Quảng Cáo (Landing Page Mode)
  const [displaySettings, setDisplaySettingsState] = useState(() => {
    try {
      const cached = localStorage.getItem('flameguard_display_settings');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      hideHeroBanner: false, // Ẩn banner Hero lớn
      bannerMode: 'trust_bar', // 'hidden' (ẩn hoàn toàn) | 'trust_bar' (thanh mỏng 44px)
      enableAdsUrlParam: true // Tự động nhận diện ?view=catalog hoặc ?ads=true
    };
  });

  const updateDisplaySettings = (newSettings) => {
    const now = updateSettingsTimestamp();
    setDisplaySettingsState(prev => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem('flameguard_display_settings', JSON.stringify(merged));
      } catch (e) {}
      saveSettingsApi({ displaySettings: merged, updatedAt: now }).catch(() => {});
      return merged;
    });
  };

  // Kiểm tra nếu URL có tham số quảng cáo / catalog mode
  const [isAdsUrlActive, setIsAdsUrlActive] = useState(() => {
    if (typeof window === 'undefined') return false;
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    return searchParams.get('view') === 'catalog' ||
      searchParams.get('ads') === 'true' ||
      searchParams.get('ads') === '1' ||
      searchParams.get('hideBanner') === 'true' ||
      hash === '#catalog' ||
      hash === '#products';
  });

  // Lắng nghe hashchange & popstate để cập nhật tức thời
  useEffect(() => {
    const checkHashAndParams = () => {
      if (typeof window === 'undefined') return;
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const isAds = searchParams.get('view') === 'catalog' ||
        searchParams.get('ads') === 'true' ||
        searchParams.get('ads') === '1' ||
        searchParams.get('hideBanner') === 'true' ||
        hash === '#catalog' ||
        hash === '#products';
      setIsAdsUrlActive(isAds);
    };
    window.addEventListener('hashchange', checkHashAndParams);
    window.addEventListener('popstate', checkHashAndParams);
    return () => {
      window.removeEventListener('hashchange', checkHashAndParams);
      window.removeEventListener('popstate', checkHashAndParams);
    };
  }, []);

  // Tính toán trạng thái ẩn banner: Tuyệt đối tuân theo Cài đặt Admin (hoặc tham số Ads trên Link)
  const isBannerEffectivelyHidden = Boolean(
    displaySettings.hideHeroBanner || (displaySettings.enableAdsUrlParam && isAdsUrlActive)
  );

  const toggleBannerVisibility = () => {
    // Được kiểm soát hoàn toàn bởi Setting Admin
  };

  const getShippingFee = useCallback((type = 'timeslot', subtotal = 0) => {
    const { 
      shippingMode = 'admin_confirm', 
      standardFee = 35000, 
      expressFee = 60000, 
      freeShippingThreshold = 1000000, 
      isFreeShippingEnabled = true 
    } = shippingSettings;

    const isFreeship = isFreeShippingEnabled && subtotal >= freeShippingThreshold;
    if (isFreeship) return 0;

    // Chế độ Admin xử lý phí ship: Tạm tính 0đ tại bước đặt mua, shop báo phí ship thực tế sau
    if (shippingMode === 'admin_confirm') {
      return 0;
    }

    if (type === 'express') {
      return Number(expressFee);
    }

    return Number(standardFee);
  }, [shippingSettings]);

  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [latestNewOrder, setLatestNewOrder] = useState(null);

  // 4. Giỏ hàng & Sản phẩm
  const [activeCategory, setActiveCategory] = useState('extinguishers'); // 'extinguishers' | 'rescue' | 'alarms'
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest' | 'name_asc'
  
  // 5. Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAIFloristOpen, setIsAIFloristOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isZaloMode, setIsZaloMode] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // 6. Danh sách đơn hàng (Lưu LocalStorage + REST API đồng bộ)
  const [orders, setOrdersState] = useState(() => {
    try {
      const cached = localStorage.getItem('flameguard_orders');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return INITIAL_ORDERS;
  });

  const setOrders = (updater) => {
    setOrdersState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('flameguard_orders', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const [activeOrder, setActiveOrder] = useState(orders[0]);

  // 7. Kho thiết bị & vật tư PCCC
  const [inventory, setInventory] = useState([
    { name: 'Bình Chữa Cháy Bột ABC 4kg MFZL4', total: 120, used: 45, remain: 75, unit: 'bình', status: 'normal' },
    { name: 'Bình Cứu Hỏa Khí CO2 3kg MT3', total: 80, used: 40, remain: 40, unit: 'bình', status: 'normal' },
    { name: 'Mặt Nạ Chống Khói Độc Thoát Hiểm TZL30', total: 250, used: 60, remain: 190, unit: 'hộp', status: 'normal' },
    { name: 'Bộ Dây Thoát Hiểm Tự Cứu Nhà Cao Tầng 15M', total: 50, used: 35, remain: 15, unit: 'bộ', status: 'warning' },
    { name: 'Chăn Dập Lửa Khẩn Cấp Sợi Thủy Tinh 1.8M', total: 30, used: 26, remain: 4, unit: 'chiếc', status: 'danger' },
    { name: 'Đầu Báo Khói Độc Lập Không Dây 85dB', total: 100, used: 30, remain: 70, unit: 'chiếc', status: 'normal' },
  ]);

  // Hàm tính trạng thái tồn kho chuẩn hóa
  const calculateInventoryStatus = (remain) => {
    if (remain <= 5) return 'danger';
    if (remain <= 20) return 'warning';
    return 'normal';
  };

  // Thêm nguyên liệu hoa mới vào kho
  const addInventoryItem = async (itemData) => {
    const total = Math.max(0, Number(itemData.total) || 0);
    const used = Math.max(0, Number(itemData.used) || 0);
    const remain = Math.max(0, total - used);
    const newItem = {
      name: itemData.name.trim(),
      total,
      used,
      remain,
      unit: itemData.unit || 'bình',
      status: calculateInventoryStatus(remain)
    };

    const next = [...inventory.filter(i => i.name.toLowerCase() !== newItem.name.toLowerCase()), newItem];
    setInventory(next);
    try {
      await updateInventoryApi(next);
    } catch (e) {}
    return newItem;
  };

  // Cập nhật/Kiểm kê thiết bị PCCC
  const updateInventoryItem = async (originalName, updates) => {
    const next = inventory.map(item => {
      if (item.name === originalName) {
        const total = updates.total !== undefined ? Math.max(0, Number(updates.total) || 0) : item.total;
        const used = updates.used !== undefined ? Math.max(0, Number(updates.used) || 0) : item.used;
        const remain = Math.max(0, total - used);
        return {
          ...item,
          ...updates,
          total,
          used,
          remain,
          status: calculateInventoryStatus(remain)
        };
      }
      return item;
    });

    setInventory(next);
    try {
      await updateInventoryApi(next);
    } catch (e) {}
  };

  // Nhập thêm hàng (Restock)
  const restockInventoryItem = async (itemName, addedQuantity) => {
    const addQty = Math.max(0, Number(addedQuantity) || 0);
    const next = inventory.map(item => {
      if (item.name === itemName) {
        const total = item.total + addQty;
        const remain = Math.max(0, total - item.used);
        return {
          ...item,
          total,
          remain,
          status: calculateInventoryStatus(remain)
        };
      }
      return item;
    });

    setInventory(next);
    try {
      await updateInventoryApi(next);
    } catch (e) {}
  };

  // Xóa thiết bị khỏi kho
  const deleteInventoryItem = async (itemName) => {
    const next = inventory.filter(item => item.name !== itemName);
    setInventory(next);
    try {
      await updateInventoryApi(next);
    } catch (e) {}
  };

  // Tự động trừ kho khi có đơn hàng mới (Deduct on Order)
  const deductInventoryOnOrder = async (cartItems) => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return;

    let updated = [...inventory];
    let hasChanges = false;

    cartItems.forEach(cartItem => {
      const qty = Number(cartItem.quantity || 1);
      const itemNameLower = (cartItem.name || '').toLowerCase();

      // Định lượng trừ kho theo từng thiết bị PCCC
      updated = updated.map(invItem => {
        const invLower = invItem.name.toLowerCase();
        let deductAmount = 0;

        if (itemNameLower.includes('bột') && itemNameLower.includes('abc') && invLower.includes('bột')) {
          deductAmount = (itemNameLower.includes('2 bình') || itemNameLower.includes('combo')) ? 2 * qty : 1 * qty;
        } else if ((itemNameLower.includes('co2') || itemNameLower.includes('khí')) && invLower.includes('co2')) {
          deductAmount = 1 * qty;
        } else if (itemNameLower.includes('mặt nạ') && invLower.includes('mặt nạ')) {
          deductAmount = (itemNameLower.includes('2 mặt nạ') || itemNameLower.includes('combo')) ? 2 * qty : 1 * qty;
        } else if (itemNameLower.includes('dây') && invLower.includes('dây')) {
          deductAmount = 1 * qty;
        } else if (itemNameLower.includes('chăn') && invLower.includes('chăn')) {
          deductAmount = 1 * qty;
        } else if (itemNameLower.includes('khói') && invLower.includes('khói')) {
          deductAmount = 1 * qty;
        }

        if (deductAmount > 0) {
          hasChanges = true;
          const newUsed = invItem.used + deductAmount;
          const newRemain = Math.max(0, invItem.total - newUsed);
          return {
            ...invItem,
            used: newUsed,
            remain: newRemain,
            status: calculateInventoryStatus(newRemain)
          };
        }

        return invItem;
      });
    });

    if (hasChanges) {
      setInventory(updated);
      try {
        await updateInventoryApi(updated);
      } catch (e) {}
    }
  };

  // Hàm phát thông báo âm thanh & giao diện khi có đơn hàng mới (Chuông + Popup + Push)
  const triggerAdminOrderAlert = useCallback((order) => {
    // 1. Cập nhật state đơn mới & popup toast
    setLatestNewOrder(order);
    setUnreadOrdersCount(prev => prev + 1);

    // 2. Phát chuông Web Audio API nếu bật âm thanh
    if (isSoundEnabled) {
      playNewOrderChime();
    }

    // 3. Đẩy Browser Push Notification ra màn hình Desktop/Mobile
    showBrowserOrderNotification(order);
  }, [isSoundEnabled]);

  // 8. Quản lý Mã Giảm Giá & Voucher
  const [discounts, setDiscounts] = useState([
    {
      id: 'dc-1',
      code: 'ANTOAN10',
      name: 'Giảm 10% Cho Đơn Thiết Bị PCCC Dự Án',
      type: 'percentage',
      value: 10,
      maxDiscount: 200000,
      minOrderValue: 1000000,
      usageLimit: 100,
      usedCount: 24,
      isActive: true,
      expiresAt: '2026-12-31'
    },
    {
      id: 'dc-2',
      code: 'CUUHOA50K',
      name: 'Ưu Đãi Trang Bị Gia Đình 50K',
      type: 'fixed',
      value: 50000,
      maxDiscount: 50000,
      minOrderValue: 400000,
      usageLimit: 50,
      usedCount: 18,
      isActive: true,
      expiresAt: '2026-12-31'
    },
    {
      id: 'dc-3',
      code: 'FREESHIP',
      name: 'Miễn Phí Vận Chuyển Thiết Bị Nặng (35K)',
      type: 'shipping',
      value: 35000,
      maxDiscount: 35000,
      minOrderValue: 500000,
      usageLimit: 200,
      usedCount: 85,
      isActive: true,
      expiresAt: '2026-12-31'
    }
  ]);

  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // 9. Quản lý Đánh Giá & Feedback Khách Hàng Thực Tế
  const [reviews, setReviews] = useState([
    {
      id: 'REV-101',
      customerName: 'Ban Quản Trị Chung Cư Sunview',
      customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      productName: 'Combo Bình Bột ABC 4kg & Khí CO2 3kg',
      rating: 5,
      occasion: 'Tòa Nhà & Chung Cư',
      comment: 'Bình chữa cháy có đầy đủ tem kiểm định Bộ Công An, áp suất kim đồng hồ chỉ đúng vạch xanh chuẩn chỉ. Đơn vị bàn giao kèm biên bản nghiệm thu và hướng dẫn cư dân thao tác 4 bước rất tận tình.',
      proofImage: '/images/abc-powder-4kg.jpg',
      verified: true,
      createdAt: '2026-08-25',
      isVisible: true,
      likes: 38
    },
    {
      id: 'REV-102',
      customerName: 'Anh Minh Hoàng (Chủ Xưởng Gỗ)',
      customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      productName: 'Bình Cứu Hỏa Bột ABC 8kg MFZL8',
      rating: 5,
      occasion: 'Nhà Xưởng & Kho Hàng',
      comment: 'Tôi dùng tính năng quét AI mặt bằng, hệ thống đề xuất chuẩn xác số lượng bình theo TCVN 3890. Đặt hàng lúc sáng, đầu giờ chiều kỹ sư đã giao tới tận nơi và kích hoạt bảo hành nạp sạc 12 tháng.',
      proofImage: '/images/smoke-mask-tzl30.jpg',
      verified: true,
      createdAt: '2026-08-24',
      isVisible: true,
      likes: 29
    },
    {
      id: 'REV-103',
      customerName: 'Chị Bích Ngọc (Căn Hộ Landmark)',
      customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      productName: 'Bộ Cứu Nạn Thoát Hiểm Khẩn Cấp (Thang Dây + Mặt Nạ)',
      rating: 5,
      occasion: 'Hộ Gia Đình & Chung Cư',
      comment: 'Trang bị cho gia đình ở tầng cao nên mình rất kỹ tính. Mặt nạ phòng độc TZL30 nguyên seal tem chống giả, thang dây móc thép chịu lực cực kỳ chắc chắn. Rất an tâm!',
      proofImage: '/images/co2-extinguisher-3kg.jpg',
      verified: true,
      createdAt: '2026-08-23',
      isVisible: true,
      likes: 21
    }
  ]);

  // Đồng bộ lại toàn bộ dữ liệu từ API Server (Dùng cho Focus, Polling & thủ công)
  const refreshShopData = useCallback(async (isSilent = true) => {
    try {
      const [apiProducts, apiOrders, apiInventory, apiDiscounts, apiReviews, apiSettings] = await Promise.all([
        fetchProductsApi().catch(() => null),
        fetchOrdersApi().catch(() => null),
        fetchInventoryApi().catch(() => null),
        fetchDiscountsApi().catch(() => null),
        fetchReviewsApi().catch(() => null),
        fetchSettingsApi().catch(() => null)
      ]);

      // 1. Đồng bộ Mẫu Hoa với Conflict Resolution & Auto-Rehydration
      if (Array.isArray(apiProducts) && apiProducts.length > 0) {
        const itemsToRehydrate = [];
        updateProductsLocalAndBroadcast(currentProducts => {
          const merged = mergeProductsWithConflictResolution(currentProducts, apiProducts);
          // Tìm các sản phẩm local có timestamp mới hơn server để re-push ngầm ngoài updater
          merged.forEach(mp => {
            const sp = apiProducts.find(p => p.id === mp.id);
            const localTime = mp.updatedAt ? new Date(mp.updatedAt).getTime() : 0;
            const serverTime = sp?.updatedAt ? new Date(sp.updatedAt).getTime() : 0;
            if (localTime > 0 && localTime > serverTime) {
              itemsToRehydrate.push(mp);
            }
          });
          return merged;
        });

        // Re-push ngoài render lifecycle của React
        if (itemsToRehydrate.length > 0) {
          itemsToRehydrate.forEach(mp => {
            updateProductApi(mp.id, mp).catch(() => {});
          });
        }
      }

      // 2. Đồng bộ Đơn Hàng an toàn
      if (Array.isArray(apiOrders) && apiOrders.length > 0) {
        setOrders(currentOrders => {
          const orderMap = new Map();
          (currentOrders || []).forEach(co => orderMap.set(co.id || co.orderCode, co));
          apiOrders.forEach(ao => {
            const key = ao.id || ao.orderCode;
            const co = orderMap.get(key);
            if (!co) {
              orderMap.set(key, ao);
            } else {
              // Bảo vệ trạng thái duyệt ảnh hoặc xác nhận ship cục bộ nếu server chưa kịp nhận
              if (co.isApproved && !ao.isApproved) {
                orderMap.set(key, { ...ao, isApproved: true, status: co.status || ao.status });
              } else if (co.isShippingConfirmed && !ao.isShippingConfirmed) {
                orderMap.set(key, { ...ao, shippingFee: co.shippingFee, totalAmount: co.totalAmount, isShippingConfirmed: true });
              } else {
                orderMap.set(key, { ...co, ...ao });
              }
            }
          });
          return Array.from(orderMap.values());
        });
        setActiveOrder(prev => (prev ? apiOrders.find(o => o.id === prev.id) || prev : apiOrders[0]));
      }

      if (apiInventory?.length > 0) setInventory(apiInventory);
      if (apiDiscounts?.length > 0) setDiscounts(apiDiscounts);
      if (apiReviews?.length > 0) setReviews(apiReviews);

      // 3. Đồng bộ Cài Đặt (Zalo, Telegram, Shipping, Facebook) với so sánh Timestamp
      if (apiSettings) {
        const localSettingsTimestamp = typeof localStorage !== 'undefined' ? localStorage.getItem('flameguard_settings_updated_at') : null;
        const localSettingsTime = localSettingsTimestamp ? new Date(localSettingsTimestamp).getTime() : 0;
        const serverSettingsTime = apiSettings.updatedAt ? new Date(apiSettings.updatedAt).getTime() : 0;

        if (serverSettingsTime > localSettingsTime) {
          // Server thực sự mới hơn -> Chấp nhận cài đặt mới từ server
          if (apiSettings.shopZaloPhone) {
            setShopZaloPhoneState(apiSettings.shopZaloPhone);
            if (typeof localStorage !== 'undefined') localStorage.setItem('flameguard_shop_zalo_phone', apiSettings.shopZaloPhone);
          }
          if (apiSettings.telegramBotToken) {
            setTelegramBotTokenState(apiSettings.telegramBotToken);
            if (typeof localStorage !== 'undefined') localStorage.setItem('flameguard_tg_token', apiSettings.telegramBotToken);
          }
          if (apiSettings.telegramChatId) {
            setTelegramChatIdState(apiSettings.telegramChatId);
            if (typeof localStorage !== 'undefined') localStorage.setItem('flameguard_tg_chat_id', apiSettings.telegramChatId);
          }
          if (apiSettings.shippingSettings) {
            setShippingSettingsState(prev => ({ ...prev, ...apiSettings.shippingSettings }));
            if (typeof localStorage !== 'undefined') localStorage.setItem('flameguard_shipping_settings', JSON.stringify(apiSettings.shippingSettings));
          }
          if (apiSettings.facebookSettings) {
            setFacebookSettingsState(prev => ({ ...prev, ...apiSettings.facebookSettings }));
            if (typeof localStorage !== 'undefined') localStorage.setItem('flameguard_facebook_settings', JSON.stringify(apiSettings.facebookSettings));
          }
          if (apiSettings.displaySettings) {
            setDisplaySettingsState(prev => ({ ...prev, ...apiSettings.displaySettings }));
            if (typeof localStorage !== 'undefined') localStorage.setItem('flameguard_display_settings', JSON.stringify(apiSettings.displaySettings));
          }
          if (typeof localStorage !== 'undefined') localStorage.setItem('flameguard_settings_updated_at', apiSettings.updatedAt);
        } else if (localSettingsTime > serverSettingsTime) {
          // Local mới hơn server -> GIỮ NGUYÊN LOCAL & Rehydrate container server ngầm!
          const localSettingsPayload = {
            shopZaloPhone: typeof localStorage !== 'undefined' ? localStorage.getItem('flameguard_shop_zalo_phone') : undefined,
            telegramBotToken: typeof localStorage !== 'undefined' ? localStorage.getItem('flameguard_tg_token') : undefined,
            telegramChatId: typeof localStorage !== 'undefined' ? localStorage.getItem('flameguard_tg_chat_id') : undefined,
            shippingSettings: shippingSettings,
            facebookSettings: facebookSettings,
            displaySettings: displaySettings,
            updatedAt: localSettingsTimestamp
          };
          saveSettingsApi(localSettingsPayload).catch(() => {});
        }
      }

      setIsApiConnected(true);
      return true;
    } catch (err) {
      if (!isSilent) console.warn('Lỗi refreshShopData:', err);
      return false;
    }
  }, [updateProductsLocalAndBroadcast, shippingSettings, facebookSettings, displaySettings]);

  // Khởi tạo và lắng nghe Real-time SSE & BroadcastChannel (trì hoãn sau first paint)
  useEffect(() => {
    const initDataFromApi = async () => {
      try {
        const health = await checkHealthApi();
        if (health.status === 'ONLINE') {
          setIsApiConnected(true);
          await refreshShopData(true);
        }
      } catch (err) {
        // Fallback local mode
      }
    };

    const timer = setTimeout(initDataFromApi, 60);

    // ----------------------------------------------------
    // SMART BACKGROUND SYNC & TAB FOCUS LISTENER (HƯỚNG 2)
    // Tự động đồng bộ ngầm khi khách quay lại tab hoặc mỗi 30s
    // ----------------------------------------------------
    let lastSyncTime = Date.now();

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastSyncTime;
        // Chỉ fetch lại nếu đã cách lần fetch gần nhất ít nhất 8 giây (chống spam request)
        if (elapsed > 8000) {
          lastSyncTime = Date.now();
          refreshShopData(true);
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleVisibilityOrFocus);
    }

    // Smart Polling: Tự động làm mới ngầm mỗi 30 giây (khi tab đang mở)
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        lastSyncTime = Date.now();
        refreshShopData(true);
      }
    }, 30000);

    // Kết nối Server-Sent Events (SSE) để nhận sự kiện real-time từ các thiết bị khác
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/admin/events');
      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'NEW_ORDER' && payload.order) {
            setOrders(prev => {
              const exists = prev.some(o => o.id === payload.order.id);
              if (exists) return prev;
              return [payload.order, ...prev];
            });
            triggerAdminOrderAlert(payload.order);
          }
          if (payload.type === 'ORDER_STATUS_CHANGED' && payload.order) {
            setOrders(prev => prev.map(o => (o.id === payload.order.id ? payload.order : o)));
            setActiveOrder(prev => (prev && prev.id === payload.order.id ? payload.order : prev));
          }
          if (payload.type === 'PRODUCT_UPDATED' && payload.product) {
            updateProductsLocalAndBroadcast(prev => {
              const exists = prev.some(p => p.id === payload.product.id);
              if (exists) {
                return prev.map(p => p.id === payload.product.id ? { ...p, ...payload.product } : p);
              }
              return [payload.product, ...prev];
            });
          }
          if (payload.type === 'PRODUCT_ADDED' && payload.product) {
            updateProductsLocalAndBroadcast(prev => {
              const exists = prev.some(p => p.id === payload.product.id);
              if (exists) return prev;
              return [payload.product, ...prev];
            });
          }
          if (payload.type === 'PRODUCT_DELETED' && payload.productId) {
            updateProductsLocalAndBroadcast(prev => prev.filter(p => p.id !== payload.productId));
          }
        } catch (err) {}
      };
    } catch (err) {}

    // Lắng nghe sự kiện đa tab qua BroadcastChannel (Đơn mới, Cập nhật ảnh thật, Đồng bộ mẫu hoa)
    const cleanupTabListener = listenToCrossTabOrders(
      (incomingOrder) => {
        setOrders(prev => {
          const exists = prev.some(o => o.id === incomingOrder.id);
          if (exists) return prev;
          return [incomingOrder, ...prev];
        });
        triggerAdminOrderAlert(incomingOrder);
      },
      (orderId, updates) => {
        setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, ...updates } : o)));
        setActiveOrder(prev => (prev && prev.id === orderId ? { ...prev, ...updates } : prev));
      },
      {
        onProductUpdated: (product) => {
          updateProductsLocalAndBroadcast(prev => {
            const exists = prev.some(p => p.id === product.id);
            if (exists) {
              return prev.map(p => p.id === product.id ? { ...p, ...product } : p);
            }
            return [product, ...prev];
          });
        },
        onProductAdded: (product) => {
          updateProductsLocalAndBroadcast(prev => {
            const exists = prev.some(p => p.id === product.id);
            if (exists) return prev;
            return [product, ...prev];
          });
        },
        onProductDeleted: (productId) => {
          updateProductsLocalAndBroadcast(prev => prev.filter(p => p.id !== productId));
        }
      }
    );

    return () => {
      clearTimeout(timer);
      if (eventSource) eventSource.close();
      cleanupTabListener();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleVisibilityOrFocus);
      }
      clearInterval(pollInterval);
    };
  }, [triggerAdminOrderAlert, updateProductsLocalAndBroadcast, refreshShopData]);


  // CRUD SẢN PHẨM MẪU HOA
  const addProduct = async (newProduct) => {
    const now = new Date().toISOString();
    const id = newProduct.id || `fl-${Date.now()}`;
    const productWithTimestamp = {
      ...newProduct,
      id,
      rating: newProduct.rating || 5.0,
      reviewsCount: newProduct.reviewsCount || 0,
      isAvailable: newProduct.isAvailable !== undefined ? newProduct.isAvailable : true,
      updatedAt: now
    };
    unmarkProductDeletedLocal(id);

    let finalProduct = null;
    try {
      finalProduct = await createProductApi(productWithTimestamp);
    } catch (e) {
      console.warn('Lỗi API createProduct, fallback local:', e);
      finalProduct = productWithTimestamp;
    }
    if (finalProduct) {
      const mergedProduct = { ...productWithTimestamp, ...finalProduct, updatedAt: now };
      updateProductsLocalAndBroadcast(
        prev => [mergedProduct, ...prev.filter(p => p.id !== mergedProduct.id)],
        () => broadcastProductAddToTabs(mergedProduct)
      );
      return mergedProduct;
    }
    return finalProduct;
  };

  const updateProduct = async (productId, updatedFields) => {
    const now = new Date().toISOString();
    const payload = { ...updatedFields, id: productId, updatedAt: now };
    unmarkProductDeletedLocal(productId);

    let finalProduct = null;
    try {
      finalProduct = await updateProductApi(productId, payload);
    } catch (e) {
      console.warn('Lỗi API updateProduct, fallback local:', e);
      const current = products.find(p => p.id === productId) || {};
      finalProduct = { ...current, ...payload };
    }
    if (finalProduct) {
      const mergedProduct = { ...payload, ...finalProduct, updatedAt: now };
      updateProductsLocalAndBroadcast(
        prev => prev.map(p => p.id === productId ? { ...p, ...mergedProduct } : p),
        () => broadcastProductUpdateToTabs(mergedProduct)
      );
      return mergedProduct;
    }
    return finalProduct;
  };

  const deleteProduct = async (productId) => {
    markProductDeletedLocal(productId);
    try {
      await deleteProductApi(productId);
    } catch (e) {
      console.warn('Lỗi API deleteProduct, fallback local:', e);
    }
    updateProductsLocalAndBroadcast(
      prev => prev.filter(p => p.id !== productId),
      () => broadcastProductDeleteToTabs(productId)
    );
  };

  const toggleProductAvailability = async (productId) => {
    const now = new Date().toISOString();
    let finalProduct = null;
    try {
      finalProduct = await toggleProductApi(productId);
    } catch (e) {
      console.warn('Lỗi API toggleProduct, fallback local:', e);
      const current = products.find(p => p.id === productId);
      if (current) {
        finalProduct = { ...current, isAvailable: current.isAvailable === false ? true : false, updatedAt: now };
      }
    }
    if (finalProduct) {
      const mergedProduct = { ...finalProduct, updatedAt: now };
      updateProductsLocalAndBroadcast(
        prev => prev.map(p => p.id === productId ? { ...p, ...mergedProduct } : p),
        () => broadcastProductUpdateToTabs(mergedProduct)
      );
      return mergedProduct;
    } else {
      updateProductsLocalAndBroadcast(
        prev => prev.map(p => p.id === productId ? { ...p, isAvailable: p.isAvailable === false ? true : false, updatedAt: now } : p)
      );
    }
  };


  // GIỎ HÀNG
  const addToCart = (product, customOptions = {}) => {
    const size = customOptions.size || { id: 'standard', name: 'Tiêu Chuẩn', priceMultiplier: 1.0 };
    const wrapper = customOptions.wrapper || { id: 'sage', name: 'Giấy Giản Dị Xanh Sage' };
    const cardMessage = customOptions.cardMessage || 'Gửi gắm yêu thương!';
    const senderSign = customOptions.senderSign || 'Người gửi';
    const addOns = customOptions.addOns || [];
    
    const unitPrice = Math.round(product.price * size.priceMultiplier);
    
    const newItem = {
      cartItemId: `${product.id}-${Date.now()}`,
      id: product.id,
      name: product.name,
      image: product.image,
      price: unitPrice,
      size,
      wrapper,
      cardMessage,
      senderSign,
      addOns,
      quantity: 1,
    };

    setCart(prev => [newItem, ...prev]);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => (item.cartItemId || item.id) !== cartItemId));
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart(prev => prev.map(item => {
      if ((item.cartItemId || item.id) === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const cartTotal = cart.reduce((total, item) => {
    const addOnsTotal = (item.addOns || []).reduce((sum, a) => sum + a.price, 0);
    return total + ((item.price + addOnsTotal) * item.quantity);
  }, 0);

  // Tính số tiền giảm giá thực tế dựa trên giỏ hàng hiện tại
  const discountAmount = React.useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      const calculated = Math.round((cartTotal * appliedCoupon.value) / 100);
      return appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated;
    }
    if (appliedCoupon.type === 'fixed') {
      return Math.min(appliedCoupon.value, cartTotal);
    }
    if (appliedCoupon.type === 'shipping') {
      return 35000;
    }
    return appliedCoupon.discountAmount || 0;
  }, [appliedCoupon, cartTotal]);

  const applyCoupon = async (code) => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) throw new Error('Vui lòng nhập mã giảm giá.');

    try {
      const res = await validateDiscountApi(cleanCode, cartTotal);
      if (res.success && res.discount) {
        setAppliedCoupon(res.discount);
        return res;
      }
      throw new Error(res.message || 'Mã giảm giá không hợp lệ');
    } catch (err) {
      // Fallback local validation
      const localMatch = discounts.find(d => d.code === cleanCode && d.isActive);
      if (!localMatch) throw new Error(err.message || 'Mã giảm giá không tồn tại hoặc đã hết hạn.');
      if (cartTotal < (localMatch.minOrderValue || 0)) {
        throw new Error(`Đơn hàng cần tối thiểu ${Number(localMatch.minOrderValue).toLocaleString('vi-VN')}đ để dùng mã này.`);
      }
      setAppliedCoupon(localMatch);
      return { success: true, discount: localMatch, message: 'Áp dụng mã thành công!' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const addDiscount = async (discountData) => {
    try {
      const saved = await createDiscountApi(discountData);
      setDiscounts(prev => [saved, ...prev]);
    } catch (e) {
      const newD = { ...discountData, id: `dc-${Date.now()}`, usedCount: 0, isActive: true };
      setDiscounts(prev => [newD, ...prev]);
    }
  };

  const toggleDiscount = async (discountId) => {
    try {
      const saved = await toggleDiscountApi(discountId);
      setDiscounts(prev => prev.map(d => d.id === discountId ? saved : d));
    } catch (e) {
      setDiscounts(prev => prev.map(d => d.id === discountId ? { ...d, isActive: !d.isActive } : d));
    }
  };

  const deleteDiscount = async (discountId) => {
    try {
      await deleteDiscountApi(discountId);
    } catch (e) {}
    setDiscounts(prev => prev.filter(d => d.id !== discountId));
  };

  // CRUD ĐÁNH GIÁ FEEDBACK KHÁCH HÀNG
  const addReview = async (reviewData) => {
    try {
      const saved = await createReviewApi(reviewData);
      setReviews(prev => [saved, ...prev]);
      return saved;
    } catch (e) {
      const fallbackRev = {
        ...reviewData,
        id: `REV-${Date.now()}`,
        verified: true,
        createdAt: new Date().toISOString().split('T')[0],
        isVisible: true,
        likes: 1
      };
      setReviews(prev => [fallbackRev, ...prev]);
      return fallbackRev;
    }
  };

  const toggleReview = async (reviewId) => {
    try {
      const saved = await toggleReviewApi(reviewId);
      setReviews(prev => prev.map(r => r.id === reviewId ? saved : r));
    } catch (e) {
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isVisible: !r.isVisible } : r));
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await deleteReviewApi(reviewId);
    } catch (e) {}
    setReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  // Khách tạo đơn hàng mới -> Lưu API & Kích hoạt thông báo đa kênh
  const submitOrder = async (orderData) => {
    const token = telegramBotToken || localStorage.getItem('flameguard_tg_token');
    const chatId = telegramChatId || localStorage.getItem('flameguard_tg_chat_id');

    // Tạo danh sách items chi tiết bao gồm size, wrapper, add-ons
    const formattedItems = cart.map(i => {
      const sizeText = i.size?.name ? ` [Size: ${i.size.name}]` : '';
      const wrapperText = i.wrapper?.name ? ` [Gói: ${i.wrapper.name}]` : '';
      const addOnsText = (i.addOns && i.addOns.length > 0) 
        ? ` + Quà: ${i.addOns.map(a => a.name).join(', ')}` 
        : '';
      const itemUnitPrice = i.price + (i.addOns || []).reduce((sum, a) => sum + a.price, 0);
      const itemTotalPrice = itemUnitPrice * (i.quantity || 1);

      return {
        name: `${i.name}${sizeText}${wrapperText}${addOnsText} ×${i.quantity || 1}`,
        price: itemTotalPrice
      };
    });

    const mainProductName = cart.length === 1
      ? `${cart[0].name} (${cart[0].size?.name || 'Tiêu chuẩn'})`
      : `${cart[0]?.name || 'Thiết bị PCCC'} và ${cart.length - 1} thiết bị khác`;

    const mainCardMessage = orderData.cardMessage || cart[0]?.cardMessage || 'Biên bản nghiệm thu & Hướng dẫn an toàn PCCC';
    const mainSenderSign = orderData.senderSign || cart[0]?.senderSign || orderData.senderName || 'Người đặt hàng';
    const effectiveShippingFee = orderData.shippingFee !== undefined 
      ? Number(orderData.shippingFee) 
      : getShippingFee(orderData.deliveryType || 'timeslot', cartTotal);
    const finalTotalAmount = Math.max(0, cartTotal + effectiveShippingFee - discountAmount);

    const orderPayload = {
      customerName: orderData.senderName || 'Khách hàng',
      customerPhone: orderData.senderPhone || '0901 234 567',
      receiverName: orderData.receiverName || 'Đại diện cơ sở / Người nhận',
      receiverPhone: orderData.receiverPhone || '0988 765 432',
      receiverAddress: orderData.receiverAddress || 'Quận 1, TP.HCM',
      isAnonymous: Boolean(orderData.isAnonymous),
      productName: mainProductName,
      cardMessage: mainCardMessage,
      senderSign: mainSenderSign,
      deliverySlot: orderData.deliverySlot || 'Hỏa tốc 60-90 phút',
      shippingFee: effectiveShippingFee,
      totalAmount: finalTotalAmount,
      discountCode: appliedCoupon?.code || null,
      discountAmount: discountAmount,
      proofPhotoUrl: null,
      catalogSamplePhoto: cart[0]?.image || '/images/abc-powder-4kg.jpg',
      items: formattedItems,
      telegramBotToken: token,
      telegramChatId: chatId
    };

    let newOrder = null;
    let serverSentTelegram = false;
    try {
      const res = await createOrderApi(orderPayload);
      newOrder = res?.data || res;
      serverSentTelegram = Boolean(res?.telegramSent);
    } catch (e) {
      const newOrderCode = `FG-${Math.floor(10000 + Math.random() * 90000)}`;
      newOrder = {
        ...orderPayload,
        id: newOrderCode,
        orderCode: newOrderCode,
        status: 'ARRANGING',
        florist: 'Kỹ sư kiểm định: Trần Đình Trọng (Xưởng PCCC)',
        floristAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        createdAt: `${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} (${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})`,
        isApproved: false
      };
    }

    // Cơ chế Hybrid: Nếu Server Node.js không gửi được (DNS/Proxy/Offline), Trình duyệt Client tự động gửi trực tiếp
    if (!serverSentTelegram && token && chatId) {
      sendTelegramOrderNotificationApi(token, chatId, newOrder).catch((err) => {
        console.warn('Client Telegram notification attempt:', err.message);
      });
    }

    setOrders(prev => {
      const exists = prev.some(o => o.id === newOrder.id || o.orderCode === newOrder.orderCode);
      if (exists) return prev;
      return [newOrder, ...prev];
    });
    setActiveOrder(newOrder);

    // Tự động trừ thiết bị PCCC và khí dập lửa tương ứng trong kho
    deductInventoryOnOrder(cart);

    setCart([]);
    setIsCheckoutOpen(false);
    setIsTrackingOpen(true);

    // Phát sự kiện đa tab & kích hoạt âm thanh chuông báo
    broadcastNewOrderToTabs(newOrder);
    triggerAdminOrderAlert(newOrder);

    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1B3B2B', '#E8998D', '#F5D6CE', '#5C8A70']
      });
    }).catch(() => {});
  };

  const approvePhotoProof = async () => {
    if (!activeOrder) return;
    try {
      await updateOrderStatusApi(activeOrder.id, { isApproved: true, status: 'DELIVERING' });
    } catch (e) {}

    setOrders(prev => prev.map(o => {
      if (o.id === activeOrder.id) {
        return { ...o, isApproved: true, status: 'DELIVERING' };
      }
      return o;
    }));

    setActiveOrder(prev => ({
      ...prev,
      isApproved: true,
      status: 'DELIVERING'
    }));

    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#5C8A70', '#E8998D']
      });
    }).catch(() => {});
  };

  const updateOrderByAdmin = async (orderId, updates) => {
    try {
      await updateOrderStatusApi(orderId, updates);
    } catch (e) {}

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedOrder = { ...o, ...updates };
        if (activeOrder && activeOrder.id === orderId) {
          setActiveOrder(updatedOrder);
        }
        return updatedOrder;
      }
      return o;
    }));

    // Phát sự kiện cập nhật đơn hàng sang các tab khác realtime
    broadcastOrderUpdateToTabs(orderId, updates);
  };

  // Cập nhật phí ship riêng cho từng đơn hàng từ Admin Dashboard
  const updateOrderShippingFee = async (orderId, newShippingFee) => {
    const fee = Math.max(0, Number(newShippingFee) || 0);
    const targetOrder = orders.find(o => o.id === orderId || o.orderCode === orderId);
    if (!targetOrder) return;

    // Tính lại totalAmount chuẩn xác
    const itemsTotal = Array.isArray(targetOrder.items) && targetOrder.items.length > 0
      ? targetOrder.items.reduce((sum, it) => sum + Number(it.price || 0), 0)
      : Number(targetOrder.productPrice || targetOrder.totalAmount || 0);

    const discount = Number(targetOrder.discountAmount || 0);
    const newTotalAmount = Math.max(0, itemsTotal - discount + fee);

    const updates = {
      shippingFee: fee,
      totalAmount: newTotalAmount,
      isShippingConfirmed: true,
      shippingConfirmedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    try {
      await updateOrderStatusApi(targetOrder.id, updates);
    } catch (e) {}

    setOrders(prev => prev.map(o => (o.id === targetOrder.id ? { ...o, ...updates } : o)));
    if (activeOrder && (activeOrder.id === targetOrder.id || activeOrder.orderCode === targetOrder.id)) {
      setActiveOrder(prev => ({ ...prev, ...updates }));
    }

    broadcastOrderUpdateToTabs(targetOrder.id, updates);
    return updates;
  };

  const resetUnreadOrdersCount = () => {
    setUnreadOrdersCount(0);
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        shopZaloPhone,
        setShopZaloPhone,
        zaloModeType,
        setZaloModeType,
        telegramBotToken,
        setTelegramBotToken,
        telegramChatId,
        setTelegramChatId,
        isSoundEnabled,
        setIsSoundEnabled,
        shippingSettings,
        updateShippingSettings,
        facebookSettings,
        updateFacebookSettings,
        getShippingFee,
        updateOrderShippingFee,
        unreadOrdersCount,
        resetUnreadOrdersCount,
        latestNewOrder,
        setLatestNewOrder,
        triggerAdminOrderAlert,
        refreshShopData,
        isApiConnected,
        activeCategory,
        setActiveCategory,
        cart,
        wishlist,
        selectedOccasion,
        setSelectedOccasion,
        selectedColor,
        setSelectedColor,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isAIFloristOpen,
        setIsAIFloristOpen,
        isTrackingOpen,
        setIsTrackingOpen,
        isZaloMode,
        setIsZaloMode,
        quickViewProduct,
        setQuickViewProduct,
        displaySettings,
        updateDisplaySettings,
        isBannerEffectivelyHidden,
        toggleBannerVisibility,
        orders,
        activeOrder,
        inventory,
        addInventoryItem,
        updateInventoryItem,
        restockInventoryItem,
        deleteInventoryItem,
        discounts,
        appliedCoupon,
        discountAmount,
        applyCoupon,
        removeCoupon,
        addDiscount,
        toggleDiscount,
        deleteDiscount,
        reviews,
        addReview,
        toggleReview,
        deleteReview,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        cartTotal,
        submitOrder,
        approvePhotoProof,
        updateOrderByAdmin
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
