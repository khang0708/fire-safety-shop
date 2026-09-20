import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { OCCASIONS, COLOR_TONES } from '../data/flowers';
import { 
  openPersonalZaloChat, 
  openPersonalZaloToCustomer 
} from '../services/zaloService';
import { 
  cleanFacebookPageId, 
  getMessengerUrl, 
  openFacebookMessenger 
} from '../services/facebookService';
import { playTestChime } from '../services/soundService';
import { 
  requestBrowserNotificationPermission, 
  getBrowserNotificationPermission 
} from '../services/notificationService';
import { sendTelegramTestApi, getTelegramChatIdAutoApi, sendFacebookTestApi } from '../api';
import { PrintInvoiceModal } from './PrintInvoiceModal';
import { SalesAnalyticsView } from './SalesAnalyticsView';
import { 
  ShoppingBag, 
  Flower2, 
  Camera, 
  CheckCircle2, 
  Phone, 
  ArrowLeft, 
  Sparkles, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Tag, 
  Smartphone,
  Send,
  QrCode,
  ShieldCheck,
  UserCheck,
  Zap,
  Copy,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
  MessageSquareShare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCheck,
  LogOut,
  Printer,
  BarChart3,
  MessageSquareHeart,
  Star,
  Upload,
  Image as ImageIcon,
  Truck,
  Menu,
  RefreshCw
} from 'lucide-react';


