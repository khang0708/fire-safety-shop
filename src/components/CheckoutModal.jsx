import React, { useState, useEffect, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  X, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  Calendar,
  FileCheck
} from 'lucide-react';

import { openPersonalZaloChat } from '../services/zaloService';

// Hàm tính toán các mốc ngày giao hàng động theo ngày thực tế hiện tại
const getDynamicDeliveryDates = () => {
  const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const now = new Date();

  const formatDateStr = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const formatISO = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. Hôm nay
  const todayDateStr = formatDateStr(now);
  const todayLabel = `Hôm nay (${todayDateStr})`;
  const todayISO = formatISO(now);

  // 2. Ngày mai
  const tmr = new Date(now);
  tmr.setDate(now.getDate() + 1);
  const tmrDateStr = formatDateStr(tmr);
  const tmrLabel = `Ngày mai (${tmrDateStr})`;
  const tmrISO = formatISO(tmr);

  // 3. Ngày mốt (Ngày kia)
  const dayAfter = new Date(now);
  dayAfter.setDate(now.getDate() + 2);
  const dayAfterDateStr = formatDateStr(dayAfter);
  const dayAfterName = dayNames[dayAfter.getDay()];
  const dayAfterLabel = `${dayAfterName} (${dayAfterDateStr})`;
  const dayAfterISO = formatISO(dayAfter);

  return {
    today: { id: 'today', label: todayLabel, iso: todayISO },
    tomorrow: { id: 'tomorrow', label: tmrLabel, iso: tmrISO },
    dayAfter: { id: 'day_after', label: dayAfterLabel, iso: dayAfterISO },
    minISO: todayISO
  };
};

