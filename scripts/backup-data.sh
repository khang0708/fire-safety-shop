#!/usr/bin/env bash
# scripts/backup-data.sh
# Sao lưu toàn bộ DATA_DIR (đơn hàng, sản phẩm, cài đặt, tài khoản admin, khóa phiên) thành một tệp .tar.gz.
#
# Biến môi trường (hoặc khai báo trong .env của repo):
#   DATA_DIR       Thư mục dữ liệu chạy thật           (mặc định /var/lib/fire-safety-data)
#   BACKUP_DIR     Nơi lưu bản sao lưu                 (mặc định /var/backups/fire-safety)
#   BACKUP_KEEP    Số bản giữ lại                      (mặc định 14)
#   BACKUP_REMOTE  (tùy chọn) đích sao lưu ra NGOÀI máy:
#                    rclone:<remote>:<đường-dẫn>   hoặc   user@host:/đường/dẫn  (rsync qua SSH)
#
# Bản sao lưu chứa mật khẩu đã băm và khóa ký phiên: tệp được đặt quyền 600; hãy mã hóa nếu gửi ra ngoài.
# Khôi phục: scripts/restore-data.sh <tệp .tar.gz>

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

read_env() {
  [ -f "$REPO_DIR/.env" ] || return 0
  grep -E "^$1=" "$REPO_DIR/.env" | tail -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'\$//" || true
}

DATA_DIR="${DATA_DIR:-$(read_env DATA_DIR)}"
DATA_DIR="${DATA_DIR:-/var/lib/fire-safety-data}"
BACKUP_DIR="${BACKUP_DIR:-$(read_env BACKUP_DIR)}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/fire-safety}"
BACKUP_KEEP="${BACKUP_KEEP:-$(read_env BACKUP_KEEP)}"
BACKUP_KEEP="${BACKUP_KEEP:-14}"
BACKUP_REMOTE="${BACKUP_REMOTE:-$(read_env BACKUP_REMOTE)}"

if [ ! -d "$DATA_DIR" ]; then
  echo "❌ Không thấy thư mục dữ liệu: $DATA_DIR" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/data-$STAMP.tar.gz"
TMP="$OUT.partial"

# Ghi ra tệp tạm rồi đổi tên: không bao giờ để lại bản sao lưu dang dở trông như hợp lệ
tar czf "$TMP" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")"
if ! tar tzf "$TMP" >/dev/null 2>&1; then
  rm -f "$TMP"
  echo "❌ Bản sao lưu bị lỗi (tar không đọc lại được)." >&2
  exit 1
fi
mv "$TMP" "$OUT"
chmod 600 "$OUT"

# Cảnh báo sớm nếu có file JSON dữ liệu đang bị hỏng (cần Node trên máy; bỏ qua nếu không có)
if command -v node >/dev/null 2>&1; then
  BAD=0
  for f in "$DATA_DIR"/*.json; do
    [ -e "$f" ] || continue
    if ! node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$f" >/dev/null 2>&1; then
      echo "⚠️ CẢNH BÁO: $(basename "$f") không phải JSON hợp lệ (đã sao lưu nguyên trạng)." >&2
      BAD=1
    fi
  done
  [ "$BAD" = 0 ] || echo "⚠️ Hãy kiểm tra các file trên; có thể khôi phục từ bản .bak cạnh file hoặc từ bản sao lưu cũ hơn." >&2
fi

# Giữ lại BACKUP_KEEP bản mới nhất
ls -1t "$BACKUP_DIR"/data-*.tar.gz 2>/dev/null | tail -n +"$((BACKUP_KEEP + 1))" | while read -r old; do
  rm -f -- "$old"
done

SIZE="$(du -h "$OUT" | cut -f1)"
echo "✅ Đã sao lưu $DATA_DIR -> $OUT ($SIZE). Đang giữ tối đa $BACKUP_KEEP bản."

# Sao chép ra ngoài máy (tùy chọn)
if [ -n "$BACKUP_REMOTE" ]; then
  case "$BACKUP_REMOTE" in
    rclone:*)
      rclone copy "$OUT" "${BACKUP_REMOTE#rclone:}" && echo "☁️ Đã đẩy bản sao lưu lên ${BACKUP_REMOTE#rclone:}"
      ;;
    *)
      rsync -a -e "ssh -o BatchMode=yes" "$OUT" "$BACKUP_REMOTE" && echo "☁️ Đã đẩy bản sao lưu lên $BACKUP_REMOTE"
      ;;
  esac
else
  echo "ℹ️ Chưa đặt BACKUP_REMOTE: bản sao lưu mới chỉ nằm trên chính VPS này. Nên chép ra ngoài máy (rclone/rsync)."
fi
