import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  ShoppingBag, 
  Heart, 
  Sparkles, 
  Search, 
  Smartphone, 
  PackageCheck,
  Menu,
  X
} from 'lucide-react';

export const Header = () => {
  const { 
    cart, 
    wishlist, 
    setIsCartOpen, 
    setIsAIFloristOpen, 
    setIsTrackingOpen,
    isZaloMode,
    setIsZaloMode,
    searchQuery,
    setSearchQuery,
    activeOrder,
    shopZaloPhone
  } = useShop();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner Thông Báo Khẩn Cấp - Chuẩn Cục Cảnh Sát PCCC BCA */}
      <div className="bg-[#0F172A] text-slate-200 text-[10px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-4 border-b border-slate-800 shadow-inner overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-1.5 sm:gap-2">
          
          {/* Thông tin Cứu Hộ & Thẩm Duyệt */}
          <div className="flex items-center gap-2 min-w-0 max-w-full overflow-hidden text-center md:text-left">
            <span className="flex items-center gap-1.5 font-bold text-amber-400 truncate">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping flex-shrink-0" />
              <span className="text-red-400 flex-shrink-0">🚨</span>
              <strong className="tracking-tight uppercase">CỨU HỘ & TƯ VẤN:</strong>
              <a href="tel:0843066604" className="text-white hover:text-amber-300 font-mono underline decoration-amber-400 underline-offset-2 flex-shrink-0">0843.066.604</a>
              <span className="hidden xl:inline text-slate-400 font-normal truncate">• GIAO HỎA TỐC 60 PHÚT NỘI THÀNH • ĐẦY ĐỦ TEM BCA & BIÊN BẢN NGHIỆM THU</span>
            </span>
          </div>

          {/* Quick Action Buttons Kỹ Thuật (Hiển thị từ sm trở lên để chống tràn mobile) */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsTrackingOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 transition-all"
              title="Tra cứu hồ sơ và tem kiểm định Cục PCCC"
            >
              <span>🛡️ Tra Cứu Tem Kiểm Định</span>
            </button>

            <button
              onClick={() => setIsAIFloristOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 transition-all"
              title="Tính toán số lượng bình và thiết bị theo diện tích m² TCVN 3890"
            >
              <span>📐 Định Mức TCVN 3890</span>
            </button>

            <a
              href="/Huong_Dan_Su_Dung_PCCC.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
              title="Xem cẩm nang an toàn & hướng dẫn sử dụng thiết bị PCCC (.PDF)"
            >
              <span>📖 Cẩm Nang (.PDF)</span>
            </a>
          </div>

        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Logo Thương Hiệu Industrial Safety */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-700 hover:text-red-600 flex-shrink-0"
            aria-label="Mở menu di động"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
          
          <a href="#" className="flex items-center gap-2 sm:gap-2.5 group min-w-0" aria-label="Trang chủ FLAMEGUARD PRO">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-slate-900 flex items-center justify-center text-white shadow-md shadow-red-600/25 border border-red-500/40 group-hover:scale-105 transition-transform flex-shrink-0">
              <span className="text-base sm:text-xl">🧯</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span className="font-extrabold text-base sm:text-2xl tracking-tight text-slate-900 leading-none uppercase font-heading truncate">
                  FLAMEGUARD<span className="text-red-600">PRO</span>
                </span>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] bg-red-100 text-red-700 font-mono font-bold px-1 sm:px-1.5 py-0.5 rounded border border-red-200 flex-shrink-0">
                  TCVN 3890
                </span>
              </div>
              <span className="hidden md:block text-[9px] uppercase tracking-[0.16em] text-slate-500 font-bold mt-1 font-sans truncate">
                Hệ Thống Thiết Bị PCCC & CNCH Chuẩn Kiểm Định BCA
              </span>
            </div>
          </a>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden lg:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm thiết bị (Bình bột 4kg, Khí CO2, Mặt nạ chống khói, Thang dây...)"
              aria-label="Tìm kiếm thiết bị cứu hỏa"
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:bg-white transition-all font-sans"
            />
          </div>
        </div>

        {/* Action Buttons Cho Khách Hàng */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          
          {/* Nút Trợ lý AI Thẩm Định Rủi Ro PCCC */}
          <button
            onClick={() => setIsAIFloristOpen(true)}
            className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 group flex-shrink-0"
            aria-label="Trợ lý thẩm định rủi ro PCCC bằng AI"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Thẩm Định PCCC AI</span>
            <span className="sm:hidden">AI PCCC</span>
          </button>

          {/* Theo dõi đơn hàng & Kiểm định */}
          <button
            onClick={() => setIsTrackingOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-300 hover:border-red-600 text-slate-700 hover:text-red-600 bg-white hover:bg-red-50/50 transition-all relative flex-shrink-0"
            title="Tra cứu tình trạng đơn hàng & Ảnh kiểm định thiết bị"
            aria-label="Tra cứu đơn hàng PCCC"
          >
            <PackageCheck className="w-4 h-4 text-red-600" />
            <span className="hidden md:inline">Tra cứu đơn hàng</span>
            {activeOrder && (
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping absolute top-1 right-1" />
            )}
          </button>

          {/* Yêu thích */}
          <button
            className="p-2 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-xl transition-all relative hidden sm:flex border border-transparent hover:border-slate-200"
            title="Danh sách yêu thích"
            aria-label={`Danh sách yêu thích (${wishlist.length} mẫu)`}
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            {wishlist.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Giỏ hàng */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 bg-red-50 hover:bg-red-100/80 text-slate-900 border border-red-200 hover:border-red-300 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-all active:scale-95 relative flex-shrink-0"
            aria-label={`Giỏ hàng (${cartItemCount} món)`}
          >
            <ShoppingBag className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold font-mono">{cartItemCount}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-4 shadow-lg animate-fade-in">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm thiết bị theo tên, quy cách (Bột 4kg, CO2 3kg...)"
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-red-600 font-sans"
            />
          </div>

          {/* Quick Action Badges on Mobile */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                setIsZaloMode(!isZaloMode);
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                isZaloMode 
                  ? 'bg-[#0068FF] text-white border-[#0068FF]' 
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isZaloMode ? '⚡ Zalo Mini App' : 'Mô Phỏng Zalo'}</span>
            </button>

            <button
              onClick={() => {
                setIsTrackingOpen(true);
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-slate-50 text-slate-700 border border-slate-200"
            >
              <PackageCheck className="w-3.5 h-3.5 text-red-600" />
              <span>Kiểm Tra Đơn Hàng</span>
            </button>
          </div>

          <div className="flex flex-col gap-1 text-xs font-medium text-slate-800 pt-2 border-t border-gray-100">
            <a href="#catalog" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-2 rounded-lg hover:bg-gray-50 flex items-center justify-between">
              <span>🧯 Tất cả thiết bị PCCC sẵn sàng giao</span>
              <span className="text-gray-400">→</span>
            </a>
            <a href="#catalog" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-2 rounded-lg hover:bg-gray-50 flex items-center justify-between">
              <span>🏠 Thiết bị PCCC gia đình & chung cư</span>
              <span className="text-gray-400">→</span>
            </a>
            <a href="#catalog" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-2 rounded-lg hover:bg-gray-50 flex items-center justify-between">
              <span>🏭 Giải pháp nhà xưởng & văn phòng TCVN 3890</span>
              <span className="text-gray-400">→</span>
            </a>
            <a href="#reviews-section" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-2 rounded-lg hover:bg-gray-50 flex items-center justify-between">
              <span>⭐ Cảm nhận khách hàng thực tế</span>
              <span className="text-gray-400">→</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
