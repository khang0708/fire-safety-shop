import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  X, 
  CheckCircle, 
  Clock, 
  Truck, 
  Camera, 
  PhoneCall, 
  MessageCircle, 
  ShieldCheck, 
  ThumbsUp,
  MapPin,
  Sparkles,
  Gauge,
  Eye,
  AlertCircle,
  FileCheck
} from 'lucide-react';

import { openPersonalZaloChat } from '../services/zaloService';
import { generateMessengerOrderInquiry } from '../services/facebookService';

export const OrderTrackingModal = () => {
  const { isTrackingOpen, setIsTrackingOpen, activeOrder, approvePhotoProof, shopZaloPhone, facebookSettings } = useShop();
  const [showCatalogRef, setShowCatalogRef] = useState(false);

  if (!isTrackingOpen || !activeOrder) return null;

  const handleChatZaloFlorist = () => {
    openPersonalZaloChat(
      shopZaloPhone,
      `Chào kỹ sư FLAMEGUARD PRO, tôi muốn hỏi tiến độ kiểm định & xuất kho đơn hàng #${activeOrder.orderCode || activeOrder.id} (${activeOrder.productName || 'Thiết Bị PCCC'})`
    );
  };

  const handleChatMessengerFlorist = () => {
    generateMessengerOrderInquiry(facebookSettings?.pageId, activeOrder.orderCode || activeOrder.id);
  };

  const hasRealPhoto = Boolean(activeOrder.proofPhotoUrl);
  const isDelivering = Boolean(activeOrder.isApproved || activeOrder.status === 'DELIVERING' || activeOrder.status === 'COMPLETED');
  const isCompleted = activeOrder.status === 'COMPLETED';

  const steps = [
    { key: 'PENDING', label: 'Tiếp nhận đơn', done: true },
    { key: 'INSPECTING', label: 'Đo áp suất & dán tem BCA', done: true },
    { key: 'PHOTO_READY', label: 'Ảnh đồng hồ áp suất vạch xanh', done: hasRealPhoto },
    { key: 'DELIVERING', label: 'Giao hàng & bàn giao', done: isDelivering },
    { key: 'COMPLETED', label: 'Hoàn tất nghiệm thu', done: isCompleted },
  ];

  // Tính % tiến trình thanh bar
  const progressPercent = isCompleted ? 100 : isDelivering ? 75 : hasRealPhoto ? 50 : 25;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 my-auto animate-fade-in text-slate-800">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[11px] text-red-400 uppercase tracking-widest block font-bold">
              Trung Tâm Kiểm Định & Điều Phối PCCC
            </span>
            <h3 className="font-heading text-lg font-bold">
              Tra Cứu Đơn Hàng: #{activeOrder.orderCode || activeOrder.id}
            </h3>
          </div>
          <button 
            onClick={() => setIsTrackingOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white text-lg transition-all"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[82vh] overflow-y-auto p-6 space-y-6">
          
          {/* Kỹ Sư Phụ Trách Kiểm Định */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold font-mono text-sm border-2 border-red-500 shadow-sm flex-shrink-0">
                PCCC
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Kỹ sư kiểm định phụ trách</span>
                <h4 className="text-xs font-bold text-slate-900">{activeOrder.florist || 'Kỹ sư Nguyễn Tuấn (Cục CNCH)'}</h4>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Trạm Kiểm Định Trung Tâm • Tiêu chuẩn TCVN 3890</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {facebookSettings?.isEnabled !== false && (
                <button
                  type="button"
                  onClick={handleChatMessengerFlorist}
                  className="p-2.5 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition-all active:scale-95 flex items-center justify-center text-xs font-bold"
                  title="Trao đổi kỹ thuật qua Messenger"
                >
                  <span>Messenger</span>
                </button>
              )}
              <a
                href={`tel:${shopZaloPhone.replace(/\s+/g, '')}`}
                className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-800 shadow-xs transition-transform active:scale-95"
                title={`Gọi trạm kỹ thuật (${shopZaloPhone})`}
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" />
              </a>
              <button
                type="button"
                onClick={handleChatZaloFlorist}
                className="p-2.5 bg-[#0068FF] text-white rounded-xl hover:bg-blue-600 shadow-xs transition-transform active:scale-95 flex items-center justify-center"
                title={`Chat Zalo Với Kỹ Sư (${shopZaloPhone})`}
              >
                <span className="font-black text-xs">Z</span>
              </button>
            </div>
          </div>

          {/* Stepper Trạng Thái Hoàn Chỉnh */}
          <div className="pt-3 pb-1 px-1">
            <div className="relative">
              {/* Thanh line xám nền */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 z-0" />
              
              {/* Thanh tiến trình hoàn thành màu đỏ */}
              <div 
                className="absolute top-4 left-6 h-0.5 bg-red-600 z-0 transition-all duration-500" 
                style={{ width: `calc(${progressPercent}% - 24px)` }}
              />

              <div className="flex justify-between items-start relative z-10">
                {steps.map((s, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 px-0.5 text-center">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                      s.done 
                        ? 'bg-red-600 text-white ring-4 ring-red-100' 
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}>
                      {s.done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-[10px] sm:text-[11px] font-bold mt-2 leading-snug break-words max-w-[85px] ${
                      s.done ? 'text-red-700' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 📸 PROOF PHOTO: KHUNG ẢNH ĐỒNG HỒ ÁP SUẤT VẠCH XANH & TEM BCA */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-red-600" />
                <h4 className="font-heading text-base font-bold text-slate-900">
                  Ảnh Kiểm Tra Áp Suất & Tem Kiểm Định BCA Thực Tế
                </h4>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                activeOrder.isApproved 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : hasRealPhoto 
                  ? 'bg-amber-100 text-amber-800 animate-pulse' 
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {activeOrder.isApproved 
                  ? '✓ Đã xác nhận đạt chuẩn' 
                  : hasRealPhoto 
                  ? '⏳ Đã có ảnh đo áp suất - Chờ bạn duyệt' 
                  : '🧯 Đang đo áp suất...'}
              </span>
            </div>

            {/* TRƯỜNG HỢP 1: ĐÃ CÓ ẢNH DO KỸ SƯ TẢI LÊN */}
            {hasRealPhoto ? (
              <div className="space-y-3 animate-fade-in">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-300 shadow-md group bg-slate-900">
                  <img
                    src={activeOrder.proofPhotoUrl}
                    alt="Ảnh kiểm định áp suất thực tế tại kho"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm border border-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Đo áp suất thực tế lúc {activeOrder.proofPhotoTime || activeOrder.createdAt} • Trạm kiểm định FLAMEGUARD</span>
                  </div>
                </div>

                {/* Ghi chú kiểm định nếu có */}
                {activeOrder.proofNote && (
                  <p className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800">
                    📝 <strong>Ghi chú từ kỹ sư PCCC:</strong> "{activeOrder.proofNote}"
                  </p>
                )}

                {/* Khối Duyệt Ảnh & Cho Phép Xuất Kho */}
                {!activeOrder.isApproved ? (
                  <div className="p-4 bg-white rounded-2xl border border-red-200 space-y-3 shadow-xs">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700">
                        Kỹ sư đã hoàn tất đo kim áp suất (nằm trọn trong vạch xanh tiêu chuẩn 1.2 - 1.4 MPa) và niêm phong chì tem Bộ Công An. Quý khách vui lòng xem ảnh và bấm duyệt để đội xe xuất phát giao hàng ngay!
                      </p>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap gap-2 pt-1">
                      <button
                        onClick={approvePhotoProof}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <ThumbsUp className="w-4 h-4 text-white" />
                        <span>Tôi Duyệt Áp Suất Chuẩn - Cho Phép Giao Ngay</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleChatZaloFlorist}
                        className="text-xs text-[#0068FF] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-3 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Yêu Cầu Kiểm Tra Lại</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-bold border border-emerald-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Quý khách đã duyệt ảnh kiểm định! Đội vận chuyển chuyên dụng FLAMEGUARD đang di chuyển đến địa chỉ nhận.</span>
                  </div>
                )}
              </div>
            ) : (
              /* TRƯỜNG HỢP 2: ĐANG TRONG QUÁ TRÌNH KIỂM TRA (CHƯA CÓ ẢNH THẬT) */
              <div className="p-6 bg-white rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto ring-4 ring-red-50">
                  <Gauge className="w-6 h-6 animate-pulse" />
                </div>
                
                <div>
                  <h5 className="font-heading text-sm font-bold text-slate-900">
                    Kỹ sư đang tiến hành đo áp suất & niêm phong tem BCA...
                  </h5>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                    Thiết bị của quý khách đang được kiểm tra kim đồng hồ áp suất, cân nạp khí CO2/bột ABC và dán tem QR chống hàng giả. Ngay khi hoàn tất, <strong>ảnh chụp đồng hồ vạch xanh thực tế sẽ xuất hiện trực tiếp tại đây</strong>.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Đang kết nối Realtime • Tự động hiển thị khi kỹ sư chụp</span>
                </div>

                {/* Tùy chọn xem lại mẫu catalog tham khảo */}
                {activeOrder.catalogSamplePhoto && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowCatalogRef(!showCatalogRef)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{showCatalogRef ? 'Ẩn ảnh thiết bị mẫu' : 'Xem lại ảnh thiết bị niêm yết'}</span>
                    </button>

                    {showCatalogRef && (
                      <div className="mt-3 max-w-xs mx-auto aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 relative">
                        <img src={activeOrder.catalogSamplePhoto} alt="Mẫu tham khảo" className="w-full h-full object-cover opacity-80" />
                        <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[9px] px-2 py-0.5 rounded-md">
                          Ảnh thiết bị niêm yết
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Chi tiết nơi nhận & Thẻ hướng dẫn đi kèm */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-700">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>Bàn giao đến: {activeOrder.receiverName} ({activeOrder.receiverPhone})</span>
            </div>
            <p className="pl-6 text-slate-600 leading-relaxed">📍 Địa chỉ: {activeOrder.receiverAddress}</p>
            <p className="pl-6 text-slate-900 font-bold">
              ⏱️ Tiến độ bàn giao: {activeOrder.deliverySlot}
            </p>
            <div className="pl-6 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
              <span className="text-slate-600">
                🚚 Phí giao hàng: <strong>{Number(activeOrder.shippingFee || 0) === 0 ? 'Freeship (0đ)' : `${Number(activeOrder.shippingFee).toLocaleString('vi-VN')}đ`}</strong>
                {activeOrder.isShippingConfirmed && <span className="text-[10px] text-emerald-700 ml-1.5 font-bold">(✓ Trạm đã xác nhận)</span>}
              </span>
              <span className="text-sm font-black text-red-600 font-mono">
                Tổng thanh toán: {Number(activeOrder.totalAmount || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>
            {activeOrder.cardMessage && (
              <div className="ml-6 p-3 bg-white rounded-xl border border-dashed border-red-300 text-slate-800 font-mono">
                📋 Vị trí & Hướng dẫn: "{activeOrder.cardMessage}"
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
