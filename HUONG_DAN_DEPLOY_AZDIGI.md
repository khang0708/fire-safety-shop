# 📖 SỔ TAY TRIỂN KHAI (DEPLOY) & CẬP NHẬT MÃ NGUỒN VPS AZDIGI
**Dự án:** FlameGuard Pro - PCCC Phát An Tâm  
**Tên miền chính:** [pcccphatantam.com](https://pcccphatantam.com)  
**Địa chỉ IP VPS:** `45.252.251.189`  
**Hệ điều hành máy chủ:** Ubuntu 22.04 / 24.04 LTS (KVM VPS AZDIGI)  

---

## 📌 PHẦN 1: CẤU HÌNH BẢN GHI DNS TÊN MIỀN TẠI TENTEN

Trên trang quản lý DNS của **TenTen** (`navi.tenten.vn`), bạn tạo chính xác 2 bản ghi sau:

| Tên bản ghi (Host) | Loại (Type) | Giá trị (IP Address) | TTL | Ý nghĩa |
| :--- | :--- | :--- | :--- | :--- |
| **@** | **A** | `45.252.251.189` | 300 | Trỏ tên miền gốc `pcccphatantam.com` về VPS |
| **www** | **A** | `45.252.251.189` | 300 | Trỏ tiền tố `www.pcccphatantam.com` về VPS |

> ⚠️ **LƯU Ý:** Dòng `www` **BẮT BUỘC** chọn Loại là **A** (hoặc nếu dùng `CNAME` thì Giá trị phải là `@` hoặc `pcccphatantam.com`). Tuyệt đối **không** chọn Loại `CNAME` mà lại điền Giá trị là số IP vì DNS thế giới sẽ báo lỗi `NXDOMAIN` và không cấp được chứng chỉ SSL.

---

## 📌 PHẦN 2: CÀI ĐẶT MÔI TRƯỜNG DOCKER TRÊN VPS AZDIGI (Chỉ làm 1 lần đầu)

Đăng nhập SSH vào VPS:
```bash
ssh root@45.252.251.189
```

Cài đặt Docker & Docker Compose:
```bash
apt update && apt install -y git curl
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
apt install -y docker-compose-plugin
```

---

## 📌 PHẦN 3: TẢI CODE & KHỞI CHẠY LẦN ĐẦU + CẤP SSL HTTPS

```bash
# 1. Tải code từ GitHub về VPS
git clone https://github.com/khang0708/fire-safety-shop.git
cd fire-safety-shop

# 2. Tạo file biến môi trường và cấp quyền chạy script
cp .env.example .env
chmod +x deploy.sh init-ssl.sh

# 3. Khởi chạy hệ thống bằng Docker Compose
./deploy.sh

# 4. Kích hoạt chứng chỉ SSL HTTPS miễn phí trọn đời
./init-ssl.sh pcccphatantam.com email-cua-ban@gmail.com
```

---

## 🔄 PHẦN 4: QUY TRÌNH CẬP NHẬT CODE MỚI (UPDATE WORKFLOW)

Mỗi khi bạn sửa giao diện, cập nhật tính năng mới trên máy tính:

### Bước 4.1: Tại máy tính cá nhân
```bash
# Lưu và đẩy code lên GitHub
git add .
git commit -m "feat: mo ta tinh nang moi vua cap nhat"
git push origin main
```

### Bước 4.2: Tại Terminal VPS AZDIGI
Đăng nhập SSH vào VPS và chạy đúng 1 lệnh:
```bash
cd fire-safety-shop
./deploy.sh
```

> 🛡️ **Bảo toàn dữ liệu 100%:** Dữ liệu đơn hàng mới, sản phẩm, bài đánh giá và cấu hình trong `server/data/` được gắn vào Docker Volume cố định trên VPS nên **hoàn toàn không bị mất hay ghi đè** khi cập nhật code.

---

## 🛠️ PHẦN 5: BẢNG TRA CỨU CÁC LỆNH VẬN HÀNH THƯỜNG DÙNG

| Mục đích thao tác | Lệnh thực thi trên VPS |
| :--- | :--- |
| **Xem trạng thái các container** | `docker compose ps` |
| **Xem log hoạt động Web/API** | `docker compose logs -f web` |
| **Xem log truy cập Nginx** | `docker compose logs -f nginx` |
| **Khởi động lại toàn bộ website** | `docker compose restart` |
| **Dừng website hoàn toàn** | `docker compose down` |
| **Xem dung lượng ổ đĩa VPS** | `df -h` |
| **Xem dung lượng RAM đang dùng** | `free -m` |
