import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { BOUQUET_SIZES, WRAPPING_PAPERS, ADDONS } from '../data/flowers';
import { CardPreviewer } from './CardPreviewer';
import { openPersonalZaloChat } from '../services/zaloService';
import { generateMessengerProductInquiry } from '../services/facebookService';
import { Star, ShoppingBag, ShieldCheck, Truck, Gauge, Check, MessageCircle } from 'lucide-react';
import { ZaloIcon } from './ZaloIcon';

export const ProductDetailModal = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart, shopZaloPhone, facebookSettings } = useShop();

  if (!quickViewProduct) return null;

  const [selectedSize, setSelectedSize] = useState(BOUQUET_SIZES[0]);
  const [selectedWrapper, setSelectedWrapper] = useState(WRAPPING_PAPERS[0]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [cardMessage, setCardMessage] = useState('VỊ TRÍ LẮP ĐẶT: Cạnh cửa chính ra vào. HƯỚNG DẪN 4 BƯỚC: Giật chốt hãm - Hướng vòi phun vào gốc lửa - Giữ cự ly 1.5m - Bóp van dập lửa liên tục.');
  const [senderSign, setSenderSign] = useState('Cán bộ phụ trách an toàn');

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => 
      prev.some(a => a.id === addon.id)
      ? prev.filter(a => a.id !== addon.id)
      : [...prev, addon]
    );
  };

  const calculatedBasePrice = Math.round(quickViewProduct.price * selectedSize.priceMultiplier);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const finalPrice = calculatedBasePrice + addonsTotal;

  const handleAddToCart = () => {
    addToCart(quickViewProduct, {
      size: selectedSize,
      wrapper: selectedWrapper,
      cardMessage,
      senderSign,
      addOns: selectedAddons,
    });
    setQuickViewProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 my-auto animate-fade-in">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping flex-shrink-0" />
            <span className="font-heading text-base sm:text-lg font-bold text-white truncate">Cấu Hình Thiết Bị PCCC</span>
          </div>
          <button 
            onClick={() => setQuickViewProduct(null)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all text-sm font-bold flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
          
          {/* CỘT TRÁI: ẢNH & THÔNG TIN CỐT LÕI (5 Cột) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-[4/3] sm:aspect-[4/5] rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-100">
              <img
                src={quickViewProduct.image}
                alt={quickViewProduct.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-amber-400 font-mono text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-700">
                🛡️ Tem BCA & Áp Suất Đạt Chuẩn
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold mb-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{quickViewProduct.rating}</span>
                <span className="text-slate-400">({quickViewProduct.reviewsCount} công trình đã lắp đặt)</span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                {quickViewProduct.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {quickViewProduct.subtitle}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>Tem kiểm định Cục Cảnh sát PCCC & CNCH kèm mã QR tra cứu</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Gauge className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Chụp ảnh đồng hồ áp suất vạch xanh gửi khách trước khi bàn giao</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Giao hỏa tốc 60 - 90 phút hoặc bàn giao kèm biên bản nghiệm thu</span>
              </div>
            </div>

            {/* Quy trình thao tác 4 bước P-A-S-S chuẩn PCCC */}
            <div className="p-3.5 bg-red-950/90 text-white rounded-xl border border-red-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block font-mono">
                ⚡ QUY TRÌNH THAO TÁC 4 BƯỚC P-A-S-S:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-red-900/60">
                  <strong className="text-red-400 block font-mono">1. PULL (Rút)</strong>
                  <span className="text-slate-300">Giật chốt hãm kẹp chì an toàn</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-red-900/60">
                  <strong className="text-amber-400 block font-mono">2. AIM (Hướng)</strong>
                  <span className="text-slate-300">Hướng vòi vào gốc đám cháy</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-red-900/60">
                  <strong className="text-emerald-400 block font-mono">3. SQUEEZE (Bóp)</strong>
                  <span className="text-slate-300">Bóp cò van xả dứt khoát</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-red-900/60">
                  <strong className="text-blue-400 block font-mono">4. SWEEP (Quét)</strong>
                  <span className="text-slate-300">Quét vòi qua lại dập ngọn lửa</span>
                </div>
              </div>
            </div>

            {/* Bản vẽ & Cấu tạo kỹ thuật giải phẫu */}
            <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span>📐</span> Bản Vẽ & Cấu Tạo Kỹ Thuật:
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border">TCVN 7026</span>
              </div>
              <ul className="text-[11px] space-y-1 text-slate-600">
                <li className="flex items-start gap-1.5">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong>Thân bình:</strong> Thép cán nguội chịu áp lực phá hủy &gt; 2.5 MPa, sơn tĩnh điện chống tia UV.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong>Cụm van xả:</strong> Đồng thau mạ niken nguyên khối kèm chốt hãm kẹp chì niêm phong BCA.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong>Đồng hồ áp kế:</strong> Hiển thị 3 dải màu (Đỏ thiếu áp • Xanh an toàn 1.2-1.4 MPa • Vàng quá áp).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong>Loa/Vòi phun:</strong> Nhựa kỹ thuật EPDM chịu nhiệt cao, cách điện an toàn lên tới 1000V.</span>
                </li>
              </ul>

              {/* Nút tải PDF hồ sơ kiểm định */}
              <a
                href="/Huong_Dan_Su_Dung_PCCC.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 py-2 px-3 bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>📥 Tải Hồ Sơ Kiểm Định CO/CQ & Hướng Dẫn (.PDF)</span>
              </a>
            </div>
          </div>

          {/* CỘT PHẢI: TRÌNH TÙY BIẾN DUNG TÍCH, GIÁ TREO & PHỤ KIỆN (7 Cột) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Chọn Quy Cách / Dung Tích */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                1. Chọn Quy Cách / Tải Trọng Thiết Bị:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {BOUQUET_SIZES.map((sz) => {
                  const isSelected = selectedSize.id === sz.id;
                  const priceForSize = Math.round(quickViewProduct.price * sz.priceMultiplier);
                  return (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'border-red-600 bg-red-50/60 ring-2 ring-red-600/20 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="block text-xs font-bold text-slate-900">{sz.name}</span>
                      <span className="block text-[11px] text-slate-500 my-1">{sz.desc}</span>
                      <span className="block text-xs font-black text-red-600 font-mono">
                        {priceForSize.toLocaleString('vi-VN')}đ
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Chọn Phương Thức Lắp Đặt / Kệ Treo */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                2. Chọn Kệ Đặt / Giá Treo Chuyên Dụng:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WRAPPING_PAPERS.map((wp) => {
                  const isSelected = selectedWrapper.id === wp.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => setSelectedWrapper(wp)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-all ${
                        isSelected 
                          ? 'border-slate-900 bg-slate-900 text-white font-bold shadow-xs' 
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span 
                        className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0" 
                        style={{ backgroundColor: wp.color }}
                      />
                      <span className="truncate">{wp.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Thẻ Hướng Dẫn Thao Tác & Biên Bản */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                3. Thẻ Hướng Dẫn Thao Tác & Vị Trí Lắp Đặt:
              </label>
              <CardPreviewer
                cardMessage={cardMessage}
                setCardMessage={setCardMessage}
                senderSign={senderSign}
                setSenderSign={setSenderSign}
                currentOccasion={quickViewProduct.occasion}
              />
            </div>

            {/* 4. Thiết Bị An Toàn Bổ Sung (Addons) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                4. Trang Bị Thêm Thiết Bị Cứu Hộ Thiết Yếu (Khuyên Dùng):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ADDONS.map((addon) => {
                  const isChecked = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <label
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-red-600 bg-red-50/40 ring-1 ring-red-500' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2.5">
                        <span className="text-xl shrink-0">{addon.img}</span>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-900 block leading-tight">{addon.name}</span>
                          <span className="text-red-600 font-mono font-bold block mt-0.5">+{addon.price.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center border transition-all ${
                        isChecked ? 'bg-red-600 border-red-600 text-white shadow-xs' : 'border-slate-300 bg-slate-50/60'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Footer Nút Thêm Giỏ Hàng & Tính Giá */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 block">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-red-600 font-mono">
                  {finalPrice.toLocaleString('vi-VN')}đ
                </span>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                {/* Nút Chat Messenger */}
                {facebookSettings?.isEnabled !== false && (
                  <button
                    type="button"
                    onClick={() => generateMessengerProductInquiry(facebookSettings?.pageId, {
                      name: `${quickViewProduct.name} (${selectedSize.name})`,
                      price: finalPrice
                    })}
                    className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
                    title="Tư vấn thiết bị này qua Facebook Messenger"
                  >
                    <MessageCircle className="w-4 h-4 text-[#0084FF]" />
                    <span>Messenger</span>
                  </button>
                )}

                {/* Nút Tư Vấn Zalo */}
                <button
                  type="button"
                  onClick={() => {
                    openPersonalZaloChat(
                      shopZaloPhone,
                      `Chào kỹ sư FLAMEGUARD PRO, tôi muốn tư vấn về thiết bị "${quickViewProduct.name}" (Quy cách: ${selectedSize.name}, Giá: ${finalPrice.toLocaleString('vi-VN')}đ)`
                    );
                  }}
                  className="px-3.5 py-3 bg-blue-50 hover:bg-blue-100 text-[#0068FF] border border-blue-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer"
                  title={`Tư vấn thiết bị qua Zalo (${shopZaloPhone})`}
                >
                  <ZaloIcon className="w-4 h-4 shrink-0 rounded-xs" />
                  <span>Liên Hệ Zalo</span>
                </button>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-5 py-3.5 rounded-xl shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4 text-white" />
                  <span>Thêm Vào Đơn Hàng</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
