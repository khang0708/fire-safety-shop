#!/bin/bash
# scripts/install-pm2.sh
# ====================================================
# SCRIPT TỰ ĐỘNG CÀI ĐẶT NODE.JS & PM2 TRÊN VPS LINUX
# Tương thích: Ubuntu, Debian, CentOS, AlmaLinux, Rocky Linux
# ====================================================

set -e

echo "=========================================="
echo "🚀 BẮT ĐẦU CÀI ĐẶT PM2 TRÊN VPS"
echo "=========================================="

# 1. Hàm thực thi lệnh an toàn (tự nhận diện root hoặc sudo)
run_cmd() {
  if [ "$(id -u)" -ne 0 ]; then
    sudo "$@"
  else
    "$@"
  fi
}

# 2. Kiểm tra nếu PM2 đã có sẵn
if command -v pm2 &> /dev/null; then
  echo "✅ PM2 đã được cài đặt từ trước:"
  pm2 -v
  echo "Bạn có thể sử dụng pm2 ngay bây giờ!"
  exit 0
fi

# 3. Kiểm tra và cài đặt Node.js & npm nếu chưa có trên Host OS
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
  echo "📦 Chưa tìm thấy Node.js/npm trên Host VPS. Đang tiến hành cài đặt bản LTS..."

  if command -v apt-get &> /dev/null; then
    # Hệ điều hành Ubuntu / Debian
    run_cmd apt-get update -y
    run_cmd apt-get install -y curl ca-certificates gnupg
    if [ "$(id -u)" -ne 0 ]; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    else
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    fi
    run_cmd apt-get install -y nodejs
  elif command -v dnf &> /dev/null; then
    # Hệ điều hành AlmaLinux / Rocky Linux / RHEL 8+
    if [ "$(id -u)" -ne 0 ]; then
      curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    else
      curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    fi
    run_cmd dnf install -y nodejs
  elif command -v yum &> /dev/null; then
    # Hệ điều hành CentOS 7 / RHEL 7
    if [ "$(id -u)" -ne 0 ]; then
      curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    else
      curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    fi
    run_cmd yum install -y nodejs
  else
    echo "❌ Không tìm thấy trình quản lý gói (apt/dnf/yum). Vui lòng cài đặt Node.js thủ công."
    exit 1
  fi
fi

echo "  ✅ Node.js: $(node -v)"
echo "  ✅ npm: v$(npm -v)"

# 4. Cài đặt PM2 toàn cục (Global)
echo "⚙️ Đang cài đặt PM2 toàn cục..."
run_cmd npm install -g pm2

# 5. Cấu hình PM2 khởi động cùng hệ điều hành (Auto-Startup on boot)
echo "🔄 Cấu hình PM2 tự động khởi động cùng VPS..."
run_cmd pm2 startup systemd -u "$(whoami)" --hp "$HOME" 2>/dev/null || run_cmd pm2 startup 2>/dev/null || true

echo "=========================================="
echo "🎉 CÀI ĐẶT PM2 THÀNH CÔNG!"
echo "Phiên bản PM2: $(pm2 -v)"
echo "=========================================="
