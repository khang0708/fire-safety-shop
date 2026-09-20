import React from 'react';
import { useShop } from '../context/ShopContext';
import { Smartphone, Zap, Check, Send } from 'lucide-react';

export const ZaloMiniAppBanner = () => {
  const { isZaloMode, setIsZaloMode } = useShop();

  if (!isZaloMode) return null;

  return (
    <div className="bg-[#0068FF] text-white py-3 px-4 shadow-lg sticky top-0 z-50 border-b border-blue-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white text-[#0068FF] flex items-center justify-center font-bold text-sm">
            Z
          </div>
          <div>
            <span className="font-bold block">Đang xem ở Chế độ Mô phỏng Zalo Mini App</span>
            <span className="text-[11px] text-blue-100">
              ✓ Tự động điền SĐT & Tên 1-chạm • Thanh toán ZaloPay • Nhận thông báo ZNS kèm ảnh áp suất kiểm định
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-white/20 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-300" />
            Tăng x2 tỷ lệ hoàn tất đơn
          </span>
          <button
            onClick={() => setIsZaloMode(false)}
            className="bg-white text-[#0068FF] font-bold px-3 py-1 rounded-full text-xs hover:bg-blue-50 transition-all"
          >
            Thoát Chế Độ Zalo
          </button>
        </div>

      </div>
    </div>
  );
};
