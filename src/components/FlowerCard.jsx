import React from 'react';
import { useShop } from '../context/ShopContext';
import { Heart, Star, Plus, Eye, ShieldCheck, Gauge, CheckCircle2, Zap, Flame } from 'lucide-react';

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
  const { wishlist, toggleWishlist, addToCart, setQuickViewProduct } = useShop();
  const isLiked = wishlist.includes(flower.id);
  const specs = getSpecsForFlower(flower);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-slate-200 hover:border-red-500 relative">
      
      {/* 4:5 Aspect Ratio Container */}
      <div 
        onClick={() => setQuickViewProduct(flower)}
        className="relative aspect-[4/5] overflow-hidden bg-slate-900 cursor-pointer"
      >
        <img
          src={flower.image}
          alt={`Thiết bị PCCC ${flower.name} - FLAMEGUARD PRO`}
          width="320"
          height="400"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
          decoding="async"
        />

        {/* Overlay Dark Gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top Technical Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-600/95 text-white backdrop-blur-md shadow-sm w-fit border border-blue-400/50 flex items-center gap-1 font-mono">
            <span>🛡️</span> TEM BCA 2026
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-600 text-white shadow-sm w-fit">
            TCVN 3890:2023
          </span>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(flower.id);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-700 hover:text-red-600 transition-all shadow-sm z-10 active:scale-90"
          aria-label="Lưu sản phẩm"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-600 text-red-600' : 'stroke-current'}`} />
        </button>

        {/* Visual Mini Pressure Gauge Indicator */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
          <div className="inline-flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-md font-mono">
            {/* SVG Mini Dial Gauge */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 36 36" fill="none">
              <path d="M6 26 A 14 14 0 0 1 30 26" stroke="#475569" strokeWidth="4" strokeLinecap="round"/>
              <path d="M12 16 A 14 14 0 0 1 24 16" stroke="#10B981" strokeWidth="4" strokeLinecap="round"/>
              <line x1="18" y1="24" x2="18" y2="12" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="18" cy="24" r="2.5" fill="#FFFFFF"/>
            </svg>
            <span>{specs.gaugeLabel}</span>
          </div>

          <span className="inline-flex items-center gap-1 bg-slate-950/90 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-700/80 font-mono">
            CO/CQ
          </span>
        </div>

        {/* Hover Quick View Button */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
          <button
            onClick={() => setQuickViewProduct(flower)}
            className="flex-1 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold py-2.5 rounded-xl shadow-lg backdrop-blur-sm transition-all flex items-center justify-center gap-1.5 border border-slate-200"
          >
            <Eye className="w-3.5 h-3.5 text-red-600" />
            <span>Xem Thông Số & CO/CQ</span>
          </button>
        </div>

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
          <h3 
            onClick={() => setQuickViewProduct(flower)}
            className="font-heading text-base sm:text-lg text-slate-900 font-bold group-hover:text-red-600 transition-colors cursor-pointer line-clamp-1"
          >
            {flower.name}
          </h3>

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
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Giá kiểm định xuất xưởng:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black text-red-600 font-mono">
                  {flower.price.toLocaleString('vi-VN')}đ
                </span>
                {flower.originalPrice && (
                  <span className="text-xs text-slate-400 line-through font-mono">
                    {flower.originalPrice.toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => addToCart(flower)}
              className="bg-slate-900 hover:bg-red-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1 active:scale-95"
              title="Thêm thiết bị vào đơn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Vào Đơn</span>
            </button>
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
