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

## 🔄 PHẦN 4: TỰ ĐỘNG HÓA DEPLOY VỚI GITHUB ACTIONS (CI/CD)

Hệ thống đã được tích hợp quy trình **CI/CD hoàn toàn tự động** qua GitHub Actions. Mỗi khi bạn đẩy code lên nhánh `main`, hệ thống sẽ:
1. **CI:** Tự động chạy kiểm thử đơn vị, kiểm thử bảo mật (`npm test`), kiểm tra linter (`npm run lint`) và đóng gói (`npm run build`). Nếu có lỗi, quy trình sẽ dừng lại ngay để bảo vệ VPS.
2. **CD:** Nếu kiểm thử thành công, GitHub Actions tự động kết nối SSH vào VPS và thực thi `./deploy.sh`, cập nhật website tức thì mà không gián đoạn dịch vụ.

### 🔑 Các bước cài đặt GitHub Secrets (Chỉ làm 1 lần trên GitHub):

1. Truy cập vào kho chứa GitHub của bạn: `https://github.com/khang0708/fire-safety-shop`
2. Vào **Settings** > **Secrets and variables** > **Actions** > Nhấn **New repository secret**.
3. Thêm các Secret sau:

| Tên Secret | Giá trị mẫu | Giải thích |
| :--- | :--- | :--- |
| `VPS_HOST` | `45.252.251.189` | Địa chỉ IP của VPS AZDIGI |
| `VPS_USERNAME` | `root` | Tài khoản đăng nhập SSH vào VPS |
| `VPS_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY----- ...` | Khóa SSH Private Key (Khuyên dùng) |
| `VPS_PASSWORD` | `MatKhauVpsCuaBan` | Mật khẩu root VPS (Dùng nếu không cài SSH Key) |
| `VPS_PORT` | `22` | Cổng SSH (Mặc định 22) |
| `VPS_TARGET_DIR` | `/root/fire-safety-shop` | Thư mục chứa mã nguồn trên VPS |

> 💡 **Cách tạo SSH Key nhanh cho GitHub Actions (nếu chưa có):**
> Trên máy tính hoặc Terminal VPS, chạy lệnh:
> ```bash
> ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
> cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
> chmod 600 ~/.ssh/authorized_keys
> ```
> Sau đó copy toàn bộ nội dung file `~/.ssh/github_actions` (khóa private) dán vào secret `VPS_SSH_KEY`.

---

## 🚀 PHẦN 5: QUY TRÌNH PHÁT TRIỂN & CẬP NHẬT CODE MỖI NGÀY

Bây giờ bạn chỉ cần làm việc trên máy tính:
```bash
# 1. Lưu các thay đổi
git add .
git commit -m "feat: cap nhat giao dien hoac tinh nang moi"

# 2. Đẩy lên GitHub -> Tự động test và deploy lên VPS!
git push origin main
```
Sau khi push, bạn có thể vào tab **Actions** trên GitHub để theo dõi tiến trình kiểm thử và deploy trực tiếp.

> 🛡️ **Bảo toàn dữ liệu 100%:** Dữ liệu đơn hàng mới, sản phẩm, bài đánh giá và cấu hình trong `server/data/` cùng file SSL Nginx được script sao lưu và khôi phục tự động trong mỗi lần deploy.

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
