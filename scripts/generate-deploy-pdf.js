import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateDeployPdf() {
  console.log('🚀 Bắt đầu tạo file PDF Hướng Dẫn Deploy & Cập Nhật VPS AZDIGI...');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    userDataDir: path.join(os.tmpdir(), 'chrome-deploy-pdf-' + Date.now()),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

  const html = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <title>Hướng Dẫn Triển Khai &amp; Vận Hành Hệ Thống FLAMEGUARD PRO Trên VPS AZDIGI</title>
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
        font-size: 12.5px;
        line-height: 1.6;
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
        gap: 10px;
      }
      .brand-badge {
        background: #dc2626;
        color: #fff;
        font-weight: 800;
        font-size: 13px;
        padding: 5px 12px;
        border-radius: 6px;
        letter-spacing: 0.5px;
      }
      .header-sub {
        font-size: 10.5px;
        color: #64748b;
        font-weight: 500;
      }
      .footer-bar {
        border-top: 1px solid #e2e8f0;
        padding-top: 8px;
        margin-top: 20px;
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #64748b;
      }
      .title-hero {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        color: white;
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 20px;
        border-left: 6px solid #dc2626;
      }
      .title-hero h1 {
        font-size: 21px;
        font-weight: 800;
        margin-bottom: 8px;
        color: #f8fafc;
      }
      .title-hero p {
        font-size: 12px;
        color: #94a3b8;
        line-height: 1.5;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-top: 14px;
      }
      .meta-card {
        background: rgba(255, 255, 255, 0.08);
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      .meta-card .label {
        font-size: 10px;
        color: #94a3b8;
        text-transform: uppercase;
        font-weight: 600;
      }
      .meta-card .val {
        font-size: 12px;
        font-weight: 700;
        color: #f1f5f9;
        margin-top: 2px;
      }
      .section-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px 18px;
        margin-bottom: 16px;
      }
      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      .section-num {
        background: #dc2626;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 800;
      }
      .section-title {
        font-size: 14.5px;
        font-weight: 800;
        color: #0f172a;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0 14px 0;
        font-size: 11.5px;
      }
      th {
        background: #0f172a;
        color: #f8fafc;
        font-weight: 700;
        text-align: left;
        padding: 8px 12px;
        border: 1px solid #334155;
      }
      td {
        padding: 8px 12px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
      }
      .code-box {
        background: #0f172a;
        color: #38bdf8;
        font-family: Consolas, Monaco, "Courier New", monospace;
        padding: 12px 14px;
        border-radius: 8px;
        font-size: 11.5px;
        line-height: 1.5;
        margin: 8px 0 12px 0;
        overflow-x: auto;
        border: 1px solid #1e293b;
      }
      .code-comment {
        color: #64748b;
      }
      .badge-success {
        background: #dcfce7;
        color: #15803d;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 700;
        display: inline-block;
      }
      .badge-danger {
        background: #fee2e2;
        color: #b91c1c;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 700;
        display: inline-block;
      }
      .badge-warn {
        background: #fef3c7;
        color: #b45309;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 700;
        display: inline-block;
      }
      .note-callout {
        background: #eff6ff;
        border-left: 4px solid #2563eb;
        padding: 10px 14px;
        border-radius: 0 8px 8px 0;
        margin: 10px 0;
        font-size: 11.5px;
        color: #1e3a8a;
      }
      .warning-callout {
        background: #fffbeb;
        border-left: 4px solid #f59e0b;
        padding: 10px 14px;
        border-radius: 0 8px 8px 0;
        margin: 10px 0;
        font-size: 11.5px;
        color: #92400e;
      }
      .step-list {
        list-style: none;
        padding-left: 0;
        margin: 8px 0;
      }
      .step-list li {
        margin-bottom: 8px;
        padding-left: 20px;
        position: relative;
      }
      .step-list li::before {
        content: "👉";
        position: absolute;
        left: 0;
      }
    </style>
  </head>
  <body>

    <!-- TRANG 1: TỔNG QUAN, CẤU HÌNH DNS TENTEN & CÀI ĐẶT VPS -->
    <div class="page-break">
      <div>
        <div class="header-bar">
          <div class="header-brand">
            <span class="brand-badge">FLAMEGUARD PRO</span>
            <span style="font-weight: 700; font-size: 13px; color: #1e293b;">PCCC PHÁT AN TÂM</span>
          </div>
          <div class="header-sub">TÀI LIỆU KỸ THUẬT DEPLOY &amp; VẬN HÀNH VPS AZDIGI | 2026</div>
        </div>

        <div class="title-hero">
          <h1>SỔ TAY TRIỂN KHAI &amp; VẬN HÀNH WEBSITE</h1>
          <p>Hướng dẫn chi tiết quy trình đưa website vào hoạt động chính thức trên máy chủ VPS AZDIGI, kết nối tên miền TenTen, kích hoạt chứng chỉ bảo mật HTTPS và quy trình cập nhật mã nguồn định kỳ.</p>
          <div class="meta-grid">
            <div class="meta-card">
              <div class="label">Tên miền chính</div>
              <div class="val">pcccphatantam.com</div>
            </div>
            <div class="meta-card">
              <div class="label">IP Máy chủ VPS</div>
              <div class="val">45.252.251.189</div>
            </div>
            <div class="meta-card">
              <div class="label">Nhà cung cấp VPS</div>
              <div class="val">AZDIGI (KVM VPS)</div>
            </div>
            <div class="meta-card">
              <div class="label">Nhà cung cấp DNS</div>
              <div class="val">TenTen.vn</div>
            </div>
          </div>
        </div>

        <!-- PHẦN 1: CẤU HÌNH DNS TENTEN -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-num">1</div>
            <div class="section-title">CẤU HÌNH BẢN GHI DNS TÊN MIỀN TẠI TENTEN</div>
          </div>
          <p>Để người dùng truy cập được cả hai địa chỉ <code>pcccphatantam.com</code> và <code>www.pcccphatantam.com</code>, bạn cần tạo đúng 2 bản ghi Type <b>A</b> trên hệ thống DNS TenTen:</p>
          
          <table>
            <thead>
              <tr>
                <th>Tên bản ghi (Host)</th>
                <th>Loại (Type)</th>
                <th>Giá trị (IP Address)</th>
                <th>Độ ưu tiên / TTL</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>@</b></td>
                <td><span class="badge-success">A</span></td>
                <td><b>45.252.251.189</b></td>
                <td>300</td>
                <td>Trỏ domain gốc về VPS</td>
              </tr>
              <tr>
                <td><b>www</b></td>
                <td><span class="badge-success">A</span></td>
                <td><b>45.252.251.189</b></td>
                <td>300</td>
                <td>Trỏ tiền tố www về VPS</td>
              </tr>
            </tbody>
          </table>

          <div class="warning-callout">
            ⚠️ <b>LƯU Ý CỰC KỲ QUAN TRỌNG:</b> Dòng <code>www</code> <b>BẮT BUỘC</b> phải chọn Loại là <b>A</b> (hoặc nếu dùng CNAME thì Giá trị phải là <code>@</code> hoặc <code>pcccphatantam.com</code>). Tuyệt đối <b>KHÔNG</b> để Loại là <code>CNAME</code> mà lại điền Giá trị là dãy số IP <code>45.252.251.189</code> vì DNS sẽ báo lỗi <code>NXDOMAIN</code> và không cấp được SSL!
          </div>
        </div>

        <!-- PHẦN 2: CHUẨN BỊ MÔI TRƯỜNG TRÊN VPS AZDIGI -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-num">2</div>
            <div class="section-title">ĐĂNG NHẬP VÀ CÀI ĐẶT MÔI TRƯỜNG DOCKER TRÊN VPS</div>
          </div>
          <p>Mở Terminal (hoặc PowerShell / PuTTY) và thực hiện kết nối SSH vào VPS:</p>
          <div class="code-box">
