import React, { useState, useMemo, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { SHOP_CATEGORIES, WRAPPING_PAPERS } from '../data/flowers';
import { 
  ShieldCheck, 
  Star, 
  Phone, 
  ShoppingBag, 
  Check, 
  Truck, 
  RotateCcw, 
  FileText, 
  Share2, 
  Copy, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Gauge, 
  Zap, 
  Heart, 
  ExternalLink, 
  Eye, 
  Flame,
  Clock,
  BadgeCheck,
  Tag,
  Headphones
} from 'lucide-react';
import { ZaloIcon } from './ZaloIcon';
import { openPersonalZaloChat, formatProductZaloMessage } from '../services/zaloService';
import { getProductSlug, getProductUrl, matchProduct } from '../utils/slugify';

// Bảng thông số kỹ thuật chi tiết theo ID sản phẩm chuẩn PCCC
const getDetailedProductSpecs = (product) => {
  const pId = product?.id || '';
  if (pId === 'fire-01') {
    return {
      agent: 'Bột hóa chất khô ABC Silicon hóa (40% MAP)',
      capacity: '4.0 kg (± 0.2 kg)',
      range: '3.5m - 5.0m',
      dischargeTime: '≥ 9 giây',
      pressure: '1.2 - 1.4 MPa (Vạch Xanh chuẩn TCVN)',
      testPressure: '2.5 MPa (Thử thủy lực vỏ bình)',
      temperature: '-20°C đến +55°C',
      fireClass: 'Class A (Chất rắn) • Class B (Chất lỏng) • Class C (Chất khí) • Cháy điện < 1000V',
      warranty: '12 tháng chính hãng • Hạn nạp sạc 2 năm',
      inspection: 'Tem kiểm định Cục CS PCCC & CNCH BCA + Mã QR điện tử tra cứu',
      origin: 'Nhập khẩu chính ngạch • CO/CQ Đầy đủ'
    };
  }
  if (pId === 'fire-02') {
    return {
      agent: 'Khí CO2 hóa lỏng nguyên chất (-79°C)',
      capacity: '3.0 kg (± 0.15 kg)',
      range: '2.0m - 3.0m',
      dischargeTime: '≥ 8 giây',
      pressure: 'Khí nén hóa lỏng cao áp đúc',
      testPressure: '25.0 MPa (Thân thép đúc nguyên khối)',
      temperature: '-10°C đến +55°C',
      fireClass: 'Class B (Chất lỏng) • Class C (Khí) • Cháy điện tử, vi mạch, phòng Server',
      warranty: '24 tháng chính hãng • Không cặn bẩn vi mạch',
      inspection: 'Tem kiểm định Cục CS PCCC & CNCH BCA',
      origin: 'Nhập khẩu chính ngạch • CO/CQ Đầy đủ'
    };
  }
  if (pId === 'fire-03') {
    return {
      agent: 'Phin lọc than hoạt tính 3 tầng kết hợp bông tĩnh điện',
      capacity: 'Bảo vệ đường thở liên tục > 40 phút',
      range: 'Lọc 99% khí độc CO, HCN, SO2, khói đặc và bụi tro',
      dischargeTime: 'Hút chân không bảo quản 3 năm',
      pressure: 'Độ cản hít vào ≤ 800 Pa • Độ cản thở ra ≤ 300 Pa',
      testPressure: 'Vải tráng bạc phản xạ nhiệt 800°C',
      temperature: 'Chịu nhiệt bức xạ bức phá 800°C trong 30 giây',
      fireClass: 'Mặt nạ thoát hiểm sinh tồn chung cư, nhà cao tầng, khách sạn',
      warranty: '36 tháng nguyên seal chân không',
      inspection: 'Chuẩn kiểm định TCVN 7338:2004',
      origin: 'Chính hãng TZL30 nguyên hộp nguyên seal'
    };
  }
  if (pId === 'fire-04') {
    return {
      agent: 'Cáp thép hàng không bọc sợi chống cháy 15 mét',
      capacity: 'Tải trọng làm việc an toàn 150 kg (Tối đa 200 kg)',
      range: 'Tương thích tầng 3 - tầng 5 (Độ dài 15m)',
      dischargeTime: 'Tốc độ hạ chậm tự động: 0.8m - 1.2m/giây',
      pressure: 'Bộ điều tốc hãm thủy lực thông minh',
      testPressure: 'Thử tải phá hủy: > 1.200 kg',
      temperature: 'Dây đai chịu nhiệt bức xạ',
      fireClass: 'Cứu hộ khẩn cấp nhà phố, biệt thự, căn hộ chung cư',
      warranty: '36 tháng chính hãng',
      inspection: 'Kiểm định an toàn tải trọng Trung tâm đo lường 3',
      origin: 'Bộ thiết bị cơ học tự hãm cao cấp'
    };
  }
  if (pId === 'fire-05') {
    return {
      agent: '100% Sợi thủy tinh mịn dệt chéo chịu nhiệt',
      capacity: 'Kích thước tiêu chuẩn 1.8m x 1.8m',
      range: 'Phủ kín chảo dầu, bếp gas, tẩm người thoát hiểm',
      dischargeTime: 'Phản ứng rút giật trong 1 giây',
      pressure: 'Độ dày 0.43mm chắc chắn',
      testPressure: 'Không bắt lửa, không sinh khói độc',
      temperature: 'Chịu nhiệt độ liên tục 550°C (Tức thời 800°C)',
      fireClass: 'Class K (Bếp ăn, dầu mỡ, nhà hàng) • Cháy ngọn lửa trùm',
      warranty: '5 năm sử dụng',
      inspection: 'Đạt chuẩn EN 1869:1997 an toàn phòng cháy',
      origin: 'Túi treo tường phản ứng nhanh'
    };
  }
  // Mặc định cho thiết bị khác
  return {
    agent: product?.meaning || 'Thiết bị an toàn PCCC chuyên dụng',
    capacity: 'Đạt chuẩn kỹ thuật theo quy định',
    range: 'Phù hợp bố trí tại nhà ở, văn phòng và cơ sở kinh doanh',
    dischargeTime: 'Kích hoạt phản ứng tức thì',
    pressure: 'Kiểm định áp suất tiêu chuẩn',
    testPressure: 'Kiểm tra kỹ thuật xuất xưởng',
    temperature: '-10°C đến +50°C',
    fireClass: 'Tiêu chuẩn PCCC Bộ Công An',
    warranty: `${product?.freshDays ? Math.round(product.freshDays / 30) : 12} tháng chính hãng`,
    inspection: 'Tem kiểm định Bộ Công An',
    origin: 'Chính hãng phân phối'
  };
};

export const ProductDetailPage = ({ productId }) => {
  const { 
    products = [],
    productsLoaded = true,
    addToCart,
    setIsCheckoutOpen, 
    shopZaloPhone, 
    brandSettings, 
    navigateTo, 
    wishlist = [], 
    toggleWishlist,
    showToast,
    reviews = []
  } = useShop();

  // Tìm sản phẩm theo id hoặc slug (ưu tiên khớp slug chuẩn SEO theo tên)
  const product = useMemo(() => {
    if (!productId) return products[0] || null;
    // Đường dẫn không khớp sản phẩm nào (ví dụ sản phẩm đã bị xóa) thì báo không tìm thấy, không hiện sản phẩm khác thay thế
    return matchProduct(products, productId)
      || products.find(p => p.id === productId || String(p.id) === String(productId))
      || null;
  }, [products, productId]);

  const [quantity, setQuantity] = useState(1);
  const [selectedAccessory, setSelectedAccessory] = useState(null);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'guide' | 'cert'
  const [copiedLink, setCopiedLink] = useState(false);

  // Cuộn lên đầu trang khi mở trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  // Cập nhật title trình duyệt
  useEffect(() => {
    if (product && typeof document !== 'undefined') {
      const brandName = brandSettings?.brandName || 'FLAMEGUARD PRO';
      document.title = `${product.name} | ${brandName}`;
    }
  }, [product, brandSettings]);

  // Sản phẩm liên quan (hook phải đặt trước mọi return sớm)
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.id !== product.id && (p.category === product.category || p.occasion === product.occasion))
      .slice(0, 4);
  }, [products, product]);

  // Lấy link chia sẻ / chạy Ads ưu tiên slug SEO theo tên sản phẩm
  const productShareUrl = useMemo(() => {
    if (!product) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pcccphatantam.com';
    return getProductUrl(product, origin);
  }, [product]);

  if (!product && !productsLoaded) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center text-sm text-slate-500" role="status">
        Đang tải thông tin thiết bị...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 animate-bounce" />
        <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy thiết bị PCCC</h2>
        <p className="text-sm text-slate-500 max-w-md">Thiết bị có thể đã được cập nhật mã mới hoặc đã tạm dừng phân phối.</p>
        <button
          onClick={() => navigateTo('/')}
          className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          Trở về Danh Mục Sản Phẩm
        </button>
      </div>
    );
  }

  const isLiked = wishlist.includes(product.id);
  const specs = getDetailedProductSpecs(product);
  const categoryInfo = SHOP_CATEGORIES.find(c => c.id === product.category) || SHOP_CATEGORIES[0];
  
  // Tính toán giá và khuyến mãi
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  
  const savedAmount = product.originalPrice && product.originalPrice > product.price
    ? (product.originalPrice - product.price)
    : 0;

  const accessoryPrice = selectedAccessory ? selectedAccessory.price : 0;
  const unitPrice = product.price + accessoryPrice;
  const totalPrice = unitPrice * quantity;

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(productShareUrl);
      setCopiedLink(true);
      showToast?.(`Đã sao chép link sản phẩm: ${productShareUrl}`);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // 1. CTA: MUA NGAY (Bật thẳng CheckoutModal)
  const handleBuyNow = () => {
    addToCart(product, {
      quantity,
      selectedAccessory: selectedAccessory ? selectedAccessory.name : null,
      unitPrice,
      cardMessage: `Đơn đặt nhanh qua Landing Page Ads: ${product.name} (SL: ${quantity})`
    });
    setIsCheckoutOpen(true);
  };

  // 2. CTA: THÊM VÀO GIỎ HÀNG
  const handleAddToCart = () => {
    addToCart(product, {
      quantity,
      selectedAccessory: selectedAccessory ? selectedAccessory.name : null,
      unitPrice
    });
    showToast?.(`Đã thêm ${quantity} × "${product.name}" vào giỏ hàng!`);
  };

  // 3. CTA: CHAT ZALO
  const handleZaloChat = () => {
    const phone = shopZaloPhone || brandSettings?.hotline || '0843066604';
    const message = `Chào FLAMEGUARD PRO, tôi muốn tư vấn & báo giá thiết bị: ${product.name} (Giá: ${product.price?.toLocaleString('vi-VN')}đ). Link sản phẩm: ${productShareUrl}`;
    openPersonalZaloChat(phone, message);
  };

  // 4. CTA: GỌI HOTLINE
  const cleanPhone = (shopZaloPhone || brandSettings?.hotline || '0843066604').replace(/[^0-9]/g, '');

  return (
    <div className="bg-slate-50 min-h-screen pb-24 lg:pb-16 animate-fade-in text-slate-800">
      
      {/* 1. BREADCRUMB & HEADER THANH ĐIỀU HƯỚNG */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 font-medium overflow-x-auto scrollbar-none whitespace-nowrap">
            <button 
              onClick={() => navigateTo('/')} 
              className="hover:text-red-600 transition-colors shrink-0 cursor-pointer flex items-center gap-1"
            >
              <span>Trang Chủ</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <button 
              onClick={() => navigateTo('/#catalog')} 
              className="hover:text-red-600 transition-colors shrink-0 cursor-pointer"
            >
              {categoryInfo.shortName}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-xs">
              {product.name}
            </span>
          </nav>

          {/* Nút Sao Chép Link Chạy Ads */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                copiedLink 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title="Sao chép đường dẫn sản phẩm này để gắn link bài viết hoặc chạy Ads"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span className="hidden sm:inline">{copiedLink ? 'Đã chép link Ads!' : 'Lấy Link Chạy Ads'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN PRODUCT HERO: 2 CỘT TỐI ƯU TỶ LỆ CHUYỂN ĐỔI LANDING PAGE ADS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* CỘT TRÁI (5 Cột): HÌNH ẢNH SẢN PHẨM & BADGES BẢO HÀNH */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-md group">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Dải nhãn kỹ thuật nằm dưới ảnh để không che thông tin trên ảnh thật khách đăng */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white border border-blue-400/50 flex items-center gap-1.5 font-mono">
                  <span>🛡️</span> TEM BCA KIỂM ĐỊNH 2026
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white">
                  TCVN 3890:2023
                </span>
                {discountPercent > 0 && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500 text-slate-950">
                    TIẾT KIỆM {discountPercent}%
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  <Gauge className="w-3.5 h-3.5" />
                  Áp Suất Vạch Xanh 1.2 - 1.4 MPa
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                  CO/CQ CHÍNH HÃNG
                </span>
              </div>
              <button
                onClick={() => toggleWishlist?.(product.id)}
                className="flex-shrink-0 w-11 h-11 rounded-full bg-slate-50 hover:bg-red-50 flex items-center justify-center text-slate-700 hover:text-red-600 transition-all active:scale-90 cursor-pointer"
                aria-label="Lưu thiết bị"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-600 text-red-600' : 'stroke-current'}`} />
              </button>
            </div>

            {/* Khối Cam Kết Uy Tín (Trust Badges Box) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Tem QR BCA hợp chuẩn</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold">1 Đổi 1 trong 30 ngày</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">Giao hỏa tốc 2 giờ</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-semibold">Có hóa đơn VAT & CO/CQ</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (7 Cột): NỘI DUNG, GIÁ TIỀN & BỘ NÚT CTA CHUYỂN ĐỔI ADS */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              
              {/* Category Badge & Đánh giá công trình */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                  {categoryInfo.icon} {categoryInfo.label}
                </span>

                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="ml-1">{product.rating || '4.9'}</span>
                  </div>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-medium underline">
                    {product.reviewsCount || 280} công trình & gia đình đã tin dùng
                  </span>
                </div>
              </div>

              {/* Tên sản phẩm H1 */}
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {product.name}
                </h1>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {product.subtitle}
                </p>
              </div>

              {/* HỘP GIÁ NỔI BẬT & KHUYẾN MÃI (ADS PRICE BOX) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 via-white to-orange-50 border-2 border-red-200 shadow-sm space-y-3">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-sans font-black text-3xl sm:text-4xl text-red-600 tracking-tight">
                    {product.price?.toLocaleString('vi-VN')}đ
                  </span>
                  
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-base sm:text-lg text-slate-400 line-through font-medium">
                      {product.originalPrice?.toLocaleString('vi-VN')}đ
                    </span>
                  )}

                  {savedAmount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-red-600 text-white">
                      Tiết kiệm {savedAmount.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </div>

                {/* Tình trạng kho & Ưu đãi giao hàng */}
                <div className="pt-2 border-t border-red-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Sẵn hàng tại kho (Giao ngay trong ngày)</span>
                  </div>
                  <span className="text-slate-600 font-medium">
                    🚚 Miễn phí vận chuyển cho đơn từ 2 bình trở lên
                  </span>
                </div>
              </div>

              {/* TÙY CHỌN PHỤ KIỆN / GIÁ ĐỠ ĐÍNH KÈM */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chọn Phụ Kiện Lắp Đặt Bổ Sung (Khuyên dùng):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedAccessory(null)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                      selectedAccessory === null
                        ? 'border-red-600 bg-red-50/50 text-red-950 font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>Không kèm phụ kiện</span>
                    <span className="text-slate-400">+0đ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAccessory({ name: 'Giá Treo Tường Thép Đỏ PCCC', price: 35000 })}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                      selectedAccessory?.name === 'Giá Treo Tường Thép Đỏ PCCC'
                        ? 'border-red-600 bg-red-50/50 text-red-950 font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>Giá treo tường thép PCCC</span>
                    <span className="text-red-600 font-bold">+35.000đ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAccessory({ name: 'Kệ Đặt Sàn Đôi Chống Gỉ PCCC', price: 65000 })}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between sm:col-span-2 ${
                      selectedAccessory?.name === 'Kệ Đặt Sàn Đôi Chống Gỉ PCCC'
                        ? 'border-red-600 bg-red-50/50 text-red-950 font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>Kệ đặt sàn đôi chống gỉ (Bảo vệ đáy bình chống ẩm mốc)</span>
                    <span className="text-red-600 font-bold">+65.000đ</span>
                  </button>
                </div>
              </div>

              {/* CHỌN SỐ LƯỢNG */}
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Số lượng:</span>
                <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-200 text-base font-bold transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-200 text-base font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Tổng: <strong className="text-red-600 text-sm">{totalPrice.toLocaleString('vi-VN')}đ</strong>
                </span>
              </div>

            </div>

            {/* BỘ NÚT CTA CHUYỂN ĐỔI CAO CHO CHẠY ADS (FACEBOOK, GOOGLE, ZALO ADS) */}
            <div className="pt-6 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Nút 1: MUA NGAY (7 Cột) */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="sm:col-span-7 bg-red-600 hover:bg-red-700 active:scale-98 text-white p-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/30 transition-all cursor-pointer group"
                >
                  <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>MUA NGAY - GIAO HÀNG TẬN NƠI</span>
                </button>

                {/* Nút 2: TƯ VẤN ZALO (5 Cột) */}
                <button
                  type="button"
                  onClick={handleZaloChat}
                  className="sm:col-span-5 bg-[#0068FF] hover:bg-[#0052cc] active:scale-98 text-white p-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-blue-500/30 transition-all cursor-pointer"
                >
                  <ZaloIcon className="w-5 h-5 fill-white" />
                  <span>TƯ VẤN QUA ZALO</span>
                </button>
              </div>

              {/* Nút 3: GỌI ĐIỆN & THÊM GIỎ HÀNG */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`tel:${cleanPhone}`}
                  className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Gọi Hotline: {brandSettings?.hotline || '0843.066.604'}</span>
                </a>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="p-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-slate-600" />
                  <span>Thêm Vào Giỏ Hàng</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3. CHI TIẾT KỸ THUẬT, CẨM NANG SỬ DỤNG & PHÁP LÝ PCCC */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-8 gap-2 sm:gap-6 overflow-x-auto scrollbar-none text-xs sm:text-sm font-bold">
            <button
              onClick={() => setActiveTab('specs')}
              className={`py-4 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-2 ${
                activeTab === 'specs' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Gauge className="w-4 h-4" />
              <span>Thông Số Kỹ Thuật Đạt Chuẩn</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`py-4 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-2 ${
                activeTab === 'guide' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Hướng Dẫn 4 Bước Sử Dụng (PASS)</span>
            </button>

            <button
              onClick={() => setActiveTab('cert')}
              className={`py-4 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-2 ${
                activeTab === 'cert' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Hồ Sơ Kiểm Định & Tem BCA</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-10">
            {/* TAB 1: THÔNG SỐ KỸ THUẬT */}
            {activeTab === 'specs' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-600" />
                      <span>Thông Số Dập Lửa & Áp Lực</span>
                    </h3>
                    <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                      <div className="p-3 bg-slate-50/70 flex justify-between">
                        <span className="text-slate-500">Chất dập lửa:</span>
                        <span className="font-bold text-slate-900 text-right">{specs.agent}</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="text-slate-500">Khối lượng tịnh:</span>
                        <span className="font-bold text-slate-900 text-right">{specs.capacity}</span>
                      </div>
                      <div className="p-3 bg-slate-50/70 flex justify-between">
                        <span className="text-slate-500">Tầm phun hiệu quả:</span>
                        <span className="font-bold text-slate-900 text-right">{specs.range}</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="text-slate-500">Thời gian xả liên tục:</span>
                        <span className="font-bold text-slate-900 text-right">{specs.dischargeTime}</span>
                      </div>
                      <div className="p-3 bg-slate-50/70 flex justify-between">
                        <span className="text-slate-500">Áp suất làm việc:</span>
                        <span className="font-bold text-emerald-700 text-right">{specs.pressure}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Tiêu Chuẩn Pháp Lý & Bảo Hành</span>
                    </h3>
                    <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                      <div className="p-3 bg-slate-50/70 flex justify-between">
                        <span className="text-slate-500">Tiêu chuẩn áp dụng:</span>
                        <span className="font-bold text-slate-900 text-right">TCVN 3890:2023 / BCA</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="text-slate-500">Chứng nhận kiểm định:</span>
                        <span className="font-bold text-blue-700 text-right">{specs.inspection}</span>
                      </div>
                      <div className="p-3 bg-slate-50/70 flex justify-between">
                        <span className="text-slate-500">Phạm vi đám cháy:</span>
                        <span className="font-bold text-slate-900 text-right">{specs.fireClass}</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span className="text-slate-500">Thời hạn bảo hành:</span>
                        <span className="font-bold text-emerald-700 text-right">{specs.warranty}</span>
                      </div>
                      <div className="p-3 bg-slate-50/70 flex justify-between">
                        <span className="text-slate-500">Nhiệt độ bảo quản:</span>
                        <span className="font-bold text-slate-900 text-right">{specs.temperature}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Lưu ý từ Kỹ Sư PCCC:</strong> Theo quy định PCCC mới nhất năm 2026, thiết bị phòng cháy chữa cháy phải được kiểm tra kim đồng hồ áp suất định kỳ 30 ngày/lần. Luôn đảm bảo kim đồng hồ nằm trong <strong>Vạch Xanh (1.2 - 1.4 MPa)</strong> để đạt hiệu quả dập lửa tức thì.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: HƯỚNG DẪN 4 BƯỚC PASS */}
            {activeTab === 'guide' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-sm">1</span>
                    <h4 className="font-bold text-slate-900 text-sm">P - PULL (Rút chốt)</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Giật mạnh chốt hãm an toàn kẹp chì ở cổ bình để phá niêm phong, chuẩn bị xả chất chữa cháy.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-sm">2</span>
                    <h4 className="font-bold text-slate-900 text-sm">A - AIM (Hướng vòi)</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Cầm chặt loa phun hoặc vòi dẫn, hướng thẳng đầu vòi vào <strong>GỐC NGỌN LỬA</strong> (không phun vào ngọn khói phía trên).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-sm">3</span>
                    <h4 className="font-bold text-slate-900 text-sm">S - SQUEEZE (Bóp cò)</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Đứng cách ngọn lửa 1.5m - 2.5m ở đầu hướng gió. Dùng lực bóp chặt van xả liên tục để bột/khí phun ra bao trùm đám cháy.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-sm">4</span>
                    <h4 className="font-bold text-slate-900 text-sm">S - SWEEP (Quét ngang)</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Di chuyển đầu vòi quét ngang từ trái qua phải và tiến dần lại gần gốc lửa cho đến khi đám cháy bị dập tắt hoàn toàn.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: HỒ SƠ KIỂM ĐỊNH & PHÁP LÝ */}
            {activeTab === 'cert' && (
              <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                  <h4 className="font-bold text-blue-950 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                    <span>Cam Kết Pháp Lý & Kiểm Định Nhà Nước:</span>
                  </h4>
                  <ul className="space-y-2 list-disc pl-5">
                    <li>100% thiết bị bán ra đều dán <strong>Tem Kiểm Định PCCC của Cục Cảnh Sát PCCC & CNCH - Bộ Công An</strong>.</li>
                    <li>Có mã QR Code in trên tem để khách hàng dùng điện thoại quét tra cứu trực tiếp số lô, ngày kiểm định trên cổng dữ liệu Bộ Công An.</li>
                    <li>Cung cấp đầy đủ Giấy chứng nhận xuất xứ (CO) và Giấy chứng nhận chất lượng (CQ) cho các dự án nghiệm thu công trình.</li>
                    <li>Có biên bản giao nhận và hướng dẫn kỹ thuật viên nghiệm thu tận nơi cho các doanh nghiệp, tòa nhà.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. SẢN PHẨM LIÊN QUAN / COMBO THƯỜNG MUA CÙNG */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Thiết Bị PCCC Thường Mua Cùng
              </h2>
              <p className="text-xs text-slate-500 mt-1">Trang bị đồng bộ để đảm bảo an toàn tuyệt đối cho gia đình & cơ sở</p>
            </div>
            <button
              onClick={() => navigateTo('/#catalog')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => navigateTo(getProductUrl(p))}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-red-500 p-3 sm:p-4 shadow-2xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md">
                      Tem BCA
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-red-600 transition-colors line-clamp-2">
                    {p.name}
                  </h3>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-red-600 font-bold text-xs sm:text-sm font-sans">
                    {p.price?.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-red-600 transition-colors flex items-center gap-0.5">
                    <span>Xem</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. STICKY MOBILE BOTTOM BAR (QUAN TRỌNG NHẤT KHI CHẠY ADS TRÊN SMARTPHONE) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 block font-medium">Giá khuyến mãi:</span>
          <span className="text-lg font-black text-red-600 font-sans tracking-tight">
            {totalPrice.toLocaleString('vi-VN')}đ
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleZaloChat}
            className="p-3 bg-[#0068FF] text-white rounded-xl shadow-md active:scale-95 flex items-center justify-center cursor-pointer"
            title="Chat Zalo"
          >
            <ZaloIcon className="w-5 h-5 fill-white" />
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs sm:text-sm shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>MUA NGAY</span>
          </button>
        </div>
      </div>

    </div>
  );
};
