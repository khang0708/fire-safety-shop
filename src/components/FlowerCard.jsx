import React from 'react';
import { useShop } from '../context/ShopContext';
import { Heart, Star, Plus, Eye, ShieldCheck, Gauge, CheckCircle2, Zap, Flame } from 'lucide-react';
import { openPersonalZaloChat, formatProductZaloMessage } from '../services/zaloService';
import { ZaloIcon } from './ZaloIcon';
import { getProductUrl } from '../utils/slugify';

const getSpecsForFlower = (flower) => {
  if (flower.id === 'fire-01') {
    return {
      agent: 'Bột Khô ABC 4kg',
      range: '3.5m - 5.0m',
      fireClass: 'Class A • B • C • E',
      bulkPrice: '265.000đ (khi mua ≥5 bình)',
      gaugeLabel: 'Áp suất 1.2 - 1.4 MPa',
      gaugeZone: 'normal'
    };
  }
  if (flower.id === 'fire-02') {
    return {
      agent: 'Khí CO2 Sạch 3kg',
      range: '2.0m - 3.0m',
      fireClass: 'Class B • C • E (Điện tử)',
      bulkPrice: '440.000đ (khi mua ≥3 bình)',
      gaugeLabel: 'Khí nén cao áp đúc',
      gaugeZone: 'co2'
    };
  }
  if (flower.id === 'fire-03') {
    return {
      agent: 'Phin lọc than 3 tầng',
      range: 'Bảo vệ > 40 phút',
      fireClass: 'Khói độc CO, HCN, khí cay',
      bulkPrice: '145.000đ (khi mua ≥10 cái)',
      gaugeLabel: 'Hút chân không vô trùng',
      gaugeZone: 'sealed'
    };
  }
  if (flower.id === 'fire-04') {
    return {
      agent: 'Cáp thép chống cháy',
      range: 'Hạ chậm 15m (Tầng 4-5)',
      fireClass: 'Tải an toàn 150kg',
      bulkPrice: '1.150.000đ (khi mua ≥2 bộ)',
      gaugeLabel: 'Chốt hãm thủy lực',
      gaugeZone: 'safe'
    };
  }
  if (flower.id === 'fire-05') {
    return {
      agent: 'Sợi thủy tinh mịn 550°C',
      range: 'Kích thước 1.8m x 1.8m',
      fireClass: 'Class K (Dầu mỡ, bếp)',
      bulkPrice: '165.000đ (khi mua ≥5 tấm)',
      gaugeLabel: 'Chịu nhiệt 550°C',
      gaugeZone: 'safe'
    };
  }
  if (flower.id === 'fire-06') {
    return {
      agent: 'Cảm biến quang điện',
      range: 'Quét 30m² - Pin 5 năm',
      fireClass: 'Còi hú báo cháy 85dB',
      bulkPrice: '310.000đ (khi mua ≥5 bộ)',
      gaugeLabel: 'Pin Lithium 9V test OK',
      gaugeZone: 'safe'
    };
  }
  if (flower.id === 'fire-07') {
    return {
      agent: 'Bọt Foam sinh học 6L',
      range: '4.0m - 6.0m',
      fireClass: 'Class A • B • K (Xịt người)',
      bulkPrice: '590.000đ (khi mua ≥3 bình)',
      gaugeLabel: 'Áp suất vạch xanh đạt',
      gaugeZone: 'normal'
    };
  }
  return {
    agent: flower.flowerTypes?.[0] || 'Thiết bị PCCC',
    range: '2.5m - 4.0m',
    fireClass: 'Class A • B • C',
    bulkPrice: 'Chiết khấu 10% số lượng',
    gaugeLabel: 'Đạt chuẩn kiểm định',
    gaugeZone: 'normal'
  };
};

