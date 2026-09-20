import React, { useState } from 'react';
import { AI_GREETING_TEMPLATES } from '../data/aiTemplates';
import { Sparkles, ShieldCheck, FileText, QrCode } from 'lucide-react';

export const CardPreviewer = ({ 
  cardMessage, 
  setCardMessage, 
  senderSign, 
  setSenderSign, 
  currentOccasion = 'household' 
}) => {
  const [activeCategory, setActiveCategory] = useState(
    currentOccasion in AI_GREETING_TEMPLATES ? currentOccasion : 'household'
  );
  
  const templates = AI_GREETING_TEMPLATES[activeCategory] || AI_GREETING_TEMPLATES.household || AI_GREETING_TEMPLATES.love;

  return (
    <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-red-600" />
          <h4 className="font-heading text-base font-bold text-slate-900">
            Thẻ Hướng Dẫn Khẩn Cấp & Vị Trí Bố Trí (Đính Kèm Miễn Phí)
          </h4>
        </div>
        <span className="text-[11px] bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-full border border-red-200">
          Ép Plastic Dạ Quang
        </span>
      </div>

      {/* AI Suggestion Pills */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Mẫu quy chuẩn hướng dẫn theo khu vực:
          </span>
          <div className="flex gap-1">
            {[
              { id: 'household', label: 'Gia đình' },
              { id: 'office', label: 'Văn phòng' },
              { id: 'factory', label: 'Nhà xưởng' },
              { id: 'vehicle', label: 'Ô tô' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`text-[10px] px-2 py-0.5 rounded-lg font-bold capitalize transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {templates.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCardMessage(tpl.text)}
              className="text-left p-2.5 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-300 rounded-xl text-[11px] text-slate-700 transition-all leading-snug group"
            >
              <span className="font-bold text-red-600 block mb-0.5 text-[10px]">
                ✦ {tpl.tone}
              </span>
              <span className="line-clamp-2 text-slate-600 group-hover:text-slate-900">
                "{tpl.text}"
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Textarea Hướng dẫn & Vị trí */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700">
          Nội dung in trên Thẻ Hướng Dẫn & Ghi Chú Lắp Đặt:
        </label>
        <textarea
          rows={3}
          value={cardMessage}
          onChange={(e) => setCardMessage(e.target.value)}
          maxLength={300}
          placeholder="Nhập vị trí dự kiến lắp đặt hoặc lưu ý đặc biệt cho kỹ thuật viên..."
          className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white transition-all font-sans"
        />
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>In chữ phản quang, nhìn rõ trong bóng tối</span>
          <span>{cardMessage.length}/300</span>
        </div>
      </div>

      {/* Tên Người Phụ Trách / Cán bộ An toàn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Người phụ trách / Bộ phận nhận bàn giao:
          </label>
          <input
            type="text"
            value={senderSign}
            onChange={(e) => setSenderSign(e.target.value)}
            placeholder="VD: Anh Nam - Trưởng phòng kỹ thuật"
            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-red-500 bg-white"
          />
        </div>
      </div>

      {/* LIVE PREVIEW CARD */}
      <div className="mt-4 pt-3 border-t border-slate-200">
        <span className="text-[11px] font-bold text-slate-600 block mb-2 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-red-600" />
          Xem trước Thẻ Hướng Dẫn Dạ Quang dán cạnh thiết bị:
        </span>
        
        <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-dashed border-red-400 shadow-sm relative overflow-hidden">
          {/* Watermark Logo */}
          <div className="absolute -right-4 -bottom-4 text-red-500/10 font-mono font-black text-6xl select-none pointer-events-none">
            FLAMEGUARD
          </div>

          <div className="flex items-center justify-between border-b border-red-200 pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[11px] font-black text-red-700 uppercase tracking-wider">
                HƯỚNG DẪN THAO TÁC KHẨN CẤP PCCC
              </span>
            </div>
            <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded">
              TCVN 3890
            </span>
          </div>

          <div className="text-xs text-slate-800 leading-relaxed font-mono font-medium min-h-[50px]">
            {cardMessage || 'Nội dung hướng dẫn và vị trí lắp đặt sẽ hiển thị ở đây...'}
          </div>

          <div className="flex items-center justify-between mt-4 pt-2 border-t border-red-200 text-[11px] font-bold text-red-800">
            <div className="flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-red-600" />
              <span>Mã kiểm định: FG-BCA-{new Date().getFullYear()}</span>
            </div>
            <div>
              Phụ trách: {senderSign || 'Chủ hộ / Quản trị viên'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