export const CheckoutModal = () => {
  const { 
    isCheckoutOpen, 
    setIsCheckoutOpen, 
    cart, 
    cartTotal, 
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    shippingSettings,
    getShippingFee,
    submitOrder,
    shopZaloPhone
  } = useShop();

  if (!isCheckoutOpen) return null;

  // Coupon state in Checkout
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setIsApplying(true);
    try {
      await applyCoupon(couponInput);
      setCouponInput('');
    } catch (err) {
      setCouponError(err.message);
    } finally {
      setIsApplying(false);
    }
  };

  // Form State
  const [senderName, setSenderName] = useState('Nguyễn Hoàng Nam');
  const [senderPhone, setSenderPhone] = useState('0909 123 456');
  const [receiverName, setReceiverName] = useState('Trần Ngọc Bích');
  const [receiverPhone, setReceiverPhone] = useState('0988 765 432');
  const [receiverAddress, setReceiverAddress] = useState('Căn hộ 1208, Tháp A, Chung cư The Sun Avenue, P. An Phú, TP. Thủ Đức, TP.HCM');
  const [isAnonymous, setIsAnonymous] = useState(true); // Biên bản kiểm định Cục PCCC & VAT
  const [purposeType, setPurposeType] = useState('apartment'); // 'apartment' | 'factory' | 'official_inspection'
  const [handoverNote, setHandoverNote] = useState('Kiểm tra kỹ tem chì niêm phong và đồng hồ áp suất vạch xanh trước khi nhận');
  const [requestPhotoProof, setRequestPhotoProof] = useState(true);
  
  // Delivery Schedule
  const dynamicDates = useMemo(() => getDynamicDeliveryDates(), [isCheckoutOpen]);
  const [deliveryType, setDeliveryType] = useState('timeslot'); // 'express' | 'timeslot'
  const [dateMode, setDateMode] = useState('today'); // 'today' | 'tomorrow' | 'day_after' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('14:00 - 16:00');

  useEffect(() => {
    if (isCheckoutOpen) {
      setDateMode('today');
      setCustomDate('');
      setSelectedSlot('14:00 - 16:00');
    }
  }, [isCheckoutOpen]);

  const currentDeliveryDateLabel = useMemo(() => {
    if (dateMode === 'today') return dynamicDates.today.label;
    if (dateMode === 'tomorrow') return dynamicDates.tomorrow.label;
    if (dateMode === 'day_after') return dynamicDates.dayAfter.label;
    if (dateMode === 'custom' && customDate) {
      const parts = customDate.split('-');
      if (parts.length === 3) {
        return `Ngày ${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return dynamicDates.today.label;
  }, [dateMode, customDate, dynamicDates]);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('qr_transfer'); // 'qr_transfer' | 'momo' | 'card'

  const shippingFee = getShippingFee(deliveryType, cartTotal);
  const grandTotal = Math.max(0, cartTotal + shippingFee - discountAmount);
  const isFreeshipEligible = shippingSettings?.isFreeShippingEnabled && cartTotal >= (shippingSettings?.freeShippingThreshold || 1000000);

  const handleSubmit = (e) => {
    e.preventDefault();
    const computedSlot = deliveryType === 'express' 
      ? `⚡ Hỏa tốc 60 - 90 phút (${dynamicDates.today.label})` 
      : `${currentDeliveryDateLabel} • ${selectedSlot}`;

    submitOrder({
      senderName,
      senderPhone,
      receiverName,
      receiverPhone,
      receiverAddress,
      isAnonymous,
      deliveryType,
      shippingFee,
      deliverySlot: computedSlot,
      paymentMethod,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 my-auto animate-fade-in">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧯</span>
            <span className="font-heading text-lg font-bold">Xác Nhận & Thanh Toán Đơn Thiết Bị PCCC</span>
          </div>
          <button 
            onClick={() => setIsCheckoutOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white text-lg transition-all"
          >
            ✕
          </button>
        </div>

        {/* Checkout Body Form */}
        <form onSubmit={handleSubmit} className="max-h-[82vh] overflow-y-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI: FORM ĐIỀN THÔNG TIN (7 Cột) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Thông tin người đặt */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                  Thông Tin Người Đặt Hàng / Cơ Quan
                </h3>
                <span className="text-[10px] text-slate-400">Bảo mật thông tin</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Họ tên / Đơn vị đặt *</label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-red-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Số điện thoại nhận ảnh kiểm định *</label>
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-red-500 bg-white"
                  />
                </div>
              </div>

              {/* Tùy chọn gửi ảnh áp suất kiểm định */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requestPhotoProof}
                  onChange={(e) => setRequestPhotoProof(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 accent-red-600"
                />
                <span className="text-xs text-slate-800 font-bold">
                  📸 Chụp ảnh đồng hồ áp suất vạch xanh & Tem BCA gửi qua Zalo trước khi xuất kho
                </span>
              </label>
            </div>

            {/* 2. Thông tin nơi nhận & Bàn giao nghiệm thu */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                Địa Điểm Giao Hàng & Bàn Giao Kỹ Thuật
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Người tiếp nhận bàn giao *</label>
                  <input
                    type="text"
                    required
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-red-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Số điện thoại người nhận *</label>
                  <input
                    type="tel"
                    required
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-red-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Địa chỉ giao & lắp đặt chi tiết *</label>
                <input
                  type="text"
                  required
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  placeholder="Số nhà, tầng, tên công trình/tòa nhà, tên đường, Phường, Quận..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-red-500 bg-white"
                />
              </div>

              {/* Mục đích sử dụng thiết bị */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Mục đích trang bị thiết bị PCCC:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'apartment', label: '🏢 Căn hộ / Gia đình' },
                    { id: 'factory', label: '🏭 Nhà xưởng / Kho' },
                    { id: 'official_inspection', label: '🏛️ Nghiệm thu PCCC' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPurposeType(p.id)}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                        purposeType === p.id 
                          ? 'border-red-600 bg-red-50/80 text-red-700 ring-1 ring-red-500' 
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox Xuất biên bản kiểm định & VAT */}
              <div className="p-3 bg-red-50/60 rounded-xl border border-red-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="anonymousCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-red-600 accent-red-600"
                />
                <label htmlFor="anonymousCheck" className="text-xs text-slate-800 cursor-pointer">
                  <strong className="block font-bold text-red-700 flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-red-600" />
                    Kèm Biên Bản Kiểm Định Xuất Xưởng, CO/CQ & Hóa Đơn VAT (8%)
                  </strong>
                  Kỹ thuật viên sẽ chuẩn bị sẵn phiếu bảo hành, tem kiểm định Cục CS PCCC và biên bản nghiệm thu cơ sở.
                </label>
              </div>

              {/* Ghi chú kỹ thuật bàn giao */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Ghi chú bàn giao & Lắp đặt kỹ thuật:</label>
                <input
                  type="text"
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  placeholder="VD: Kiểm tra kỹ tem chì niêm phong và đồng hồ áp suất vạch xanh trước khi nhận..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-red-500 bg-white font-sans text-slate-800"
                />
              </div>
            </div>

            {/* 3. Thời gian giao hàng */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center font-bold">3</span>
                  Thời Gian & Tiến Độ Bàn Giao
                </h3>
                {isFreeshipEligible ? (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Miễn Phí Vận Chuyển</span>
                  </span>
                ) : shippingSettings?.isFreeShippingEnabled && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    Freeship từ {Number(shippingSettings.freeShippingThreshold || 1000000).toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeliveryType('timeslot')}
                  className={`p-3 rounded-xl text-left border text-xs transition-all ${
                    deliveryType === 'timeslot' 
                      ? 'border-red-600 bg-red-50/50 font-bold text-slate-900 ring-1 ring-red-500' 
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">📅 Khung giờ bàn giao tiêu chuẩn</span>
                    <span className={`text-[11px] font-mono font-bold ${isFreeshipEligible ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {getShippingFee('timeslot', cartTotal) === 0 ? 'Freeship (0đ)' : `${getShippingFee('timeslot', cartTotal).toLocaleString('vi-VN')}đ`}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Giao đúng giờ hẹn tiện sắp xếp nhân sự</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('express')}
                  className={`p-3 rounded-xl text-left border text-xs transition-all ${
                    deliveryType === 'express' 
                      ? 'border-red-600 bg-red-50 font-bold text-red-700 ring-1 ring-red-600' 
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">⚡ Hỏa tốc 60 - 90 phút</span>
                    <span className="text-[11px] font-mono font-bold text-red-600">
                      {getShippingFee('express', cartTotal).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Ưu tiên xuất kho khẩn cấp cho cơ sở</span>
                </button>
              </div>

              {deliveryType === 'timeslot' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                      Chọn ngày bàn giao thiết bị:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setDateMode('today')}
                        className={`text-[11px] px-3.5 py-2 rounded-xl border transition-all ${
                          dateMode === 'today' 
                            ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {dynamicDates.today.label}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDateMode('tomorrow')}
                        className={`text-[11px] px-3.5 py-2 rounded-xl border transition-all ${
                          dateMode === 'tomorrow' 
                            ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {dynamicDates.tomorrow.label}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDateMode('day_after')}
                        className={`text-[11px] px-3.5 py-2 rounded-xl border transition-all ${
                          dateMode === 'day_after' 
                            ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {dynamicDates.dayAfter.label}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDateMode('custom')}
                        className={`text-[11px] px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                          dateMode === 'custom' 
                            ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Chọn ngày khác 📅</span>
                      </button>
                    </div>

                    {dateMode === 'custom' && (
                      <div className="mt-2.5 p-3 bg-white rounded-xl border border-slate-300 flex items-center gap-3 text-xs">
                        <label className="font-bold text-slate-700">Ngày bàn giao:</label>
                        <input
                          type="date"
                          min={dynamicDates.minISO}
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          className="p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-red-500 bg-slate-50"
                        />
                        <span className="text-[11px] text-slate-500 italic">
                          (Bàn giao theo lịch nghiệm thu công trình)
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                      Khung giờ giao ({currentDeliveryDateLabel}):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {['08:00 - 10:00', '10:00 - 12:00', '14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00', 'Theo thỏa thuận dự án'].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 px-2.5 text-xs rounded-xl border transition-all text-center ${
                            selectedSlot === slot 
                              ? 'bg-red-600 text-white font-bold border-red-600 shadow-xs' 
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Phương thức thanh toán */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center font-bold">4</span>
                Phương Thức Thanh Toán
              </h3>

              <div className="space-y-2">
                {[
                  { id: 'qr_transfer', label: 'Quét mã VietQR chuyển khoản tức thì (Miễn phí)', badge: 'Khuyên dùng', icon: '📱' },
                  { id: 'momo', label: 'Ví MoMo / ZaloPay', badge: 'Tiện lợi', icon: '🟣' },
                  { id: 'card', label: 'Thẻ Doanh nghiệp / Visa / Mastercard', badge: 'Doanh nghiệp', icon: '💳' },
                ].map((m) => (
                  <label
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      paymentMethod === m.id 
                        ? 'border-red-600 bg-white ring-1 ring-red-600 shadow-sm' 
                        : 'border-slate-200 bg-white/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{m.icon}</span>
                      <span className="font-bold text-slate-800">{m.label}</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                      {m.badge}
                    </span>
                  </label>
                ))}
              </div>

              {/* Dynamic VietQR Preview Mockup */}
              {paymentMethod === 'qr_transfer' && (
                <div className="p-4 bg-white rounded-xl border border-dashed border-red-300 flex items-center gap-4">
                  <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-1.5 flex-shrink-0">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FLAMEGUARD_SAFETY_ORDER_PAYMENT" 
                      alt="VietQR" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">Mã VietQR Tự Động</span>
                    <p>Ngân hàng: <strong>Techcombank (1903 888 666)</strong></p>
                    <p>Chủ TK: <strong>FLAMEGUARD PRO VIETNAM</strong></p>
                    <p className="text-emerald-700 font-bold">Kích hoạt bảo hành & tem kiểm định ngay khi nhận tiền</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (5 Cột) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 sticky top-4">
              <h3 className="font-heading text-base font-bold text-slate-900 pb-2 border-b border-slate-200">
                Tóm Tắt Đơn Thiết Bị ({cart.length})
              </h3>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.cartItemId || item.id} className="flex gap-2.5 text-xs pb-2 border-b border-slate-200">
                    <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-lg border flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-heading font-bold text-slate-900 truncate">{item.name}</h5>
                      <span className="text-[10px] text-slate-500">{item.size?.name || 'Tiêu chuẩn'} × {item.quantity}</span>
                      <span className="block font-black text-red-600 mt-0.5 font-mono">{item.price.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Khung Nhập Mã Voucher / Khuyến Mãi */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <span>🎟️</span> Mã Giảm Giá / Voucher:
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Đã áp dụng
                    </span>
                  )}
                </div>

                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Nhập mã (VD: ANTOAN10)"
                      className="flex-1 p-2 text-xs uppercase font-mono rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplying || !couponInput.trim()}
                      className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                    >
                      {isApplying ? '...' : 'Áp Dụng'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                    <div>
                      <strong className="font-mono text-slate-900 block font-bold">{appliedCoupon.code}</strong>
                      <span className="text-[11px] text-emerald-700">{appliedCoupon.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-red-600 hover:text-red-700 font-bold text-xs p-1"
                      title="Gỡ mã giảm giá"
                    >
                      ✕ Gỡ
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-[11px] text-red-600 italic">{couponError}</p>
                )}
              </div>

              {/* Chi phí */}
              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span>Tiền thiết bị & phụ kiện:</span>
                  <span className="font-bold text-slate-900 font-mono">{cartTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Phí vận chuyển chuyên dụng:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {isFreeshipEligible ? (
                      <span className="text-emerald-700 font-bold">Freeship (0đ)</span>
                    ) : shippingSettings?.shippingMode === 'admin_confirm' ? (
                      <span className="text-red-600 font-bold text-[11px]">Kỹ thuật viên báo sau khi khảo sát (0đ)</span>
                    ) : (
                      `${shippingFee.toLocaleString('vi-VN')}đ`
                    )}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Ưu đãi voucher ({appliedCoupon.code}):</span>
                    <span className="font-mono">-{discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}

                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Thẻ hướng dẫn & Tem kiểm định BCA:</span>
                  <span>Miễn phí (0đ)</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-500 block">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-red-600 font-mono">
                    {grandTotal.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-1 rounded-md border border-red-200">
                  ĐÃ GỒM VAT
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-4 rounded-xl shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-white" />
                <span>Xác Nhận Đặt Hàng & Xuất Kho PCCC</span>
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => openPersonalZaloChat(shopZaloPhone, 'Chào kỹ sư FLAMEGUARD PRO, tôi đang ở bước thanh toán đơn thiết bị PCCC và cần hỗ trợ tư vấn gấp!')}
                  className="text-xs text-[#0068FF] hover:underline font-bold inline-flex items-center gap-1"
                >
                  <span>💬 Cần hỗ trợ xuất hóa đơn VAT? Chat Zalo ({shopZaloPhone})</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 text-center space-y-1">
                <p>🔒 Bảo mật thông tin đơn hàng theo tiêu chuẩn an ninh mạng</p>
                <p>🛡️ Đổi mới 100% nếu áp suất bình tụt khỏi vạch xanh khi giao</p>
              </div>

            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
