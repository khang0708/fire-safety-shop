# 🔥 FLAMEGUARD PRO - Thiết Bị PCCC & Cứu Hộ Chuẩn Kiểm Định (TCVN 3890)

Hệ thống phân phối và quản lý giải pháp phòng cháy chữa cháy (PCCC) & cứu nạn cứu hộ chuyên nghiệp. Cam kết phương tiện đạt chuẩn tem kiểm định của Cục Cảnh sát PCCC & CNCH - Bộ Công An, áp dụng theo tiêu chuẩn **TCVN 3890:2023**.

---

## 🚀 Các Tính Năng Nổi Bật

* **Storefront Chuyên Nghiệp:** Danh mục thiết bị đầy đủ (Bình bột ABC, Khí CO2, Bọt Foam sinh học, Mặt nạ chống độc TZL30, Dây thoát hiểm hạ chậm, Chăn dập lửa sợi thủy tinh).
* **Phân Loại Khu Vực Ứng Dụng:** Hộ gia đình/Chung cư, Nhà xưởng/Kho hàng, Văn phòng, Bếp ăn nhà hàng, Phương tiện giao thông.
* **In Phiếu Bàn Giao & Biên Bản Nghiệm Thu Chuẩn A4:** Tích hợp quy trình kiểm định áp suất kim đồng hồ vạch xanh, niêm phong kẹp chì và biên bản bàn giao có giá trị pháp lý.
* **AI Khảo Sát An Toàn PCCC:** Trợ lý AI phân tích hình ảnh không gian (bếp, phòng máy chủ, nhà xưởng) để phát hiện mối nguy cháy nổ và tư vấn thiết bị theo TCVN 3890.
* **Hệ Thống Voucher Ưu Đãi An Toàn:** Mã giảm giá `ANTOAN10`, `CHUNGCU50K`, `FREESHIP`, `DOANHNGHIEP15`.
* **Bảng Điều Hành Admin Portal:** Theo dõi đơn hàng thời gian thực, quản lý kho tồn thiết bị, biểu đồ phân tích doanh số và cài đặt đa kênh Zalo/Telegram/Facebook.

---

## 🛠️ Công Nghệ Sử Dụng

* **Frontend:** React 19, TailwindCSS 4, Lucide Icons, Vite 8.
* **Backend:** Express API, Node.js, Local-first Persistence (BroadcastChannel & In-Memory Fallback).
* **Testing:** Bộ kiểm thử đơn vị, kiểm thử bảo mật XSS/Token và kiểm thử giải quyết xung đột dữ liệu Local-First.

---

## 📦 Cài Đặt & Khởi Chạy

1. **Cài đặt các gói phụ thuộc:**
   ```bash
   npm install
   ```

2. **Chạy máy chủ phát triển:**
   ```bash
   # Chạy giao diện Storefront:
   npm run dev

   # Hoặc chạy song song cả Express Server và Vite:
   npm run dev:all
   ```

3. **Chạy kiểm thử toàn diện:**
   ```bash
   npm test
   ```

4. **Kiểm tra linter và đóng gói ứng dụng:**
   ```bash
   npm run lint
   npm run build
   ```

---

## 🔐 Cổng Quản Trị Nội Bộ (Admin Portal)

* **Đường dẫn:** Mở `http://localhost:5173/#admin` hoặc bấm tổ hợp phím `Ctrl + Shift + A` (hoặc `Alt + Shift + A`).
* **Đăng nhập:** Hỗ trợ SSO Google, Facebook, Telegram hoặc mã PIN an toàn.
