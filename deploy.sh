#!/bin/bash

# ====================================================
# SCRIPT DEPLOY & CẬP NHẬT TỰ ĐỘNG CHO VPS
# FLAMEGUARD PRO FIRE SAFETY SHOP
# ====================================================

set -e

echo "=========================================="
echo "🚀 BẮT ĐẦU QUY TRÌNH DEPLOY / CẬP NHẬT VPS"
echo "=========================================="

# 1. Sao lưu tạm các file dữ liệu runtime và cấu hình SSL đang hoạt động trên VPS
BACKUP_DIR="/tmp/flameguard_deploy_backup_$(date +%s)"
mkdir -p "$BACKUP_DIR"

if [ -d "server/data" ]; then
    echo "💾 Đang sao lưu tạm dữ liệu thực tế tại server/data..."
    cp -r server/data "$BACKUP_DIR/"
fi

if [ -f "nginx/conf.d/app.conf" ]; then
    echo "🔒 Đang sao lưu cấu hình SSL Nginx hiện tại..."
    cp nginx/conf.d/app.conf "$BACKUP_DIR/app.conf"
fi

# 2. Kéo mã nguồn mới nhất từ GitHub
echo "📥 1. Đồng bộ mã nguồn mới nhất từ GitHub..."
git fetch origin main
git reset --hard origin/main

# 3. Khôi phục lại dữ liệu runtime và cấu hình SSL
if [ -d "$BACKUP_DIR/data" ]; then
    echo "🔄 Khôi phục dữ liệu thực tế (đơn hàng, đánh giá, kho)..."
    cp -r "$BACKUP_DIR/data"/* server/data/ 2>/dev/null || true
fi

if [ -f "$BACKUP_DIR/app.conf" ]; then
    echo "🔒 Khôi phục cấu hình HTTPS Nginx..."
    cp "$BACKUP_DIR/app.conf" nginx/conf.d/app.conf
fi

rm -rf "$BACKUP_DIR"

# Đảm bảo loại bỏ triệt để sản phẩm hoa cũ fl-1787735321783 khỏi server/data/products.json
if [ -f "server/data/products.json" ]; then
    node -e "
    const fs = require('fs');
    try {
        let p = JSON.parse(fs.readFileSync('server/data/products.json', 'utf8'));
        p = p.filter(x => x.id !== 'fl-1787735321783' && !x.id.startsWith('fl-') && !x.name.includes('Hoa Hồng'));
        fs.writeFileSync('server/data/products.json', JSON.stringify(p, null, 2));
    } catch(e) {}
    " 2>/dev/null || true
fi

# 4. Kiểm tra file .env
if [ ! -f .env ]; then
    echo "⚠️ Chưa tìm thấy file .env! Đang sao chép từ .env.example..."
    cp .env.example .env
    echo "ℹ️ Vui lòng chỉnh sửa .env nếu cần cấu hình Database hoặc Domain."
fi

# 5. Cấp quyền thực thi các script
chmod +x deploy.sh init-ssl.sh scripts/*.sh 2>/dev/null || true

# 6. Build và cập nhật Container với Docker Compose (Zero-downtime rebuild)
echo "🐳 2. Build và cập nhật các container Docker..."
docker compose up -d --build --remove-orphans

# 7. Dọn dẹp images cũ để tiết kiệm dung lượng ổ cứng VPS
echo "🧹 3. Dọn dẹp Docker images cũ..."
docker image prune -f

echo "=========================================="
echo "✅ DEPLOY THÀNH CÔNG!"
echo "Kiểm tra trạng thái container:"
docker compose ps
echo "=========================================="
