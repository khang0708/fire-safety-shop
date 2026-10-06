import React from 'react';
import { useShop, formatPhoneNumber, getCleanPhoneNumber } from '../context/ShopContext';
import { PhoneCall } from 'lucide-react';

export const PhoneCallFloatingButton = ({ className = '' }) => {
  const { shopZaloPhone, brandSettings } = useShop();
  const currentHotline = shopZaloPhone || brandSettings?.hotline || '0843066604';
  const cleanPhone = getCleanPhoneNumber(currentHotline);
  const formattedPhone = formatPhoneNumber(currentHotline);

  return (
    <a
      href={`tel:${cleanPhone}`}
      className={`group flex items-center gap-2.5 transition-all duration-300 active:scale-95 text-decoration-none select-none ${className}`}
      title={`Gọi Hotline Cứu Hỏa & PCCC 24/7: ${formattedPhone}`}
      aria-label={`Gọi Hotline PCCC số ${formattedPhone}`}
    >
      {/* Label Pill trên màn hình máy tính / tablet */}
      <span className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 text-white text-xs font-bold shadow-xl border border-red-500/40 backdrop-blur-md group-hover:bg-red-600 group-hover:border-red-400 group-hover:shadow-red-500/30 transition-all duration-300">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="tracking-wide">Hotline 24/7: <strong className="font-mono text-red-300 group-hover:text-white font-black">{formattedPhone}</strong></span>
      </span>

      {/* Nút tròn chính với hiệu ứng chuông reo & sóng radar */}
      <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
        {/* Sóng radar tỏa tròn ngoài */}
        <span className="absolute inset-0 rounded-full bg-red-600 animate-radar-wave pointer-events-none" />
        <span className="absolute -inset-1 rounded-full bg-red-500/40 animate-pulse pointer-events-none" />

        {/* Khối nút chính */}
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 via-red-500 to-rose-600 text-white shadow-xl group-hover:shadow-2xl border-2 border-white flex items-center justify-center transition-all duration-300 group-hover:scale-105">
          <PhoneCall className="w-6 h-6 animate-phone-ring text-white drop-shadow-md" />
        </div>
      </div>
    </a>
  );
};