export const AdminDashboard = ({ onBackToStore, adminUser, onLogout }) => {
  const { 
    orders, 
    updateOrderByAdmin, 
    inventory, 
    addInventoryItem,
    updateInventoryItem,
    restockInventoryItem,
    deleteInventoryItem,
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductAvailability,
    discounts,
    addDiscount,
    toggleDiscount,
    deleteDiscount,
    reviews,
    toggleReview,
    deleteReview,
    shopZaloPhone,
    setShopZaloPhone,
    telegramBotToken,
    setTelegramBotToken,
    telegramChatId,
    setTelegramChatId,
    isSoundEnabled,
    setIsSoundEnabled,
    shippingSettings,
    updateShippingSettings,
    updateOrderShippingFee,
    unreadOrdersCount,
    resetUnreadOrdersCount,
    latestNewOrder,
    setLatestNewOrder,
    facebookSettings,
    updateFacebookSettings,
    refreshShopData
  } = useShop();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (typeof refreshShopData === 'function') {
      await refreshShopData(false);
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products_cms' | 'discounts' | 'zalo_config' | 'inventory' | 'shipping_config'
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedOrderFilter, setSelectedOrderFilter] = useState('all');
  const [browserNotifStatus, setBrowserNotifStatus] = useState(getBrowserNotificationPermission());
  const [printOrder, setPrintOrder] = useState(null);
  
  // State Modal Thêm/Sửa Mẫu Thiết Bị PCCC Mới
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [imageImportMode, setImageImportMode] = useState('upload'); // 'upload' | 'library' | 'url'

  // State Modal Chụp / Upload Ảnh Thật & Đồng Hồ Áp Suất Tại Xưởng
  const [proofModalOrder, setProofModalOrder] = useState(null);
  const [proofPhotoInput, setProofPhotoInput] = useState('');
  const [proofNoteInput, setProofNoteInput] = useState('');
  const [proofTabMode, setProofTabMode] = useState('upload'); // 'upload' | 'preset' | 'url'

  // State Chỉnh sửa phí ship nhanh cho từng đơn hàng
  const [editingShippingOrderId, setEditingShippingOrderId] = useState(null);
  const [customShippingInput, setCustomShippingInput] = useState('');

  // State Quản lý Kho Thiết Bị PCCC
  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  const [addInventoryForm, setAddInventoryForm] = useState({ name: '', total: 60, unit: 'bình' });
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState(30);
  const [editInventoryItemData, setEditInventoryItemData] = useState(null);
  const [editInventoryForm, setEditInventoryForm] = useState({ name: '', total: 0, used: 0, unit: 'bình' });

  // State Cấu hình Phí Vận Chuyển Thiết Bị & Freeship
  const [shippingForm, setShippingForm] = useState({
    shippingMode: shippingSettings?.shippingMode ?? 'admin_confirm',
    standardFee: shippingSettings?.standardFee ?? 35000,
    expressFee: shippingSettings?.expressFee ?? 60000,
    freeShippingThreshold: shippingSettings?.freeShippingThreshold ?? 1000000,
    isFreeShippingEnabled: shippingSettings?.isFreeShippingEnabled ?? true,
    freeShippingNote: shippingSettings?.freeShippingNote ?? 'FLAMEGUARD sẽ kiểm tra địa chỉ & xác nhận phí vận chuyển thiết bị PCCC chính xác theo quãng đường & tải trọng thực tế qua Zalo/Hotline'
  });
  const [isShippingSaved, setIsShippingSaved] = useState(false);

  useEffect(() => {
    if (shippingSettings) {
      setShippingForm({
        shippingMode: shippingSettings.shippingMode ?? 'admin_confirm',
        standardFee: shippingSettings.standardFee ?? 35000,
        expressFee: shippingSettings.expressFee ?? 60000,
        freeShippingThreshold: shippingSettings.freeShippingThreshold ?? 1000000,
        isFreeShippingEnabled: shippingSettings.isFreeShippingEnabled ?? true,
        freeShippingNote: shippingSettings.freeShippingNote ?? 'FLAMEGUARD sẽ kiểm tra địa chỉ & xác nhận phí vận chuyển thiết bị PCCC chính xác theo quãng đường & tải trọng thực tế qua Zalo/Hotline'
      });
    }
  }, [shippingSettings]);

  const handleSaveShippingSettings = (e) => {
    e.preventDefault();
    updateShippingSettings({
      shippingMode: shippingForm.shippingMode || 'admin_confirm',
      standardFee: Number(shippingForm.standardFee) || 0,
      expressFee: Number(shippingForm.expressFee) || 0,
      freeShippingThreshold: Number(shippingForm.freeShippingThreshold) || 0,
      isFreeShippingEnabled: Boolean(shippingForm.isFreeShippingEnabled),
      freeShippingNote: shippingForm.freeShippingNote || ''
    });
    setIsShippingSaved(true);
    setTimeout(() => setIsShippingSaved(false), 3500);
  };

  const PRESET_FLOWER_PHOTOS = [
    { name: 'Bình Bột ABC 4kg MFZL4', url: '/images/abc-powder-4kg.jpg' },
    { name: 'Bình Khí CO2 3kg MT3', url: '/images/co2-extinguisher-3kg.jpg' },
    { name: 'Mặt Nạ Chống Khói TZL30', url: '/images/smoke-mask-tzl30.jpg' },
    { name: 'Dây Thoát Hiểm Hạ Chậm 15m', url: '/images/escape-rope-15m.jpg' },
    { name: 'Chăn Dập Lửa Sợi Thủy Tinh 1.8m', url: '/images/fire-blanket-18m.jpg' },
    { name: 'Đầu Báo Khói Quang Học Độc Lập', url: '/images/smoke-detector-alarm.jpg' },
    { name: 'Bình Bọt Foam Sinh Học 6L', url: '/images/foam-extinguisher-6l.jpg' },
    { name: 'Bình Cứu Hỏa Mini Ô Tô', url: '/images/car-mini-extinguisher.jpg' }
  ];

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file hình ảnh (JPG, PNG, WEBP,...)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Data = uploadEvent.target?.result;
      if (base64Data) {
        setFormData(prev => ({ ...prev, image: base64Data }));
      }
    };
    reader.readAsDataURL(file);
  };

  // State Modal Thêm Voucher
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountFormData, setDiscountFormData] = useState({
    code: '',
    name: '',
    type: 'percentage',
    value: 10,
    maxDiscount: 100000,
    minOrderValue: 500000,
    usageLimit: 100,
    expiresAt: '2026-12-31'
  });
  
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    price: 320000,
    originalPrice: 380000,
    occasion: 'fire-extinguisher',
    colorTone: 'abc-powder',
    image: '/images/abc-powder-4kg.jpg',
    tags: ['Tem BCA'],
    meaning: 'Thiết bị chữa cháy đạt chuẩn TCVN 3890:2023, dập tắt đám cháy tức thời.',
    flowerTypes: 'Khí áp lực N2, Bột chữa cháy ABC 40%, Van đồng thau',
    freshDays: 365,
  });

  // State Cài đặt Zalo & Telegram
  const [inputShopPhone, setInputShopPhone] = useState(shopZaloPhone);
  const [inputBotToken, setInputBotToken] = useState(telegramBotToken);
  const [inputChatId, setInputChatId] = useState(telegramChatId);
  const [saveZaloSuccess, setSaveZaloSuccess] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [isDetectingChatId, setIsDetectingChatId] = useState(false);
  const [autoDetectMsg, setAutoDetectMsg] = useState(null);
  const [copyToast, setCopyToast] = useState('');
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  // State Cài đặt Facebook Messenger
  const [inputFbPageId, setInputFbPageId] = useState(facebookSettings?.pageId || 'flameguardvietnam');
  const [inputFbPageName, setInputFbPageName] = useState(facebookSettings?.pageName || 'FLAMEGUARD PRO - Thiết Bị PCCC');
  const [inputFbToken, setInputFbToken] = useState(facebookSettings?.pageAccessToken || '');
  const [inputFbVerifyToken, setInputFbVerifyToken] = useState(facebookSettings?.verifyToken || 'flameguard_webhook_secret_2026');
  const [inputFbRecipientId, setInputFbRecipientId] = useState(facebookSettings?.adminRecipientId || '');
  const [inputFbEnabled, setInputFbEnabled] = useState(facebookSettings?.isEnabled !== false);
  const [inputFbWelcomeMsg, setInputFbWelcomeMsg] = useState(facebookSettings?.welcomeMessage || 'Chào bạn! FLAMEGUARD PRO rất vui được hỗ trợ tư vấn thiết bị PCCC cho bạn.');
  const [inputFbAutoReply, setInputFbAutoReply] = useState(facebookSettings?.autoReplyEnabled !== false);
  const [showFbGuide, setShowFbGuide] = useState(false);
  const [facebookStatus, setFacebookStatus] = useState(null);

  // Đồng bộ giá trị từ localStorage/Context vào Form
  useEffect(() => {
    if (telegramBotToken) setInputBotToken(telegramBotToken);
  }, [telegramBotToken]);

  useEffect(() => {
    if (telegramChatId) setInputChatId(telegramChatId);
  }, [telegramChatId]);

  useEffect(() => {
    if (shopZaloPhone) setInputShopPhone(shopZaloPhone);
  }, [shopZaloPhone]);

  useEffect(() => {
    if (facebookSettings) {
      if (facebookSettings.pageId) setInputFbPageId(facebookSettings.pageId);
      if (facebookSettings.pageName) setInputFbPageName(facebookSettings.pageName);
      if (facebookSettings.pageAccessToken !== undefined) setInputFbToken(facebookSettings.pageAccessToken);
      if (facebookSettings.verifyToken) setInputFbVerifyToken(facebookSettings.verifyToken);
      if (facebookSettings.adminRecipientId !== undefined) setInputFbRecipientId(facebookSettings.adminRecipientId);
      if (facebookSettings.isEnabled !== undefined) setInputFbEnabled(facebookSettings.isEnabled);
      if (facebookSettings.welcomeMessage) setInputFbWelcomeMsg(facebookSettings.welcomeMessage);
      if (facebookSettings.autoReplyEnabled !== undefined) setInputFbAutoReply(facebookSettings.autoReplyEnabled);
    }
  }, [facebookSettings]);

  // Cập nhật trạng thái quyền thông báo trình duyệt
  const handleRequestBrowserNotif = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserNotifStatus(res);
  };

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setFormData({
      name: '',
      subtitle: '',
      price: 320000,
      originalPrice: 380000,
      occasion: 'fire-extinguisher',
      colorTone: 'abc-powder',
      image: '/images/abc-powder-4kg.jpg',
      tags: ['Tem BCA'],
      meaning: 'Thiết bị chữa cháy đạt chuẩn TCVN 3890:2023, dập tắt đám cháy tức thời.',
      flowerTypes: 'Khí áp lực N2, Bột chữa cháy ABC 40%, Van đồng thau',
      freshDays: 365,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProductId(prod.id);
    setFormData({
      name: prod.name,
      subtitle: prod.subtitle || '',
      price: prod.price,
      originalPrice: prod.originalPrice || prod.price,
      occasion: prod.occasion || 'love',
      colorTone: prod.colorTone || 'pastel',
      image: prod.image,
      tags: prod.tags || ['Mẫu Mới'],
      meaning: prod.meaning || '',
      flowerTypes: Array.isArray(prod.flowerTypes) ? prod.flowerTypes.join(', ') : prod.flowerTypes || '',
      freshDays: prod.freshDays || 4,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const flowerTypesArray = formData.flowerTypes.split(',').map(s => s.trim()).filter(Boolean);
    const now = new Date().toISOString();
    const payload = {
      ...formData,
      price: Number(formData.price),
      originalPrice: Number(formData.originalPrice),
      flowerTypes: flowerTypesArray,
      freshDays: Number(formData.freshDays) || 4,
      updatedAt: now
    };

    if (editingProductId) {
      const existing = products.find(p => p.id === editingProductId) || {};
      await updateProduct(editingProductId, {
        ...existing,
        ...payload,
        id: editingProductId,
        isAvailable: existing.isAvailable !== undefined ? existing.isAvailable : true,
        rating: existing.rating || 5.0,
        reviewsCount: existing.reviewsCount || 0,
        updatedAt: now
      });
    } else {
      await addProduct(payload);
    }
    setIsProductModalOpen(false);
    setEditingProductId(null);
  };


  const handleSaveZaloSettings = (e) => {
    e.preventDefault();
    const cleanToken = (inputBotToken || '').trim();
    const cleanChatId = (inputChatId || '').trim();
    const cleanPhone = (inputShopPhone || '').trim();

    setShopZaloPhone(cleanPhone);
    setTelegramBotToken(cleanToken);
    setTelegramChatId(cleanChatId);

    if (updateFacebookSettings) {
      updateFacebookSettings({
        pageId: (inputFbPageId || '').trim(),
        pageName: (inputFbPageName || '').trim(),
        pageAccessToken: (inputFbToken || '').trim(),
        verifyToken: (inputFbVerifyToken || '').trim(),
        adminRecipientId: (inputFbRecipientId || '').trim(),
        isEnabled: inputFbEnabled,
        welcomeMessage: (inputFbWelcomeMsg || '').trim(),
        autoReplyEnabled: inputFbAutoReply
      });
    }

    setSaveZaloSuccess(true);
    setTimeout(() => setSaveZaloSuccess(false), 3000);
  };

  // Tự động tìm Chat ID từ Bot Token
  const handleAutoDetectChatId = async () => {
    if (!inputBotToken) {
      setAutoDetectMsg({ success: false, text: 'Vui lòng dán chuỗi Bot Token vào ô trên trước khi dò tìm!' });
      return;
    }
    setIsDetectingChatId(true);
    setAutoDetectMsg(null);
    try {
      const res = await getTelegramChatIdAutoApi(inputBotToken);
      setIsDetectingChatId(false);
      if (res.chatId) {
        setInputChatId(res.chatId);
        setAutoDetectMsg({ 
          success: true, 
          text: `🎉 Tuyệt vời! Đã tìm thấy Chat ID của ${res.senderName || 'bạn'}: ${res.chatId} (Đã tự động điền vào ô)` 
        });
      }
    } catch (err) {
      setIsDetectingChatId(false);
      setAutoDetectMsg({ success: false, text: err.message });
    }
  };

  const handleTestTelegram = async () => {
    setTelegramStatus({ loading: true, message: 'Đang gửi tin nhắn test qua Telegram...' });
    try {
      const res = await sendTelegramTestApi(inputBotToken, inputChatId);
      setTelegramStatus({ success: true, message: res.message });
    } catch (err) {
      setTelegramStatus({ success: false, message: err.message });
    }
  };

  const handleTestFacebook = async () => {
    setFacebookStatus({ loading: true, message: 'Đang gửi tin nhắn test qua Facebook Messenger...' });
    try {
      const res = await sendFacebookTestApi({
        pageId: inputFbPageId,
        pageAccessToken: inputFbToken,
        recipientId: inputFbRecipientId
      });
      setFacebookStatus({ 
        success: true, 
        message: res.message || 'Kết nối Facebook Messenger thành công!',
        messengerUrl: res.messengerUrl 
      });
    } catch (err) {
      setFacebookStatus({ success: false, message: err.message || 'Lỗi khi kiểm tra kết nối Facebook' });
    }
  };

  const handleQuickSetOrderShipping = async (orderId, fee) => {
    await updateOrderShippingFee(orderId, fee);
    setEditingShippingOrderId(null);
    setCopyToast(`✓ Đã cập nhật phí vận chuyển thành ${Number(fee).toLocaleString('vi-VN')}đ! Tổng tiền đơn đã được tính lại.`);
    setTimeout(() => setCopyToast(''), 3500);
  };

  const handleSendShippingZaloQuote = (order) => {
    const shipFee = Number(order.shippingFee || 0);
    const shipText = shipFee === 0 ? 'Miễn phí vận chuyển (Freeship 0đ)' : `${shipFee.toLocaleString('vi-VN')}đ`;
    const message = `🧯 Chào ${order.customerName}, FLAMEGUARD PRO xin gửi thông tin xác nhận & báo giá đơn thiết bị PCCC #${order.orderCode || order.id}:\n\n` +
      `📦 Thiết bị: ${order.productName}\n` +
      `📍 Bàn giao đến: ${order.receiverAddress}\n` +
      `⏱️ Tiến độ bàn giao: ${order.deliverySlot}\n` +
      `🚚 Phí vận chuyển xác nhận: ${shipText}\n` +
      `💰 TỔNG CỘNG THANH TOÁN: ${Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ\n\n` +
      `👉 Kỹ sư kiểm định đang đo áp suất vạch xanh và niêm phong tem kiểm định Bộ Công An. Khi hoàn tất, trạm sẽ gửi ảnh chụp thật cho bạn duyệt trước khi xuất kho!`;

    navigator.clipboard?.writeText(message);
    const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
    window.open(`https://zalo.me/${cleanPhone}`, '_blank');
    setCopyToast(`🎉 Đã copy báo giá & phí ship cho ${order.customerName}! Hãy bấm Dán (Paste) vào Zalo.`);
    setTimeout(() => setCopyToast(''), 4000);
  };

  // Handlers Nghiệp Vụ Kho Thiết Bị PCCC
  const handleCreateInventoryItem = async (e) => {
    e.preventDefault();
    if (!addInventoryForm.name.trim()) return;
    await addInventoryItem(addInventoryForm);
    setIsAddInventoryOpen(false);
    setAddInventoryForm({ name: '', total: 60, unit: 'bình' });
    setCopyToast(`✓ Đã thêm ${addInventoryForm.name} vào kho thiết bị PCCC thành công!`);
    setTimeout(() => setCopyToast(''), 3000);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockItem) return;
    await restockInventoryItem(restockItem.name, restockQty);
    setRestockItem(null);
    setCopyToast(`✓ Đã nhập thêm +${restockQty} ${restockItem.unit} cho ${restockItem.name}!`);
    setTimeout(() => setCopyToast(''), 3000);
  };

  const handleSaveEditInventory = async (e) => {
    e.preventDefault();
    if (!editInventoryItemData) return;
    await updateInventoryItem(editInventoryItemData.name, editInventoryForm);
    setEditInventoryItemData(null);
    setCopyToast(`✓ Đã cập nhật kiểm kê cho ${editInventoryItemData.name}!`);
    setTimeout(() => setCopyToast(''), 3000);
  };

  const handleDeleteInventory = async (itemName) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${itemName}" khỏi kho PCCC?`)) {
      await deleteInventoryItem(itemName);
      setCopyToast(`✓ Đã xóa ${itemName} khỏi danh mục kho.`);
      setTimeout(() => setCopyToast(''), 3000);
    }
  };

  const handleOpenProofModal = (order) => {
    setProofModalOrder(order);
    setProofPhotoInput(order.proofPhotoUrl || '');
    setProofNoteInput(order.proofNote || 'Đã đo kiểm áp suất vạch xanh & dán tem BCA đạt chuẩn');
    setProofTabMode('upload');
  };

  const handleProofFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file hình ảnh hợp lệ (JPG, PNG, WEBP, HEIC)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProofPhotoInput(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProofPhoto = (e) => {
    e.preventDefault();
    if (!proofModalOrder) return;
    if (!proofPhotoInput.trim()) {
      alert('Vui lòng chọn hoặc tải lên một tấm ảnh đồng hồ áp suất & tem kiểm định BCA trước khi gửi duyệt!');
      return;
    }
    const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    updateOrderByAdmin(proofModalOrder.id, {
      proofPhotoUrl: proofPhotoInput,
      proofNote: proofNoteInput,
      proofPhotoTime: currentTime,
      status: 'PHOTO_READY',
      isApproved: false
    });
    setProofModalOrder(null);
    setCopyToast(`🎉 Đã cập nhật ảnh kiểm định áp suất cho đơn #${proofModalOrder.orderCode || proofModalOrder.id}! Khách hàng có thể xem & duyệt realtime.`);
    setTimeout(() => setCopyToast(''), 4000);
  };

  const handleSendToShipper = (orderId) => {
    updateOrderByAdmin(orderId, {
      status: 'DELIVERING',
      isApproved: true
    });
  };

  const filteredOrders = orders.filter(o => {
    if (selectedOrderFilter === 'all') return true;
    return o.status === selectedOrderFilter;
  });

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-[#222523] font-sans">
      
      {/* Toast thông báo copy tin nhắn */}
      {copyToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1B3B2B] text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* POPUP BANNER THÔNG BÁO ĐƠN HÀNG MỚI NỔI (REALTIME ALERT) */}
      {latestNewOrder && (
        <div className="fixed top-20 right-6 z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border-2 border-red-500 overflow-hidden animate-bounce-short text-[#222523]">
          <div className="bg-gradient-to-r from-red-700 to-red-800 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-bold text-xs">🔔 CÓ ĐƠN ĐẶT THIẾT BỊ PCCC MỚI!</span>
            </div>
            <button
              onClick={() => setLatestNewOrder(null)}
              className="text-white/70 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <strong className="block text-[#1B3B2B] text-sm font-serif">{latestNewOrder.productName}</strong>
                <span className="text-gray-500 block">Người đặt: <strong>{latestNewOrder.customerName}</strong></span>
              </div>
              <span className="font-bold text-[#C4685A] text-sm">
                {Number(latestNewOrder.totalAmount || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>

            <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-gray-200 text-[11px] text-gray-600">
              <p>⏱️ Khung giờ hẹn: <strong>{latestNewOrder.deliverySlot}</strong></p>
              <p>📍 Giao tới: {latestNewOrder.receiverAddress}</p>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setLatestNewOrder(null);
                  resetUnreadOrdersCount();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-center text-xs transition-all active:scale-95"
              >
                Xem & Kiểm Định Ngay
              </button>
              <button
                onClick={() => setLatestNewOrder(null)}
                className="px-3 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 rounded-xl text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BỐ CỤC CHÍNH: SIDEBAR DỌC (PHƯƠNG ÁN 2) & KHU VỰC LÀM VIỆC */}
      <div className="flex min-h-screen">
        
        {/* LỚP PHỦ CHO MOBILE (BACKDROP) */}
        {isMobileSidebarOpen && (
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          />
        )}

        {/* 1. SIDEBAR DỌC BÊN TRÁI (STICKY DESKTOP & DRAWER MOBILE) */}
        <aside className={`
          fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-950 text-white flex-shrink-0 flex flex-col justify-between border-r border-slate-800 shadow-xl transition-transform duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* Sidebar Top: Brand Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
                FG
              </div>
              <div>
                <h2 className="font-heading text-base font-bold text-white leading-tight">FLAMEGUARD PRO</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] text-red-300 uppercase font-bold tracking-wider">Trạm Kiểm Định PCCC</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsMobileSidebarOpen(false)} 
              className="md:hidden text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {/* Sidebar Center: 4 Phân Khu Nghiệp Vụ */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs">
            {[
              {
                groupTitle: 'ĐIỀU HÀNH & KIỂM ĐỊNH',
                items: [
                  { id: 'orders', label: 'Đơn Hàng & Kiểm Định', icon: ShoppingBag, count: orders.length, alert: unreadOrdersCount > 0 },
                  { id: 'inventory', label: 'Kho Bình & Khí Nạp', icon: Gauge, count: inventory.length, danger: inventory.some(i => i.status === 'danger') }
                ]
              },
              {
                groupTitle: 'DANH MỤC THIẾT BỊ',
                items: [
                  { id: 'products_cms', label: 'Thiết Bị PCCC & Cứu Hộ', icon: ShieldCheck, count: products.length },
                  { id: 'discounts', label: 'Voucher Khuyến Mãi', icon: Tag, count: discounts?.length || 0 },
                  { id: 'reviews', label: 'Đánh Giá Nghiệm Thu', icon: MessageSquareHeart, count: reviews?.length || 0 }
                ]
              },
              {
                groupTitle: 'BÁO CÁO & PHÂN TÍCH',
                items: [
                  { id: 'analytics', label: 'Báo Cáo Doanh Thu & VAT', icon: BarChart3 }
                ]
              },
              {
                groupTitle: 'CÀI ĐẶT HỆ THỐNG',
                items: [
                  { id: 'shipping_config', label: 'Vận Chuyển Chuyên Dụng', icon: Truck },
                  { id: 'zalo_config', label: 'Cấu Hình Zalo / FB / Tele', icon: Smartphone }
                ]
              }
            ].map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 block">
                  {group.groupTitle}
                </span>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          if (item.id === 'orders') resetUnreadOrdersCount();
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-left group ${
                          isActive
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-1 ring-white/10'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 flex-shrink-0 transition-transform ${isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-white'}`} />
                          <span className="truncate text-xs">{item.label}</span>
                        </div>

                        {item.count !== undefined && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-extrabold flex-shrink-0 ${
                            item.danger
                              ? 'bg-rose-500 text-white animate-pulse'
                              : isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {item.count}
                          </span>
                        )}

                        {item.alert && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Bottom: Quick Return & User Profile */}
          <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900">
            <button
              onClick={onBackToStore}
              className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white py-2 rounded-xl text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Về Cửa Hàng</span>
            </button>

            {/* Nút xem trực tiếp Cẩm Nang PDF */}
            <a
              href="/Huong_Dan_Su_Dung_FlameGuard_Pro.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#E8998D]/20 hover:bg-[#E8998D]/30 text-[#F5D6CE] hover:text-white py-2 rounded-xl text-xs font-bold transition-all border border-[#E8998D]/30"
              title="Mở cẩm nang hướng dẫn sử dụng file PDF (9 trang)"
            >
              <span>📖 Cẩm Nang HDSD (.PDF)</span>
            </a>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={adminUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                  alt={adminUser?.name || "Admin"}
                  className="w-7 h-7 rounded-full object-cover border border-[#E8998D]"
                />
                <div className="min-w-0">
                  <span className="font-bold text-white text-[11px] block truncate max-w-[100px]">
                    {adminUser?.name || 'Admin Atelier'}
                  </span>
                  <span className="text-[9px] text-emerald-300 block truncate">
                    {adminUser?.provider === 'google' ? 'Google SSO' : 'Admin'}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="text-emerald-200 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/20 transition-all"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* 2. KHU VỰC NỘI DUNG CHÍNH (RIGHT WORKSPACE) */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#F8FAF9]">
          
          {/* Top Navigation Bar */}
          <header className="bg-white border-b border-[#E8EFEA] sticky top-0 z-30 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-xs">
            
            {/* Left: Mobile Menu Toggle & Breadcrumb Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                aria-label="Mở Menu Admin"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <h1 className="font-serif text-base sm:text-lg font-bold text-[#1B3B2B] leading-tight">
                  {activeTab === 'orders' && '🧯 Quản Lý Đơn Hàng & Kiểm Định Kỹ Thuật'}
                  {activeTab === 'inventory' && '🛡️ Quản Lý Kho Thiết Bị & Khí Nạp PCCC'}
                  {activeTab === 'products_cms' && '📦 Quản Lý Danh Mục Thiết Bị PCCC'}
                  {activeTab === 'discounts' && '🎟️ Quản Lý Voucher & Khuyến Mãi PCCC'}
                  {activeTab === 'reviews' && '⭐ Quản Lý Đánh Giá Nghiệm Thu'}
                  {activeTab === 'analytics' && '📊 Báo Cáo Phân Tích Doanh Thu & VAT'}
                  {activeTab === 'shipping_config' && '🚚 Cấu Hình Vận Chuyển Chuyên Dụng PCCC'}
                  {activeTab === 'zalo_config' && '💬 Cấu Hình Kênh Chat & Khẩn Cấp (Zalo, Telegram, Messenger)'}
                </h1>
                <span className="text-[10px] text-slate-400 hidden sm:block">FLAMEGUARD PRO • Trung Tâm Điều Hành & Kiểm Định Kỹ Thuật PCCC</span>
              </div>
            </div>

            {/* Right: Sound controls, Bell & Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Nút Đồng Bộ Dữ Liệu Máy Chủ (Smart Sync) */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold shadow-2xs"
                title="Làm mới và đồng bộ dữ liệu từ máy chủ đám mây"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#1B3B2B] ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                <span className="hidden md:inline">{isRefreshing ? 'Đang đồng bộ...' : 'Đồng bộ'}</span>
              </button>

              {/* Nút Bật/Tắt Chuông Báo */}
              <button
                onClick={() => {
                  setIsSoundEnabled(!isSoundEnabled);
                  if (!isSoundEnabled) playTestChime();
                }}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all border font-semibold ${
                  isSoundEnabled 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                    : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                }`}
                title={isSoundEnabled ? 'Chuông báo đơn mới đang BẬT' : 'Chuông báo đang TẮT'}
              >
                {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-700" /> : <VolumeX className="w-3.5 h-3.5 text-rose-700" />}
                <span className="hidden sm:inline">{isSoundEnabled ? 'Chuông Bật' : 'Tắt Chuông'}</span>
              </button>

              {/* Nút Nghe Thử Chuông */}
              <button
                onClick={playTestChime}
                className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-2.5 py-1.5 rounded-full transition-all hidden sm:inline"
                title="Phát thử âm thanh chuông báo"
              >
                🎵 Thử
              </button>

              {/* Chuông Thông Báo Bell Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotifDropdownOpen(!isNotifDropdownOpen);
                    if (!isNotifDropdownOpen) resetUnreadOrdersCount();
                  }}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all relative text-gray-700"
                  title="Thông báo đơn mới"
                >
                  <Bell className="w-4 h-4" />
                  {unreadOrdersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C4685A] text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse border-2 border-white">
                      {unreadOrdersCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Menu */}
                {isNotifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 text-[#222523] text-xs space-y-3 z-50 animate-fade-in">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <strong className="font-serif text-sm text-[#1B3B2B]">Thông Báo Đơn Hàng</strong>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 animate-pulse" /> SSE Realtime
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {orders.slice(0, 4).map((o) => (
                        <div
                          key={o.id}
                          onClick={() => {
                            setActiveTab('orders');
                            setIsNotifDropdownOpen(false);
                          }}
                          className="p-2.5 rounded-xl bg-gray-50 hover:bg-[#FAF8F5] cursor-pointer transition-colors border border-gray-100"
                        >
                          <div className="flex justify-between font-bold text-[#1B3B2B]">
                            <span>#{o.orderCode || o.id}</span>
                            <span className="text-[#C4685A]">{Number(o.totalAmount || 0).toLocaleString('vi-VN')}đ</span>
                          </div>
                          <p className="text-[11px] text-gray-600 line-clamp-1 mt-0.5">{o.productName}</p>
                          <span className="text-[10px] text-gray-400 block mt-1">Người nhận: {o.receiverName} ({o.deliverySlot})</span>
                        </div>
                      ))}
                    </div>

                    {browserNotifStatus !== 'granted' && (
                      <button
                        onClick={handleRequestBrowserNotif}
                        className="w-full bg-[#0068FF] hover:bg-blue-600 text-white font-bold py-2 rounded-xl text-center text-[11px] transition-all"
                      >
                        🔔 Bật Thông Báo Nổi Màn Hình Máy Tính
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>

          </header>

          {/* Main Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        
        {/* TAB 1: QUẢN LÝ ĐƠN HÀNG */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Banner Trạng Thái Nhận Đơn Realtime */}
            <div className="bg-gradient-to-r from-[#1B3B2B] to-[#264A37] text-white p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <h4 className="font-serif text-base font-bold">Đang Trực Đơn Thời Gian Thực (Realtime Active)</h4>
                  <p className="text-[11px] text-emerald-200">
                    Khi khách đặt đơn, hệ thống sẽ tự động phát chuông và đẩy đơn lên đầu danh sách.
                  </p>
                </div>
              </div>

              {browserNotifStatus !== 'granted' && (
                <button
                  onClick={handleRequestBrowserNotif}
                  className="bg-white text-[#1B3B2B] hover:bg-emerald-50 text-xs font-bold px-4 py-2 rounded-full transition-all shadow-sm"
                >
                  🔔 Bật Thông Báo Desktop
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E8EFEA]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#5C8A70]" />
                <span className="text-xs font-bold text-gray-700">Trạng thái:</span>
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'ARRANGING', label: 'Đang cắm' },
                  { id: 'PHOTO_READY', label: 'Chờ duyệt ảnh' },
                  { id: 'DELIVERING', label: 'Đang ship' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedOrderFilter(f.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      selectedOrderFilter === f.id ? 'bg-[#1B3B2B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-500">Hiển thị <strong>{filteredOrders.length}</strong> đơn hàng</span>
            </div>

            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="font-serif text-lg font-bold text-[#1B3B2B]">#{order.orderCode || order.id}</span>
                    <span className="text-xs font-bold text-[#1B3B2B] font-sans">{Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 space-y-2 text-xs">
                      <h4 className="font-serif text-base font-bold text-[#1B3B2B]">{order.productName}</h4>
                      <p className="p-3 bg-[#FFFDF9] rounded-xl border border-dashed border-[#E8998D] italic">"{order.cardMessage}"</p>
                      
                      <div className="bg-[#FAF8F5] p-3 rounded-xl space-y-1">
                        <p>Người đặt: <strong>{order.customerName}</strong> (<span className="text-[#0068FF] font-bold">{order.customerPhone}</span>)</p>
                        <p>Người nhận: <strong>{order.receiverName}</strong> ({order.receiverPhone})</p>
                        <p>Địa chỉ: {order.receiverAddress}</p>
                        <p className="text-[#C4685A] font-bold pt-1">⏱️ Khung giờ: {order.deliverySlot}</p>
                      </div>

                      {/* BẢNG XỬ LÝ PHÍ GIAO HÀNG TRỰC TIẾP TỪ ADMIN */}
                      <div className="bg-[#F0F5F2] p-3.5 rounded-2xl border border-[#D1DFD6] space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-[#1B3B2B]">
                            <Truck className="w-4 h-4 text-[#5C8A70]" />
                            <span>Xác Nhận Phí Vận Chuyển PCCC (Admin Xử Lý):</span>
                          </div>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            Number(order.shippingFee) > 0 
                              ? 'bg-[#1B3B2B] text-white' 
                              : order.isShippingConfirmed 
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900 animate-pulse'
                          }`}>
                            {Number(order.shippingFee) > 0 
                              ? `Phí ship: ${Number(order.shippingFee).toLocaleString('vi-VN')}đ` 
                              : order.isShippingConfirmed
                              ? 'Freeship (0đ)'
                              : '⏳ Chưa xác nhận phí ship'}
                          </span>
                        </div>

                        {/* Quick Presets for florists */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-500 font-semibold block">Chọn nhanh mức phí theo cước Grab / Ahamove:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: 'Freeship (0đ)', val: 0 },
                              { label: 'Gần 20k', val: 20000 },
                              { label: 'Nội thành 30k', val: 30000 },
                              { label: 'Tiêu chuẩn 35k', val: 35000 },
                              { label: 'Hỏa tốc 50k', val: 50000 },
                              { label: 'Ngoại thành 70k', val: 70000 }
                            ].map((preset) => (
                              <button
                                key={preset.val}
                                type="button"
                                onClick={() => handleQuickSetOrderShipping(order.id, preset.val)}
                                className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-all ${
                                  Number(order.shippingFee) === preset.val && order.isShippingConfirmed
                                    ? 'bg-[#1B3B2B] text-white shadow-xs'
                                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Shipping Input & Zalo Quote Button */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200/60">
                          {editingShippingOrderId === order.id ? (
                            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                value={customShippingInput}
                                onChange={(e) => setCustomShippingInput(e.target.value)}
                                placeholder="Nhập số tiền (VD: 45000)"
                                className="p-1.5 rounded-lg border border-gray-300 text-xs w-28 bg-white font-mono"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleQuickSetOrderShipping(order.id, Number(customShippingInput) || 0)}
                                className="bg-[#1B3B2B] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-[#264A37]"
                              >
                                Lưu
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingShippingOrderId(null)}
                                className="text-gray-500 hover:text-gray-800 text-[10px] px-2 py-1.5"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingShippingOrderId(order.id);
                                setCustomShippingInput(String(order.shippingFee || 35000));
                              }}
                              className="text-[11px] font-bold text-[#1B3B2B] hover:underline flex items-center gap-1"
                            >
                              ✏️ Nhập số tiền ship khác
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleSendShippingZaloQuote(order)}
                            className="ml-auto bg-[#0068FF] hover:bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 active:scale-95"
                            title="Tự động copy tin nhắn báo giá thiết bị PCCC + tiền vận chuyển và mở Zalo gửi khách hàng"
                          >
                            <span>💬 Báo Giá & Phí Ship Qua Zalo</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-red-600" />
                            <span>Ảnh Đo Áp Suất & Tem BCA:</span>
                          </span>
                          {order.proofPhotoUrl ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                              ✓ Đã có ảnh áp suất
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                              ⏳ Đang đo áp suất
                            </span>
                          )}
                        </div>

                        {order.proofPhotoUrl ? (
                          <div className="relative group aspect-[4/3] rounded-xl overflow-hidden border-2 border-white shadow-sm bg-slate-900">
                            <img src={order.proofPhotoUrl} alt="Ảnh áp suất thật" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenProofModal(order)}
                                className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-md hover:bg-gray-100 flex items-center gap-1"
                              >
                                <Camera className="w-3.5 h-3.5 text-red-600" />
                                <span>Chụp lại / Đổi ảnh</span>
                              </button>
                            </div>
                            {order.proofPhotoTime && (
                              <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-md">
                                Đo lúc {order.proofPhotoTime}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div 
                            onClick={() => handleOpenProofModal(order)}
                            className="aspect-[4/3] rounded-xl border-2 border-dashed border-red-400 hover:border-red-600 flex flex-col items-center justify-center text-slate-500 bg-white hover:bg-red-50/50 cursor-pointer transition-all p-4 text-center group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                              <Camera className="w-5 h-5 text-red-600" />
                            </div>
                            <strong className="text-xs text-slate-900 block font-bold">Chụp / Tải ảnh áp suất vạch xanh</strong>
                            <span className="text-[10px] text-slate-400">Khách hàng sẽ kiểm tra & duyệt realtime</span>
                          </div>
                        )}

                        {order.proofNote && (
                          <p className="text-[11px] text-slate-800 bg-white p-2 rounded-lg border border-slate-200 mt-2 italic">
                            💬 "{order.proofNote}"
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 pt-1">
                        <button
                          onClick={() => setPrintOrder(order)}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                          title="In phiếu bàn giao và biên bản nghiệm thu thiết bị PCCC"
                        >
                          <Printer className="w-3.5 h-3.5 text-red-400" />
                          <span>🖨️ In Phiếu Giao & Biên Bản Nghiệm Thu PCCC</span>
                        </button>

                        <button
                          onClick={() => handleOpenPersonalZaloForOrder(order)}
                          className="w-full bg-[#0068FF] hover:bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          title="Tự động copy tin nhắn duyệt ảnh áp suất và mở Zalo của khách hàng"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Mở Zalo Gửi Ảnh Áp Suất Cho Khách</span>
                        </button>

                        {!order.proofPhotoUrl ? (
                          <button 
                            onClick={() => handleOpenProofModal(order)} 
                            className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                          >
                            <Camera className="w-3.5 h-3.5 text-white" />
                            <span>📸 Tải Ảnh Áp Suất & Tem BCA Lên Hệ Thống</span>
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenProofModal(order)}
                              className="flex-1 bg-white hover:bg-gray-100 text-slate-900 border border-slate-300 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 active:scale-95"
                              title="Tải ảnh khác hoặc chụp lại"
                            >
                              <Camera className="w-3.5 h-3.5 text-[#C4685A]" />
                              <span>Đổi Ảnh</span>
                            </button>
                            <button 
                              onClick={() => handleSendToShipper(order.id)} 
                              className="flex-1 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold py-2.5 rounded-xl active:scale-95"
                            >
                              Bàn Giao Shipper
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: BÁO CÁO DOANH THU & PHÂN TÍCH */}
        {activeTab === 'analytics' && (
          <SalesAnalyticsView orders={orders} products={products} />
        )}

        {/* TAB 3: QUẢN LÝ SẢN PHẨM (CMS) */}
        {activeTab === 'products_cms' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-slate-900">
                  Quản Lý Danh Mục Thiết Bị PCCC Chuẩn Kiểm Định
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Thêm thiết bị mới, cập nhật tem BCA, thông số kỹ thuật, giá bán và tồn kho hiển thị ra trang chủ.
                </p>
              </div>

              <button
                onClick={handleOpenAddModal}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-3 rounded-full shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>+ Thêm Thiết Bị PCCC Mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div key={prod.id} className="bg-white rounded-2xl border border-[#E8EFEA] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold bg-[#1B3B2B] text-white px-2.5 py-0.5 rounded-full shadow-sm">
                        Dịp: {OCCASIONS.find(o => o.id === prod.occasion)?.label || prod.occasion}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => toggleProductAvailability(prod.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 transition-all ${
                          prod.isAvailable !== false
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {prod.isAvailable !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{prod.isAvailable !== false ? 'Đang hiển thị' : 'Đã ẩn'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-serif text-base font-bold text-[#1B3B2B] line-clamp-1">{prod.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{prod.subtitle}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Giá niêm yết:</span>
                        <span className="text-base font-bold text-[#C4685A] font-sans">
                          {prod.price?.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleOpenEditModal(prod)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteProduct(prod.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: QUẢN LÝ MÃ GIẢM GIÁ & VOUCHER */}
        {activeTab === 'discounts' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#1B3B2B]">
                  Quản Lý Mã Giảm Giá & Voucher Khuyến Mãi
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Thiết lập các mã coupon (% hoặc tiền cố định hoặc miễn phí vận chuyển) để khách hàng áp dụng khi thanh toán.
                </p>
              </div>

              <button
                onClick={() => setIsDiscountModalOpen(true)}
                className="bg-[#1B3B2B] hover:bg-[#264A37] text-white text-xs font-bold px-5 py-3 rounded-full shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4 text-[#F5D6CE]" />
                <span>+ Tạo Mã Voucher Mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {discounts?.map((dc) => (
                <div key={dc.id} className="bg-white rounded-3xl border border-[#E8EFEA] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-extrabold bg-[#F4F7F5] text-[#1B3B2B] px-3 py-1 rounded-xl border border-[#D1DFD6]">
                        🎟️ {dc.code}
                      </span>
                      <button
                        onClick={() => toggleDiscount(dc.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 transition-all ${
                          dc.isActive !== false
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {dc.isActive !== false ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{dc.isActive !== false ? 'Đang Hoạt Động' : 'Tạm Dừng'}</span>
                      </button>
                    </div>

                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#1B3B2B]">{dc.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {dc.type === 'percentage' && `Giảm ${dc.value}% (Tối đa ${Number(dc.maxDiscount || 0).toLocaleString('vi-VN')}đ)`}
                        {dc.type === 'fixed' && `Giảm trực tiếp ${Number(dc.value).toLocaleString('vi-VN')}đ`}
                        {dc.type === 'shipping' && `Miễn phí vận chuyển (${Number(dc.value || 35000).toLocaleString('vi-VN')}đ)`}
                      </p>
                    </div>

                    <div className="bg-[#FAF8F5] p-3 rounded-xl border border-gray-100 text-[11px] text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Đơn tối thiểu:</span>
                        <strong className="text-gray-900">{Number(dc.minOrderValue || 0).toLocaleString('vi-VN')}đ</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Đã sử dụng:</span>
                        <span className="font-mono text-emerald-800 font-bold">{dc.usedCount || 0} / {dc.usageLimit || '∞'} lượt</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Hạn dùng:</span>
                        <span>{dc.expiresAt || 'Không giới hạn'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">ID: {dc.id}</span>
                    <button
                      onClick={() => deleteDiscount(dc.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 text-xs"
                      title="Xóa mã voucher này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Mã</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB TÙY CHỈNH PHÍ GIAO HOA & FREESHIP */}
        {activeTab === 'shipping_config' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Tab */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span>🚚 Tùy Chỉnh Cước Vận Chuyển & Giao Hàng Thiết Bị PCCC</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Thiết lập giá cước vận chuyển tiêu chuẩn, phí giao hỏa tốc ưu tiên và định mức miễn phí giao hàng (Freeship) cho toàn hệ thống.
                </p>
              </div>

              {isShippingSaved && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold px-4 py-2 rounded-2xl flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã lưu & áp dụng phí giao mới thành công!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* CỘT TRÁI: FORM THIẾT LẬP PHÍ SHIP (7 Cột) */}
              <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-6">
                <form onSubmit={handleSaveShippingSettings} className="space-y-6 text-xs">
                  
                  {/* CHỌN CHẾ ĐỘ XỬ LÝ PHÍ GIAO HÀNG */}
                  <div className="p-5 bg-[#FAF8F5] rounded-3xl border border-gray-200 space-y-3">
                    <label className="font-bold text-gray-900 text-sm block">
                      ⚙️ Cơ Chế Tính & Xác Nhận Phí Ship:
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Chế độ 1: Admin xử lý (Khuyên dùng) */}
                      <div 
                        onClick={() => setShippingForm({ ...shippingForm, shippingMode: 'admin_confirm' })}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          shippingForm.shippingMode === 'admin_confirm'
                            ? 'bg-white border-[#1B3B2B] ring-2 ring-[#1B3B2B]/20 shadow-xs'
                            : 'bg-white/60 border-gray-200 hover:border-gray-300 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs text-[#1B3B2B] mb-1">
                          <span>🌸 Xưởng Báo Phí Ship (Admin xử lý)</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Khuyên dùng</span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          Khách đặt đơn tạm tính 0đ ship. Nghệ nhân/chủ shop kiểm tra địa chỉ và báo phí ship chính xác theo Grab/Ahamove qua Zalo.
                        </p>
                      </div>

                      {/* Chế độ 2: Tự động theo bảng giá */}
                      <div 
                        onClick={() => setShippingForm({ ...shippingForm, shippingMode: 'auto' })}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          shippingForm.shippingMode === 'auto'
                            ? 'bg-white border-[#1B3B2B] ring-2 ring-[#1B3B2B]/20 shadow-xs'
                            : 'bg-white/60 border-gray-200 hover:border-gray-300 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs text-gray-800 mb-1">
                          <span>⚡ Tự Động Theo Bảng Giá Cố Định</span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          Tự động cộng phí ship cố định ({Number(shippingForm.standardFee || 35000).toLocaleString('vi-VN')}đ khung giờ / {Number(shippingForm.expressFee || 60000).toLocaleString('vi-VN')}đ hỏa tốc) vào tổng đơn khi khách đặt.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1. Phí Giao Tiêu Chuẩn */}
                  <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-bold text-gray-900 text-sm block">
                          📅 Phí Giao Tiêu Chuẩn (Theo khung giờ hẹn)
                        </label>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          Áp dụng cho các đơn giao đúng khung giờ hẹn (08:00 - 10:00, 14:00 - 16:00,...)
                        </p>
                      </div>
                      <span className="font-mono text-base font-extrabold text-[#1B3B2B]">
                        {Number(shippingForm.standardFee || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={shippingForm.standardFee}
                      onChange={(e) => setShippingForm({ ...shippingForm, standardFee: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#1B3B2B] font-mono text-sm font-bold text-gray-900"
                    />

                    {/* Quick chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-gray-400">Chọn nhanh:</span>
                      {[
                        { label: 'Miễn phí (0đ)', val: 0 },
                        { label: '25.000đ', val: 25000 },
                        { label: '30.000đ', val: 30000 },
                        { label: '35.000đ (Mặc định)', val: 35000 },
                        { label: '40.000đ', val: 40000 },
                      ].map((chip) => (
                        <button
                          key={chip.val}
                          type="button"
                          onClick={() => setShippingForm({ ...shippingForm, standardFee: chip.val })}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                            Number(shippingForm.standardFee) === chip.val
                              ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Phí Giao Hỏa Tốc */}
                  <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-bold text-gray-900 text-sm block">
                          ⚡ Phí Giao Hỏa Tốc (60 - 90 phút)
                        </label>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          Áp dụng khi khách yêu cầu cắm gấp ưu tiên và giao xe máy chuyên dụng cấp tốc
                        </p>
                      </div>
                      <span className="font-mono text-base font-extrabold text-[#C4685A]">
                        {Number(shippingForm.expressFee || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={shippingForm.expressFee}
                      onChange={(e) => setShippingForm({ ...shippingForm, expressFee: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#1B3B2B] font-mono text-sm font-bold text-gray-900"
                    />

                    {/* Quick chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-gray-400">Chọn nhanh:</span>
                      {[
                        { label: '45.000đ', val: 45000 },
                        { label: '50.000đ', val: 50000 },
                        { label: '60.000đ (Chuẩn)', val: 60000 },
                        { label: '70.000đ', val: 70000 },
                        { label: '80.000đ', val: 80000 },
                      ].map((chip) => (
                        <button
                          key={chip.val}
                          type="button"
                          onClick={() => setShippingForm({ ...shippingForm, expressFee: chip.val })}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                            Number(shippingForm.expressFee) === chip.val
                              ? 'bg-[#C4685A] text-white border-[#C4685A]'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Chính Sách Freeship Theo Giá Trị Đơn Hàng */}
                  <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-bold text-gray-900 text-sm block">
                          🎁 Miễn Phí Vận Chuyển Tự Động (Freeship)
                        </label>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          Tự động giảm 100% phí giao tiêu chuẩn khi đơn hàng đạt mức thanh toán tối thiểu
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shippingForm.isFreeShippingEnabled}
                          onChange={(e) => setShippingForm({ ...shippingForm, isFreeShippingEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B3B2B]"></div>
                      </label>
                    </div>

                    {shippingForm.isFreeShippingEnabled && (
                      <div className="space-y-3 pt-2 border-t border-gray-200">
                        <div>
                          <label className="font-semibold text-gray-700 block mb-1">
                            Ngưỡng đơn hàng tối thiểu được Freeship (VNĐ):
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="50000"
                            value={shippingForm.freeShippingThreshold}
                            onChange={(e) => setShippingForm({ ...shippingForm, freeShippingThreshold: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#1B3B2B] font-mono text-sm font-bold text-gray-900"
                          />
                        </div>

                        {/* Quick chips */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">Chọn nhanh:</span>
                          {[
                            { label: '500.000đ', val: 500000 },
                            { label: '800.000đ', val: 800000 },
                            { label: '1.000.000đ', val: 1000000 },
                            { label: '1.500.000đ', val: 1500000 },
                          ].map((chip) => (
                            <button
                              key={chip.val}
                              type="button"
                              onClick={() => setShippingForm({ ...shippingForm, freeShippingThreshold: chip.val })}
                              className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                                Number(shippingForm.freeShippingThreshold) === chip.val
                                  ? 'bg-emerald-800 text-white border-emerald-800'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>

                        <div>
                          <label className="font-semibold text-gray-700 block mb-1">
                            Lời nhắn thông báo cho khách hàng:
                          </label>
                          <input
                            type="text"
                            value={shippingForm.freeShippingNote}
                            onChange={(e) => setShippingForm({ ...shippingForm, freeShippingNote: e.target.value })}
                            placeholder="VD: Miễn phí giao thiết bị PCCC tiêu chuẩn cho đơn từ 1.000.000đ"
                            className="w-full p-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-red-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nút Lưu Cấu Hình */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4 text-white" />
                      <span>Lưu Cấu Hình Cước Vận Chuyển</span>
                    </button>
                  </div>

                </form>
              </div>

              {/* CỘT PHẢI: LIVE CUSTOMER PREVIEW (5 Cột) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-red-600" />
                    <h4 className="font-serif text-base font-bold text-slate-900">
                      Mô Phỏng Trực Quan (Giao Diện Khách Hàng)
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500">
                    Khách hàng khi đặt thiết bị PCCC tại Checkout sẽ nhìn thấy bảng giá giao hàng và thông báo freeship như sau:
                  </p>

                  {/* Demo Khung Checkout */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="font-bold text-gray-800">Thời Gian & Phương Thức Giao</span>
                      {shippingForm.isFreeShippingEnabled && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          Freeship đơn từ {Number(shippingForm.freeShippingThreshold || 0).toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>

                    {/* Option 1: Tiêu chuẩn */}
                    <div className="p-3 rounded-xl border border-red-600 bg-red-50/50 space-y-1">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-red-700">📅 Giao giờ hành chính (1-2 ngày)</span>
                        <span className="font-mono text-red-700">
                          {Number(shippingForm.standardFee) === 0 ? 'Freeship (0đ)' : `${Number(shippingForm.standardFee).toLocaleString('vi-VN')}đ`}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">Đầy đủ tem kiểm định BCA và biên bản nghiệm thu</p>
                    </div>

                    {/* Option 2: Hỏa tốc */}
                    <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-gray-800">⚡ Hỏa tốc cứu nguy 60 - 90 phút</span>
                        <span className="font-mono text-red-600">
                          {Number(shippingForm.expressFee).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">Ưu tiên kiểm tra áp suất ngay & giao gấp công trình</p>
                    </div>

                    {/* Breakdown Demo */}
                    <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] text-gray-600">
                      <div className="flex justify-between">
                        <span>Tiền thiết bị (Ví dụ):</span>
                        <span className="font-mono font-bold text-gray-900">850.000đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cước vận chuyển tận nơi:</span>
                        <span className="font-mono font-bold text-gray-900">
                          {Number(shippingForm.standardFee).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 text-xs pt-1 border-t border-gray-100">
                        <span>Tổng thanh toán:</span>
                        <span className="font-mono font-extrabold text-sm text-red-600">
                          {(850000 + Number(shippingForm.standardFee)).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                    <strong>💡 Lời khuyên định giá & chính sách vận chuyển PCCC:</strong>
                    <p>
                      Mức phí tiêu chuẩn 35.000đ và Freeship từ 1.000.000đ giúp tăng giá trị trung bình đơn hàng (AOV) lên 24%.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: QUẢN LÝ ĐÁNH GIÁ & FEEDBACK KHÁCH HÀNG */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span>⭐ Quản Lý Đánh Giá & Nghiệm Thu Từ Khách Hàng</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Xem toàn bộ đánh giá nghiệm thu và ảnh chụp áp suất vạch xanh thực tế từ khách hàng gửi về. Bạn có thể duyệt, ẩn hoặc xóa đánh giá không phù hợp.
                </p>
              </div>

              <div className="bg-[#FAF8F5] px-4 py-2 rounded-2xl border border-gray-200 text-xs flex items-center gap-3">
                <span className="font-bold text-[#1B3B2B]">Tổng feedback: <strong>{reviews?.length || 0}</strong></span>
                <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  Đang hiển thị: {reviews?.filter(r => r.isVisible !== false).length || 0}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews?.map((rev) => (
                <div 
                  key={rev.id} 
                  className={`bg-white rounded-3xl border p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                    rev.isVisible === false ? 'border-red-200 bg-red-50/20 opacity-75' : 'border-[#E8EFEA]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={rev.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                          alt={rev.customerName}
                          className="w-9 h-9 rounded-full object-cover border border-emerald-100" 
                        />
                        <div>
                          <strong className="text-xs font-bold text-[#1B3B2B] block">{rev.customerName}</strong>
                          <span className="text-[10px] text-gray-400">{rev.createdAt}</span>
                        </div>
                      </div>

                      <div className="flex text-amber-400 text-xs">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    {/* Thiết bị PCCC */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] bg-[#FAF4F0] text-[#C4685A] font-bold px-2 py-0.5 rounded-md">
                        🧯 {rev.productName}
                      </span>
                      {rev.occasion && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">
                          {rev.occasion}
                        </span>
                      )}
                    </div>

                    {/* Lời bình luận */}
                    <p className="text-xs text-gray-700 italic bg-[#FAF8F5] p-3 rounded-2xl border border-gray-100">
                      "{rev.comment}"
                    </p>

                    {/* Ảnh thiết bị PCCC đính kèm nếu có */}
                    {rev.proofImage && (
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200">
                        <img src={rev.proofImage} alt="Feedback" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => toggleReview(rev.id)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all ${
                        rev.isVisible !== false
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                      }`}
                    >
                      {rev.isVisible !== false ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{rev.isVisible !== false ? 'Hiển Thị Ngoài Web' : 'Đang Bị Ẩn'}</span>
                    </button>

                    <button
                      onClick={() => deleteReview(rev.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 transition-colors"
                      title="Xóa đánh giá này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CÀI ĐẶT ZALO & THÔNG BÁO ĐƠN HÀNG ĐA KÊNH */}
        {activeTab === 'zalo_config' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Cài Đặt SĐT Zalo & Telegram (7 Cột) */}
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-5">
                <h4 className="font-serif text-lg font-bold text-[#1B3B2B] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#0068FF]" />
                  Cấu Hình Kênh Nhận Đơn Hàng Tức Thì
                </h4>

                <form onSubmit={handleSaveZaloSettings} className="space-y-5 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      1. Số Điện Thoại Zalo Cá Nhân Của Bạn:
                    </label>
                    <input
                      type="tel"
                      required
                      value={inputShopPhone}
                      onChange={(e) => setInputShopPhone(e.target.value)}
                      placeholder="Ví dụ: 0909123456"
                      className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0068FF] text-sm font-semibold"
                    />
                  </div>

                  <div className="pt-3 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-gray-700 text-xs">
                        2. Cấu Hình Bot Telegram Nhận Đơn (Miễn phí 100%):
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowTelegramGuide(!showTelegramGuide)}
                        className="text-[#0068FF] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{showTelegramGuide ? 'Ẩn Hướng Dẫn' : 'Xem Các Cách Lấy Chat ID'}</span>
                        {showTelegramGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* BOX HƯỚNG DẪN TỪNG BƯỚC LẤY TELEGRAM TOKEN & CHAT ID */}
                    {showTelegramGuide && (
                      <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl text-[11px] text-gray-700 space-y-3 animate-fade-in">
                        <strong className="text-sky-900 block font-serif text-xs">
                          📖 3 Bước Lấy Bot Token & Chat ID Nhanh Nhất:
                        </strong>

                        <div className="space-y-2.5 pl-1">
                          <div className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">1</span>
                            <div>
                              <span>Mở Telegram → Tìm kiếm </span>
                              <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-700 font-bold underline inline-flex items-center gap-0.5">
                                @BotFather <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                              <span> → Bấm <strong>Start</strong> → Gõ <code>/newbot</code>. Nhập tên bot → Nhận chuỗi <strong>HTTP API Token</strong> (dán vào ô Bot Token bên dưới).</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">2</span>
                            <div>
                              <span>Mở bot bạn vừa tạo trên Telegram → Bấm <strong>Start</strong> hoặc gửi chữ <code>Hi</code> đến bot.</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">3</span>
                            <div className="space-y-1">
                              <span><strong>Lấy Chat ID (Chọn 1 trong 2 cách cực dễ):</strong></span>
                              <p className="text-sky-950 bg-white/80 p-2 rounded-lg border border-sky-200">
                                ⚡ <strong>Cách 1 (Dễ nhất):</strong> Sau khi gửi tin nhắn cho bot ở Bước 2, bạn chỉ cần bấm nút màu xanh <strong>"🔍 Tự Động Dò Tìm Chat ID Của Tôi"</strong> bên dưới, hệ thống sẽ tự động điền ID cho bạn!
                              </p>
                              <p className="text-gray-600">
                                🤖 <strong>Cách 2 (Dùng bot tra cứu):</strong> Mở <a href="https://t.me/myidbot" target="_blank" rel="noreferrer" className="text-sky-700 font-bold underline inline-flex items-center gap-0.5">@myidbot <ExternalLink className="w-2.5 h-2.5" /></a> hoặc <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-sky-700 font-bold underline inline-flex items-center gap-0.5">@userinfobot <ExternalLink className="w-2.5 h-2.5" /></a> → Bấm Start để xem số ID của bạn.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-[11px] text-gray-700 font-bold block mb-1">Telegram Bot Token:</span>
                      <input
                        type="text"
                        value={inputBotToken}
                        onChange={(e) => setInputBotToken(e.target.value)}
                        placeholder="VD: 7123456789:AAHk_XYZ..."
                        className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] text-gray-700 font-bold">Telegram Chat ID:</span>
                        <button
                          type="button"
                          onClick={handleAutoDetectChatId}
                          disabled={isDetectingChatId}
                          className="text-[#0068FF] hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 transition-all"
                        >
                          <Search className="w-3 h-3" />
                          <span>{isDetectingChatId ? 'Đang dò tìm...' : '🔍 Tự Động Dò Tìm Chat ID Của Tôi'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={inputChatId}
                        onChange={(e) => setInputChatId(e.target.value)}
                        placeholder="VD: 987654321 hoặc bấm nút Tự Động Dò Tìm ở trên"
                        className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none font-mono text-[11px]"
                      />
                    </div>

                    {/* Thông báo kết quả dò tìm tự động */}
                    {autoDetectMsg && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${autoDetectMsg.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}`}>
                        {autoDetectMsg.success ? <CheckCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                        <span>{autoDetectMsg.text}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleTestTelegram}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                      >
                        <MessageSquareShare className="w-3.5 h-3.5" />
                        <span>Gửi Thử Tin Nhắn Tới Telegram Của Bạn</span>
                      </button>
                    </div>

                    {telegramStatus && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${telegramStatus.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                        {telegramStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <X className="w-4 h-4 text-red-600 flex-shrink-0" />}
                        <span>{telegramStatus.message}</span>
                      </div>
                    )}
                  </div>

                  {/* PHẦN 3: CẤU HÌNH FACEBOOK FANPAGE & MESSENGER API */}
                  <div className="pt-4 border-t border-gray-100 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#0084FF] to-[#00C6FF] flex items-center justify-center text-white shadow-xs">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.727 7.195V22l3.414-1.874c.915.253 1.884.39 2.859.39 5.523 0 10-4.145 10-9.257C22 6.145 17.523 2 12 2zm1.066 12.441l-2.718-2.899-5.305 2.899 5.834-6.195 2.784 2.899 5.239-2.899-5.834 6.195z"/>
                          </svg>
                        </div>
                        <label className="font-bold text-gray-800 text-xs">
                          3. Cấu Hình Facebook Fanpage & Messenger (Meta Webhook & Chatbot):
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowFbGuide(!showFbGuide)}
                        className="text-[#0084FF] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{showFbGuide ? 'Ẩn Hướng Dẫn' : 'Hướng Dẫn Kết Nối Meta'}</span>
                        {showFbGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Toggles Bật Kênh & Tự Động Phản Hồi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-gray-50/80 rounded-2xl border border-gray-200">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={inputFbEnabled}
                          onChange={(e) => setInputFbEnabled(e.target.checked)}
                          className="w-4 h-4 rounded text-[#0084FF] focus:ring-[#0084FF]"
                        />
                        <span className="text-[11px] font-semibold text-gray-700">
                          Bật nút tư vấn Messenger trên Web
                        </span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={inputFbAutoReply}
                          onChange={(e) => setInputFbAutoReply(e.target.checked)}
                          className="w-4 h-4 rounded text-[#0084FF] focus:ring-[#0084FF]"
                        />
                        <span className="text-[11px] font-semibold text-gray-700">
                          Tự động tra cứu mã đơn FB-XXXXX
                        </span>
                      </label>
                    </div>

                    {/* BOX HƯỚNG DẪN KẾT NỐI META DEVELOPER WEBHOOK */}
                    {showFbGuide && (
                      <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl text-[11px] text-gray-700 space-y-3 animate-fade-in">
                        <strong className="text-blue-900 block font-serif text-xs">
                          📖 Hướng Dẫn Kết Nối Fanpage & Webhook Meta for Developers:
                        </strong>

                        <div className="space-y-2.5 pl-1">
                          <div className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">1</span>
                            <div>
                              <span><strong>Lấy Fanpage ID hoặc Username:</strong> Mở Fanpage của bạn trên Facebook → Sao chép Username (VD: <code>flameguardpccc</code>) hoặc ID Fanpage dán vào ô bên dưới.</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">2</span>
                            <div className="space-y-1">
                              <span><strong>Cấu hình Webhook trên Meta for Developers:</strong></span>
                              <p className="text-blue-950 bg-white/80 p-2 rounded-lg border border-blue-200 font-mono text-[10px]">
                                🌐 Callback URL: <span className="font-bold text-blue-700">{typeof window !== 'undefined' ? `${window.location.origin}/api/facebook/webhook` : 'https://flameguard.vn/api/facebook/webhook'}</span>
                              </p>
                              <p className="text-blue-950 bg-white/80 p-2 rounded-lg border border-blue-200 font-mono text-[10px]">
                                🔑 Verify Token: <span className="font-bold text-blue-700">{inputFbVerifyToken || 'flameguard_webhook_secret_2026'}</span>
                              </p>
                              <span className="text-gray-600 block text-[10px]">Trường sự kiện cần tick: <code>messages</code>, <code>messaging_postbacks</code></span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">3</span>
                            <div>
                              <span><strong>Page Access Token (Tùy chọn cho Graph Send API):</strong> Tạo mã Token truy cập trang trong Meta App để gửi tin nhắn thông báo đẩy trực tiếp tới khách hàng. Nếu để trống, hệ thống sẽ mở ứng dụng Messenger hoặc link <code>m.me</code> trực tiếp.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-gray-700 font-bold block mb-1">Facebook Page ID / Username:</span>
                        <input
                          type="text"
                          value={inputFbPageId}
                          onChange={(e) => setInputFbPageId(e.target.value)}
                          placeholder="VD: flameguardpccc"
                          className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0084FF] font-mono text-[11px]"
                        />
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          Link chat: <a href={`https://m.me/${cleanFacebookPageId(inputFbPageId)}`} target="_blank" rel="noreferrer" className="text-[#0084FF] hover:underline font-semibold">m.me/{cleanFacebookPageId(inputFbPageId)}</a>
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-700 font-bold block mb-1">Tên Hiển Thị Fanpage:</span>
                        <input
                          type="text"
                          value={inputFbPageName}
                          onChange={(e) => setInputFbPageName(e.target.value)}
                          placeholder="VD: FLAMEGUARD PRO - Thiết Bị PCCC TCVN 3890"
                          className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0084FF] text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-gray-700 font-bold block mb-1">Webhook Verify Token:</span>
                        <input
                          type="text"
                          value={inputFbVerifyToken}
                          onChange={(e) => setInputFbVerifyToken(e.target.value)}
                          placeholder="flameguard_webhook_secret_2026"
                          className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-700 font-bold block mb-1">Admin Recipient ID (PSID nhận tin - tùy chọn):</span>
                        <input
                          type="text"
                          value={inputFbRecipientId}
                          onChange={(e) => setInputFbRecipientId(e.target.value)}
                          placeholder="VD: 748920193821092"
                          className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-700 font-bold block mb-1">Meta Page Access Token (Tùy chọn):</span>
                      <input
                        type="password"
                        value={inputFbToken}
                        onChange={(e) => setInputFbToken(e.target.value)}
                        placeholder="EAABw... (Để trống nếu dùng liên kết m.me trực tiếp)"
                        className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-700 font-bold block mb-1">Tin Nhắn Chào Mừng / Phản Hồi Mặc Định:</span>
                      <textarea
                        rows="2"
                        value={inputFbWelcomeMsg}
                        onChange={(e) => setInputFbWelcomeMsg(e.target.value)}
                        placeholder="Nội dung lời chào khi khách nhắn tin vào Fanpage..."
                        className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none text-[11px]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleTestFacebook}
                        className="bg-gradient-to-r from-[#0084FF] to-[#00C6FF] hover:opacity-90 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                      >
                        <MessageSquareShare className="w-3.5 h-3.5" />
                        <span>🧪 Thử Nghiệm Kết Nối Facebook Messenger</span>
                      </button>

                      <a
                        href={`https://m.me/${cleanFacebookPageId(inputFbPageId)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs flex items-center gap-1 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Mở Chat m.me</span>
                      </a>
                    </div>

                    {facebookStatus && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${facebookStatus.success ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'bg-red-50 text-red-800 border border-red-200'} animate-fade-in`}>
                        {facebookStatus.success ? <CheckCircle2 className="w-4 h-4 text-[#0084FF] flex-shrink-0" /> : <X className="w-4 h-4 text-red-600 flex-shrink-0" />}
                        <div className="flex-1 flex items-center justify-between gap-2">
                          <span>{facebookStatus.message}</span>
                          {facebookStatus.messengerUrl && (
                            <a
                              href={facebookStatus.messengerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#0084FF] underline font-bold text-[11px] flex-shrink-0 flex items-center gap-0.5"
                            >
                              Mở Chat <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#1B3B2B] hover:bg-[#264A37] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-xs"
                  >
                    Lưu Cài Đặt Thông Báo & Kênh Chat
                  </button>

                  {saveZaloSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã lưu thành công cài đặt Zalo, Telegram & Facebook Messenger!</span>
                    </div>
                  )}
                </form>
              </div>

              {/* QR Code Zalo Cá Nhân & Thẻ Messenger & Test Âm Thanh (5 Cột) */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* Thẻ Kết Nối Facebook Fanpage Trực Quan */}
                <div className="bg-white p-5 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0084FF] to-[#00C6FF] flex items-center justify-center text-white shadow-xs">
                      <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.727 7.195V22l3.414-1.874c.915.253 1.884.39 2.859.39 5.523 0 10-4.145 10-9.257C22 6.145 17.523 2 12 2zm1.066 12.441l-2.718-2.899-5.305 2.899 5.834-6.195 2.784 2.899 5.239-2.899-5.834 6.195z"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-gray-900 text-xs truncate">{inputFbPageName || 'FLAMEGUARD PRO Fanpage'}</h5>
                      <span className="text-[10px] text-gray-500 font-mono">@{cleanFacebookPageId(inputFbPageId)}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-100 text-[11px] space-y-1.5">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Nút Messenger trên Web:</span>
                      <span className={`font-bold ${inputFbEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {inputFbEnabled ? '● Đang hiển thị' : '○ Đang ẩn'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Chatbot tra cứu đơn hàng PCCC:</span>
                      <span className={`font-bold ${inputFbAutoReply ? 'text-blue-600' : 'text-gray-400'}`}>
                        {inputFbAutoReply ? '● Tự động trả lời' : '○ Đang tắt'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Chế độ kết nối:</span>
                      <span className="font-bold text-[#0084FF]">
                        {inputFbToken ? '● Graph Send API' : '● Direct m.me Link'}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`https://m.me/${cleanFacebookPageId(inputFbPageId)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-gradient-to-r from-[#0084FF] to-[#00C6FF] hover:opacity-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <span>💬 Mở Chat Messenger Thử Nghiệm</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* QR Code Zalo Cá Nhân */}
                <div className="bg-white p-5 rounded-3xl border border-[#E8EFEA] shadow-sm flex flex-col items-center text-center space-y-3">
                  <h4 className="font-serif text-sm font-bold text-[#1B3B2B]">
                    Mã QR Kết Bạn Zalo Tư Vấn
                  </h4>

                  <div className="w-32 h-32 bg-gray-50 p-2 rounded-2xl border-2 border-dashed border-[#0068FF] shadow-xs flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://zalo.me/${shopZaloPhone.replace(/\s+/g, '')}`}
                      alt="Zalo QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">Khách quét mã sẽ kết bạn Zalo trực tiếp với chủ tiệm</span>
                </div>

                {/* Test Âm Thanh Chuông Báo */}
                <div className="bg-white p-5 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-2 text-left">
                  <strong className="text-gray-800 text-xs block">🔊 Kiểm tra âm thanh chuông báo:</strong>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Chuông Web Audio API:</span>
                    <button
                      onClick={playTestChime}
                      className="px-3 py-1.5 bg-[#1B3B2B] hover:bg-[#264A37] text-white rounded-xl text-[11px] font-bold transition-all active:scale-95 shadow-xs"
                    >
                      Phát Thử Chuông
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 4: TỒN KHO THIẾT BỊ PCCC & KHÍ NẠP DẬP LỬA */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Tab */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-heading text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span>🧯 Quản Lý Kho Thiết Bị PCCC & Khí Nạp Dập Lửa</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Kiểm soát lượng bình dập lửa, bọt Foam, phụ kiện cứu nạn, tự động trừ kho theo đơn hàng và cảnh báo khi sắp hết hàng.
                </p>
              </div>

              <button
                onClick={() => {
                  setAddInventoryForm({ name: '', total: 60, unit: 'bình' });
                  setIsAddInventoryOpen(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>+ Thêm Thiết Bị Vào Kho</span>
              </button>
            </div>

            {/* 4 Thẻ Thống Kê KPI Kho */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] text-gray-500 font-bold block">TỔNG LOẠI THIẾT BỊ / BÌNH</span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">{inventory.length}</span>
                <span className="text-[10px] text-gray-400">Sẵn sàng xuất xưởng & kiểm định</span>
              </div>

              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs">
                <span className="text-[11px] text-emerald-800 font-bold block">DỒI DÀO / AN TOÀN</span>
                <span className="text-2xl font-extrabold text-emerald-700 font-mono mt-1 block">
                  {inventory.filter(i => i.status === 'normal').length}
                </span>
                <span className="text-[10px] text-emerald-600">Đủ bình & thiết bị giao hỏa tốc</span>
              </div>

              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-xs">
                <span className="text-[11px] text-amber-800 font-bold block">SẮP HẾT HÀNG (≤ 20)</span>
                <span className="text-2xl font-extrabold text-amber-700 font-mono mt-1 block">
                  {inventory.filter(i => i.status === 'warning').length}
                </span>
                <span className="text-[10px] text-amber-600">Cần nạp sạc & nhập thêm từ nhà máy</span>
              </div>

              <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-xs">
                <span className="text-[11px] text-rose-800 font-bold block">BÁO ĐỘNG ĐỎ (≤ 5)</span>
                <span className="text-2xl font-extrabold text-rose-700 font-mono mt-1 block">
                  {inventory.filter(i => i.status === 'danger').length}
                </span>
                <span className="text-[10px] text-rose-600">Nguy cơ thiếu bình xuất xưởng</span>
              </div>
            </div>

            {/* Bảng Chi Tiết Tồn Kho */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-xs text-gray-800">Danh Mục Tồn Kho Thiết Bị & Khí Nạp PCCC</span>
                <span className="text-[11px] text-gray-500 italic">💡 Số liệu tự động cập nhật & trừ kho khi khách đặt mua thiết bị</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600 bg-[#FAF8F5] font-bold">
                      <th className="p-3.5">Tên Thiết Bị / Vật Tư PCCC</th>
                      <th className="p-3.5 text-center">Tổng Nhập Kho</th>
                      <th className="p-3.5 text-center">Đã Xuất Theo Đơn</th>
                      <th className="p-3.5">Tiến Độ Tiêu Thụ</th>
                      <th className="p-3.5 text-center">Còn Lại Trong Kho</th>
                      <th className="p-3.5 text-center">Trạng Thái</th>
                      <th className="p-3.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inventory.map((item, idx) => {
                      const consumptionPercent = Math.min(100, Math.round((Number(item.used || 0) / Math.max(1, Number(item.total || 1))) * 100));
                      return (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5">
                            <span className="font-bold text-gray-900 block text-sm">{item.name}</span>
                            <span className="text-[10px] text-gray-400">Đơn vị: {item.unit}</span>
                          </td>
                          <td className="p-3.5 text-center font-semibold text-gray-700 font-mono">
                            {item.total} {item.unit}
                          </td>
                          <td className="p-3.5 text-center font-bold text-amber-700 font-mono">
                            {item.used} {item.unit}
                          </td>
                          <td className="p-3.5 w-48">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                                <span>Tiêu thụ:</span>
                                <span>{consumptionPercent}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    consumptionPercent > 85 ? 'bg-rose-500' : consumptionPercent > 60 ? 'bg-amber-500' : 'bg-[#1B3B2B]'
                                  }`}
                                  style={{ width: `${consumptionPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`text-base font-extrabold font-mono px-3 py-1 rounded-xl ${
                              item.status === 'danger'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                : item.status === 'warning'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-[#EBF2ED] text-[#1B3B2B]'
                            }`}>
                              {item.remain} {item.unit}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            {item.status === 'danger' ? (
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full border border-rose-300">
                                🚨 Báo động đỏ (≤ 5)
                              </span>
                            ) : item.status === 'warning' ? (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full border border-amber-300">
                                ⚠️ Sắp hết hàng
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                                ✓ Dồi dào
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setRestockItem(item);
                                  setRestockQty(30);
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-all"
                                title="Nhập thêm thiết bị / nạp bình vào kho"
                              >
                                + Nhập Thêm
                              </button>

                              <button
                                onClick={() => {
                                  setEditInventoryItemData(item);
                                  setEditInventoryForm({
                                    name: item.name,
                                    total: item.total,
                                    used: item.used,
                                    unit: item.unit
                                  });
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-all"
                                title="Kiểm kê điều chỉnh số lượng"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteInventory(item.name)}
                                className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-all"
                                title="Xóa thiết bị khỏi kho"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  </div>

      {/* MODAL THÊM / SỬA THIẾT BỊ PCCC */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-gray-200 animate-fade-in my-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">
                {editingProductId ? '✏️ Chỉnh Sửa Thiết Bị PCCC' : '🧯 Thêm Thiết Bị PCCC Mới'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-white/80 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tên thiết bị PCCC *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Bình Chữa Cháy Bột ABC 4kg MFZL4"
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Tiêu chuẩn kiểm định & Mô tả ngắn *</label>
                <input
                  type="text"
                  required
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="VD: Đạt chuẩn TCVN 3890:2023, dán sẵn tem kiểm định Bộ Công An"
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Giá gốc *</label>
                  <input
                    type="number"
                    required
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mục đích / Khu vực sử dụng</label>
                  <select
                    value={formData.occasion}
                    onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none bg-white"
                  >
                    {OCCASIONS.filter(o => o.id !== 'all').map(o => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tone màu chủ đạo</label>
                  <select
                    value={formData.colorTone}
                    onChange={(e) => setFormData({ ...formData, colorTone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none bg-white"
                  >
                    {COLOR_TONES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* HÌNH ẢNH SẢN PHẨM: 3 CÁCH IMPORT ẢNH */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-gray-700 text-xs">
                    Hình ảnh thiết bị PCCC *
                  </label>
                  <div className="flex bg-gray-100 p-0.5 rounded-lg text-[10px] font-semibold text-gray-600">
                    <button
                      type="button"
                      onClick={() => setImageImportMode('upload')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        imageImportMode === 'upload' ? 'bg-white text-red-600 shadow-xs font-bold' : 'hover:text-black'
                      }`}
                    >
                      📁 Tải Từ Máy
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageImportMode('library')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        imageImportMode === 'library' ? 'bg-white text-red-600 shadow-xs font-bold' : 'hover:text-black'
                      }`}
                    >
                      🧯 Mẫu Có Sẵn
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageImportMode('url')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        imageImportMode === 'url' ? 'bg-white text-[#1B3B2B] shadow-xs font-bold' : 'hover:text-black'
                      }`}
                    >
                      🔗 Link URL
                    </button>
                  </div>
                </div>

                {/* CÁCH 1: TẢI FILE TỪ MÁY TÍNH (KÉO THẢ HOẶC CHỌN TỆP) */}
                {imageImportMode === 'upload' && (
                  <div className="relative border-2 border-dashed border-[#5C8A70] hover:border-[#1B3B2B] bg-[#FAF8F5] hover:bg-[#F4F7F5] p-4 rounded-2xl text-center transition-all cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="space-y-1.5 flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-[#EBF2ED] text-[#1B3B2B] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5 text-[#5C8A70]" />
                      </div>
                      <p className="text-xs font-bold text-[#1B3B2B]">
                        Bấm để chọn ảnh từ máy tính hoặc kéo thả vào đây
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Hỗ trợ file JPG, PNG, WEBP, HEIC (Tự động tối ưu)
                      </p>
                    </div>
                  </div>
                )}

                {/* CÁCH 2: CHỌN TỪ THƯ VIỆN MẪU XƯỞNG HOA CÓ SẴN */}
                {imageImportMode === 'library' && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-500 font-semibold block">Click vào ảnh mẫu bạn muốn áp dụng:</span>
                    <div className="grid grid-cols-3 gap-2 p-2 bg-[#FAF8F5] rounded-2xl border border-gray-200 max-h-40 overflow-y-auto">
                      {PRESET_FLOWER_PHOTOS.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => setFormData(prev => ({ ...prev, image: preset.url }))}
                          className={`relative group cursor-pointer aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
                            formData.image === preset.url ? 'border-[#1B3B2B] ring-2 ring-[#1B3B2B]/20' : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold p-1 text-center leading-tight">
                            {preset.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CÁCH 3: NHẬP LINK ẢNH TRỰC TIẾP */}
                {imageImportMode === 'url' && (
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/... hoặc dán link ảnh Web"
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B] text-xs font-medium"
                  />
                )}

                {/* KHUNG XEM TRƯỚC ẢNH THỰC TẾ (LIVE PREVIEW) */}
                {formData.image ? (
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-2xl border border-[#E8EFEA] shadow-xs">
                    <img
                      src={formData.image}
                      alt="Xem trước ảnh mẫu thiết bị"
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-[#1B3B2B] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Đã nạp ảnh thành công</span>
                      </span>
                      <span className="text-[10px] text-gray-400 block truncate mt-0.5">
                        {formData.image.startsWith('data:') ? 'Tệp ảnh từ máy tính (Data URI)' : formData.image}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Gỡ ảnh này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[10px] flex items-center gap-1.5">
                    <span>⚠️ Vui lòng chọn hoặc tải lên 1 ảnh để hiển thị ra trang chủ.</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#1B3B2B] hover:bg-[#264A37] text-white font-bold py-3 rounded-full shadow-md"
                >
                  {editingProductId ? 'Lưu Thay Đổi' : '+ Đăng Bán Lên Cửa Hàng'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 border border-gray-300 text-gray-600 rounded-full"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẠO MÃ GIẢM GIÁ / VOUCHER */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in border border-gray-100">
            <div className="bg-gradient-to-r from-[#1B3B2B] to-[#264A37] text-white p-5 flex items-center justify-between">
              <h4 className="font-serif text-lg font-bold flex items-center gap-2">
                <span>🏷️ Thêm Mã Giảm Giá Mới</span>
              </h4>
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateDiscount}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs"
            >
              <div>
                <label className="block font-bold text-gray-700 mb-1">Mã Giảm Giá (Code) *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={discountFormData.code}
                    onChange={(e) => setDiscountFormData({ ...discountFormData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: ANTOAN2026"
                    className="flex-1 p-2.5 rounded-xl border border-gray-300 focus:outline-none uppercase font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const randomCode = `PCCC${Math.floor(10 + Math.random() * 90)}`;
                      setDiscountFormData({ ...discountFormData, code: randomCode });
                    }}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                  >
                    🎲 Tự Sinh
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Tên chương trình ưu đãi *</label>
                <input
                  type="text"
                  required
                  value={discountFormData.name}
                  onChange={(e) => setDiscountFormData({ ...discountFormData, name: e.target.value })}
                  placeholder="VD: Tri ân khách hàng thân thiết"
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Loại giảm giá</label>
                  <select
                    value={discountFormData.type}
                    onChange={(e) => setDiscountFormData({ ...discountFormData, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none bg-white font-semibold"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                    <option value="shipping">Miễn phí ship (35k)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {discountFormData.type === 'percentage' ? 'Mức giảm (%) *' : 'Số tiền giảm (đ) *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={discountFormData.value}
                    onChange={(e) => setDiscountFormData({ ...discountFormData, value: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {discountFormData.type === 'percentage' && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mức giảm tối đa (VNĐ)</label>
                  <input
                    type="number"
                    value={discountFormData.maxDiscount}
                    onChange={(e) => setDiscountFormData({ ...discountFormData, maxDiscount: e.target.value })}
                    placeholder="VD: 100000"
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Đơn tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    value={discountFormData.minOrderValue}
                    onChange={(e) => setDiscountFormData({ ...discountFormData, minOrderValue: e.target.value })}
                    placeholder="VD: 400000"
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Giới hạn số lượt</label>
                  <input
                    type="number"
                    value={discountFormData.usageLimit}
                    onChange={(e) => setDiscountFormData({ ...discountFormData, usageLimit: e.target.value })}
                    placeholder="VD: 100"
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Hạn sử dụng</label>
                <input
                  type="date"
                  value={discountFormData.expiresAt}
                  onChange={(e) => setDiscountFormData({ ...discountFormData, expiresAt: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#1B3B2B] hover:bg-[#264A37] text-white font-bold py-3 rounded-full shadow-md"
                >
                  + Phát Hành Mã Voucher
                </button>
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="px-5 border border-gray-300 text-gray-600 rounded-full"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHỤP / TẢI ẢNH THIẾT BỊ & ĐỒNG HỒ ÁP SUẤT ĐỂ GỬI DUYỆT */}
      {proofModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-gray-200 animate-fade-in my-auto text-[#222523]">
            {/* Header Modal */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold">
                    Chụp & Cập Nhật Ảnh Đồng Hồ Áp Suất & Tem BCA
                  </h3>
                  <p className="text-[11px] text-red-300">
                    Đơn hàng: #{proofModalOrder.orderCode || proofModalOrder.id} • {proofModalOrder.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProofModalOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSaveProofPhoto} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
              
              {/* Thông tin đơn */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">THIẾT BỊ KHÁCH ĐẶT:</span>
                  <strong className="text-slate-900 text-sm font-heading">{proofModalOrder.productName}</strong>
                </div>
                <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-md border border-red-200">
                  ⏱️ {proofModalOrder.deliverySlot}
                </span>
              </div>

              {/* 3 Tabs chọn nguồn ảnh */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  📸 Nguồn Tải Ảnh Chụp Đồng Hồ Áp Suất & Tem BCA:
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setProofTabMode('upload')}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                      proofTabMode === 'upload' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải Từ Máy / Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProofTabMode('preset')}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                      proofTabMode === 'preset' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Kho Mẫu Chuẩn</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProofTabMode('url')}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                      proofTabMode === 'url' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🔗 Link URL</span>
                  </button>
                </div>

                {/* Tab 1: Upload File Từ Máy Tính / Camera */}
                {proofTabMode === 'upload' && (
                  <div className="p-4 border-2 border-dashed border-red-400 hover:border-red-600 rounded-2xl text-center bg-red-50/40 space-y-2 cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleProofFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-slate-900 block font-bold">Bấm để chụp ảnh đồng hồ vạch xanh hoặc chọn file</strong>
                      <p className="text-[11px] text-slate-500">Chụp rõ kim chỉ áp suất và tem kiểm định QR Bộ Công An</p>
                    </div>
                  </div>
                )}

                {/* Tab 2: Chọn từ thư viện xưởng studio */}
                {proofTabMode === 'preset' && (
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_FLOWER_PHOTOS.map((p, idx) => (
                      <div
                        key={idx}
                        onClick={() => setProofPhotoInput(p.url)}
                        className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all group relative ${
                          proofPhotoInput === p.url ? 'border-red-600 ring-2 ring-red-600' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img src={p.url} alt={p.name} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform" />
                        <div className="p-1.5 bg-white text-[10px] font-bold text-slate-800 truncate text-center">
                          {p.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 3: Nhập URL Trực Tiếp */}
                {proofTabMode === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={proofPhotoInput}
                      onChange={(e) => setProofPhotoInput(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-red-600 font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              {/* LIVE PHOTO PREVIEW BOX */}
              {proofPhotoInput && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Xem trước ảnh áp suất sẽ gửi cho khách duyệt:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setProofPhotoInput('')}
                      className="text-red-600 hover:text-red-800 text-[11px] font-bold"
                    >
                      ✕ Gỡ ảnh
                    </button>
                  </div>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm relative bg-slate-900">
                    <img src={proofPhotoInput} alt="Preview ảnh áp suất thật" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md border border-slate-700">
                      Đo lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • Trạm kiểm định FLAMEGUARD
                    </div>
                  </div>
                </div>
              )}

              {/* Ghi chú kỹ sư kiểm định gửi kèm cho khách */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  💬 Ghi chú từ kỹ sư kiểm định PCCC:
                </label>
                <input
                  type="text"
                  value={proofNoteInput}
                  onChange={(e) => setProofNoteInput(e.target.value)}
                  placeholder="VD: Áp suất vạch xanh 1.35 MPa đạt chuẩn, tem niêm phong chì Bộ Công An nguyên vẹn..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-red-600 font-medium"
                />
              </div>

              {/* Nút Submit */}
              <div className="pt-3 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  disabled={!proofPhotoInput}
                  className="flex-1 bg-[#1B3B2B] hover:bg-[#264A37] disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Xác Nhận Ảnh Thật & Gửi Khách Duyệt (Realtime)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProofModalOrder(null)}
                  className="px-5 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-100 font-bold"
                >
                  Đóng
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: THÊM THIẾT BỊ NGUYÊN LIỆU MỚI VÀO KHO */}
      {isAddInventoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-200 animate-fade-in my-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                <span>🧯 Thêm Thiết Bị Vào Kho</span>
              </h3>
              <button onClick={() => setIsAddInventoryOpen(false)} className="text-white/80 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateInventoryItem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tên thiết bị / vật tư PCCC *</label>
                <input
                  type="text"
                  required
                  value={addInventoryForm.name}
                  onChange={(e) => setAddInventoryForm({ ...addInventoryForm, name: e.target.value })}
                  placeholder="VD: Bình Bột ABC 4kg (Tem BCA)"
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-red-600 font-semibold text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Số lượng nhập kho *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={addInventoryForm.total}
                    onChange={(e) => setAddInventoryForm({ ...addInventoryForm, total: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Đơn vị tính *</label>
                  <select
                    value={addInventoryForm.unit}
                    onChange={(e) => setAddInventoryForm({ ...addInventoryForm, unit: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none bg-white font-semibold"
                  >
                    <option value="bình">bình</option>
                    <option value="cuộn">cuộn</option>
                    <option value="bộ">bộ</option>
                    <option value="chiếc">chiếc</option>
                    <option value="cái">cái</option>
                    <option value="hộp">hộp</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Lưu Vào Kho PCCC</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddInventoryOpen(false)}
                  className="px-4 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-100 font-bold"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NHẬP THÊM HÀNG (RESTOCK) */}
      {restockItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-200 animate-fade-in my-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold flex items-center gap-2">
                <span>📦 Nhập Thêm Thiết Bị PCCC</span>
              </h3>
              <button onClick={() => setRestockItem(null)} className="text-white/80 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleRestockSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[11px]">Thiết bị đang nhập thêm:</span>
                <strong className="text-slate-900 text-sm block">{restockItem.name}</strong>
                <span className="text-[11px] text-gray-600">Hiện còn: <strong>{restockItem.remain} {restockItem.unit}</strong> (Đã xuất {restockItem.used})</span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Số lượng {restockItem.unit} nhập thêm hôm nay:
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none font-mono text-base font-extrabold text-red-600"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[10, 20, 30, 50, 100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRestockQty(val)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold ${
                      Number(restockQty) === val ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    +{val} {restockItem.unit}
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Xác Nhận Nhập Thêm</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="px-4 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-100 font-bold"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: KIỂM KÊ & ĐIỀU CHỈNH KHO THỰC TẾ */}
      {editInventoryItemData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-200 animate-fade-in my-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold flex items-center gap-2">
                <span>✏️ Kiểm Kê & Sửa Số Lượng Thiết Bị</span>
              </h3>
              <button onClick={() => setEditInventoryItemData(null)} className="text-white/80 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleEditInventorySubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tên thiết bị PCCC *</label>
                <input
                  type="text"
                  required
                  value={editInventoryForm.name}
                  onChange={(e) => setEditInventoryForm({ ...editInventoryForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tổng nhập (Total) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editInventoryForm.total}
                    onChange={(e) => setEditInventoryForm({ ...editInventoryForm, total: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Đã cắm vào đơn (Used) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editInventoryForm.used}
                    onChange={(e) => setEditInventoryForm({ ...editInventoryForm, used: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-semibold">Tồn kho tính toán lại:</span>
                <span className="text-base font-extrabold text-[#1B3B2B] font-mono">
                  {Math.max(0, Number(editInventoryForm.total || 0) - Number(editInventoryForm.used || 0))} {editInventoryForm.unit}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#1B3B2B] hover:bg-[#264A37] text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Lưu Cập Nhật Kiểm Kê</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditInventoryItemData(null)}
                  className="px-4 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-100 font-bold"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal In Biên Bản Nghiệm Thu & Phiếu Giao Thiết Bị */}
      <PrintInvoiceModal
        isOpen={Boolean(printOrder)}
        onClose={() => setPrintOrder(null)}
        order={printOrder}
      />

    </div>
  );
};
