import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Printer, X, ShieldCheck, FileCheck, QrCode } from 'lucide-react';

export const PrintInvoiceModal = ({ isOpen, onClose, order }) => {
  const { shopZaloPhone } = useShop();
  const [printSection, setPrintSection] = useState('all'); // 'all' | 'invoice_only' | 'card_only'

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedAmount = Number(order.totalAmount || 0).toLocaleString('vi-VN');

  return (
    <div 
      id="invoice-print-modal-container"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      {/* CSS Chuyên dụng cho in ấn và xuất file PDF */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          
          body * {
            visibility: hidden !important;
          }

          #invoice-printable-content,
          #invoice-printable-content * {
            visibility: visible !important;
          }

          #invoice-print-modal-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
          }

          #invoice-modal-card {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-page-break {
            break-before: page !important;
            page-break-before: always !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div 
        id="invoice-modal-card" 
        className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-slate-300 my-auto text-slate-900 animate-fade-in"
      >
        
        {/* Modal Header Controls (Ẩn hoàn toàn khi In) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 no-print border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold leading-tight">
                In Phiếu Bàn Giao & Biên Bản Nghiệm Thu PCCC
              </h3>
              <p className="text-[11px] text-red-300">Đơn hàng: #{order.orderCode || order.id} • {order.customerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bộ chọn phần in */}
            <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-bold text-white border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintSection('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  printSection === 'all' ? 'bg-red-600 text-white shadow-xs' : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                In Trọn Bộ (A4)
              </button>
              <button
                type="button"
                onClick={() => setPrintSection('invoice_only')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  printSection === 'invoice_only' ? 'bg-red-600 text-white shadow-xs' : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                Chỉ Biên Bản Bàn Giao
              </button>
              <button
                type="button"
                onClick={() => setPrintSection('card_only')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  printSection === 'card_only' ? 'bg-red-600 text-white shadow-xs' : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                Chỉ Thẻ Dạ Quang
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ml-1"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white text-base transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Area (Khu vực duy nhất được xuất ra trang in / PDF) */}
        <div id="invoice-printable-content" className="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto">
          
          {/* ======================================================== */}
          {/* PHẦN 1: BIÊN BẢN BÀN GIAO THIẾT BỊ & PHIẾU XUẤT KHO */}
          {/* ======================================================== */}
          {(printSection === 'all' || printSection === 'invoice_only') && (
            <div className="border-2 border-slate-900 p-6 rounded-2xl space-y-4 bg-white print-avoid-break">
              
              {/* Header Công ty & Mã Biên Bản */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                    FLAMEGUARD PRO VIETNAM
                  </h2>
                  <p className="text-[11px] text-slate-700 font-bold">HỆ THỐNG CUNG CẤP THIẾT BỊ PCCC CHUẨN KIỂM ĐỊNH BCA</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">📍 Kho tổng: 128 Nguyễn Trãi, Q.1, TP.HCM • Hotline kỹ thuật: {shopZaloPhone} • TCVN 3890:2023</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-700 block">BIÊN BẢN BÀN GIAO & XUẤT KHO</span>
                  <span className="font-mono text-xl font-black text-slate-950 block">
                    #{order.orderCode || order.id}
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold">Ngày lập: {order.createdAt || new Date().toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              {/* Thông Tin Bên Giao & Bên Nhận */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Bên Giao (FLAMEGUARD PRO):</span>
                  <p className="font-bold text-slate-950 text-sm">Kỹ Sư Kiểm Định Nguyễn Tuấn</p>
                  <p className="text-slate-700">Bộ phận: Trạm Kiểm Định & Cấp Tem BCA</p>
                  <p className="text-slate-700">Hotline bàn giao: <span className="font-mono font-bold text-red-600">{shopZaloPhone}</span></p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Bên Tiếp Nhận & Nghiệm Thu:</span>
                  <p className="font-bold text-slate-950 text-sm">{order.receiverName || order.customerName || 'Người nhận'}</p>
                  <p className="text-slate-700">SĐT: <span className="font-mono font-bold text-slate-950">{order.receiverPhone || order.customerPhone || 'Chưa cung cấp'}</span></p>
                  <p className="text-slate-800 leading-snug">📍 <strong>Địa chỉ lắp đặt:</strong> {order.receiverAddress || 'Chưa cung cấp'}</p>
                  <p className="text-red-700 font-bold pt-0.5">⏱️ Tiến độ bàn giao: {order.deliverySlot}</p>
                </div>
              </div>

              {/* Bảng Chi Tiết Thiết Bị & Kiểm Định */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 w-10 text-center">STT</th>
                      <th className="p-2 border-r border-slate-300">Tên Thiết Bị & Thông Số Kiểm Định</th>
                      <th className="p-2 border-r border-slate-300 w-28 text-center">Tình Trạng Áp Suất</th>
                      <th className="p-2 text-right w-32">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-center text-slate-600 font-mono border-r border-slate-200">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-950 border-r border-slate-200">
                            {item.name}
                            <span className="block text-[10px] text-emerald-700 font-normal">✓ Đã dán tem kiểm định Bộ Công An • Chốt chì nguyên seal</span>
                          </td>
                          <td className="p-2 text-center text-emerald-700 font-bold border-r border-slate-200 text-[11px]">
                            ✓ Vạch xanh (1.4 MPa)
                          </td>
                          <td className="p-2 text-right font-black text-slate-900 font-mono">
                            {Number(item.price || 0).toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-2 text-center font-mono border-r border-slate-200">1</td>
                        <td className="p-2 font-bold text-slate-950 border-r border-slate-200">
                          {order.productName}
                          <span className="block text-[10px] text-emerald-700 font-normal">✓ Đã dán tem kiểm định Bộ Công An • Chốt chì nguyên seal</span>
                        </td>
                        <td className="p-2 text-center text-emerald-700 font-bold border-r border-slate-200 text-[11px]">
                          ✓ Vạch xanh (1.4 MPa)
                        </td>
                        <td className="p-2 text-right font-black font-mono">{formattedAmount}đ</td>
                      </tr>
                    )}

                    {/* Vận chuyển */}
                    <tr className="bg-slate-50 text-slate-800">
                      <td className="p-2 text-center font-mono border-r border-slate-200">#</td>
                      <td colSpan={2} className="p-2 font-bold border-r border-slate-200">
                        🚚 Vận chuyển chuyên dụng phương tiện PCCC
                        {order.isShippingConfirmed && <span className="text-[10px] text-emerald-800 font-bold ml-1.5">(Đã xác nhận)</span>}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {Number(order.shippingFee || 0) === 0 ? 'Freeship (0đ)' : `${Number(order.shippingFee).toLocaleString('vi-VN')}đ`}
                      </td>
                    </tr>

                    {/* Chiết khấu */}
                    {Number(order.discountAmount || 0) > 0 && (
                      <tr className="bg-rose-50/50 text-rose-800">
                        <td className="p-2 text-center font-mono border-r border-slate-200">%</td>
                        <td colSpan={2} className="p-2 font-bold border-r border-slate-200">
                          🎁 Chiết khấu ưu đãi voucher doanh nghiệp / chung cư
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-rose-700">
                          -{Number(order.discountAmount).toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    )}

                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <td colSpan={3} className="p-2 text-right text-slate-900 font-bold">
                        TỔNG CỘNG THANH TOÁN (ĐÃ GỒM SHIP & VAT 8%):
                      </td>
                      <td className="p-2 text-right font-black text-red-600 text-sm font-mono">
                        {formattedAmount}đ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Chữ Ký 3 Bên */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-4 border-t border-slate-300 text-slate-600">
                <div>
                  <span className="font-bold block text-slate-900">Kỹ Sư Kiểm Định PCCC</span>
                  <span className="text-[10px] italic">Nguyễn Tuấn (Ký & Đóng dấu kiểm định)</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-900">Đội Vận Chuyển PCCC</span>
                  <span className="text-[10px] italic">FLAMEGUARD Logistics (Ký nhận)</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-900">Đại Diện Tiếp Nhận & Nghiệm Thu</span>
                  <span className="text-[10px] italic">(Ký và ghi rõ họ tên / Chức vụ)</span>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* PHẦN 2: THẺ HƯỚNG DẪN THAO TÁC DẠ QUANG DÁN CẠNH BÌNH */}
          {/* ======================================================== */}
          {(printSection === 'all' || printSection === 'card_only') && (
            <div className="border-2 border-red-600 p-6 rounded-2xl bg-amber-50/50 relative overflow-hidden print-avoid-break">
              
              <div className="flex items-center justify-between pb-2.5 border-b border-red-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-red-600" />
                  <span className="font-heading text-sm font-black text-red-800 uppercase tracking-widest">
                    THẺ HƯỚNG DẪN THAO TÁC KHẨN CẤP & VỊ TRÍ BỐ TRÍ
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono font-bold bg-white px-2 py-0.5 rounded border border-red-200">
                  TCVN 3890:2023
                </span>
              </div>

              <div className="py-4 px-2 sm:px-6 space-y-3">
                <p className="text-xs text-slate-700">
                  Công trình / Vị trí bàn giao: <strong className="text-sm text-slate-950 font-bold">{order.receiverName}</strong>
                </p>
                
                <div className="p-4 bg-white rounded-xl border-2 border-dashed border-red-400 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-red-700 block uppercase tracking-wider">
                    📋 HƯỚNG DẪN THAO TÁC DẬP LỬA NHANH (QUY TẮC PASS):
                  </span>
                  <p className="font-mono text-xs text-slate-800 leading-relaxed font-bold">
                    {order.cardMessage || '1. Giật chốt hãm kẹp chì. 2. Hướng vòi phun vào gốc ngọn lửa. 3. Giữ cự ly an toàn 1.5 - 2m. 4. Bóp chặt cò van đến khi lửa tắt hẳn.'}
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-700 pt-1">
                  <span>Cán bộ an toàn cơ sở: <strong className="text-slate-900">{order.senderSign || order.customerName || 'Chủ hộ / Quản trị viên'}</strong></span>
                  <span className="text-red-700 font-bold flex items-center gap-1 font-mono text-[11px]">
                    <QrCode className="w-3.5 h-3.5" /> Tem BCA: FG-BCA-2026
                  </span>
                </div>
              </div>

              <div className="text-center border-t border-red-200 pt-2 text-[10px] text-slate-500 font-mono">
                🧯 Đường dây nóng Cảnh sát PCCC: 114 • Hỗ trợ kỹ thuật nạp sạc FLAMEGUARD: {shopZaloPhone}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
