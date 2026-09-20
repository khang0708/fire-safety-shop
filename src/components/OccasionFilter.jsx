import React from 'react';
import { useShop } from '../context/ShopContext';
import { OCCASIONS, COLOR_TONES } from '../data/flowers';
import { ShieldAlert, Layers } from 'lucide-react';

export const OccasionFilter = () => {
  const { 
    selectedOccasion, 
    setSelectedOccasion, 
    selectedColor, 
    setSelectedColor 
  } = useShop();

  return (
    <div id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Tiêu đề & Phân Loại Công Trình TCVN 3890 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-red-900/10 text-red-700 px-3.5 py-1.5 rounded-xl text-xs font-bold mb-3 border border-red-200 shadow-xs">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span className="font-mono tracking-wide">TIÊU CHUẨN TCVN 3890:2023 • ĐỊNH MỨC TRANG BỊ PCCC CƠ SỞ</span>
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl text-slate-900 font-extrabold tracking-tight uppercase">
          Phương Tiện Chữa Cháy & Cứu Nạn Cứu Hộ
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto">
          Tra cứu phương tiện chữa cháy chuyên dụng theo từng loại hình công trình và nhóm nguy cơ cháy nổ thực tế
        </p>
      </div>

      {/* Row 1: Khu Vực Lắp Đặt (Khu Vực Tabs) */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 scrollbar-none">
        {OCCASIONS.map((occ) => {
          const isActive = selectedOccasion === occ.id;
          return (
            <button
              key={occ.id}
              onClick={() => setSelectedOccasion(occ.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 active:scale-95 ${
                isActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm'
              }`}
            >
              <span>{occ.icon}</span>
              <span>{occ.label}</span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Bộ Lọc Công Nghệ & Chất Chữa Cháy */}
      <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-600" />
          <span className="text-xs font-bold text-slate-800">Chất Chữa Cháy & Phân Loại:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {COLOR_TONES.map((ct) => {
            const isColorActive = selectedColor === ct.id;
            return (
              <button
                key={ct.id}
                onClick={() => setSelectedColor(ct.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                  isColorActive
                    ? 'border-red-600 bg-red-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {ct.id !== 'all' && (
                  <span 
                    className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block" 
                    style={{ backgroundColor: ct.color }}
                  />
                )}
                <span>{ct.label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
