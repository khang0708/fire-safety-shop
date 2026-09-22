import React from 'react';
import { useShop } from '../context/ShopContext';
import { openPersonalZaloChat } from '../services/zaloService';
import { Phone, Mail, MapPin, ShieldCheck, Globe, MessageCircle, Lock, Flame } from 'lucide-react';
import { ZaloIcon } from './ZaloIcon';

export const Footer = ({ onOpenAdminLogin }) => {
  const { shopZaloPhone } = useShop();
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Cột 1: Brand Info */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-sm">
                  FG
                </div>
                <span className="font-heading text-2xl font-black tracking-tight text-white block">
                  FLAMEGUARD PRO
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-red-400 font-bold block mt-1">
                Thiết Bị PCCC Chuẩn Kiểm Định BCA
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Hệ thống cung ứng thiết bị Phòng Cháy Chữa Cháy và Cứu Nạn Cứu Hộ chính hãng. Đồng hành cùng 5.000+ tòa nhà, doanh nghiệp và hộ gia đình trên toàn quốc.
            </p>
            <div className="flex gap-3 text-slate-300">
              <a href="#" className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all" title="Website">
                <Globe className="w-4 h-4" />
              </a>
              <button 
                type="button"
                onClick={() => openPersonalZaloChat(shopZaloPhone, 'Chào FLAMEGUARD PRO, tôi cần tư vấn thiết bị PCCC!')}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-[#0068FF] hover:text-white flex items-center justify-center transition-all" 
                title={`Chat Zalo (${shopZaloPhone})`}
              >
                <ZaloIcon className="w-4 h-4" />
              </button>
              <a href={`tel:${shopZaloPhone.replace(/\s+/g, '')}`} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all" title="Hotline">
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Cột 2: Danh Mục Thiết Bị */}
          <div className="space-y-3">
            <h4 className="font-heading text-base font-bold text-white">Danh Mục Thiết Bị PCCC</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#catalog" className="hover:text-red-400 transition-colors">🧯 Bình Chữa Cháy Bột ABC (4kg, 8kg)</a></li>
              <li><a href="#catalog" className="hover:text-red-400 transition-colors">❄️ Bình Khí CO2 Chống Cháy Điện (3kg, 5kg)</a></li>
              <li><a href="#catalog" className="hover:text-red-400 transition-colors">🌿 Bình Bọt Foam Dập Dầu Mỡ Sinh Học</a></li>
              <li><a href="#catalog" className="hover:text-red-400 transition-colors">😷 Mặt Nạ Lọc Khói Độc TZL30</a></li>
              <li><a href="#catalog" className="hover:text-red-400 transition-colors">🧗 Thang Dây & Dây Thoát Hiểm Chống Cháy</a></li>
              <li><a href="#catalog" className="hover:text-red-400 transition-colors">🚨 Đầu Báo Khói Quang Học Độc Lập</a></li>
            </ul>
          </div>

          {/* Cột 3: Cam kết của FLAMEGUARD */}
          <div className="space-y-3">
            <h4 className="font-heading text-base font-bold text-white">Tiêu Chuẩn & Kiểm Định</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-red-400 transition-colors flex items-center gap-1">🛡️ Tem kiểm định Cục Cảnh sát PCCC & CNCH</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors flex items-center gap-1">⏱️ Chụp ảnh đo áp suất vạch xanh trước khi giao</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors flex items-center gap-1">⚡ Giao hỏa tốc 60 - 90 phút tại nội thành</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors flex items-center gap-1">📄 Cấp biên bản bàn giao nghiệm thu & hóa đơn VAT</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors flex items-center gap-1">🔄 Bảo hành nạp sạc chính hãng 12 - 24 tháng</a></li>
            </ul>
          </div>

          {/* Cột 4: Hệ thống kho & Trạm kỹ thuật */}
          <div className="space-y-3 text-xs text-slate-400">
            <h4 className="font-heading text-base font-bold text-white">Kho Hàng & Trạm Kiểm Định</h4>
            <div className="space-y-2">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>Kho Tổng Nam: 128 Nguyễn Trãi, P. Bến Thành, Quận 1, TP.HCM</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>Trạm Kỹ Thuật Bắc: 45 Lý Thường Kiệt, Q. Hoàn Kiếm, Hà Nội</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <a href={`tel:${shopZaloPhone.replace(/\s+/g, '')}`} className="font-bold text-white hover:text-red-400 transition-colors">
                  Hotline/Zalo PCCC: {shopZaloPhone} (24/7)
                </a>
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#0068FF] flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => openPersonalZaloChat(shopZaloPhone, 'Chào kỹ sư FLAMEGUARD PRO, tôi cần hỗ trợ kỹ thuật PCCC!')}
                  className="text-slate-400 hover:text-white transition-colors underline flex items-center gap-1 text-[11px]"
                >
                  Kênh Hỗ Trợ Kỹ Thuật Zalo Khẩn Cấp
                </button>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>kythuat@flameguard.vn</span>
              </p>
            </div>
          </div>

        </div>

        {/* Sub-footer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <p>© 2026 FLAMEGUARD PRO Vietnam. All rights reserved. Tiêu chuẩn TCVN 3890:2023.</p>
          
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              An toàn PCCC là trách nhiệm của toàn xã hội
            </span>
            <span className="text-slate-700">•</span>
            {/* Link kín đáo ở chân trang */}
            <button
              onClick={onOpenAdminLogin}
              className="text-slate-500 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold"
              title="Đăng nhập dành cho kỹ sư kiểm định & quản trị viên"
            >
              <Lock className="w-3 h-3 text-red-500" />
              <span>Cổng Kỹ Sư Kiểm Định</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
