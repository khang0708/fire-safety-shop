# 📋 FLAMEGUARD PRO - TIẾN ĐỘ & BÀN GIAO TOÀN DIỆN HỆ THỐNG PCCC TCVN 3890

## 🎯 BẢNG TỔNG KẾT TIẾN ĐỘ 4 CHẶNG CHIẾN LƯỢC:

| Chặng | Tên Tính Năng | Trạng Thái | Mô Tả Nghiệp Vụ PCCC |
| :--- | :--- | :---: | :--- |
| **Chặng 1** | In Phiếu Bàn Giao & Biên Bản Nghiệm Thu PCCC | ✅ **HOÀN TẤT** | In phiếu xuất kho 2 liên: Liên 1 Bàn giao thiết bị, Liên 2 Biên bản nghiệm thu kiểm tra áp suất kim vạch xanh & tem BCA |
| **Chặng 2** | Hệ Thống Mã Ưu Đãi Trang Bị PCCC & Voucher | ✅ **HOÀN TẤT** | Voucher `ANTOAN10`, `CHUNGCU50K`, `FREESHIP`, `DOANHNGHIEP15` chiết khấu tự động theo giá trị đơn |
| **Chặng 3** | Báo Cáo & Thống Kê Phân Phối Thiết Bị Cứu Hỏa | ✅ **HOÀN TẤT** | 4 thẻ KPI, biểu đồ doanh thu 7 ngày, phân bổ theo môi trường rủi ro (Gia đình, Xưởng, Bếp, Server) |
| **Chặng 4** | Đánh Giá & Feedback Kiểm Định Thực Tế | ✅ **HOÀN TẤT** | Đánh giá thực tế từ Ban quản trị tòa nhà, Bếp trưởng nhà hàng, Chủ cơ sở xưởng kèm ảnh nghiệm thu |

---

## 📌 CHI TIẾT CÁC MODULE ĐÃ TRIỂN KHAI VÀ XÁC THỰC:

### 🧯 Chặng 1: In Phiếu Bàn Giao & Biên Bản Nghiệm Thu PCCC Chuẩn A4
* **Files:** `src/components/PrintInvoiceModal.jsx`, `src/components/AdminDashboard.jsx`.
* **Chức Năng:**
  * Hỗ trợ in 2 liên chuẩn kỹ thuật:
    * **Liên 1:** Phiếu giao nhận thiết bị cứu hỏa (Địa chỉ, người phụ trách, số điện thoại ban quản lý, ghi chú giao nhận).
    * **Liên 2:** Biên bản kiểm tra an toàn kỹ thuật & nghiệm thu bàn giao (Kiểm tra niêm phong chốt chì, đồng hồ áp lực chỉ vạch xanh, hướng dẫn 4 bước thao tác dập lửa khẩn cấp).
  * Hỗ trợ chuẩn `@media print` căn chỉnh hoàn hảo trên khổ giấy A4, không vỡ layout khi xuất file PDF.

---

### 🎟️ Chặng 2: Hệ Thống Mã Giảm Giá & Voucher Khuyến Mãi PCCC
* **Files:** `server/data/discounts.json`, `vite.config.js`, `src/api/index.js`, `src/context/ShopContext.jsx`, `src/components/CartDrawer.jsx`, `src/components/CheckoutModal.jsx`, `src/components/AdminDashboard.jsx`.
* **Chức Năng:**
  * Các mã ưu đãi: `ANTOAN10` (Giảm 10% tối đa 100k cho đơn từ 500k), `CHUNGCU50K` (Giảm ngay 50k cho hộ gia đình/chung cư), `FREESHIP` (Miễn cước xe chuyển thiết bị nặng), `DOANHNGHIEP15` (Chiết khấu 15% cho doanh nghiệp lắp đặt mới).
  * Tự động tính toán chiết khấu và kiểm tra hạn mức đơn tối thiểu (`minOrderValue`).
  * Quản trị CMS Admin: Thêm mã, tự sinh mã ngẫu nhiên (`🎲 Tự Sinh`), bật/tắt kích hoạt, xóa mã.

---

### 📊 Chặng 3: Báo Cáo & Thống Kê Phân Phối Thiết Bị (Sales Analytics)
* **Files:** `src/components/SalesAnalyticsView.jsx`, `src/components/AdminDashboard.jsx`.
* **Chức Năng:**
  * 4 Thẻ KPI: Tổng doanh thu, Số lượng đơn bàn giao, Giá trị trung bình/đơn (AOV), Tỷ lệ nghiệm thu đạt chuẩn.
  * Biểu đồ xu hướng phân phối thiết bị 7 ngày gần nhất.
  * Biểu đồ tỷ lệ phân bổ theo môi trường rủi ro: Gia đình/Chung cư, Nhà xưởng/Kho hàng, Văn phòng/Khách sạn, Bếp ăn nhà hàng, Ô tô/Tàu thuyền.
  * Bảng xếp hạng Top thiết bị bán chạy nhất (Bình bột ABC 4kg MFZL4, Bình khí CO2 MT3, Mặt nạ chống khói TZL30, Chăn dập lửa sợi thủy tinh).

