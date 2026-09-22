import React from 'react';
import { useShop } from '../context/ShopContext';
import { openPersonalZaloChat } from '../services/zaloService';
import { openFacebookMessenger } from '../services/facebookService';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';
import { ZaloIcon } from './ZaloIcon';

export const CartDrawer = () => {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateQuantity, 
    cartTotal,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    setIsCheckoutOpen,
    shopZaloPhone,
    facebookSettings
  } = useShop();

  const [couponInput, setCouponInput] = React.useState('');
  const [couponError, setCouponError] = React.useState('');
  const [isApplying, setIsApplying] = React.useState(false);

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

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧯</span>
              <h3 className="font-heading text-lg font-bold text-white">
                Giỏ Thiết Bị PCCC ({cart.length})
              </h3>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-4xl block mb-2">🧯</span>
                <p className="font-heading text-base font-bold text-slate-800">Giỏ thiết bị của bạn đang trống</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Trang bị phương tiện PCCC để bảo vệ gia đình và công trình ngay hôm nay!</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-red-600/25"
                >
                  Khám phá thiết bị PCCC
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const itemKey = item.cartItemId || item.id;
                const addOnsTotal = (item.addOns || []).reduce((s, a) => s + a.price, 0);
                const itemSingleTotal = item.price + addOnsTotal;

                return (
                  <div 
                    key={itemKey}
                    className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 relative group"
                  >
                    <div className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-20 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-heading text-sm font-bold text-slate-900 truncate">
                            {item.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(itemKey)}
                            className="text-slate-400 hover:text-red-600 p-0.5 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <span className="text-[11px] bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold inline-block mt-1">
                          {item.size?.name || 'Tiêu chuẩn'}
                        </span>

                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Kệ/Giá: <em>{item.wrapper?.name || 'Giá treo tiêu chuẩn'}</em>
                        </p>
                      </div>
                    </div>

                    {/* Vị trí lắp đặt & Thẻ Hướng Dẫn */}
                    {item.cardMessage && (
                      <div className="p-2 bg-white rounded-lg border border-dashed border-red-200 text-[11px]">
                        <span className="text-red-600 font-bold block text-[10px]">📍 Vị trí & Thẻ hướng dẫn:</span>
                        <p className="text-slate-700 font-mono text-[11px] line-clamp-2">
                          "{item.cardMessage}"
                        </p>
                      </div>
                    )}

                    {/* Add-ons list */}
                    {item.addOns?.length > 0 && (
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        {item.addOns.map((a, i) => (
                          <div key={i} className="flex justify-between">
                            <span>+ {a.name}</span>
                            <span className="font-bold text-slate-800 font-mono">{a.price.toLocaleString('vi-VN')}đ</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Price & Quantity Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                        <button
                          onClick={() => updateQuantity(itemKey, -1)}
                          className="p-1 text-slate-500 hover:text-black"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(itemKey, 1)}
                          className="p-1 text-slate-500 hover:text-black"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-sm font-black text-red-600 font-mono">
                        {(itemSingleTotal * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout */}
          {cart.length > 0 && (
            <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4">
              
              {/* Khung Nhập Mã Giảm Giá Voucher */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5 text-red-600" /> Mã Ưu Đãi / Khuyến Mãi PCCC:
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Đã áp dụng mã
                    </span>
                  )}
                </div>

                {!appliedCoupon ? (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="VD: ANTOAN10, CHUNGCU50K"
                      className="flex-1 p-2 text-xs uppercase font-mono rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="submit"
                      disabled={isApplying || !couponInput.trim()}
                      className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                    >
                      {isApplying ? '...' : 'Áp Dụng'}
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                    <div>
                      <strong className="font-mono text-slate-900 block font-bold">{appliedCoupon.code}</strong>
                      <span className="text-[11px] text-emerald-700">{appliedCoupon.name}</span>
                    </div>
                    <button
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

              {/* Chi tiết chi phí */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Tạm tính thiết bị & phụ kiện:</span>
                  <span className="font-bold text-slate-900 font-mono">{cartTotal.toLocaleString('vi-VN')}đ</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Ưu đãi voucher ({appliedCoupon.code}):</span>
                    <span className="font-mono">-{discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}

                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Miễn phí Thẻ Hướng Dẫn & Tem Kiểm Định BCA:</span>
                  <span>0đ</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">Tổng thanh toán:</span>
                <span className="text-xl font-black text-red-600 font-mono">
                  {Math.max(0, cartTotal - discountAmount).toLocaleString('vi-VN')}đ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {facebookSettings?.isEnabled !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      const itemsSummary = cart.map(it => it.name).join(', ');
                      openFacebookMessenger(
                        facebookSettings?.pageId,
                        `Chào FLAMEGUARD PRO, tôi đang chọn các thiết bị PCCC trong giỏ: ${itemsSummary}. Nhờ kỹ sư kiểm tra báo giá và hồ sơ kiểm định giúp tôi!`
                      );
                    }}
                    className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    title="Tư vấn đơn hàng qua Facebook Messenger"
                  >
                    <span>Messenger</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const itemsSummary = cart.map(it => it.name).join(', ');
                    openPersonalZaloChat(
                      shopZaloPhone,
                      `Chào kỹ sư FLAMEGUARD PRO, tôi đang chọn các thiết bị: ${itemsSummary}. Nhờ kỹ sư tư vấn thêm quy chuẩn lắp đặt!`
                    );
                  }}
                  className={`py-2.5 px-2 bg-blue-50 hover:bg-blue-100 text-[#0068FF] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-blue-200 ${
                    facebookSettings?.isEnabled === false ? 'col-span-2' : ''
                  }`}
                  title={`Chat Zalo (${shopZaloPhone})`}
                >
                  <ZaloIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>Chat Zalo</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Xác Nhận Đặt Hàng & Giao Hỏa Tốc</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% thiết bị dán tem kiểm định Bộ Công An & đo áp suất trước khi xuất kho
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
