#!/usr/bin/env bash
# scripts/prepare-data.sh
# Chuyển dữ liệu chạy thật từ <repo>/server/data sang DATA_DIR NẰM NGOÀI repo (mặc định /var/lib/fire-safety-data)
# để `git reset --hard` khi deploy không bao giờ chạm tới dữ liệu.
#
#   prepare   Chạy TRƯỚC git reset. Sao lưu server/data ra tarball an toàn, rồi sao chép (không ghi đè) sang DATA_DIR.
#   finalize  Chạy SAU khi đã dừng container cũ. Đồng bộ nốt các file mới hơn rồi tạo cờ .migrated.
#
# Cả hai lệnh đều idempotent: chạy lại nhiều lần không làm mất hay ghi đè dữ liệu đã có trong DATA_DIR.
# Dùng:  scripts/prepare-data.sh prepare [thư-mục-repo]

set -euo pipefail

MODE="${1:-prepare}"
REPO_DIR="${2:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$REPO_DIR"

# Đọc một biến từ .env mà không `source` file (tránh chạy mã lạ và lỗi do ký tự đặc biệt)
read_env() {
  [ -f .env ] || return 0
  grep -E "^$1=" .env | tail -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'\$//" || true
}

DATA_DIR="${DATA_DIR:-$(read_env DATA_DIR)}"
DATA_DIR="${DATA_DIR:-/var/lib/fire-safety-data}"
BACKUP_ROOT="${BACKUP_DIR:-$(read_env BACKUP_DIR)}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/fire-safety}"

has_files() {
  [ -d "$1" ] && [ -n "$(ls -A "$1" 2>/dev/null)" ]
}

prepare() {
  mkdir -p "$DATA_DIR"
  chmod 700 "$DATA_DIR"

  if [ -f "$DATA_DIR/.migrated" ]; then
    echo "✅ Dữ liệu đã nằm ở $DATA_DIR (bỏ qua bước chuyển)."
    return 0
  fi

  if has_files server/data; then
    mkdir -p "$BACKUP_ROOT"
    chmod 700 "$BACKUP_ROOT"
    local tarball
    tarball="$BACKUP_ROOT/premigration-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar czf "$tarball" server/data
    chmod 600 "$tarball"
    echo "💾 Đã sao lưu server/data -> $tarball"

    cp -an server/data/. "$DATA_DIR"/
    echo "📦 Đã sao chép dữ liệu hiện có sang $DATA_DIR (không ghi đè file đã tồn tại)."
  else
    echo "ℹ️ Không có dữ liệu trong server/data để chuyển (cài mới hoặc đã chuyển)."
  fi
}

finalize() {
  mkdir -p "$DATA_DIR"
  chmod 700 "$DATA_DIR"

  if [ -f "$DATA_DIR/.migrated" ]; then
    return 0
  fi

  # -u: chỉ chép file mới hơn bản đã sao ở bước prepare (các đơn hàng phát sinh trong lúc build)
  if has_files server/data; then
    cp -au server/data/. "$DATA_DIR"/
    echo "🔄 Đã đồng bộ nốt thay đổi mới nhất từ server/data sang $DATA_DIR."
  fi
  touch "$DATA_DIR/.migrated"
  echo "✅ Hoàn tất chuyển dữ liệu. Có thể xóa thư mục server/data cũ sau khi kiểm tra website hoạt động bình thường."
}

case "$MODE" in
  prepare)  prepare ;;
  finalize) finalize ;;
  *)
    echo "Cách dùng: $0 {prepare|finalize} [thư-mục-repo]" >&2
    exit 2
    ;;
esac