<span class="code-comment"># 1. Đăng nhập vào VPS với quyền root (nhập mật khẩu VPS được AZDIGI cấp)</span>
ssh root@45.252.251.189

<span class="code-comment"># 2. Cài đặt Docker &amp; Docker Compose tự động (chỉ cần chạy 1 lần duy nhất)</span>
apt update &amp;&amp; apt install -y git curl
curl -fsSL https://get.docker.com -o get-docker.sh &amp;&amp; sh get-docker.sh
apt install -y docker-compose-plugin
          </div>
        </div>
      </div>

      <div class="footer-bar">
        <span>Tài Liệu Hướng Dẫn Kỹ Thuật FLAMEGUARD PRO</span>
        <span>Trang 1 / 2</span>
      </div>
    </div>

    <!-- TRANG 2: KHỞI TẠO DỰ ÁN, CẤP SSL & QUY TRÌNH UPDATE CODE MỚI -->
    <div class="page-break">
      <div>
        <div class="header-bar">
          <div class="header-brand">
            <span class="brand-badge">FLAMEGUARD PRO</span>
            <span style="font-weight: 700; font-size: 13px; color: #1e293b;">PCCC PHÁT AN TÂM</span>
          </div>
          <div class="header-sub">TÀI LIỆU KỸ THUẬT DEPLOY &amp; VẬN HÀNH VPS AZDIGI | 2026</div>
        </div>

        <!-- PHẦN 3: TẢI CODE & KHỞI CHẠY LẦN ĐẦU -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-num">3</div>
            <div class="section-title">TẢI MÃ NGUỒN &amp; KÍCH HOẠT CHỨNG CHỈ BẢO MẬT SSL (HTTPS)</div>
          </div>
          <p>Thực hiện các lệnh sau để tải code từ GitHub, cấu hình hệ thống và kích hoạt HTTPS bảo mật miễn phí:</p>
          <div class="code-box">
