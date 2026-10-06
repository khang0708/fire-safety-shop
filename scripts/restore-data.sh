#!/usr/bin/env bash
# scripts/restore-data.sh
# Khôi phục DATA_DIR từ một bản sao lưu do scripts/backup-data.sh tạo ra.
#
# Dùng:  scripts/restore-data.sh /var/backups/fire-safety/data-20261007-023000.tar.gz [--yes]
#
# Quy trình an toàn: dừng website -> đổi tên DATA_DIR hiện tại thành DATA_DIR.before-restore-<giờ> (KHÔNG xóa)
# -> giải nén bản sao lưu -> khởi động lại. Nếu khôi phục sai, dữ liệu trước đó vẫn còn nguyên để quay lại.

set -euo pipefail

BACKUP_FILE="${1:-}"
ASSUME_YES="${2:-}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Cách dùng: $0 <tệp-sao-lưu.tar.gz> [--yes]" >&2
  exit 2
fi

read_env() {
  [ -f "$REPO_DIR/.env" ] || return 0
  grep -E "^$1=" "$REPO_DIR/.env" | tail -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'\$//" || true
}

DATA_DIR="${DATA_DIR:-$(read_env DATA_DIR)}"
DATA_DIR="${DATA_DIR:-/var/lib/fire-safety-data}"

if ! tar tzf "$BACKUP_FILE" >/dev/null 2>&1; then
  echo "❌ Tệp sao lưu không hợp lệ hoặc bị hỏng: $BACKUP_FILE" >&2
  exit 1
fi

echo "Sẽ khôi phục:  $BACKUP_FILE"
echo "Vào thư mục:   $DATA_DIR  (dữ liệu hiện tại được giữ lại với hậu tố .before-restore-*)"
if [ "$ASSUME_YES" != "--yes" ]; then
  read -r -p "Gõ 'khoi phuc' để tiếp tục: " ANSWER
  [ "$ANSWER" = "khoi phuc" ] || { echo "Đã hủy."; exit 1; }
fi

cd "$REPO_DIR"
RUNNING=0
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx flameguard-web; then
  RUNNING=1
  echo "⏸️ Đang dừng container flameguard-web..."
  docker compose stop web
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
if [ -d "$DATA_DIR" ]; then
  mv "$DATA_DIR" "$DATA_DIR.before-restore-$STAMP"
  echo "📦 Dữ liệu hiện tại được giữ ở $DATA_DIR.before-restore-$STAMP"
fi

PARENT="$(dirname "$DATA_DIR")"
TOP="$(tar tzf "$BACKUP_FILE" | head -n1 | cut -d/ -f1)"
mkdir -p "$PARENT"
tar xzf "$BACKUP_FILE" -C "$PARENT"
if [ "$TOP" != "$(basename "$DATA_DIR")" ]; then
  mv "$PARENT/$TOP" "$DATA_DIR"
fi
chmod 700 "$DATA_DIR"
touch "$DATA_DIR/.migrated"
echo "✅ Đã khôi phục dữ liệu vào $DATA_DIR"

if [ "$RUNNING" = 1 ]; then
  docker compose up -d web
  echo "▶️ Đã khởi động lại website. Kiểm tra: curl -fsS http://127.0.0.1:3001/api/health"
fi
