import React, { useMemo } from 'react';
import { resolveProductCategoryId } from '../utils/categories';
import { useShop } from '../context/ShopContext';
import { FlowerCard } from './FlowerCard';
import { 
  Sparkles, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Star, 
  Clock, 
  Tag,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';

import { openPersonalZaloChat } from '../services/zaloService';
import { ZaloIcon } from './ZaloIcon';

export const FlowerGrid = () => {
  const { 
    activeCategory,
    products, 
    selectedOccasion, 
    selectedColor, 
    searchQuery, 
    sortBy, 
    setSortBy, 
    shopZaloPhone,
    brandSettings,
    categories
  } = useShop();

  const SORT_OPTIONS = [
    { id: 'featured', label: 'Nổi Bật Nhất', icon: Sparkles },
    { id: 'price_asc', label: 'Giá: Thấp → Cao', icon: ArrowUp },
    { id: 'price_desc', label: 'Giá: Cao → Thấp', icon: ArrowDown },
    { id: 'rating_desc', label: 'Đánh Giá Cao', icon: Star },
    { id: 'newest', label: 'Mới Ra Mắt', icon: Clock },
    { id: 'name_asc', label: 'Tên: A → Z', icon: Tag },
  ];

  // Lọc và sắp xếp sản phẩm theo tiêu chí được chọn
  const filteredAndSortedFlowers = useMemo(() => {
    // 1. Lọc sản phẩm
    const filtered = products.filter((flower) => {
      if (flower.isAvailable === false) return false;

      // Lọc theo danh mục chính
      if (activeCategory && activeCategory !== 'all' && resolveProductCategoryId(flower, categories) !== activeCategory) {
        return false;
      }

      // Filter Occasion
      if (selectedOccasion !== 'all' && flower.occasion !== selectedOccasion) {
        return false;
      }
      // Filter Color Tone
      if (selectedColor !== 'all' && flower.colorTone !== selectedColor) {
        return false;
      }
      // Filter Search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = flower.name?.toLowerCase().includes(q);
        const matchSubtitle = flower.subtitle?.toLowerCase().includes(q);
        const matchFlowers = flower.flowerTypes?.some(f => f.toLowerCase().includes(q));
        if (!matchName && !matchSubtitle && !matchFlowers) return false;
      }
      return true;
    });

    // 2. Sắp xếp sản phẩm (Sorting)
    const cloned = [...filtered];
    switch (sortBy) {
      case 'price_asc':
        return cloned.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      case 'price_desc':
        return cloned.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      case 'rating_desc':
        return cloned.sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5) || (Number(b.reviewsCount) || 0) - (Number(a.reviewsCount) || 0));
      case 'newest':
        return cloned.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      case 'name_asc':
        return cloned.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
      case 'featured':
      default:
        return cloned;
    }
  }, [products, categories, activeCategory, selectedOccasion, selectedColor, searchQuery, sortBy]);

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-16">
      
      {/* THANH CÔNG CỤ ĐIỀU KHIỂN & SẮP XẾP SẢN PHẨM */}
      <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs mb-3 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
        
        {/* Số lượng sản phẩm */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] sm:text-xs font-bold text-slate-800 bg-red-50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-red-200">
            🧯 <strong>{filteredAndSortedFlowers.length}</strong> thiết bị PCCC sẵn sàng giao
          </span>
        </div>

        {/* BỘ SẮP XẾP SẢN PHẨM (SORTING BAR) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none -mx-2.5 px-2.5 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 font-medium shrink-0">
            <ArrowUpDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600 shrink-0" />
            <span className="hidden sm:inline">Sắp xếp:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-200 shrink-0">
            {SORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = sortBy === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`flex items-center gap-1 text-[11px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Grid danh sách sản phẩm */}
      {filteredAndSortedFlowers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 animate-fade-in">
          {filteredAndSortedFlowers.map((flower) => (
            <FlowerCard key={flower.id} flower={flower} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <p className="text-3xl mb-2">🧯</p>
          <h3 className="font-heading text-lg font-bold text-slate-900">
            Không tìm thấy thiết bị phù hợp với bộ lọc
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Bạn có thể thử chọn lại khu vực lắp đặt khác hoặc bấm để xem toàn bộ danh mục thiết bị PCCC.
          </p>
          <button
            onClick={() => { setSelectedOccasion('all'); setSelectedColor('all'); }}
            className="mt-4 bg-red-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-600/20 cursor-pointer"
          >
            Xem tất cả thiết bị PCCC
          </button>
        </div>
      )}

      {/* Banner Cam kết & Kỹ sư tư vấn dự án */}
      <div className="mt-16 bg-slate-900 rounded-3xl p-8 border border-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            {brandSettings?.brandName || 'FLAMEGUARD PRO'} • DỰ ÁN & DOANH NGHIỆP
          </span>
          <h3 className="font-heading text-2xl font-bold text-white">
            Cần Khảo Sát & Lập Phương Án PCCC Trọn Gói?
          </h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Đội ngũ kỹ sư PCCC có chứng chỉ Bộ Công An nhận khảo sát thực địa tận nơi, lập dự toán theo định mức và cung cấp đầy đủ hồ sơ kiểm định cho tòa nhà, nhà hàng, karaoke, văn phòng và kho bãi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openPersonalZaloChat(shopZaloPhone, `Chào kỹ sư ${brandSettings?.brandName || 'FLAMEGUARD PRO'}, tôi cần tư vấn thiết bị PCCC và hồ sơ kiểm định cho công trình!`)}
            className="bg-[#0068FF] text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-blue-600 transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <ZaloIcon className="w-4 h-4 shrink-0" />
            <span>Chat Zalo Kỹ Sư ({shopZaloPhone})</span>
          </button>
          <a
            href={`tel:${shopZaloPhone.replace(/\s+/g, '')}`}
            className="bg-slate-800 text-white border border-slate-700 text-xs font-bold px-5 py-3 rounded-xl hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hotline {shopZaloPhone}</span>
          </a>
        </div>
      </div>

    </section>
  );
};