<span class="code-comment"># 1. Tải source code từ kho lưu trữ GitHub về thư mục máy chủ</span>
git clone https://github.com/khang0708/fire-safety-shop.git
cd fire-safety-shop

<span class="code-comment"># 2. Tạo file biến môi trường và cấp quyền chạy script</span>
cp .env.example .env
chmod +x deploy.sh init-ssl.sh

<span class="code-comment"># 3. Khởi chạy dự án bằng Docker Compose</span>
./deploy.sh

<span class="code-comment"># 4. Cấp chứng chỉ SSL bảo mật HTTPS miễn phí (thay email thật của bạn)</span>
./init-ssl.sh pcccphatantam.com email-cua-ban@gmail.com
          </div>
          <div class="note-callout">
            🔒 <b>Cơ chế tự động gia hạn SSL:</b> Container <code>certbot</code> đã được cấu hình chạy ngầm, tự động kiểm tra và gia hạn chứng chỉ trước khi hết hạn mỗi 60 ngày. Website của bạn sẽ luôn có ổ khóa xanh HTTPS mà không cần thao tác gia hạn thủ công.
          </div>
        </div>

        <!-- PHẦN 4: QUY TRÌNH CẬP NHẬT CODE MỚI (UPDATE WORKFLOW) -->
        <div class="section-card" style="border-left: 5px solid #16a34a;">
          <div class="section-header">
            <div class="section-num" style="background: #16a34a;">4</div>
            <div class="section-title" style="color: #16a34a;">QUY TRÌNH CẬP NHẬT SOURCE CODE MỚI (UPDATE WORKFLOW)</div>
          </div>
          <p>Mỗi khi bạn sửa đổi giao diện, thêm tính năng, hoặc chỉnh sửa logic trên máy tính cá nhân, hãy thực hiện theo đúng 2 bước đơn giản sau:</p>

          <p style="font-weight: 700; margin-top: 8px;">Bước 4.1: Tại máy tính cá nhân (Đẩy code lên GitHub)</p>
          <div class="code-box">
<span class="code-comment"># Lưu thay đổi và đẩy lên nhánh chính của GitHub</span>
git add .
git commit -m "feat: cap nhat tinh nang moi"
git push origin main
          </div>

          <p style="font-weight: 700; margin-top: 8px;">Bước 4.2: Tại Terminal VPS AZDIGI (Cập nhật website bằng 1 lệnh)</p>
          <div class="code-box">
<span class="code-comment"># 1. Truy cập vào thư mục dự án</span>
cd fire-safety-shop

<span class="code-comment"># 2. Chạy script tự động cập nhật duy nhất:</span>
./deploy.sh
          </div>

          <div class="note-callout">
            🛡️ <b>An toàn dữ liệu tuyệt đối:</b> Lệnh <code>./deploy.sh</code> tự động kéo code mới nhất về và build lại container. Dữ liệu thực tế như danh sách sản phẩm, các đơn đặt hàng mới, bài đánh giá và cấu hình cài đặt được lưu tại thư mục <code>server/data/</code> gắn với <b>Docker Volume</b> nên <b>KHÔNG BAO GIỜ BỊ MẤT</b> khi cập nhật code!
          </div>
        </div>

        <!-- PHẦN 5: CÁC LỆNH QUẢN TRỊ NGUY CẤP / THƯỜNG DÙNG -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-num">5</div>
            <div class="section-title">BẢNG TRA CỨU CÁC LỆNH VẬN HÀNH THƯỜNG DÙNG</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Mục đích thao tác</th>
                <th>Câu lệnh thực thi trên VPS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Xem trạng thái các container</b></td>
                <td><code>docker compose ps</code></td>
              </tr>
              <tr>
                <td><b>Xem log hoạt động của Web / API</b></td>
                <td><code>docker compose logs -f web</code></td>
              </tr>
              <tr>
                <td><b>Xem log truy cập của Nginx Proxy</b></td>
                <td><code>docker compose logs -f nginx</code></td>
              </tr>
              <tr>
                <td><b>Khởi động lại toàn bộ dịch vụ</b></td>
                <td><code>docker compose restart</code></td>
              </tr>
              <tr>
                <td><b>Dừng website hoàn toàn</b></td>
                <td><code>docker compose down</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="footer-bar">
        <span>Tài Liệu Hướng Dẫn Kỹ Thuật FLAMEGUARD PRO</span>
        <span>Trang 2 / 2</span>
      </div>
    </div>

  </body>
  </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const outputDir = path.join(__dirname, '../public');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'Huong_Dan_Deploy_Va_Cap_Nhat_VPS_AZDIGI.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '14mm',
      bottom: '14mm',
      left: '16mm',
      right: '16mm'
    }
  });

  await browser.close();
  console.log(`✅ Xuất thành công file PDF tại: ${outputPath}`);
}

generateDeployPdf().catch((err) => {
  console.error('❌ Lỗi tạo PDF:', err);
  process.exit(1);
});
