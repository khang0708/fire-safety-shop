import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { ZaloIcon } from './ZaloIcon';
import { Check, Copy, ExternalLink, X, ShieldCheck } from 'lucide-react';

export const ZaloInquiryModal = () => {
  const { zaloInquiryData, closeZaloInquiry, shopZaloPhone } = useShop();
  const [copied, setCopied] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [autoRedirect, setAutoRedirect] = useState(false);

  useEffect(() => {
    if (zaloInquiryData) {
      setCopied(true);
      setCountdown(3);
      setAutoRedirect(false);
    }
  }, [zaloInquiryData]);

  if (!zaloInquiryData) return null;

  const { product, message, cleanPhone } = zaloInquiryData;
  const targetPhone = cleanPhone || (shopZaloPhone || '0843066604').replace(/\D/g, '');
  const zaloUrl = `https://zalo.me/${targetPhone}`;

  const handleCopyAgain = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenZalo = () => {
    // Đảm bảo copy lại lần cuối trước khi chuyển tab
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message);
    }
    window.open(zaloUrl, '_blank');
    closeZaloInquiry();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#0068FF] to-[#0051C6] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center p-2 backdrop-blur-xs">
              <ZaloIcon className="w-full h-full text-white" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg leading-tight">
                Tư Vấn Thiết Bị Qua Zalo
              </h3>
              <p className="text-[11px] text-blue-100 font-medium">
                Hotline Kỹ Sư PCCC: <strong>{shopZaloPhone || '0843.066.604'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={closeZaloInquiry}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-base transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          
          {/* Thông tin vắn tắt sản phẩm */}
          {product && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-mono">
                    TEM BCA
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium truncate">
                    TCVN 3890:2023
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                  {product.name}
                </h4>
                <span className="text-red-600 font-black font-mono text-sm">
                  {Number(product.price || 0).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          )}

          {/* Trạng thái đã sao chép & Hướng dẫn */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-900">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1">
              <strong className="text-xs font-bold block text-emerald-950">
                Nội dung thiết bị đã được tự động sao chép!
              </strong>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Khi mở Zalo, bạn chỉ cần bấm <b>"Dán" (Paste / Ctrl + V)</b> vào ô gửi tin nhắn để gửi thông số cho Kỹ Sư.
              </p>
            </div>
          </div>

          {/* Hộp xem trước tin nhắn Zalo sẽ gửi */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                <span>💬 Nội dung tin nhắn gửi kỹ sư:</span>
              </span>
              <button
                type="button"
                onClick={handleCopyAgain}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Đã chép lại' : 'Sao chép lại'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed border border-slate-800 max-h-40 overflow-y-auto whitespace-pre-wrap select-all shadow-inner">
              {message}
            </div>
          </div>

          {/* Nút Hành Động Chính */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleOpenZalo}
              className="flex-1 bg-[#0068FF] hover:bg-[#0055D4] text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
            >
              <ZaloIcon className="w-5 h-5 shrink-0" />
              <span>Mở Zalo & Gửi Tin Nhắn Ngay</span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </button>

            <button
              type="button"
              onClick={closeZaloInquiry}
              className="px-5 py-3 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-2xl font-bold transition-colors cursor-pointer text-center"
            >
              Xem Tiếp Sản Phẩm
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
