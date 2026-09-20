import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function generateManuals() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  // 1. Huong_Dan_Su_Dung_PCCC.pdf
  const page1 = await browser.newPage();
  const html1 = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <title>Cẩm Nang PCCC &amp; Quy Chuẩn TCVN 3890:2023</title>
    <style>
      @page { size: A4 portrait; margin: 15mm 20mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        font-size: 13px;
        line-height: 1.6;
      }
      .header {
        border-bottom: 3px solid #dc2626;
        padding-bottom: 12px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      .brand { font-size: 24px; font-weight: 900; color: #dc2626; letter-spacing: -0.5px; }
      .sub-brand { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
      .doc-title { font-size: 11px; font-weight: bold; color: #0f172a; text-align: right; }
      h1 { font-size: 18px; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; font-weight: 800; }
      .alert-box {
        background: #fef2f2;
        border-left: 4px solid #dc2626;
        padding: 12px 16px;
        margin-bottom: 20px;
        border-radius: 0 8px 8px 0;
      }
      .step-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 20px;
      }
      .step-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 12px;
        border-radius: 8px;
      }
      .step-num {
        display: inline-block;
        background: #dc2626;
        color: white;
        font-weight: 900;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        margin-bottom: 6px;
      }
      .step-title { font-weight: bold; color: #0f172a; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
      th { background: #f1f5f9; color: #0f172a; font-weight: bold; }
      .footer {
        margin-top: 30px;
        border-top: 1px solid #e2e8f0;
        padding-top: 12px;
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #64748b;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="brand">🧯 FLAMEGUARD PRO</div>
        <div class="sub-brand">Hệ Thống Thiết Bị PCCC &amp; Cứu Hộ Tiêu Chuẩn TCVN 3890:2023</div>
      </div>
      <div class="doc-title">
        TÀI LIỆU KỸ THUẬT: HDSD-PCCC-2026<br>
        Ban hành: Cục Cảnh Sát PCCC &amp; CNCH
      </div>
    </div>

    <h1>CẨM NANG HƯỚNG DẪN SỬ DỤNG &amp; THAO TÁC PHƯƠNG TIỆN PCCC</h1>
    <div class="alert-box">
      <strong>⚠️ LƯU Ý SỐNG CÒN KHI XẢY RA HỎA HOẠN:</strong><br>
      1. Bấm chuông báo cháy hoặc hô hoán to cho toàn bộ cơ sở.<br>
      2. Ngắt cầu dao điện tổng khu vực cháy trước khi xịt nước (nếu an toàn).<br>
      3. Gọi ngay tổng đài khẩn cấp <strong>114</strong> hoặc Hotline hỗ trợ <strong>0843.066.604</strong>.
    </div>

    <h2 style="font-size: 14px; margin-bottom: 10px; color: #b91c1c;">I. QUY TẮC THAO TÁC 4 BƯỚC P-A-S-S TIÊU CHUẨN QUỐC TẾ</h2>
    <div class="step-grid">
      <div class="step-card">
        <span class="step-num">BƯỚC 1: P - PULL</span>
        <div class="step-title">Giật chốt hãm kẹp chì</div>
        <p>Rút mạnh chốt hãm niêm phong chì ra khỏi van xả của bình chữa cháy.</p>
      </div>
      <div class="step-card">
        <span class="step-num">BƯỚC 2: A - AIM</span>
        <div class="step-title">Hướng vòi xả vào gốc lửa</div>
        <p>Hướng đầu loa hoặc vòi phun trực diện vào gốc đám cháy, giữ cự ly an toàn 1.5 - 2m.</p>
      </div>
      <div class="step-card">
        <span class="step-num">BƯỚC 3: S - SQUEEZE</span>
        <div class="step-title">Bóp mạnh mỏ vịt (cò van)</div>
        <p>Bóp cò van xả dứt khoát để đẩy chất dập lửa (bột ABC / bọt Foam / khí CO2) xịt ra ngoài.</p>
      </div>
      <div class="step-card">
        <span class="step-num">BƯỚC 4: S - SWEEP</span>
        <div class="step-title">Quét qua lại liên tục</div>
        <p>Quét vòi phun qua lại bao phủ toàn bộ chân ngọn lửa cho đến khi đám cháy tắt hoàn toàn.</p>
      </div>
    </div>

    <h2 style="font-size: 14px; margin-bottom: 10px; color: #b91c1c;">II. BẢNG TRA CỨU PHÂN LOẠI CHẤT DẬP LỬA THEO ĐÁM CHÁY</h2>
    <table>
      <thead>
        <tr>
          <th>Loại Bình</th>
          <th>Phù Hợp Đám Cháy</th>
          <th>Cấm Dùng Cho</th>
          <th>Chu Kỳ Kiểm Định</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Bột khô ABC</strong></td>
          <td>Chất rắn (Gỗ, vải, giấy), Xăng dầu, Khí gas, Thiết bị điện hạ thế</td>
          <td>Phòng máy chủ IT nhạy cảm (gây bụi bám)</td>
          <td>12 tháng / lần</td>
        </tr>
        <tr>
          <td><strong>Khí CO2 (MT3, MT5)</strong></td>
          <td>Thiết bị điện, phòng Server, vi mạch điện tử tinh xảo</td>
          <td>Đám cháy ngoài trời gió to, than đỏ (sinh khí độc CO)</td>
          <td>Kiểm tra cân nặng 6 tháng / lần</td>
        </tr>
        <tr>
          <td><strong>Bọt Foam Sinh Học</strong></td>
          <td>Dầu mỡ bếp ăn, chất lỏng dễ cháy (Xăng, dung môi)</td>
          <td>Đám cháy điện cao thế khi chưa ngắt điện</td>
          <td>12 tháng / lần</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div>FLAMEGUARD PRO VIETNAM • Hotline: 0843.066.604 • Website: fire-safety-shop.vercel.app</div>
      <div>Trang 1/1 • Tiêu Chuẩn TCVN 3890:2023</div>
    </div>
  </body>
  </html>
  `;
  await page1.setContent(html1);
  const pdf1Path = path.join(process.cwd(), 'public', 'Huong_Dan_Su_Dung_PCCC.pdf');
  await page1.pdf({ path: pdf1Path, format: 'A4', printBackground: true });
  console.log('✓ Đã tạo Huong_Dan_Su_Dung_PCCC.pdf:', fs.statSync(pdf1Path).size, 'bytes');

  // 2. Huong_Dan_Su_Dung_FlameGuard_Pro.pdf
  const page2 = await browser.newPage();
  const html2 = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <title>Cẩm Nang Quản Trị &amp; Vận Hành FLAMEGUARD PRO</title>
    <style>
      @page { size: A4 portrait; margin: 15mm 20mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        font-size: 13px;
        line-height: 1.6;
      }
      .header {
        border-bottom: 3px solid #0f172a;
        padding-bottom: 12px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      .brand { font-size: 24px; font-weight: 900; color: #dc2626; }
      .sub-brand { font-size: 11px; color: #475569; font-weight: 600; text-transform: uppercase; }
      .doc-title { font-size: 11px; font-weight: bold; color: #0f172a; text-align: right; }
      h1 { font-size: 18px; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; font-weight: 800; }
      .feature-box {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 14px;
        margin-bottom: 14px;
      }
      .feature-title { font-weight: bold; color: #dc2626; font-size: 14px; margin-bottom: 6px; }
      .footer {
        margin-top: 30px;
        border-top: 1px solid #e2e8f0;
        padding-top: 12px;
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #64748b;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="brand">🛡️ FLAMEGUARD PRO</div>
        <div class="sub-brand">Tài Liệu Hướng Dẫn Vận Hành Hệ Thống Admin &amp; Kho Thiết Bị</div>
      </div>
      <div class="doc-title">
        MÃ TÀI LIỆU: HDVH-FG-2026<br>
        Phiên bản: 1.0.0 (Production)
      </div>
    </div>

    <h1>HƯỚNG DẪN QUẢN TRỊ &amp; KIỂM ĐỊNH THIẾT BỊ FLAMEGUARD PRO</h1>
    
    <div class="feature-box">
      <div class="feature-title">1. Quản Lý Đơn Hàng &amp; Nghiệm Thu Áp Suất</div>
      <p>Kỹ thuật viên mở chi tiết từng đơn hàng, tải ảnh chụp thực tế đồng hồ áp suất vạch xanh và tem kẹp chì niêm phong BCA trước khi xuất kho giao cho khách hàng.</p>
    </div>

    <div class="feature-box">
      <div class="feature-title">2. In Phiếu Bàn Giao &amp; Thẻ Dạ Quang (A4)</div>
      <p>Hệ thống hỗ trợ in phiếu bàn giao xuất kho 3 bên (Kỹ sư kiểm định, Đội vận chuyển, Đại diện tiếp nhận) và Thẻ hướng dẫn thao tác khẩn cấp dán cạnh bình chữa cháy.</p>
    </div>

    <div class="feature-box">
      <div class="feature-title">3. Quản Lý Kho Khí Nạp &amp; Thiết Bị PCCC</div>
      <p>Theo dõi thời gian thực số lượng bình bột ABC, bình khí CO2, bọt Foam, tự động cảnh báo khi mức tồn kho xuống dưới ngưỡng an toàn (&le; 5 bình).</p>
    </div>

    <div class="feature-box">
      <div class="feature-title">4. Tích Hợp Thông Báo Telegram &amp; Zalo Chat</div>
      <p>Mỗi khi có đơn hàng mới hoặc khách hàng gửi phản hồi, hệ thống tự động phát cảnh báo âm thanh và gửi tin nhắn tức thời đến Telegram Bot của ban chỉ huy.</p>
    </div>

    <div class="footer">
      <div>FLAMEGUARD PRO VIETNAM • Kỹ Thuật Trưởng: 0843.066.604</div>
      <div>Trang 1/1 • Bản Quyền Thuộc Về FLAMEGUARD PRO</div>
    </div>
  </body>
  </html>
  `;
  await page2.setContent(html2);
  const pdf2Path = path.join(process.cwd(), 'public', 'Huong_Dan_Su_Dung_FlameGuard_Pro.pdf');
  await page2.pdf({ path: pdf2Path, format: 'A4', printBackground: true });
  console.log('✓ Đã tạo Huong_Dan_Su_Dung_FlameGuard_Pro.pdf:', fs.statSync(pdf2Path).size, 'bytes');

  await browser.close();
}

generateManuals().catch(console.error);
