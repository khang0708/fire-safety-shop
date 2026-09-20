import React from 'react';
import { useShop } from '../context/ShopContext';
import { Sparkles, ShieldCheck, Gauge, ArrowRight, Award } from 'lucide-react';

export const HeroSection = () => {
  const { setIsAIFloristOpen, setSelectedOccasion } = useShop();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] py-12 md:py-18 text-white">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* CỘT TRÁI: TEXT & CAM KẾT CHUẨN KIỂM ĐỊNH */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 bg-red-950/80 border border-red-500/40 px-3.5 py-1.5 rounded-xl shadow-inner">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider font-mono">
                KIỂM ĐỊNH CỤC CẢNH SÁT PCCC & CNCH • BỘ CÔNG AN
              </span>
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] tracking-tight uppercase">
              THIẾT BỊ PHÒNG CHÁY CHỮA CHÁY & CỨU NẠN CỨU HỘ <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-red-400">CHUẨN TCVN 3890:2023</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans font-normal">
              <strong>FLAMEGUARD PRO</strong> là hệ thống phân phối phương tiện chữa cháy, cứu nạn cứu hộ và thiết bị an toàn cơ sở đạt chuẩn quốc gia. <strong>100% sản phẩm có tem kiểm định Bộ Công An</strong>, kim áp suất vạch xanh xuất xưởng, bàn giao kèm biên bản nghiệm thu và hồ sơ CO/CQ đầy đủ.
            </p>

            {/* 2 Nút CTA Hành Động Kỹ Thuật */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={() => setIsAIFloristOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all flex items-center gap-2 active:scale-95 group"
              >
                <span>📐 Tính Toán Định Mức PCCC Theo Mặt Bằng</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#catalog"
                onClick={() => setSelectedOccasion('all')}
                className="bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-600 text-xs sm:text-sm font-bold px-5 py-3.5 rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-95"
              >
                <span>📋 Yêu Cầu Báo Giá Dự Án & Công Trình</span>
              </a>
            </div>

            {/* 4 Khối Huy Hiệu Bảo Chứng Kỹ Thuật (Trust Badges) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-700/60 text-left">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">100% Tem Kiểm Định BCA</h4>
                <p className="text-[10px] text-slate-400">Mã QR xác thực Cục CS PCCC</p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Gauge className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">Áp Suất Vạch Xanh</h4>
                <p className="text-[10px] text-slate-400">Chụp ảnh gửi trước bàn giao</p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">Hồ Sơ Nghiệm Thu & CO/CQ</h4>
                <p className="text-[10px] text-slate-400">Đầy đủ hóa đơn VAT 8%</p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">Bảo Dưỡng 12-24T</h4>
                <p className="text-[10px] text-slate-400">Hỗ trợ nạp sạc chính hãng</p>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI: VISUAL SHOWCASE THIẾT BỊ CỨU HỎA */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md">
              
              {/* Main Image Frame 4:5 */}
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700/60 bg-slate-800">
                <img
                  src="/images/hero-fire-safety.jpg"
                  alt="Bình chữa cháy và thiết bị an toàn PCCC FLAMEGUARD PRO"
                  width="400"
                  height="500"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Bộ Trang Bị Khuyên Dùng Cho Gia Đình
                  </span>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold mt-1">Bình Bột ABC & Mặt Nạ Khói TZL30</h3>
                  <p className="text-xs text-slate-300 mt-1">Đạt chuẩn TCVN 3890:2023 • Sẵn sàng dập tắt đám cháy trong 10 giây</p>
                </div>
              </div>

              {/* Floating Badge 1: Kỹ sư PCCC kiểm tra */}
              <div className="absolute -bottom-4 left-2 sm:-left-4 bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-fade-in z-10">
                <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 font-black text-sm">
                  PCCC
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block leading-tight">Thẩm định kỹ thuật</span>
                  <span className="text-xs font-bold text-white">Kỹ sư PCCC Nguyễn Tuấn</span>
                </div>
              </div>

              {/* Floating Badge 2: Đánh giá uy tín */}
              <div className="absolute top-4 right-2 sm:-right-4 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-1.5 z-10">
                <span className="text-amber-400 text-xs sm:text-sm">★★★★★</span>
                <span className="text-[11px] sm:text-xs font-bold text-white">4.9/5.0 (1.800+ Dự án)</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
