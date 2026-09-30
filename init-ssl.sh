#!/bin/bash

# ====================================================
# SCRIPT KÍCH HOẠT CHỨNG CHỈ SSL MIỄN PHÍ LET'S ENCRYPT
# ====================================================

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "❌ Hướng dẫn sử dụng: ./init-ssl.sh <ten-mien> <email-cua-ban>"
    echo "Ví dụ: ./init-ssl.sh pcccvietnam.vn admin@pcccvietnam.vn"
    exit 1
fi

DOMAIN=$1
EMAIL=$2

echo "🔒 Đang yêu cầu cấp chứng chỉ SSL cho tên miền: $DOMAIN và www.$DOMAIN..."

# 1. Đảm bảo Nginx HTTP đang chạy để xác thực challenge
docker compose up -d nginx web

# 2. Chạy certbot cấp chứng chỉ
docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

echo "📝 Đang cấu hình Nginx sang giao thức HTTPS..."
# 3. Tạo file cấu hình HTTPS từ template
sed "s/YOUR_DOMAIN/$DOMAIN/g" nginx/conf.d/app-ssl.conf.template > nginx/conf.d/app.conf

# 4. Reload Nginx để nhận chứng chỉ mới
docker compose exec nginx nginx -s reload

echo "=========================================="
echo "🎉 CHÚC MỪNG! ĐÃ CÀI ĐẶT SSL (HTTPS) THÀNH CÔNG CHO $DOMAIN"
echo "Hãy truy cập: https://$DOMAIN"
echo "=========================================="