---

### ⭐ Chặng 4: Đánh Giá & Phản Hồi Kiểm Định Từ Khách Hàng
* **Files:** `server/data/reviews.json`, `vite.config.js`, `src/api/index.js`, `src/context/ShopContext.jsx`, `src/components/ReviewsSection.jsx`, `src/components/AdminDashboard.jsx`.
* **Chức Năng:**
  * Phản hồi thực tế từ các đơn vị đã trang bị: Ban Quản Trị Chung Cư, Phòng Hạ Tầng IT, Bếp Trưởng Nhà Hàng.
  * Hiển thị điểm số trung bình (4.9/5.0), ảnh chụp tem kiểm định thực tế và huy hiệu `✓ Đã kiểm định & nghiệm thu`.
  * Khách hàng có thể gửi đánh giá, xếp hạng sao và tải ảnh nghiệm thu thực tế.
  * CMS Quản trị cho phép kiểm duyệt, ẩn/hiện hoặc xóa phản hồi vi phạm.

---

### 🛡️ Bộ Kiểm Thử Bảo Mật & Nghiệp Vụ (Test Suite 100% Pass)
* **Files:** `tests/unit-test.js`, `tests/security-test.js`, `tests/conflict-resolution-test.js`.
* **Lệnh chạy:** `npm test` (Tổng cộng 64/64 test cases đạt chuẩn).
* **Tiêu chuẩn kiểm thử:**
  1. **Toàn vẹn chiết khấu:** Khấu trừ chính xác các mã `ANTOAN10`, `CHUNGCU50K`, `FREESHIP`, chống gian lận đơn hàng âm tiền.
  2. **Quản lý kho tồn thiết bị:** Tính toán chính xác định mức tồn kho, cảnh báo mức thiếu hàng (`danger` khi $\le 5$, `warning` khi $\le 20$).
  3. **Bảo mật Secret Token:** Tuyệt đối không hardcode Telegram Bot Token hay Meta Page Token ở Client.
  4. **Chống tấn công XSS:** Làm sạch & mã hóa toàn bộ dữ liệu đầu vào khách hàng.
  5. **Local-First & Đồng bộ:** Cơ chế giải quyết xung đột (Conflict Resolution) bảo vệ dữ liệu khi vận hành offline hoặc đa thiết bị.

---

### 🚚 Quản Lý & Xác Nhận Phí Vận Chuyển Thiết Bị Nặng
* **Files:** `src/components/AdminDashboard.jsx`, `src/context/ShopContext.jsx`, `src/components/CheckoutModal.jsx`, `src/components/PrintInvoiceModal.jsx`.
* **Chức năng:**
  * Khách đặt đơn: Hệ thống tạm tính 0đ đối với thiết bị nặng cồng kềnh, cam kết kiểm tra địa chỉ thực tế.
  * Xưởng điều phối (Admin): Chọn nhanh cước Grab/Ahamove/Xe tải theo cự ly thực tế (`[Freeship]`, `[Nội thành 30k]`, `[Hỏa tốc 50k]`, `[Ngoại thành 70k]`).
  * 1-Click thông báo cước và xác nhận đơn qua Zalo khách hàng.

---

## 🛠️ HƯỚNG DẪN VẬN HÀNH:
1. **Khởi chạy Development Server:**
   ```bash
   npm run dev
   # Hoặc chạy song song cả Express Server và Vite:
   npm run dev:all
   ```
2. **Trải nghiệm Storefront:**
   * Mở `http://localhost:5173/` để xem danh mục thiết bị, công nghệ dập lửa, bộ lọc môi trường rủi ro, và áp dụng mã ưu đãi PCCC.
3. **Mở Bảng Điều Hành Quản Trị (Admin Portal):**
   * Nhấn phím tắt `Ctrl + Shift + A` (hoặc `Alt + Shift + A`) hoặc mở URL `http://localhost:5173/#admin`.
   * Đăng nhập bảo mật qua SSO (Google/Facebook/Telegram).
   * Khám phá đầy đủ các tab quản trị:
     1. 📦 **Quản Lý Đơn Hàng & Điều Phối Bàn Giao** (Có nút `🖨️ In Phiếu Bàn Giao & Biên Bản Nghiệm Thu`).
     2. 📊 **Báo Cáo Phân Phối & Doanh Thu PCCC**.
     3. 🧯 **Quản Lý Danh Mục Thiết Bị (Storefront CMS)**.
     4. 🎟️ **Quản Lý Mã Ưu Đãi PCCC**.
     5. ⭐ **Kiểm Duyệt Đánh Giá & Ảnh Nghiệm Thu**.
     6. 💬 **Cài Đặt Zalo & Telegram Nhận Cảnh Báo Đơn**.
     7. 🏷️ **Tồn Kho Thiết Bị & Phụ Kiện PCCC**.
