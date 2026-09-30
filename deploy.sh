#!/bin/bash

# ====================================================
# SCRIPT DEPLOY & CẬP NHẬT TỰ ĐỘNG CHO VPS AZDIGI
# FLAMEGUARD PRO FIRE SAFETY SHOP
# ====================================================

set -e

echo "=========================================="
echo "🚀 BẮT ĐẦU QUY TRÌNH DEPLOY / CẬP NHẬT"
echo "=========================================="

# 1. Kéo mã nguồn mới nhất từ GitHub
echo "📥 1. Kéo mã nguồn mới nhất từ GitHub..."
git pull origin main

# 2. Kiểm tra file .env
if [ ! -f .env ]; then
    echo "⚠️ Chưa tìm thấy file .env! Đang sao chép từ .env.example..."
    cp .env.example .env
    echo "ℹ️ Vui lòng chỉnh sửa .env nếu cần cấu hình Database hoặc Domain."
fi

# 3. Build và khởi động lại các Container với Docker Compose
echo "🐳 2. Build và khởi động các container Docker..."
docker compose down
docker compose up -d --build

echo "=========================================="
echo "✅ DEPLOY THÀNH CÔNG!"
echo "Kiểm tra trạng thái container bằng: docker compose ps"
echo "Xem log hoạt động bằng: docker compose logs -f"
echo "=========================================="
