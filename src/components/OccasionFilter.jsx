import React from 'react';
import { useShop } from '../context/ShopContext';
import { OCCASIONS, COLOR_TONES } from '../data/flowers';
import { ShieldAlert, Layers } from 'lucide-react';

export const OccasionFilter = () => {
  const { 
    selectedOccasion, 
    setSelectedOccasion, 
    selectedColor, 
    setSelectedColor,
    isBannerEffectivelyHidden
  } = useShop();

  return (
    <div id="catalog" className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 ${isBannerEffectivelyHidden ? 'pt-2 pb-2 sm:pt-4 sm:pb-6' : 'pt-2 pb-3 sm:py-8'}`}>


      {/* Tiêu đề & Phân Loại Công Trình TCVN 3890 - Ẩn trên Mobile để nhường chỗ hiển thị sản phẩm ngay lập tức */}
      <div className="text-center mb-6 sm:mb-8 hidden sm:block">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-red-900/10 text-red-700 px-3 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold mb-3 border border-red-200 shadow-xs max-w-full">
          <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 shrink-0" />
          <span className="font-mono tracking-tight sm:tracking-wide text-center">TIÊU CHUẨN TCVN 3890:2023 • ĐỊNH MỨC TRANG BỊ PCCC CƠ SỞ</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-slate-900 font-extrabold tracking-tight uppercase">
          Phương Tiện Chữa Cháy & Cứu Nạn Cứu Hộ
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto px-2">
          Tra cứu phương tiện chữa cháy chuyên dụng theo từng loại hình công trình và nhóm nguy cơ cháy nổ thực tế
        </p>
      </div>

      {/* Tạm ẩn 2 hàng bộ lọc (khu vực + công nghệ dập lửa). Bỏ thuộc tính hidden để hiện lại. */}
      <div hidden>
      {/* Row 1: Khu Vực Lắp Đặt (Khu Vực Tabs) */}
      <div className="-mx-3 px-3 sm:mx-0 sm:px-0 flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-3 pt-0.5 scrollbar-none scroll-smooth">
        {OCCASIONS.map((occ) => {
          const isActive = selectedOccasion === occ.id;
          return (
            <button
              key={occ.id}
              onClick={() => setSelectedOccasion(occ.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm'
              }`}
            >
              <span className="shrink-0">{occ.icon}</span>
              <span>{occ.label}</span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Bộ Lọc Công Nghệ & Chất Chữa Cháy */}
      <div className="mt-2 pt-2 sm:mt-4 sm:pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4">
        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-700">Công nghệ dập lửa:</span>
          </div>
          {selectedColor !== 'all' && (
            <button
              onClick={() => setSelectedColor('all')}
              className="sm:hidden text-[10px] text-red-600 font-semibold underline underline-offset-2"
            >
              Xóa lọc
            </button>
          )}
        </div>

        <div className="-mx-3 px-3 sm:mx-0 sm:px-0 flex items-center gap-1.5 overflow-x-auto scrollbar-none sm:flex-wrap pb-1 sm:pb-0">
          {COLOR_TONES.map((ct) => {
            const isColorActive = selectedColor === ct.id;
            return (
              <button
                key={ct.id}
                onClick={() => setSelectedColor(ct.id)}
                className={`flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] font-semibold border transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  isColorActive
                    ? 'border-red-600 bg-red-600 text-white shadow-xs font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {ct.id !== 'all' && (
                  <span 
                    className="w-2 h-2 rounded-full border border-black/10 shrink-0" 
                    style={{ backgroundColor: ct.color }}
                  />
                )}
                <span>
                  {ct.id === 'all' ? (
                    <>
                      <span className="sm:hidden">Tất cả</span>
                      <span className="hidden sm:inline">Tất cả công nghệ dập lửa</span>
                    </>
                  ) : (
                    ct.label
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      </div>

    </div>
  );
};
