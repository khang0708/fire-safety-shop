import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Award, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Flower2, 
  CheckCircle2, 
  Clock,
  PieChart,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { generateNativeXlsxBlob } from '../utils/excelGenerator';

const statusLabels = {
  'NEW': 'Tiếp nhận đơn',
  'ARRANGING': 'Đo áp suất & Dán tem BCA',
  'PHOTO_READY': 'Chờ duyệt ảnh áp suất',
  'DELIVERING': 'Đang vận chuyển PCCC',
  'COMPLETED': 'Đã hoàn tất nghiệm thu'
};

// Hàm chuẩn hóa trích xuất ngày thực tế của đơn hàng từ orderDate, createdAt hoặc deliverySlot
export const getOrderDateObj = (order) => {
  if (!order) return new Date();

  // 1. Nếu có trường orderDate chuẩn ISO (VD: 2026-08-31)
  if (order.orderDate) {
    const d = new Date(order.orderDate);
    if (!isNaN(d.getTime())) return d;
  }

  const now = new Date();
  const cTime = order.createdAt || '';
  const dSlot = order.deliverySlot || '';

  // 2. Tìm mẫu ngày DD/MM/YYYY hoặc DD/MM trong createdAt hoặc deliverySlot
  const matchDate = (cTime + ' ' + dSlot).match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (matchDate) {
    const day = parseInt(matchDate[1], 10);
    const month = parseInt(matchDate[2], 10) - 1;
    const year = matchDate[3] ? parseInt(matchDate[3], 10) : now.getFullYear();
    const parsed = new Date(year, month, day);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // 3. Fallback: ngày hiện tại
  return now;
};

export const SalesAnalyticsView = ({ orders = [], products = [] }) => {
  // Bộ lọc dữ liệu
  const [timeRange, setTimeRange] = useState('7_days'); // 'today' | '7_days' | 'month' | 'all' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [exportToast, setExportToast] = useState('');

  // 1. ÁP DỤNG BỘ LỌC LÊN DANH SÁCH ĐƠN HÀNG
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    return orders.filter(order => {
      // 1. Lọc theo khoảng thời gian thực tế
      const orderDate = getOrderDateObj(order);
      
      if (timeRange === 'today') {
        if (orderDate < todayStart || orderDate > todayEnd) return false;
      } else if (timeRange === '7_days') {
        if (orderDate < sevenDaysAgo || orderDate > todayEnd) return false;
      } else if (timeRange === 'month') {
        if (orderDate < startOfMonth || orderDate > todayEnd) return false;
      } else if (timeRange === 'custom') {
        if (startDate) {
          const s = new Date(startDate + 'T00:00:00');
          if (orderDate < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate + 'T23:59:59');
          if (orderDate > e) return false;
        }
      }

      // 2. Lọc trạng thái
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // 3. Lọc từ khóa tìm kiếm (Mã đơn, Tên người đặt, SĐT người đặt, Tên người nhận, Mẫu hoa)
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const matchCode = (order.orderCode || order.id || '').toLowerCase().includes(q);
        const matchCustomer = (order.customerName || '').toLowerCase().includes(q);
        const matchCustomerPhone = (order.customerPhone || '').toLowerCase().includes(q);
        const matchReceiver = (order.receiverName || '').toLowerCase().includes(q);
        const matchReceiverPhone = (order.receiverPhone || '').toLowerCase().includes(q);
        const matchProduct = (order.productName || '').toLowerCase().includes(q);
        const matchAddress = (order.receiverAddress || '').toLowerCase().includes(q);

        if (!matchCode && !matchCustomer && !matchCustomerPhone && !matchReceiver && !matchReceiverPhone && !matchProduct && !matchAddress) {
          return false;
        }
      }

      // 4. Lọc theo khoảng giá tiền
      const total = Number(order.totalAmount || 0);
      if (minPrice && total < Number(minPrice)) return false;
      if (maxPrice && total > Number(maxPrice)) return false;

      return true;
    });
  }, [orders, timeRange, startDate, endDate, statusFilter, searchKeyword, minPrice, maxPrice]);

  // 2. TÍNH TOÁN SỐ LIỆU THỐNG KÊ DỰA TRÊN 100% ĐƠN HÀNG THẬT
  const analyticsData = useMemo(() => {
    const totalOrdersCount = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
    const approvedPhotosCount = filteredOrders.filter(o => o.isApproved || o.status === 'DELIVERING' || o.status === 'COMPLETED').length;
    const approvalRate = totalOrdersCount > 0 ? Math.round((approvedPhotosCount / totalOrdersCount) * 100) : 100;

    // 1. Top mẫu hoa bán chạy từ dữ liệu thật
    const productSalesMap = {};
    filteredOrders.forEach(order => {
      const pName = order.productName?.split('(')[0]?.trim() || 'Thiết Bị PCCC';
      if (!productSalesMap[pName]) {
        productSalesMap[pName] = {
          name: pName,
          count: 0,
          revenue: 0,
          image: order.proofPhotoUrl || order.catalogSamplePhoto || '/images/abc-powder-4kg.jpg'
        };
      }
      productSalesMap[pName].count += 1;
      productSalesMap[pName].revenue += Number(order.totalAmount || 0);
    });

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, 5);

    // 2. Biểu đồ doanh thu 7 ngày thực tế (Tính đúng theo ngày tạo & khung giờ đơn)
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const now = new Date();
    const daysData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayOfWeek = dayNames[d.getDay()];
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = `${dayNum}/${monthNum}`;
      const isToday = i === 0;
      const dayLabel = isToday ? `Hôm nay (${dateStr})` : `${dayOfWeek} (${dateStr})`;

      const dYear = d.getFullYear();
      const dMonth = d.getMonth();
      const dDate = d.getDate();

      // Khớp chính xác đơn hàng theo ngày thực tế
      const matchedOrders = filteredOrders.filter(order => {
        const oDate = getOrderDateObj(order);
        return oDate.getFullYear() === dYear && oDate.getMonth() === dMonth && oDate.getDate() === dDate;
      });

      const dayRevenue = matchedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const dayOrdersCount = matchedOrders.length;

      daysData.push({
        day: dayLabel,
        shortDay: isToday ? 'Hôm nay' : dayOfWeek,
        dateFormatted: dateStr,
        revenue: dayRevenue,
        orders: dayOrdersCount
      });
    }

    // Nếu các ngày trước chưa có đơn lẻ (do tạo test hôm nay), hiển thị chính xác ngày hôm nay với doanh thu thật
    const maxDayRevenue = Math.max(...daysData.map(d => d.revenue), 1);
    const peakDay = daysData.reduce((max, d) => (d.revenue > max.revenue ? d : max), daysData[daysData.length - 1]);
    const peakDayLabel = peakDay && peakDay.revenue > 0 
      ? `Cao điểm: ${peakDay.shortDay} (${peakDay.revenue.toLocaleString('vi-VN')}đ)`
      : `Ghi nhận ${totalOrdersCount} đơn thực tế`;

    // 3. Phân bổ Khu Vực Lắp Đặt 100% dựa trên hướng dẫn & tên sản phẩm thật
    let householdCount = 0;
    let officeCount = 0;
    let factoryCount = 0;
    let vehicleCount = 0;

    filteredOrders.forEach(o => {
      const text = `${o.cardMessage || ''} ${o.productName || ''} ${o.senderSign || ''}`.toLowerCase();
      if (/bếp|gia đình|chung cư|căn hộ|nhà ở|phòng ngủ|ban công/.test(text)) {
        householdCount++;
      } else if (/văn phòng|công ty|server|máy tính|tòa nhà|công sở/.test(text)) {
        officeCount++;
      } else if (/xưởng|kho|pallet|nhà máy|sản xuất|cơ khí/.test(text)) {
        factoryCount++;
      } else {
        vehicleCount++;
      }
    });

    const divisor = totalOrdersCount > 0 ? totalOrdersCount : 1;
    const occasionsData = [
      { label: 'Hộ Gia Đình & Chung Cư', count: householdCount, percent: Math.round((householdCount / divisor) * 100), color: '#DC2626' },
      { label: 'Văn Phòng & Server', count: officeCount, percent: Math.round((officeCount / divisor) * 100), color: '#2563EB' },
      { label: 'Nhà Xưởng & Kho Bãi', count: factoryCount, percent: Math.round((factoryCount / divisor) * 100), color: '#D97706' },
      { label: 'Ô Tô & Khác', count: vehicleCount, percent: Math.round((vehicleCount / divisor) * 100), color: '#059669' },
    ];

    // Gợi ý chiến lược thật dựa trên số liệu thực tế
    const topOccasion = [...occasionsData].sort((a, b) => b.count - a.count)[0];
    const topProduct = topSellingProducts[0];
    let strategyAdvice = 'Chưa có dữ liệu đơn hàng thỏa mãn bộ lọc.';
    if (totalOrdersCount > 0 && topOccasion && topProduct) {
      strategyAdvice = `Khu vực "${topOccasion.label}" đang chiếm ${topOccasion.percent}% với ${topOccasion.count} đơn hàng. Thiết bị "${topProduct.name}" bán chạy nhất, mang về ${(topProduct.revenue || 0).toLocaleString('vi-VN')}đ doanh thu thực tế.`;
    }

    return {
      totalRevenue,
      totalOrdersCount,
      averageOrderValue,
      approvalRate,
      topSellingProducts,
      daysData,
      maxDayRevenue,
      peakDayLabel,
      occasionsData,
      strategyAdvice
    };
  }, [filteredOrders]);

  // 3. XUẤT BÁO CÁO EXCEL (.CSV UTF-8 BOM CHUẨN - KHÔNG BỊ CẢNH BÁO EXTENSION MISMATCH)
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      alert('Không có dữ liệu đơn hàng nào khớp với bộ lọc hiện tại để xuất!');
      return;
    }

    const now = new Date();
    const exportTimeStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateFileStr = now.toISOString().slice(0, 10);

    const statusLabels = {
      'NEW': 'Tiếp nhận đơn',
      'ARRANGING': 'Đo áp suất & Dán tem BCA',
      'PHOTO_READY': 'Chờ duyệt ảnh áp suất',
      'DELIVERING': 'Đang vận chuyển PCCC',
      'COMPLETED': 'Đã hoàn tất nghiệm thu'
    };

    const totalRevenueExport = filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const avgOrderVal = Math.round(totalRevenueExport / filteredOrders.length);
    const approvedCount = filteredOrders.filter(o => o.isApproved || o.status === 'DELIVERING' || o.status === 'COMPLETED').length;
    const approvalRatePercent = Math.round((approvedCount / filteredOrders.length) * 100);

    // Xây dựng mô tả bộ lọc đang áp dụng
    const timeRangeLabels = {
      '7_days': '7 ngày gần nhất',
      'today': 'Hôm nay',
      'month': 'Tháng này',
      'all': 'Toàn thời gian',
      'custom': `Tùy chỉnh (${startDate || 'Từ đầu'} đến ${endDate || 'Hiện tại'})`
    };

    const filterDesc = [
      `Thời gian: ${timeRangeLabels[timeRange] || timeRange}`,
      statusFilter !== 'all' ? `Trạng thái: ${statusLabels[statusFilter] || statusFilter}` : 'Trạng thái: Tất cả',
      searchKeyword ? `Từ khóa: "${searchKeyword}"` : null,
      (minPrice || maxPrice) ? `Khoảng giá: ${minPrice ? Number(minPrice).toLocaleString('vi-VN') + 'đ' : '0đ'} - ${maxPrice ? Number(maxPrice).toLocaleString('vi-VN') + 'đ' : 'Vô cực'}` : null
    ].filter(Boolean).join(' | ');

    // Xuất file OpenXML (.xlsx) chuẩn native 100% không bị cảnh báo định dạng
    const blob = generateNativeXlsxBlob({
      filteredOrders,
      totalRevenueExport,
      avgOrderVal,
      approvalRatePercent,
      approvedCount,
      exportTimeStr,
      filterDesc,
      statusLabels
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_Doanh_Thu_Flora_Bloom_${dateFileStr}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast(`🎉 Đã xuất thành công báo cáo ${filteredOrders.length} đơn hàng ra file Excel Native (.XLSX) chuẩn không lỗi!`);
    setTimeout(() => setExportToast(''), 4000);
  };

  // Hàm xuất CSV bổ sung (nhẹ, hỗ trợ import hệ thống khác)
  const handleExportCsv = () => {
    const dateFileStr = new Date().toISOString().slice(0, 10);
    const escapeCsv = (str) => `"${String(str ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['STT', 'Mã Đơn', 'Thời Gian', 'Khách Đặt', 'SĐT Khách', 'Người Nhận', 'SĐT Nhận', 'Địa Chỉ', 'Khung Giờ', 'Thiết Bị PCCC', 'Voucher', 'Giảm Giá', 'Phí Ship', 'Tổng Tiền', 'Trạng Thái'].map(escapeCsv).join(',')
    ];

    filteredOrders.forEach((o, idx) => {
      lines.push([
        idx + 1,
        `="""${o.orderCode || o.id}"""`,
        escapeCsv(o.createdAt || ''),
        escapeCsv(o.customerName || ''),
        `="""${o.customerPhone || ''}"""`,
        escapeCsv(o.receiverName || ''),
        `="""${o.receiverPhone || ''}"""`,
        escapeCsv(o.receiverAddress || ''),
        escapeCsv(o.deliverySlot || ''),
        escapeCsv(o.productName || ''),
        escapeCsv(o.discountCode || '-'),
        Number(o.discountAmount || 0),
        Number(o.shippingFee || 0),
        Number(o.totalAmount || 0),
        escapeCsv(statusLabels[o.status] || o.status || '')
      ].join(','));
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_Doanh_Thu_Flora_Bloom_${dateFileStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast(`🎉 Đã xuất thành công file CSV (${filteredOrders.length} đơn hàng)!`);
    setTimeout(() => setExportToast(''), 4000);
  };

  const handleResetFilters = () => {
    setTimeRange('7_days');
    setStatusFilter('all');
    setSearchKeyword('');
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = statusFilter !== 'all' || searchKeyword.trim() !== '' || minPrice !== '' || maxPrice !== '' || timeRange !== '7_days';

  return (
    <div className="space-y-8 animate-fade-in text-[#222523]">
      
      {/* Toast thông báo xuất Excel */}
      {exportToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1B3B2B] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{exportToast}</span>
        </div>
      )}

      {/* HEADER BÁO CÁO & THANH CÔNG CỤ XUẤT EXCEL */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-bold text-[#1B3B2B] flex items-center gap-2">
            <span>📊</span> Báo Cáo Doanh Thu & Hiệu Quả Bán Hàng
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Tổng hợp dữ liệu bán hàng thời gian thực, bộ lọc đa tiêu chí và xuất báo cáo bảng tính Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút bật/tắt bộ lọc nâng cao */}
          <button
            type="button"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all ${
              isFilterExpanded || hasActiveFilters
                ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Bộ Lọc Nâng Cao</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#E8998D] animate-ping" />
            )}
          </button>

          {/* NÚT XUẤT EXCEL FORMAT ĐẸP CHÍNH */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-[#107C41] hover:bg-[#0c6233] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
            title="Xuất báo cáo bảng tính Excel chuẩn OpenXML (.xlsx) không bị lỗi cảnh báo định dạng"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Xuất Excel Đẹp (.XLSX)</span>
            <Download className="w-3.5 h-3.5 text-white/80" />
          </button>

          {/* Nút Xuất CSV phụ */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            title="Xuất file CSV thô"
          >
            <span>.CSV</span>
          </button>
        </div>
      </div>

      {/* KHUNG BỘ LỌC ĐẦY ĐỦ (ADVANCED FILTER PANEL) */}
      {(isFilterExpanded || hasActiveFilters) && (
        <div className="bg-white p-5 rounded-3xl border border-[#E8EFEA] shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-xs font-bold text-[#1B3B2B] flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-[#5C8A70]" />
              Tiêu Chí Lọc Báo Cáo ({filteredOrders.length} / {orders.length} đơn thỏa mãn)
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Đặt Lại Mặc Định</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* 1. Lọc khoảng thời gian */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">📅 Khoảng thời gian</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B] bg-[#FAF8F5] font-semibold"
              >
                <option value="7_days">7 ngày gần nhất</option>
                <option value="today">Hôm nay</option>
                <option value="month">Tháng này</option>
                <option value="all">Toàn thời gian</option>
                <option value="custom">Tùy chọn khoảng ngày</option>
              </select>
            </div>

            {/* 2. Tìm kiếm từ khóa */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">🔍 Tìm kiếm thông tin</label>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tên khách, SĐT, mã đơn..."
                className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B] bg-[#FAF8F5]"
              />
            </div>

            {/* 3. Lọc trạng thái đơn */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">🏷️ Trạng thái đơn</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B] bg-[#FAF8F5]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="NEW">Tiếp nhận đơn</option>
                <option value="ARRANGING">Đo áp suất & Dán tem BCA</option>
                <option value="PHOTO_READY">Chờ duyệt ảnh áp suất</option>
                <option value="DELIVERING">Đang vận chuyển PCCC</option>
                <option value="COMPLETED">Đã hoàn tất nghiệm thu</option>
              </select>
            </div>

            {/* 4. Giá tối thiểu */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">💰 Giá tối thiểu (VNĐ)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="VD: 500000"
                className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B] bg-[#FAF8F5]"
              />
            </div>

            {/* 5. Giá tối đa */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">💰 Giá tối đa (VNĐ)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="VD: 2000000"
                className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B] bg-[#FAF8F5]"
              />
            </div>
          </div>

          {/* Ô chọn ngày tùy chỉnh khi timeRange === 'custom' */}
          {timeRange === 'custom' && (
            <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-gray-100 text-xs animate-fade-in">
              <span className="font-bold text-gray-700">Chọn khoảng ngày báo cáo:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Từ ngày:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold bg-[#FAF8F5]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Đến ngày:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold bg-[#FAF8F5]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4 THẺ KPI CHỈ SỐ CHÍNH (TÍNH THEO BỘ LỌC) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Tổng Doanh Thu */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8EFEA] shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-medium">Doanh Thu Đã Lọc</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-extrabold text-[#1B3B2B] font-sans">
              {analyticsData.totalRevenue.toLocaleString('vi-VN')}đ
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Tổng doanh số ghi nhận</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Tổng Số Đơn */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8EFEA] shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-medium">Số Lượng Đơn Hàng</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-extrabold text-slate-900 font-sans">
              {analyticsData.totalOrdersCount} <span className="text-xs font-normal text-slate-500">đơn thiết bị</span>
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-amber-700 font-bold mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Khớp tiêu chí lọc</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Giá Trị Đơn Trung Bình (AOV) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 font-medium">Giá Trị TB / Đơn (AOV)</span>
            <div className="w-9 h-9 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-extrabold text-slate-900 font-sans">
              {analyticsData.averageOrderValue.toLocaleString('vi-VN')}đ
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-red-600 font-bold mt-1">
              <span>Thiết bị PCCC tiêu chuẩn</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Tỷ Lệ Khách Duyệt Ảnh Đo Áp Suất */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 font-medium">Chuẩn Áp Suất Vạch Xanh</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-extrabold text-[#1B3B2B] font-sans">
              {analyticsData.approvalRate}%
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-sky-700 font-bold mt-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Duyệt ảnh trước khi giao</span>
            </div>
          </div>
        </div>

      </div>

      {/* BIỂU ĐỒ DOANH THU & PHÂN BỔ DỊP TẶNG (2 Cột) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CỘT TRÁI: BIỂU ĐỒ CỘT DOANH THU 7 NGÀY (7 Cột) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-serif text-lg font-bold text-[#1B3B2B]">
                Xu Hướng Doanh Thu 7 Ngày Gần Nhất
              </h4>
              <p className="text-xs text-gray-500">Biểu đồ thể hiện doanh thu và số lượng đơn hàng thực tế theo từng ngày</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {analyticsData.peakDayLabel}
            </span>
          </div>

          {/* Bar Chart Bars */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-gray-100">
            {analyticsData.daysData.map((d, idx) => {
              const heightPercent = Math.max(12, Math.round((d.revenue / analyticsData.maxDayRevenue) * 100));
              const isToday = idx === analyticsData.daysData.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#1B3B2B] text-white text-[10px] p-1.5 rounded-lg whitespace-nowrap shadow-md mb-1 pointer-events-none z-10">
                    <p className="font-bold">{d.revenue.toLocaleString('vi-VN')}đ</p>
                    <p className="text-emerald-200">{d.orders} đơn thực tế</p>
                  </div>

                  {/* The Bar */}
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-xl transition-all group-hover:opacity-90 ${
                      isToday 
                        ? 'bg-gradient-to-t from-[#1B3B2B] to-[#5C8A70]' 
                        : 'bg-gradient-to-t from-gray-200 to-[#E8998D]'
                    }`}
                  />
                  
                  {/* Day Label */}
                  <div className="text-center w-full">
                    <span className={`text-[10px] font-medium block truncate ${
                      isToday ? 'font-bold text-[#1B3B2B]' : 'text-gray-600'
                    }`}>
                      {d.shortDay}
                    </span>
                    <span className="text-[9px] text-gray-400 block font-mono">
                      {d.dateFormatted}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#1B3B2B]" /> Hôm nay
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#E8998D]" /> Các ngày trước
            </span>
            <span>Đơn vị: VNĐ</span>
          </div>
        </div>

        {/* CỘT PHẢI: PHÂN BỔ KHU VỰC LẮP ĐẶT (5 Cột) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <h4 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-red-600" />
              Phân Bổ Theo Khu Vực Lắp Đặt Thực Tế
            </h4>
            <p className="text-xs text-slate-500">Thống kê từ dữ liệu đơn hàng và quy chuẩn lắp đặt cơ sở</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {analyticsData.occasionsData.map((occ, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{occ.label} <span className="text-slate-400 font-normal">({occ.count} đơn)</span></span>
                  <span className="font-mono font-bold text-slate-900">{occ.percent}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${occ.percent}%`, backgroundColor: occ.color }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
            <strong className="text-slate-900 block font-bold">💡 Gợi ý chiến lược cho Kho Thiết Bị PCCC:</strong>
            <p className="leading-relaxed">{analyticsData.strategyAdvice}</p>
          </div>
        </div>

      </div>

      {/* DANH SÁCH CHI TIẾT CÁC ĐƠN HÀNG TRONG BỘ LỌC (TABLE BREAKDOWN) */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-serif text-lg font-bold text-[#1B3B2B] flex items-center gap-2">
              <span>📋</span> Bảng Kê Đơn Hàng Chi Tiết Theo Bộ Lọc ({filteredOrders.length} đơn)
            </h4>
            <p className="text-xs text-gray-500">Dữ liệu được sử dụng trực tiếp khi xuất bảng tính Excel</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-[#107C41] hover:bg-[#0c6233] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất File Excel Đẹp (.XLSX)</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl transition-all"
            >
              <span>.CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600 bg-[#FAF8F5]">
                <th className="p-3">Mã Đơn</th>
                <th className="p-3">Người Đặt & SĐT</th>
                <th className="p-3">Người Nhận & Địa Chỉ</th>
                <th className="p-3">Thiết Bị PCCC</th>
                <th className="p-3 text-right">Tổng Tiền</th>
                <th className="p-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#1B3B2B]">
                      #{o.orderCode || o.id}
                      <span className="block text-[10px] font-normal text-gray-400">{o.createdAt || 'Hôm nay'}</span>
                    </td>
                    <td className="p-3">
                      <strong className="text-gray-900 block">{o.customerName}</strong>
                      <span className="text-[11px] text-gray-500 font-mono">{o.customerPhone}</span>
                    </td>
                    <td className="p-3">
                      <strong className="text-gray-900 block">{o.receiverName}</strong>
                      <span className="text-[11px] text-gray-500 line-clamp-1">{o.receiverAddress}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-gray-900 line-clamp-1">{o.productName}</span>
                      <span className="text-[10px] text-[#C4685A] font-bold block">{o.deliverySlot}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-[#1B3B2B]">
                      {Number(o.totalAmount || 0).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        o.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                        o.status === 'ARRANGING' ? 'bg-amber-100 text-amber-800' :
                        o.status === 'PHOTO_READY' ? 'bg-purple-100 text-purple-800' :
                        o.status === 'DELIVERING' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {statusLabels[o.status] || o.status || 'Đang xử lý'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                    Không tìm thấy đơn hàng nào khớp với điều kiện lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
