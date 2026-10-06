#!/usr/bin/env bash
# scripts/install-backup-cron.sh
# Cài lịch sao lưu dữ liệu hằng ngày (02:30) bằng /etc/cron.d. Chạy bằng root, chạy lại nhiều lần vẫn an toàn.
# Dùng:  ./scripts/install-backup-cron.sh [giờ:phút]    ví dụ: ./scripts/install-backup-cron.sh 03:15

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIME="${1:-02:30}"
HOUR="${TIME%%:*}"
MINUTE="${TIME##*:}"
CRON_FILE="/etc/cron.d/fire-safety-backup"

if [ "$(id -u)" -ne 0 ]; then
  echo "❌ Cần chạy bằng root để ghi $CRON_FILE" >&2
  exit 1
fi
if ! [[ "$HOUR" =~ ^[0-9]{1,2}$ && "$MINUTE" =~ ^[0-9]{1,2}$ ]]; then
  echo "❌ Giờ không hợp lệ: $TIME (định dạng HH:MM)" >&2
  exit 2
fi

chmod +x "$REPO_DIR/scripts/backup-data.sh"
cat > "$CRON_FILE" <<EOF
# Sao lưu dữ liệu FLAMEGUARD hằng ngày (tạo bởi scripts/install-backup-cron.sh)
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
$MINUTE $HOUR * * * root $REPO_DIR/scripts/backup-data.sh >> /var/log/fire-safety-backup.log 2>&1
EOF
chmod 644 "$CRON_FILE"

echo "✅ Đã cài lịch sao lưu hằng ngày lúc $HOUR:$MINUTE -> $CRON_FILE"
echo "   Chạy thử ngay:  $REPO_DIR/scripts/backup-data.sh"
echo "   Xem nhật ký:    tail -n 20 /var/log/fire-safety-backup.log"
