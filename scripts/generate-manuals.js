import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';

async function generateManuals() {
  console.log('🚀 Bắt đầu tạo tài liệu Hướng Dẫn Sử Dụng FLAMEGUARD PRO...');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    userDataDir: path.join(os.tmpdir(), 'chrome-manuals-' + Date.now()),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  // =========================================================================
  // 1. TÀI LIỆU: Huong_Dan_Su_Dung_FlameGuard_Pro.pdf (CHUẨN 9 TRANG QUẢN TRỊ & STOREFRONT)
  // =========================================================================
  const pageAdmin = await browser.newPage();
  await pageAdmin.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

  const htmlAdmin = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <title>Cẩm Nang Chi Tiết Tính Năng &amp; Vận Hành Hệ Thống FLAMEGUARD PRO</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 14mm 16mm 14mm 16mm;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        font-size: 12px;
        line-height: 1.5;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page-break {
        page-break-after: always;
        break-after: page;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .header-bar {
        border-bottom: 2.5px solid #dc2626;
        padding-bottom: 10px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      .header-brand {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 20px;
        font-weight: 900;
        color: #dc2626;
        letter-spacing: -0.5px;
      }
      .header-tag {
        font-size: 10px;
        color: #475569;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .header-right {
        text-align: right;
        font-size: 10px;
        color: #64748b;
        line-height: 1.3;
      }
      .header-right strong {
        color: #0f172a;
        font-size: 11px;
      }
      .section-badge {
        display: inline-block;
        background: #0f172a;
        color: #ffffff;
        font-size: 10px;
        font-weight: 800;
        padding: 3px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
      }
      .section-title {
        font-size: 17px;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 12px;
        line-height: 1.3;
      }
      .card-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 12px;
      }
      .card-title {
        font-size: 13px;
        font-weight: 700;
        color: #b91c1c;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 12px;
      }
      .grid-3 {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
        margin-bottom: 12px;
      }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        border: 1px solid;
      }
      .pill-blue { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
      .pill-amber { background: #fffbeb; color: #b45309; border-color: #fde68a; }
      .pill-purple { background: #faf5ff; color: #7e22ce; border-color: #e9d5ff; }
      .pill-sky { background: #f0f9ff; color: #0369a1; border-color: #bae6fd; }
      .pill-green { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
      .pill-red { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
        font-size: 11px;
      }
      th, td {
        border: 1px solid #cbd5e1;
        padding: 6px 8px;
        text-align: left;
      }
      th {
        background: #f1f5f9;
        font-weight: 700;
        color: #0f172a;
      }
      .callout {
        background: #fef2f2;
        border-left: 3.5px solid #dc2626;
        padding: 10px 12px;
        border-radius: 0 6px 6px 0;
        margin-bottom: 12px;
        font-size: 11px;
      }
      .callout strong { color: #991b1b; }
      .callout-blue {
        background: #eff6ff;
        border-left: 3.5px solid #2563eb;
        padding: 10px 12px;
        border-radius: 0 6px 6px 0;
        margin-bottom: 12px;
        font-size: 11px;
      }
      .callout-blue strong { color: #1e40af; }

      .footer-bar {
        border-top: 1px solid #e2e8f0;
        padding-top: 8px;
        margin-top: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        color: #64748b;
      }
      ul { padding-left: 18px; margin-bottom: 8px; }
      li { margin-bottom: 4px; }
      strong { color: #0f172a; }
      .tag {
        background: #e2e8f0;
        color: #334155;
        font-size: 9px;
        font-weight: 700;
        padding: 1px 5px;
        border-radius: 3px;
      }
    </style>
  </head>
  <body>

    <!-- ==================== TRANG 1: BÌA & MỤC LỤC MA TRẬN ==================== -->
    <div class="page-break">
      <div>
        <div class="header-bar">
          <div>
            <div class="header-brand">🧯 FLAMEGUARD PRO</div>
            <div class="header-tag">Nền Tảng Thương Mại Điện Tử &amp; Kiểm Định PCCC (TCVN 3890:2023)</div>
          </div>
          <div class="header-right">
            <strong>BẢN DEMO &amp; SẢN XUẤT 2026</strong><br>
            Link: fire-safety-shop.vercel.app
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0 24px 0;">
          <span class="section-badge" style="background: #dc2626; font-size: 11px; padding: 4px 12px;">HỆ THỐNG ĐIỀU HÀNH AN TOÀN PCCC QUỐC GIA</span>
          <h1 style="font-size: 26px; font-weight: 900; color: #0f172a; margin-top: 8px; letter-spacing: -0.5px;">CẨM NANG CHI TIẾT TÍNH NĂNG &amp; VẬN HÀNH HỆ THỐNG</h1>
          <p style="font-size: 13px; color: #475569; max-width: 620px; margin: 8px auto 0 auto; line-height: 1.6;">
            Tài liệu quy chuẩn tổng hợp toàn bộ quy trình công nghệ 2 chiều: <strong>Trải nghiệm khách hàng mua sắm &amp; thẩm định an toàn PCCC trực tuyến</strong> kết hợp <strong>Hướng dẫn quản trị, kiểm định áp suất và điều hành kho thiết bị Admin</strong> chi tiết từ A đến Z.
          </p>
        </div>

        <div class="callout" style="margin-bottom: 24px;">
          <strong>🛡️ TIÊU CHUẨN PHÁP LÝ &amp; AN TOÀN BẮT BUỘC:</strong> Toàn bộ trang thiết bị trong hệ thống tuân thủ nghiêm ngặt Luật Phòng cháy chữa cháy, Tiêu chuẩn Việt Nam <strong>TCVN 3890:2023</strong> (Trang bị, bố trí phương tiện PCCC cho nhà và công trình) và chứng chỉ dán tem kiểm định của <strong>Cục Cảnh sát PCCC &amp; CNCH - Bộ Công An</strong>.
        </div>

        <h2 style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 12px; text-transform: uppercase;">MỤC LỤC &amp; MA TRẬN PHÂN HỆ VẬN HÀNH</h2>

        <div class="grid-2">
          <div class="card-box" style="border-left: 4px solid #dc2626;">
            <div style="font-size: 14px; font-weight: 800; color: #dc2626; margin-bottom: 8px;">🛍️ Phân Hệ 1: Khách Hàng (Storefront - Trang 2 ➔ 5)</div>
            <ul>
              <li><strong>Trang 2:</strong> Bộ lọc thông minh: Theo Khu vực rủi ro (Gia đình, Kho, Xưởng, Bếp) &amp; Loại chất dập lửa.</li>
              <li><strong>Trang 3:</strong> Tùy biến cấu hình: Dung tích, Gói an toàn TCVN 3890, Kệ sàn/Tủ hộp &amp; Thẻ dạ quang P-A-S-S.</li>
              <li><strong>Trang 4:</strong> Đặt hàng hỏa tốc xe chuyên dụng, Nghiệm thu bàn giao &amp; Thanh toán VietQR tự động.</li>
              <li><strong>Trang 5:</strong> Tra cứu đơn hàng, Duyệt ảnh áp suất vạch xanh thực tế &amp; Trợ lý AI Khảo sát PCCC.</li>
            </ul>
          </div>

          <div class="card-box" style="border-left: 4px solid #0f172a;">
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">⚙️ Phân Hệ 2: Quản Trị Admin (Portal - Trang 6 ➔ 9)</div>
            <ul>
              <li><strong>Trang 6:</strong> Cách mở cổng &amp; Đăng nhập Admin bảo mật (URL, Phím tắt, Mã PIN 1234/flame2026, SSO).</li>
              <li><strong>Trang 7:</strong> Quy trình điều hành đơn 5 bước: Tiếp nhận ➔ Test áp suất ➔ Chờ duyệt ➔ Giao ➔ Nghiệm thu A4.</li>
              <li><strong>Trang 8:</strong> Quản lý tồn kho bình &amp; trạm nạp khí (ABC, CO2, Foam), Cảnh báo ngưỡng nguy hiểm &amp; Danh mục.</li>
              <li><strong>Trang 9:</strong> Báo cáo doanh thu thời gian thực, Xuất file Excel (.XLSX), Telegram Bot &amp; Zalo OA kỹ thuật.</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer-bar">
        <div>FLAMEGUARD PRO VIETNAM • Hotline PCCC: 0843.066.604 • Hệ Thống Thiết Bị Chuẩn BCA</div>
        <div>Trang 1 / 9</div>
      </div>
    </div>

    <!-- ==================== TRANG 2: STOREFRONT - KHÁM PHÁ & BỘ LỌC ==================== -->
    <div class="page-break">
      <div>
        <div class="header-bar">
          <div>
            <div class="header-brand">🧯 FLAMEGUARD PRO</div>
            <div class="header-tag">Phần 1: Trải Nghiệm Khách Hàng (Storefront)</div>
          </div>
          <div class="header-right">
            <strong>KHÁM PHÁ &amp; BỘ LỌC THIẾT BỊ</strong><br>
            Quy Chuẩn Phân Loại PCCC
          </div>
        </div>

        <span class="section-badge">1. KHÁM PHÁ DANH MỤC &amp; BỘ LỌC KHU VỰC THÔNG MINH</span>
        <h2 class="section-title">Hệ Thống Lọc Kép Đa Tiêu Chí: Khu Vực Ứng Dụng &amp; Chất Dập Cháy</h2>

        <p style="margin-bottom: 12px; color: #475569;">
          Giao diện kỹ thuật cao, thao tác tức thì không cần tải lại trang. Giúp chủ căn hộ, kỹ sư an toàn hay giám đốc kho xưởng tìm đúng trang thiết bị đạt chuẩn trong vòng 30 giây.
        </p>

        <div class="grid-2">
          <div class="card-box">
            <div class="card-title">🛡️ Phân Loại Theo Khu Vực Ứng Dụng (Occasion / Application)</div>
            <ul>
              <li><strong>Hộ gia đình / Chung cư:</strong> Bình bột ABC 4kg, chăn dập lửa sợi thủy tinh 1.8m, mặt nạ chống độc khói TZL30.</li>
              <li><strong>Nhà xưởng / Kho hàng:</strong> Bình bột xe đẩy 35kg, bình bột ABC 8kg, cuộn vòi rulo chữa cháy.</li>
              <li><strong>Văn phòng / Tòa nhà:</strong> Bình khí CO2 3kg - 5kg chuyên dụng phòng máy chủ IT, hồ sơ tài liệu.</li>
              <li><strong>Bếp ăn / Nhà hàng:</strong> Bình bọt Foam sinh học 6L - 9L chống cháy dầu mỡ nhiệt độ cao.</li>
              <li><strong>Phương tiện giao thông:</strong> Bình xịt cứu hỏa mini trên ô tô, xe tải, tàu thuyền.</li>
            </ul>
          </div>

          <div class="card-box">
            <div class="card-title">⚡ Bộ Lọc Chất Dập Lửa &amp; Nhóm Đám Cháy TCVN</div>
            <ul>
              <li><strong>Bột khô ABC (Phốt phát Amôn):</strong> Dập tắt đám cháy chất Rắn (A), Lỏng (B), Khí gas (C).</li>
              <li><strong>Khí CO2 nguyên chất (Tuyết Carbonic):</strong> Chữa cháy thiết bị điện, phòng server, không để lại cặn bẩn.</li>
              <li><strong>Bọt Foam sinh học (AFFF):</strong> Tạo màng phủ cô lập oxy cực nhanh với đám cháy dầu ăn, xăng dầu.</li>
              <li><strong>Thiết bị thoát nạn tự cứu:</strong> Thang dây thoát hiểm hợp kim thép, cuộn dây thoát hiểm hạ chậm.</li>
              <li><strong>Tìm kiếm thời gian thực:</strong> Nhập từ khóa tên thiết bị hoặc dung tích (4kg, 3kg, 6L) hiển thị kết quả ngay.</li>
            </ul>
          </div>
        </div>

        <div class="card-title" style="margin-top: 10px;">📋 Bảng Ma Trận Khuyến Nghị Thiết Bị Theo Mặt Bằng Thực Tế:</div>
        <table>
          <thead>
            <tr>
              <th>Loại Không Gian</th>
              <th>Mối Nguy Cháy Chủ Đạo</th>
              <th>Thiết Bị Khuyến Nghị Trang Bị</th>
              <th>Tiêu Chuẩn Định Mức TCVN 3890</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Căn hộ chung cư / Nhà phố</strong></td>
              <td>Chập điện, rò khí gas, khói độc cầu thang</td>
              <td>Bình bột ABC 4kg + Mặt nạ TZL30 + Chăn dập lửa 1.8m</td>
              <td>1 bình / 50m² sàn + 1 mặt nạ / người</td>
            </tr>
            <tr>
              <td><strong>Phòng Server / Trạm biến áp</strong></td>
              <td>Tủ điện, vi mạch điện tử, máy chủ IT</td>
              <td>Bình khí CO2 3kg (MT3) hoặc 5kg (MT5)</td>
              <td>1 bình / 40m² (không dùng bình bột vì ăn mòn)</td>
            </tr>
            <tr>
              <td><strong>Khu bếp nhà hàng / Quán ăn</strong></td>
              <td>Cháy chảo dầu ăn mỡ sôi (Class F/K)</td>
              <td>Bình bọt Foam sinh học 6L + Chăn chống cháy</td>
              <td>1 bình đặt ngay cạnh lối thoát bếp</td>
            </tr>
            <tr>
              <td><strong>Kho hàng / Nhà máy sản xuất</strong></td>
              <td>Kiện pallet gỗ, bao bì carton, hàng hóa</td>
              <td>Bình bột ABC 8kg hoặc Bình xe đẩy ABC 35kg</td>
              <td>Cự ly di chuyển đến bình &le; 15 mét</td>
            </tr>
          </tbody>
        </table>

        <div class="callout-blue">
          <strong>💡 TÍNH NĂNG ĐỒNG BỘ CLOUD:</strong> Khi quản trị viên cập nhật thêm mẫu bình hoặc điều chỉnh giá bán trong Admin, dữ liệu được tự động cập nhật ngay lên Storefront mà không cần bảo trì hệ thống.
        </div>
      </div>

      <div class="footer-bar">
        <div>FLAMEGUARD PRO • Cẩm Nang Vận Hành &amp; Tính Năng Hệ Thống PCCC</div>
        <div>Trang 2 / 9</div>
      </div>
    </div>

    <!-- ==================== TRANG 3: STOREFRONT - TÙY BIẾN CẤU HÌNH & GIỎ HÀNG ==================== -->
    <div class="page-break">
      <div>
        <div class="header-bar">
          <div>
            <div class="header-brand">🧯 FLAMEGUARD PRO</div>
            <div class="header-tag">Phần 1: Trải Nghiệm Khách Hàng (Storefront)</div>
          </div>
          <div class="header-right">
            <strong>TÙY BIẾN CẤU HÌNH &amp; PHỤ KIỆN</strong><br>
            Tối Ưu Gói Trang Bị PCCC
          </div>
        </div>

        <span class="section-badge">2. TÙY BIẾN THIẾT BỊ &amp; BỘ PHỤ KIỆN LẮP ĐẶT CHUYÊN DỤNG</span>
        <h2 class="section-title">Cá Nhân Hóa Cấu Hình Trang Bị &amp; Ngăn Kéo Giỏ Hàng An Toàn</h2>

        <p style="margin-bottom: 12px; color: #475569;">
          Khách hàng không chỉ mua một bình chữa cháy đơn lẻ, mà có thể linh hoạt chọn gói bảo hành dự án, phụ kiện giá đỡ chịu lực, tủ kính bảo vệ và các vật tư cứu nạn khẩn cấp đi kèm.
        </p>

        <div class="grid-2">
          <div class="card-box">
            <div class="card-title">⚙️ Tùy Chọn Quy Cách &amp; Gói Kiểm Định An Toàn</div>
            <ul>
              <li><strong>Bình tiêu chuẩn (Standard):</strong> Bình mới 100%, áp suất kim vạch xanh, dán tem kiểm định BCA 12 tháng.</li>
              <li><strong>Gói Gia Đình An Toàn (+120.000₫):</strong> Bổ sung kệ sàn đôi sơn tĩnh điện + Thẻ dạ quang P-A-S-S dán tường.</li>
              <li><strong>Gói Doanh Nghiệp TCVN (+250.000₫):</strong> Gia hạn bảo hành 36 tháng, miễn phí kiểm tra cân nặng định kỳ hàng quý, cấp biên bản nghiệm thu pháp lý cho Cảnh sát PCCC.</li>
            </ul>
          </div>

          <div class="card-box">
            <div class="card-title">🧰 Chọn Phụ Kiện Lắp Đặt &amp; Giá Treo Thép Đỏ</div>
            <ul>
              <li><strong>Kệ sàn chống ẩm sơn tĩnh điện (+80.000₫):</strong> Giúp đáy bình không bị rỉ sét do tiếp xúc ẩm ướt với mặt sàn.</li>
              <li><strong>Giá treo tường thép chịu lực (+60.000₫):</strong> Cố định bình vững chắc ở độ cao 1.2m theo đúng tiêu chuẩn.</li>
              <li><strong>Tủ hộp PCCC kính cường lực (+220.000₫):</strong> Bảo vệ bình khỏi bụi bẩn, nắng mưa tại khu vực ngoài trời.</li>
              <li><strong>Thẻ dạ quang phát sáng trong bóng tối (+35.000₫):</strong> Giúp người gặp nạn định vị nhanh vị trí bình khi mất điện.</li>
            </ul>
          </div>
        </div>

        <div class="card-box">
          <div class="card-title">🛒 Ngăn Kéo Giỏ Hàng (Cart Drawer) &amp; Gợi Ý Thiết Bị Cứu Sinh Kèm Theo</div>
          <div class="grid-3" style="margin-top: 8px;">
            <div style="background: white; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px;">
              <div style="font-weight: 700; color: #b91c1c;">Mặt Nạ Chống Khói TZL30</div>
              <p style="font-size: 10px; color: #64748b;">Dưỡng khí 30 phút, lọc sạch khí độc CO, xyanua khi thoát hiểm.</p>
              <div style="font-weight: 700; margin-top: 4px; color: #0f172a;">+180.000₫ <span class="tag">Khuyến nghị</span></div>
            </div>
            <div style="background: white; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px;">
              <div style="font-weight: 700; color: #b91c1c;">Chăn Dập Lửa Sợi Thủy Tinh</div>
              <p style="font-size: 10px; color: #64748b;">Chịu nhiệt 550°C, dập nhanh đám cháy bếp &amp; trùm người thoát hiểm.</p>
              <div style="font-weight: 700; margin-top: 4px; color: #0f172a;">+145.000₫ <span class="tag">Bếp ăn</span></div>
            </div>
            <div style="background: white; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px;">
              <div style="font-weight: 700; color: #b91c1c;">Búa Phá Kính Thoát Hiểm</div>
              <p style="font-size: 10px; color: #64748b;">Đầu vonfram tôi cứng, tích hợp dao cắt dây an toàn xe hơi.</p>
              <div style="font-weight: 700; margin-top: 4px; color: #0f172a;">+75.000₫ <span class="tag">Ô tô / Xe khách</span></div>
            </div>
          </div>
          <ul style="margin-top: 8px;">
            <li><strong>Nhập Voucher An Toàn:</strong> Hỗ trợ các mã <code>ANTOAN10</code> (-10%), <code>CHUNGCU50K</code> (-50.000₫), <code>FREESHIP</code> (miễn phí ship), <code>DOANHNGHIEP15</code> (-15%).</li>
            <li><strong>Tính toán trực quan:</strong> Tổng tiền, giảm giá và phí vận chuyển hiển thị minh bạch từng khoản trước khi bấm Đặt Hàng.</li>
          </ul>
        </div>
      </div>

      <div class="footer-bar">
        <div>FLAMEGUARD PRO • Cẩm Nang Vận Hành &amp; Tính Năng Hệ Thống PCCC</div>
        <div>Trang 3 / 9</div>
      </div>
    </div>

    <!-- ==================== TRANG 4: STOREFRONT - ĐẶT HÀNG & GIAO HỎA TỐC ==================== -->
    <div class="page-break">
      <div>
        <div class="header-bar">
          <div>
            <div class="header-brand">🧯 FLAMEGUARD PRO</div>
            <div class="header-tag">Phần 1: Trải Nghiệm Khách Hàng (Storefront)</div>
          </div>
          <div class="header-right">
            <strong>ĐẶT HÀNG &amp; VẬN CHUYỂN PCCC</strong><br>
            Logistics Chuyên Dụng TCVN
          </div>
        </div>

        <span class="section-badge">3. ĐẶT HÀNG NHANH, GIAO XE CHUYÊN DỤNG &amp; THANH TOÁN VIETQR</span>
        <h2 class="section-title">Quy Trình Đặt Hàng Chuẩn Xác, Bàn Giao Kiểm Định &amp; Nghiệm Thu</h2>

        <p style="margin-bottom: 12px; color: #475569;">
          Thiết bị PCCC là danh mục hàng hóa đặc thù có áp suất khí nén cao. FLAMEGUARD PRO áp dụng quy trình vận chuyển cố định bình theo phương thẳng đứng, loại bỏ hoàn toàn nguy cơ va đập, xì van.
        </p>

        <div class="grid-2">
          <div class="card-box">
            <div class="card-title">🚚 2 Phương Thức Vận Chuyển An Toàn PCCC</div>
            <ul>
              <li><strong>Hỏa tốc 60 phút (Nội thành):</strong> Bàn giao cấp bách cho các cơ sở cần nghiệm thu đột xuất hoặc bổ sung bình chữa cháy thay thế bình đã xả.</li>
              <li><strong>Giao xe chuyên dụng theo lịch hẹn:</strong> Xe tải gắn khung cố định bình chữa cháy thẳng đứng, chuyên chở đơn hàng lớn cho dự án tòa nhà, kho bãi.</li>
              <li><strong>Kỹ thuật viên giao tận nơi:</strong> Trực tiếp đo áp suất kim vạch xanh trước mặt khách, ký biên bản bàn giao thiết bị đạt chuẩn.</li>
            </ul>
          </div>

          <div class="card-box">
            <div class="card-title">💳 Đa Dạng Phương Thức Thanh Toán Linh Hoạt</div>
            <ul>
              <li><strong>Chuyển khoản VietQR Pro:</strong> Quét mã QR tự động điền số tài khoản, số tiền và mã đơn hàng (VD: <code>FG-89241</code>), xác nhận giao dịch tức thời.</li>
              <li><strong>Thanh toán tiền mặt khi nghiệm thu (COD):</strong> Khách nhận bình, kiểm tra nguyên vẹn chốt kẹp chì và kim đồng hồ áp suất rồi mới thanh toán.</li>
              <li><strong>Xuất hóa đơn GTGT (VAT) điện tử:</strong> Hỗ trợ kê khai mã số thuế công ty, nhận hóa đơn đỏ hợp lệ qua email.</li>
            </ul>
          </div>
        </div>

        <div class="card-box">
          <div class="card-title">📝 Quy Trình 3 Bước Hoàn Tất Đơn Đặt Hàng</div>
          <div class="grid-3" style="margin-top: 8px;">
            <div style="background: white; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
              <div style="font-weight: 800; color: #dc2626; font-size: 11px;">BƯỚC 1: ĐỊA CHỈ NHẬN THIẾT BỊ</div>
              <p style="font-size: 10px; color: #475569; margin-top: 4px;">Điền họ tên, số điện thoại, địa chỉ công trình/nhà riêng và ghi chú cho kỹ thuật viên giao hàng (ví dụ: giao tại phòng bảo vệ hoặc tầng hầm).</p>
            </div>
            <div style="background: white; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
              <div style="font-weight: 800; color: #dc2626; font-size: 11px;">BƯỚC 2: CHỌN HÌNH THỨC GIAO &amp; TRẢ</div>
              <p style="font-size: 10px; color: #475569; margin-top: 4px;">Chọn giao hỏa tốc hoặc giao tiêu chuẩn; chọn thanh toán VietQR chuyển khoản ngân hàng hoặc thanh toán khi nghiệm thu bàn giao.</p>
            </div>
            <div style="background: white; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
              <div style="font-weight: 800; color: #dc2626; font-size: 11px;">BƯỚC 3: XÁC NHẬN &amp; PHÁT CẢNH BÁO</div>
              <p style="font-size: 10px; color: #475569; margin-top: 4px;">Nhận mã đơn hàng duy nhất, hệ thống tự động phát chuông âm thanh cảnh báo tại trung tâm điều hành và gửi thông báo đơn về Telegram Bot.</p>
            </div>
          </div>
        </div>

        <div class="callout">
          <strong>⚠️ ĐẶC QUYỀN DUYỆT ẢNH ÁP SUẤT:</strong> Khách hàng có thể tích chọn <em>"Gửi ảnh chụp đồng hồ áp suất thực tế trước khi xuất kho"</em>. Kỹ thuật viên sẽ chụp cận cảnh mặt áp kế và tem niêm phong chì gửi qua hệ thống tra cứu để khách nghiệm thu từ xa.
        </div>
      </div>

      <div class="footer-bar">
        <div>FLAMEGUARD PRO • Cẩm Nang Vận Hành &amp; Tính Năng Hệ Thống PCCC</div>
        <div>Trang 4 / 9</div>
      </div>
    </div>

    <!-- ==================== TRANG 5: STOREFRONT - TRA CỨU & AI KHẢO SÁT PCCC ==================== -->
    <div class="page-break">
      <div>
        <div class="header-bar">
          <div>
            <div class="header-brand">🧯 FLAMEGUARD PRO</div>
            <div class="header-tag">Phần 1: Trải Nghiệm Khách Hàng (Storefront)</div>
          </div>
          <div class="header-right">
            <strong>TRA CỨU ĐƠN &amp; AI VISION PCCC</strong><br>
            Công Nghệ Kiểm Định Độc Quyền
          </div>
        </div>

        <span class="section-badge">4. TRA CỨU ĐƠN HÀNG 5 BƯỚC &amp; TRỢ LÝ AI KHẢO SÁT AN TOÀN</span>
        <h2 class="section-title">Minh Bạch Hành Trình Nghiệm Thu &amp; Trí Tuệ Nhân Tạo TCVN 3890</h2>

        <p style="margin-bottom: 12px; color: #475569;">
          Khách hàng kiểm soát 100% chất lượng phương tiện phòng cháy trước khi nhận hàng và sở hữu trợ lý ảo AI khảo sát hiện trường nguy cơ cháy nổ ngay trên điện thoại.
        </p>

        <div class="card-box">
          <div class="card-title">🔍 Tra Cứu Đơn Hàng &amp; Duyệt Ảnh Đồng Hồ Áp Kế Vạch Xanh</div>
          <p style="color: #475569; margin-bottom: 8px;">Khách hàng mở modal <strong>"Tra Cứu Đơn Hàng"</strong> bằng số điện thoại để theo dõi quy trình 5 bước:</p>
          <div style="background: white; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="status-pill pill-blue">1. Tiếp Nhận Đơn</span> ➔
            <span class="status-pill pill-amber">2. Đo Áp Suất &amp; Tem BCA</span> ➔
            <span class="status-pill pill-purple">3. Chờ Duyệt Ảnh</span> ➔
            <span class="status-pill pill-sky">4. Vận Chuyển PCCC</span> ➔
            <span class="status-pill pill-green">5. Nghiệm Thu Hoàn Tất</span>
          </div>
          <ul>
            <li><strong>Xem ảnh chụp thực tế tại xưởng kiểm định:</strong> Kiểm tra kim áp kế chỉ đúng dải màu xanh (1.2 - 1.4 MPa) và dây chì niêm phong chưa bị đứt gãy.</li>
            <li><strong>Nút "Duyệt Áp Suất &amp; Giao Ngay":</strong> Khách hàng bấm duyệt để cho phép xe chuyên dụng xuất bến giao hàng.</li>
          </ul>
        </div>

        <div class="card-box">
          <div class="card-title">🤖 Trợ Lý AI Khảo Sát An Toàn PCCC (Gemini 2.0 Flash Vision)</div>
          <p style="color: #475569; margin-bottom: 8px;">Khi người dùng không rõ không gian của mình cần trang bị bao nhiêu bình và loại bình gì:</p>
          <ul>
            <li><strong>Tải ảnh hiện trường:</strong> Chụp ảnh khu bếp ăn gia đình, gian hàng chợ, kho chứa vải, phòng máy tính hoặc gara xe.</li>
            <li><strong>AI phân tích nguy cơ cháy nổ:</strong> Tự động nhận diện các nguồn nhiệt, vật liệu dễ bắt lửa (khí gas, dầu mỡ, dây điện trần, thùng xốp).</li>
            <li><strong>Tư vấn trang bị theo TCVN 3890:2023:</strong> Chỉ định loại chất dập lửa tối ưu (ví dụ: cấm dùng nước cho đám cháy dầu mỡ, khuyến nghị bình Foam 6L và chăn dập lửa).</li>
            <li><strong>Ước tính ngân sách &amp; Chuyển Zalo 1-chạm:</strong> Đưa ra dự toán chi phí trọn gói và bấm nút chuyển toàn bộ phương án kỹ thuật sang Zalo Hotline kỹ sư PCCC để chốt đơn nhanh.</li>
          </ul>
        </div>

        <div class="callout-blue">
          <strong>🔒 BẢO MẬT &amp; TIN CẬY:</strong> Mọi hình ảnh hiện trường khảo sát và thông tin khách hàng đều được mã hóa theo tiêu chuẩn an toàn thông tin, cam kết không rò rỉ dữ liệu mặt bằng cơ sở.
        </div>
      </div>

      <div class="footer-bar">
        <div>FLAMEGUARD PRO • Cẩm Nang Vận Hành &amp; Tính Năng Hệ Thống PCCC</div>
        <div>Trang 5 / 9</div>
      </div>
    </div>

    <!-- ==================== TRANG 6: ADMIN HUB - TRUY CẬP & ĐĂNG NHẬP ==================== -->
    <div class="page-break">
      <div>
        <div class="header-bar">
          <div>
            <div class="header-brand">🛡️ FLAMEGUARD PRO</div>
            <div class="header-tag">Phần 2: Trung Tâm Vận Hành (Admin Portal)</div>
          </div>
          <div class="header-right">
            <strong>TRUY CẬP &amp; BẢO MẬT ADMIN</strong><br>
            Cổng Quản Trị Trung Tâm
          </div>
        </div>

        <span class="section-badge">5. HƯỚNG DẪN MỞ CỔNG ADMIN &amp; ĐĂNG NHẬP BẢO MẬT</span>
        <h2 class="section-title">Quy Định Truy Cập Dành Riêng Cho Quản Trị Viên &amp; Kỹ Thuật Viên</h2>

        <p style="margin-bottom: 12px; color: #475569;">
          Cổng quản trị nội bộ không hiển thị liên kết công khai trên thanh điều hướng khách hàng để đảm bảo an ninh hệ thống và ngăn ngừa truy cập trái phép vào kho dữ liệu đơn hàng.
        </p>

        <div class="grid-2">
          <div class="card-box" style="border-top: 3px solid #dc2626;">
            <div class="card-title">🔗 Cách 1: Thêm Đường Dẫn #admin Trên URL</div>
            <p style="color: #475569; margin-bottom: 8px;">Trên thanh địa chỉ trình duyệt, gõ thêm đuôi <code>#admin</code> vào sau tên miền:</p>
            <div style="background: white; border: 1px solid #cbd5e1; padding: 6px 10px; font-family: monospace; font-size: 11px; border-radius: 4px; color: #b91c1c;">
              👉 https://fire-safety-shop.vercel.app/#admin
            </div>
            <p style="font-size: 11px; color: #64748b; margin-top: 6px;">Hộp thoại xác thực Admin Login Modal sẽ lập tức hiển thị trên màn hình.</p>
          </div>

          <div class="card-box" style="border-top: 3px solid #0f172a;">
            <div class="card-title">⌨️ Cách 2: Phím Tắt Khẩn Cấp Của Chỉ Huy (Hotkeys)</div>
            <p style="color: #475569; margin-bottom: 8px;">Khi đang ở bất kỳ trang nào trên website, chỉ cần bấm tổ hợp phím:</p>
            <div style="background: white; border: 1px solid #cbd5e1; padding: 6px 10px; font-family: monospace; font-size: 11px; border-radius: 4px; color: #0f172a;">
              • Hệ điều hành Windows: <strong>Alt + Shift + A</strong><br>
              • Hệ điều hành macOS: <strong>Option + Shift + A</strong>
            </div>
            <p style="font-size: 11px; color: #64748b; margin-top: 6px;">Cửa sổ quản trị được kích hoạt ngay lập tức mà không cần gõ URL.</p>
          </div>
        </div>

        <div class="card-box">
          <div class="card-title">🔑 Các Phương Thức Xác Thực Đăng Nhập Hệ Thống</div>
          <div class="grid-2" style="margin-top: 8px;">
            <div style="background: white; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
              <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">1. Đăng Nhập Nhanh Bằng Mã PIN Nội Bộ</div>
              <p style="font-size: 11px; color: #475569;">Bấm chọn <em>"Hoặc đăng nhập bằng mã PIN nội bộ"</em>:</p>
              <ul style="margin-top: 4px; font-size: 11px;">
                <li>Mã PIN demo: <code>1234</code> hoặc <code>flame2026</code>.</li>
                <li>Bấm nút <strong>"Mở Bảng Điều Hành PCCC"</strong> để vào thẳng Admin.</li>
              </ul>
            </div>
            <div style="background: white; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
              <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">2. Xác Thực SSO Tài Khoản Doanh Nghiệp</div>
              <p style="font-size: 11px; color: #475569;">Hỗ trợ đăng nhập một chạm chuẩn quốc tế:</p>
              <ul style="margin-top: 4px; font-size: 11px;">
                <li>Tài khoản Google Workspace (OAuth 2.0).</li>
                <li>Tài khoản Meta Facebook &amp; Telegram Bot xác thực.</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="callout">
          <strong>🚪 CÁCH QUAY LẠI CỬA HÀNG:</strong> Khi muốn chuyển về giao diện mua sắm của khách, bấm nút <strong>"← Về Cửa Hàng"</strong> ở góc dưới bên trái thanh menu điều hướng. Session đăng nhập được duy trì an toàn trong Local-first Storage.
        </div>
      </div>

      <div class="footer-bar">
        <div>FLAMEGUARD PRO • Cẩm Nang Vận Hành &amp; Tính Năng Hệ Thống PCCC</div>
        <div>Trang 6 / 9</div>
      </div>
    </div>

    <!-- ==================== TRANG 7: ADMIN HUB - ĐIỀU HÀNH ĐƠN HÀNG ==================== -->
    <div class="page-break">
      <div>
        <div class="header-bar">
          <div>
            <div class="header-brand">🛡️ FLAMEGUARD PRO</div>
            <div class="header-tag">Phần 2: Trung Tâm Vận Hành (Admin Portal)</div>
          </div>
          <div class="header-right">
            <strong>ĐIỀU HÀNH ĐƠN HÀNG 5 BƯỚC</strong><br>
            Kiểm Định &amp; Nghiệm Thu TCVN
          </div>
        </div>

        <span class="section-badge">6. ĐIỀU HÀNH ĐƠN HÀNG 5 BƯỚC &amp; IN BIÊN BẢN NGHIỆM THU A4</span>
        <h2 class="section-title">Chu Trình Kiểm Định Áp Suất &amp; Bàn Giao Thiết Bị PCCC Chuẩn</h2>

        <p style="margin-bottom: 12px; color: #475569;">
          Giao diện Kanban thời gian thực với còi cảnh báo đơn mới, hỗ trợ lọc theo 5 trạng thái kiểm định và in ấn hồ sơ bàn giao pháp lý phục vụ thanh tra PCCC.
        </p>

        <div class="card-box">
          <div class="card-title">🔄 Chu Trình Quản Trị 5 Trạng Thái Đơn Hàng PCCC Chuẩn Hóa</div>
          <table>
            <thead>
              <tr>
                <th>Mã Trạng Thái</th>
                <th>Tên Trạng Thái Chuẩn Hóa</th>
                <th>Mã Màu Badge</th>
                <th>Thao Tác Nghiệp Vụ Của Kỹ Thuật Viên</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>NEW</code></td>
                <td><strong>Tiếp Nhận Đơn</strong></td>
                <td><span class="status-pill pill-blue">Tiếp Nhận Đơn</span></td>
                <td>Phát âm thanh báo động; kỹ thuật viên bấm tiếp nhận đơn vào ca.</td>
              </tr>
              <tr>
                <td><code>ARRANGING</code></td>
                <td><strong>Đo Áp Suất &amp; Dán Tem BCA</strong></td>
                <td><span class="status-pill pill-amber">Đo Áp Suất &amp; Dán Tem</span></td>
                <td>Gắp bình từ kho; đo đồng hồ áp kế đạt vạch xanh; dán tem kiểm định Bộ Công An.</td>
              </tr>
              <tr>
                <td><code>PHOTO_READY</code></td>
                <td><strong>Chờ Duyệt Ảnh Áp Suất</strong></td>
                <td><span class="status-pill pill-purple">Chờ Duyệt Ảnh Áp Suất</span></td>
                <td>Bấm <em>"Tải Ảnh Áp Suất Thật"</em>; chụp cận cảnh kim áp kế và tem niêm chì gửi khách xem.</td>
              </tr>
              <tr>
                <td><code>DELIVERING</code></td>
                <td><strong>Đang Vận Chuyển PCCC</strong></td>
                <td><span class="status-pill pill-sky">Đang Vận Chuyển PCCC</span></td>
                <td>Bấm <em>"Xuất Kho &amp; Giao"</em>; bàn giao xe chuyên dụng chở bình thẳng đứng.</td>
              </tr>
              <tr>
                <td><code>COMPLETED</code></td>
                <td><strong>Đã Nghiệm Thu Hoàn Tất</strong></td>
                <td><span class="status-pill pill-green">Đã Nghiệm Thu Hoàn Tất</span></td>
                <td>Khách nhận bình, test áp lực và ký vào biên bản nghiệm thu 3 bên.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="grid-2">
          <div class="card-box">
            <div class="card-title">🖨️ In Phiếu Bàn Giao &amp; Nghiệm Thu Xuất Kho A4</div>
            <ul>
              <li><strong>Biên bản bàn giao 3 bên có giá trị pháp lý:</strong> Kỹ sư kiểm định ký xác nhận kim vạch xanh ➔ Đội vận chuyển xác nhận bình nguyên vẹn kẹp chì ➔ Đại diện tiếp nhận cơ sở nghiệm thu.</li>
              <li><strong>Công nghệ in Iframe cách ly:</strong> In sắc nét 100% trang A4, không bị đứt đoạn, không tràn lề và không tạo trang trắng thừa.</li>
            </ul>
          </div>

          <div class="card-box">
            <div class="card-title">🏷️ In Thẻ Hướng Dẫn Khẩn Cấp Kẹp Bình P-A-S-S</div>
            <ul>
              <li><strong>Kích thước chuẩn ép plastic kẹp cổ bình:</strong> Hiển thị rõ 4 bước PULL - AIM - SQUEEZE - SWEEP.</li>
              <li><strong>Số điện thoại khẩn cấp 114:</strong> Mã số thiết bị, ngày nạp khí gần nhất và hạn kiểm định định kỳ tiếp theo.</li>
              <li><strong>Bàn giao shipper hỏa tốc:</strong> Nút chuyển trạng thái nhanh thông báo tức thì cho khách hàng.</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer-bar">
        <div>FLAMEGUARD PRO • Cẩm Nang Vận Hành &amp; Tính Năng Hệ Thống PCCC</div>
        <div>Trang 7 / 9</div>
      </div>
    </div>

    <!-- ==================== TRANG 8: ADMIN HUB - TỒN KHO & DANH MỤC THIẾT BỊ ==================== -->
    <div class="page-break">
      <div>
        <div class="header-bar">
          <div>
            <div class="header-brand">🛡️ FLAMEGUARD PRO</div>
            <div class="header-tag">Phần 2: Trung Tâm Vận Hành (Admin Portal)</div>
          </div>
          <div class="header-right">
            <strong>KHO THIẾT BỊ &amp; NẠP KHÍ PCCC</strong><br>
            Cảnh Báo Ngưỡng An Toàn
          </div>
        </div>

        <span class="section-badge">7. QUẢN LÝ TỒN KHO THIẾT BỊ PCCC, KHÍ NẠP &amp; DANH MỤC ĐỒNG BỘ</span>
        <h2 class="section-title">Kiểm Soát Dung Lượng Khí, Vật Tư Cứu Hộ &amp; Cảnh Báo Tồn Kho</h2>

        <p style="margin-bottom: 12px; color: #475569;">
          Theo dõi số lượng từng bình khí có sẵn tại trạm, tự động phát cảnh báo khi lượng tồn kho chạm ngưỡng nguy hiểm để kịp thời nạp thêm khí đẩy Nito và bột dập lửa.
        </p>

        <div class="grid-2">
          <div class="card-box">
            <div class="card-title">📊 Quản Lý Tồn Kho Bình &amp; Trạm Nạp Khí Thời Gian Thực</div>
            <ul>
              <li><strong>Bình bột chữa cháy ABC 4kg:</strong> Số lượng tổng nhập, số lượng đã xuất cho đơn hàng và số lượng tồn sẵn sàng tại trạm.</li>
              <li><strong>Bình khí CO2 3kg (MT3) &amp; 5kg (MT5):</strong> Quản lý trọng lượng cân định kỳ, van áp lực cao và loa phun tuyết lạnh.</li>
              <li><strong>Bình bọt Foam sinh học 6L / 9L:</strong> Quản lý hạn sử dụng dung dịch tạo màng ngăn bốc hơi cháy.</li>
              <li><strong>Vật tư cứu hộ:</strong> Số lượng mặt nạ chống khói TZL30, cuộn dây thoát hiểm chống cháy 15m, chăn dập lửa sợi thủy tinh.</li>
            </ul>
          </div>

          <div class="card-box">
            <div class="card-title">🚨 Hệ Thống 3 Mức Cảnh Báo Tồn Kho Tự Động</div>
            <ul>
              <li><span class="status-pill pill-red">danger (&le; 5 bình)</span>: Tồn kho chạm mức báo động đỏ! Cần liên hệ trạm nạp khí nạp thêm ngay lập tức để tránh đứt gãy cung ứng.</li>
              <li><span class="status-pill pill-amber">warning (6 - 20 bình)</span>: Tồn kho mức trung bình, cần chuẩn bị đơn đặt hàng linh kiện mới.</li>
              <li><span class="status-pill pill-green">normal (&gt; 20 bình)</span>: Tồn kho dồi dào, sẵn sàng phục vụ các công trình lớn.</li>
              <li><strong>Nhập thêm hàng 1-chạm:</strong> Bấm nút cộng số lượng để nhập kho lô thiết bị mới kiểm định.</li>
            </ul>
          </div>
        </div>

        <div class="card-box">
          <div class="card-title">📦 Quản Lý Danh Mục Thiết Bị PCCC Đồng Bộ Đám Mây</div>
          <p style="color: #475569; margin-bottom: 8px;">Quản trị viên có toàn quyền thêm, sửa, xóa các mã sản phẩm trên toàn hệ thống:</p>
          <div class="grid-2">
            <ul>
              <li><strong>Thêm thiết bị mới trong 1 phút:</strong> Nhập tên thiết bị, tải ảnh chụp thực tế, thiết lập giá niêm yết và giá chiết khấu.</li>
              <li><strong>Gán khu vực ứng dụng:</strong> Chọn phân loại (Gia đình, Kho xưởng, Văn phòng, Bếp ăn, Xe cộ) để thiết bị tự động xuất hiện đúng bộ lọc.</li>
            </ul>
            <ul>
              <li><strong>Công tắc Bật/Tắt còn hàng:</strong> Thiết bị nào tạm thời hết hàng tại trạm chỉ cần gạt tắt là ẩn ngay khỏi website.</li>
              <li><strong>Đồng bộ Local-First &amp; Cloud:</strong> Dữ liệu được lưu trữ bền vững, tự động giải quyết xung đột khi nhiều kỹ thuật viên cùng thao tác.</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer-bar">
        <div>FLAMEGUARD PRO • Cẩm Nang Vận Hành &amp; Tính Năng Hệ Thống PCCC</div>
        <div>Trang 8 / 9</div>
      </div>
    </div>

    <!-- ==================== TRANG 9: ADMIN HUB - BÁO CÁO & TELEGRAM ==================== -->
    <div class="page-break">
      <div>
        <div class="header-bar">
          <div>
            <div class="header-brand">🛡️ FLAMEGUARD PRO</div>
            <div class="header-tag">Phần 2: Trung Tâm Vận Hành (Admin Portal)</div>
          </div>
          <div class="header-right">
            <strong>BÁO CÁO TÀI CHÍNH &amp; KÊNH KẾT NỐI</strong><br>
            Báo Động Khẩn Cấp 24/7
          </div>
        </div>

        <span class="section-badge">8. BÁO CÁO DOANH SỐ, XUẤT EXCEL (.XLSX) &amp; TÍCH HỢP ĐA KÊNH</span>
        <h2 class="section-title">Theo Dõi Dòng Tiền, Báo Cáo Tài Chính &amp; Kết Nối Telegram Bot</h2>

        <p style="margin-bottom: 12px; color: #475569;">
          Kiểm soát hiệu quả kinh doanh, xuất bảng kê chi tiết cho kế toán và tích hợp thông báo đẩy khẩn cấp khi có đơn hàng mới phát sinh.
        </p>

        <div class="card-box">
          <div class="card-title">📈 Báo Cáo Doanh Thu, Phân Tích Thiết Bị &amp; Xuất File Excel Chuẩn Native (.XLSX)</div>
          <div class="grid-3" style="margin-top: 8px;">
            <div style="background: white; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Doanh Thu Thực Tế</div>
              <div style="font-size: 18px; font-weight: 900; color: #dc2626; margin-top: 2px;">Cập nhật realtime</div>
              <p style="font-size: 10px; color: #64748b; margin-top: 4px;">Tổng giá trị các đơn đã nghiệm thu hoàn tất.</p>
            </div>
            <div style="background: white; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Biểu Đồ Xu Hướng 7 Ngày</div>
              <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 2px;">Cột biểu đồ trực quan</div>
              <p style="font-size: 10px; color: #64748b; margin-top: 4px;">Nắm bắt biến động nhu cầu trang bị PCCC trong tuần.</p>
            </div>
            <div style="background: white; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Xuất Báo Cáo Excel (.xlsx)</div>
              <div style="font-size: 18px; font-weight: 900; color: #15803d; margin-top: 2px;">Chuẩn OpenXML</div>
              <p style="font-size: 10px; color: #64748b; margin-top: 4px;">Mở mượt mà trên Excel, không bị cảnh báo định dạng.</p>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card-box">
            <div class="card-title">🚚 Cấu Hình Cước Phí Vận Chuyển PCCC</div>
            <ul>
              <li><strong>Phí giao nội thành &amp; ngoại thành:</strong> Thiết lập mức cước hợp lý cho xe chuyên dụng chở bình cứu hỏa.</li>
              <li><strong>Mốc miễn phí vận chuyển (Freeship):</strong> Thiết lập ngưỡng đơn hàng (VD: từ 1.000.000₫) để kích cầu các dự án lấy số lượng lớn.</li>
            </ul>
          </div>

          <div class="card-box">
            <div class="card-title">🔔 Tích Hợp Telegram Bot &amp; Zalo OA Chuyên Gia</div>
            <ul>
              <li><strong>Dò tìm Chat ID Telegram 1-chạm:</strong> Tự động đẩy tin nhắn báo động kèm mã đơn, số tiền và loại thiết bị ngay khi khách vừa đặt hàng.</li>
              <li><strong>Nút Zalo Chat &amp; Hotline khẩn cấp nổi trên web:</strong> Hỗ trợ trực tiếp 1-1 khách hàng cần thẩm duyệt phương án PCCC theo TCVN 3890.</li>
            </ul>
          </div>
        </div>

        <div class="callout" style="margin-top: 6px;">
          <strong>🚀 NỀN TẢNG CÔNG NGHỆ CHUẨN DOANH NGHIỆP:</strong> React 19, TailwindCSS 4, Vite 8, Express API, Local-First Engine, Gemini 2.0 Flash Vision AI, Telegram Bot Webhook &amp; Giao Thức Bảo Mật Chống Tấn Công XSS 100%.
        </div>
      </div>

      <div class="footer-bar">
        <div>FLAMEGUARD PRO VIETNAM • Bản Quyền &copy; 2026 • Tài Liệu Vận Hành Toàn Diện</div>
        <div>Trang 9 / 9 (Hoàn tất)</div>
      </div>
    </div>

  </body>
  </html>
  `;

  await pageAdmin.setContent(htmlAdmin, { waitUntil: 'networkidle0' });
  const pdfAdminPath = path.join(process.cwd(), 'public', 'Huong_Dan_Su_Dung_FlameGuard_Pro.pdf');
  await pageAdmin.pdf({
    path: pdfAdminPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' }
  });
  console.log('✓ Đã tạo thành công Huong_Dan_Su_Dung_FlameGuard_Pro.pdf (9 trang):', fs.statSync(pdfAdminPath).size, 'bytes');

  // =========================================================================
  // 2. TÀI LIỆU: Huong_Dan_Su_Dung_PCCC.pdf (CẨM NANG THAO TÁC THIẾT BỊ KHẨN CẤP DÀNH CHO KHÁCH)
  // =========================================================================
  const pagePCCC = await browser.newPage();
  await pagePCCC.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

  const htmlPCCC = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <title>Cẩm Nang An Toàn &amp; Hướng Dẫn Sử Dụng Phương Tiện PCCC (TCVN 3890:2023)</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 14mm 16mm;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        font-size: 12px;
        line-height: 1.5;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page-break {
        page-break-after: always;
        break-after: page;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .header {
        border-bottom: 3px solid #dc2626;
        padding-bottom: 10px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      .brand { font-size: 22px; font-weight: 900; color: #dc2626; }
      .sub-brand { font-size: 10px; color: #475569; font-weight: 700; text-transform: uppercase; }
      .doc-info { font-size: 10px; color: #64748b; text-align: right; }
      h1 { font-size: 18px; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; font-weight: 900; }
      .alert-banner {
        background: #fef2f2;
        border-left: 4px solid #dc2626;
        padding: 10px 14px;
        border-radius: 0 6px 6px 0;
        margin-bottom: 14px;
        font-size: 11.5px;
      }
      .alert-banner strong { color: #b91c1c; }
      .step-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 14px;
      }
      .step-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 10px;
        border-radius: 6px;
      }
      .step-badge {
        display: inline-block;
        background: #dc2626;
        color: white;
        font-weight: 900;
        padding: 2px 7px;
        border-radius: 4px;
        font-size: 10px;
        margin-bottom: 4px;
      }
      .step-title { font-weight: 800; color: #0f172a; font-size: 12px; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11px; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
      th { background: #f1f5f9; color: #0f172a; font-weight: 700; }
      .footer {
        border-top: 1px solid #e2e8f0;
        padding-top: 8px;
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #64748b;
      }
    </style>
  </head>
  <body>

    <!-- TRANG 1: QUY TẮC P-A-S-S & BẢNG PHÂN LOẠI CHẤT DẬP LỬA -->
    <div class="page-break">
      <div>
        <div class="header">
          <div>
            <div class="brand">🧯 FLAMEGUARD PRO</div>
            <div class="sub-brand">Hệ Thống Thiết Bị PCCC &amp; Cứu Nạn Cứu Hộ Chuẩn TCVN 3890:2023</div>
          </div>
          <div class="doc-info">
            <strong>MÃ TÀI LIỆU: CND-PCCC-2026</strong><br>
            Ban hành: Cục Cảnh Sát PCCC &amp; CNCH
          </div>
        </div>

        <h1>CẨM NANG HƯỚNG DẪN SỬ DỤNG &amp; THAO TÁC PHƯƠNG TIỆN PCCC</h1>
        <div class="alert-banner">
          <strong>⚠️ 3 NGUYÊN TẮC VÀNG KHI PHÁT HIỆN HỎA HOẠN:</strong><br>
          1. Hô hoán thật to, bấm nút báo cháy khẩn cấp để báo động toàn bộ khu vực xung quanh.<br>
          2. Cắt cầu dao điện tổng khu vực cháy (nếu vị trí cầu dao an toàn) trước khi tiến hành dập lửa.<br>
          3. Gọi ngay lực lượng Cứu hỏa chuyên nghiệp qua số <strong>114</strong> hoặc Hotline hỗ trợ <strong>0843.066.604</strong>.
        </div>

        <h2 style="font-size: 13px; font-weight: 800; color: #b91c1c; margin-bottom: 8px; text-transform: uppercase;">
          I. QUY TẮC THAO TÁC 4 BƯỚC P-A-S-S TIÊU CHUẨN QUỐC TẾ
        </h2>
        <div class="step-grid">
          <div class="step-card">
            <span class="step-badge">BƯỚC 1: P - PULL</span>
            <div class="step-title">Giật chốt hãm kẹp chì niêm phong</div>
            <p style="font-size: 11px; color: #475569;">Dùng ngón tay móc vào khuyên tròn chốt hãm, giật dứt khoát làm đứt dây chì niêm phong an toàn.</p>
          </div>
          <div class="step-card">
            <span class="step-badge">BƯỚC 2: A - AIM</span>
            <div class="step-title">Hướng vòi xả trực tiếp vào gốc lửa</div>
            <p style="font-size: 11px; color: #475569;">Cầm đầu loa phun/vòi xả, đứng ở đầu hướng gió, giữ cự ly an toàn 1.5m - 2m và hướng vào chân ngọn lửa.</p>
          </div>
          <div class="step-card">
            <span class="step-badge">BƯỚC 3: S - SQUEEZE</span>
            <div class="step-title">Bóp mạnh mỏ vịt (cò van xả)</div>
            <p style="font-size: 11px; color: #475569;">Bóp chặt van bóp để khí nén đẩy bột hoặc khí lạnh phun trào mạnh mẽ ra khỏi bình dập lửa.</p>
          </div>
          <div class="step-card">
            <span class="step-badge">BƯỚC 4: S - SWEEP</span>
            <div class="step-title">Quét vòi qua lại liên tục</div>
            <p style="font-size: 11px; color: #475569;">Quét vòi phun đều đặn từ trái qua phải, bao phủ toàn bộ chân đám cháy cho đến khi ngọn lửa tắt ngấm hoàn toàn.</p>
          </div>
        </div>

        <h2 style="font-size: 13px; font-weight: 800; color: #b91c1c; margin-bottom: 8px; text-transform: uppercase;">
          II. BẢNG TRA CỨU PHÂN LOẠI CHẤT DẬP LỬA THEO ĐÁM CHÁY
        </h2>
        <table>
          <thead>
            <tr>
              <th>Loại Bình Chữa Cháy</th>
              <th>Đám Cháy Hiệu Quả Nhất</th>
              <th>Tuyệt Đối Cấm Dùng Cho</th>
              <th>Chu Kỳ Kiểm Tra</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Bột khô ABC (4kg, 8kg, 35kg)</strong></td>
              <td>Chất rắn (gỗ, giấy), Xăng dầu, Khí gas, Thiết bị điện hạ thế</td>
              <td>Phòng thiết bị máy chủ vi mạch điện tử (gây rỉ sét)</td>
              <td>12 tháng / lần</td>
            </tr>
            <tr>
              <td><strong>Khí CO2 (MT3 3kg, MT5 5kg)</strong></td>
              <td>Phòng máy chủ IT, trạm điện tử, tủ điện viễn thông</td>
              <td>Đám cháy ngoài trời gió lớn, kim loại cháy (sinh khí độc CO)</td>
              <td>Cân định kỳ 6 tháng / lần</td>
            </tr>
            <tr>
              <td><strong>Bọt Foam Sinh Học (6L, 9L)</strong></td>
              <td>Cháy dầu ăn bếp ăn (Class F/K), xăng dầu, hóa chất lỏng</td>
              <td>Đám cháy điện cao thế khi chưa ngắt nguồn điện</td>
              <td>12 tháng / lần</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="footer">
        <div>FLAMEGUARD PRO VIETNAM • Hotline PCCC: 0843.066.604 • fire-safety-shop.vercel.app</div>
        <div>Trang 1 / 2 • TCVN 3890:2023</div>
      </div>
    </div>

    <!-- TRANG 2: HƯỚNG DẪN KIỂM ĐỊNH ÁP SUẤT & THIẾT BỊ THOÁT NẠN -->
    <div class="page-break">
      <div>
        <div class="header">
          <div>
            <div class="brand">🧯 FLAMEGUARD PRO</div>
            <div class="sub-brand">Hệ Thống Thiết Bị PCCC &amp; Cứu Nạn Cứu Hộ Chuẩn TCVN 3890:2023</div>
          </div>
          <div class="doc-info">
            <strong>MÃ TÀI LIỆU: CND-PCCC-2026</strong><br>
            Quy Trình Kiểm Tra Định Kỳ
          </div>
        </div>

        <h2 style="font-size: 13px; font-weight: 800; color: #b91c1c; margin-bottom: 8px; text-transform: uppercase;">
          III. CÁCH ĐỌC ĐỒNG HỒ ĐO ÁP SUẤT (PRESSURE GAUGE) BÌNH CHỮA CHÁY
        </h2>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 14px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 8px; border-radius: 4px;">
              <strong style="color: #b91c1c;">🔴 VẠCH ĐỎ (BÊN TRÁI):</strong>
              <p style="font-size: 10.5px; color: #475569; margin-top: 4px;">Bình đã bị tụt áp lực, không đủ lực đẩy bột ra ngoài. Cần mang đến trạm nạp khí ngay lập tức.</p>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px; border-radius: 4px;">
              <strong style="color: #15803d;">🟢 VẠCH XANH (CHÍNH GIỮA):</strong>
              <p style="font-size: 10.5px; color: #475569; margin-top: 4px;">Áp suất đạt chuẩn hoàn hảo (1.2 - 1.4 MPa). Bình sẵn sàng hoạt động với hiệu suất dập lửa cao nhất.</p>
            </div>
            <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 8px; border-radius: 4px;">
              <strong style="color: #b45309;">🟡 VẠCH VÀNG (BÊN PHẢI):</strong>
              <p style="font-size: 10.5px; color: #475569; margin-top: 4px;">Bình bị quá áp (thường do để gần nguồn nhiệt hoặc dưới trời nắng gắt). Cần di chuyển vào nơi râm mát.</p>
            </div>
          </div>
        </div>

        <h2 style="font-size: 13px; font-weight: 800; color: #b91c1c; margin-bottom: 8px; text-transform: uppercase;">
          IV. HƯỚNG DẪN THAO TÁC THIẾT BỊ CỨU NẠN THOÁT HIỂM KHẨN CẤP
        </h2>
        <div class="step-grid">
          <div class="step-card">
            <div style="font-weight: 800; color: #b91c1c; margin-bottom: 4px;">1. Mặt Nạ Chống Khói Độc TZL30 (30 Phút)</div>
            <p style="font-size: 11px; color: #475569;">
              • Bóc hộp nhựa, giật mạnh 2 nút cao su màu đỏ ở 2 đầu phin lọc.<br>
              • Trùm mũ tráng bạc qua đầu, kéo dây chun vừa khít mặt.<br>
              • Thở đều đặn, mặt nạ lọc sạch khí CO, HCN, SO2 trong 30 phút thoát nạn.
            </p>
          </div>
          <div class="step-card">
            <div style="font-weight: 800; color: #b91c1c; margin-bottom: 4px;">2. Chăn Dập Lửa Sợi Thủy Tinh (1.8m x 1.8m)</div>
            <p style="font-size: 11px; color: #475569;">
              • Rút mạnh 2 dải băng màu đen để chăn tự bung ra.<br>
              • Cầm 2 góc chăn che trước mặt, nhẹ nhàng phủ kín hoàn toàn đám cháy.<br>
              • Hoặc trùm chăn lên người rồi nhanh chóng cúi thấp chạy thoát ra ngoài.
            </p>
          </div>
          <div class="step-card">
            <div style="font-weight: 800; color: #b91c1c; margin-bottom: 4px;">3. Dây Thoát Hiểm Tự Động Nhà Cao Tầng</div>
            <p style="font-size: 11px; color: #475569;">
              • Móc chốt an toàn vào giá treo ban công hoặc dầm bê tông kiên cố.<br>
              • Thả cuộn dây thép xuống đất, thắt đai cứu hộ sát nách.<br>
              • Bước chân ra ngoài lan can, bộ giảm tốc tự điều chỉnh tốc độ hạ chậm 1m/s an toàn.
            </p>
          </div>
          <div class="step-card">
            <div style="font-weight: 800; color: #b91c1c; margin-bottom: 4px;">4. Bố Trí Phương Tiện Theo Chuẩn TCVN 3890</div>
            <p style="font-size: 11px; color: #475569;">
              • Đặt bình trên giá treo tường hoặc kệ sàn cách mặt đất 1.2m.<br>
              • Vị trí đặt phải thông thoáng, dễ thấy, ngay cạnh cửa ra vào hoặc cầu thang.<br>
              • Dán thẻ dạ quang chỉ dẫn vị trí bình phát sáng trong bóng tối.
            </p>
          </div>
        </div>

        <div class="alert-banner" style="margin-top: 6px;">
          <strong>📞 TRUNG TÂM HỖ TRỢ KỸ THUẬT &amp; CỨU HỘ FLAMEGUARD PRO:</strong><br>
          Hotline tiếp nhận sự cố: <strong>0843.066.604</strong> • Đường dây nóng Cứu Hỏa Quốc Gia: <strong>114</strong> • Website: <strong>fire-safety-shop.vercel.app</strong>
        </div>
      </div>

      <div class="footer">
        <div>FLAMEGUARD PRO VIETNAM • Hotline PCCC: 0843.066.604 • fire-safety-shop.vercel.app</div>
        <div>Trang 2 / 2 • Bản Quyền Thuộc Về FLAMEGUARD PRO</div>
      </div>
    </div>

  </body>
  </html>
  `;

  await pagePCCC.setContent(htmlPCCC, { waitUntil: 'networkidle0' });
  const pdfPCCCPath = path.join(process.cwd(), 'public', 'Huong_Dan_Su_Dung_PCCC.pdf');
  await pagePCCC.pdf({
    path: pdfPCCCPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' }
  });
  console.log('✓ Đã tạo thành công Huong_Dan_Su_Dung_PCCC.pdf (2 trang):', fs.statSync(pdfPCCCPath).size, 'bytes');

  await browser.close();
  console.log('🎉 Hoàn thành xuất sắc việc tạo toàn bộ tài liệu hướng dẫn sử dụng!');
}

generateManuals().catch(err => {
  console.error('❌ Lỗi tạo tài liệu:', err);
  process.exit(1);
});