export const FlowerCard = ({ flower }) => {
  const { 
    wishlist, 
    toggleWishlist, 
    addToCart, 
    setQuickViewProduct, 
    shopZaloPhone, 
    openZaloInquiry, 
    brandSettings,
    navigateTo 
  } = useShop();
  const isLiked = wishlist.includes(flower.id);
  const specs = getSpecsForFlower(flower);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-slate-200 hover:border-red-500 relative">
      
      {/* Khung ảnh vuông, hiển thị TRỌN ảnh (object-contain) để không cắt chữ/thông tin trên ảnh thật khách đăng */}
      <div 
        onClick={() => setQuickViewProduct(flower)}
        className="relative aspect-square overflow-hidden bg-white cursor-pointer"
      >
        <img
          src={flower.image}
          alt={`Thiết bị PCCC ${flower.name} - ${brandSettings?.brandName || 'FLAMEGUARD PRO'}`}
          width="400"
          height="400"
          className="w-full h-full object-contain object-center group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          loading="lazy"
          decoding="async"
        />

        {/* Overlay Dark Gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Hover Quick View & Detail Buttons */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
          <button
            type="button"
            onClick={() => setQuickViewProduct(flower)}
            className="flex-1 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold py-2.5 rounded-xl shadow-lg backdrop-blur-sm transition-all flex items-center justify-center gap-1 border border-slate-200"
            title="Xem nhanh thông số"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>Xem Nhanh</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateTo(getProductUrl(flower));
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
            title="Xem trang chi tiết & Chạy Ads"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span>Chi Tiết & Mua</span>
          </button>
        </div>

      </div>

      {/* Dải nhãn kỹ thuật nằm dưới ảnh để không che thông tin trên ảnh thật */}
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white border border-blue-400/50 flex items-center gap-1 font-mono">
            <span>🛡️</span> TEM BCA 2026
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-600 text-white">
            TCVN 3890:2023
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
            {specs.gaugeLabel}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-mono">
            CO/CQ
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(flower.id);
          }}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-50 hover:bg-red-50 flex items-center justify-center text-slate-700 hover:text-red-600 transition-all active:scale-90"
          aria-label="Lưu sản phẩm"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-600 text-red-600' : 'stroke-current'}`} />
        </button>
      </div>

      {/* Product Content & Technical Spec Grid */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between bg-white space-y-3">
        
        <div>
          {/* Header row: Rating & Warranty */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
            <span className="flex items-center gap-1 text-amber-500 font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{flower.rating}</span>
              <span className="text-slate-400 font-normal">({flower.reviewsCount} công trình)</span>
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-emerald-200 text-[10px]">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Bảo hành {flower.freshDays || 12}T
            </span>
          </div>

          {/* Title */}
          <a 
            href={getProductUrl(flower)}
            onClick={(e) => {
              e.preventDefault();
              navigateTo(getProductUrl(flower));
            }}
            className="font-heading text-base sm:text-lg text-slate-900 font-bold hover:text-red-600 transition-colors cursor-pointer line-clamp-1 block"
            title={`Xem chi tiết ${flower.name}`}
          >
            {flower.name}
          </a>

          <p className="text-xs text-slate-500 mt-1 line-clamp-1 leading-relaxed">
            {flower.subtitle}
          </p>

          {/* 3 THÔNG SỐ VÀNG KỸ THUẬT (TECHNICAL SPEC GRID) */}
          <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <span className="text-slate-400">🧪</span> Chất dập:
              </span>
              <span className="font-bold text-slate-800 truncate max-w-[170px]">{specs.agent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <span className="text-slate-400">🎯</span> Tầm phun:
              </span>
              <span className="font-bold text-slate-800 font-mono">{specs.range}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <span className="text-slate-400">⚡</span> Phù hợp:
              </span>
              <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200/60 font-mono text-[10px]">
                {specs.fireClass}
              </span>
            </div>
          </div>
        </div>

        {/* Price & Action Section */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
          {/* Giá bán & Giá sỉ dự án */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Giá xuất xưởng:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black text-red-600 font-mono">
                  {flower.price.toLocaleString('vi-VN')}đ
                </span>
                {flower.originalPrice && (
                  <span className="text-[11px] text-slate-400 line-through font-mono">
                    {flower.originalPrice.toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openZaloInquiry(flower, specs);
                }}
                className="bg-blue-50 hover:bg-blue-100 text-[#0068FF] hover:text-blue-700 border border-blue-200/80 text-[11px] sm:text-xs font-bold px-2.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                title={`Xem nội dung & liên hệ Zalo thiết bị này (${shopZaloPhone})`}
              >
                <ZaloIcon className="w-3.5 h-3.5 shrink-0 rounded-xs" />
                <span className="hidden sm:inline">Liên Hệ Zalo</span>
                <span className="sm:hidden">Zalo</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(flower);
                }}
                className="bg-slate-900 hover:bg-red-600 text-white text-[11px] sm:text-xs font-bold px-3 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
                title="Thêm thiết bị vào đơn"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Vào Đơn</span>
              </button>
            </div>
          </div>

          {/* Dòng giá chiết khấu dự án / chung cư */}
          <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50/70 py-1 px-2 rounded-lg border border-emerald-200/60 flex items-center justify-between">
            <span>Dự án / Số lượng lớn:</span>
            <strong className="font-mono text-emerald-800">{specs.bulkPrice}</strong>
          </div>
        </div>

      </div>

    </div>
  );
};
