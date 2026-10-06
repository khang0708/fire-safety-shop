#!/usr/bin/env bash
# ====================================================
# DEPLOY / CẬP NHẬT VPS (Docker Compose) - FLAMEGUARD PRO
#
#   ./deploy.sh             Tự đồng bộ code từ GitHub (main) rồi build + khởi động
#   ./deploy.sh --no-sync   CI đã đồng bộ code; chỉ build + khởi động (dùng trong GitHub Actions)
#
# Dữ liệu chạy thật nằm ở DATA_DIR (mặc định /var/lib/fire-safety-data) NGOÀI repo, nên git reset không chạm tới.
# Quy trình: chuẩn bị dữ liệu -> đồng bộ code -> build -> THỬ KHỞI ĐỘNG bản mới ở cổng phụ ->
#            (chỉ khi thử thành công) thay container thật -> kiểm tra sức khỏe.
# Nếu bản mới không khởi động được, container đang chạy được giữ nguyên.
# ====================================================

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

SYNC=1
[ "${1:-}" = "--no-sync" ] && SYNC=0

IMAGE="fire-safety-shop-web:latest"
CONTAINER="flameguard-web"
HEALTH_URL="http://127.0.0.1:3001/api/health"
SMOKE_NAME="flameguard-smoke"
SMOKE_PORT="3999"

log()  { echo "$@"; }
fail() { echo "❌ $*" >&2; exit 1; }

read_env() {
  [ -f .env ] || return 0
  grep -E "^$1=" .env | tail -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'\$//" || true
}

echo "=========================================="
echo "🚀 BẮT ĐẦU QUY TRÌNH DEPLOY / CẬP NHẬT VPS"
echo "=========================================="

# 0. Kiểm tra điều kiện
command -v docker >/dev/null 2>&1 || fail "Chưa cài Docker."
command -v curl >/dev/null 2>&1 || fail "Chưa cài curl."
[ -f .env ] || fail "Chưa có file .env. Tạo từ .env.example và điền giá trị thật (đặc biệt ADMIN_PASSWORD, ADMIN_PIN)."

DATA_DIR="${DATA_DIR:-$(read_env DATA_DIR)}"
DATA_DIR="${DATA_DIR:-/var/lib/fire-safety-data}"
case "$DATA_DIR" in
  "$PWD"|"$PWD"/*) fail "DATA_DIR ($DATA_DIR) đang nằm TRONG thư mục repo; hãy đặt ngoài repo, ví dụ /var/lib/fire-safety-data." ;;
esac

# Cài mới (chưa có admins.json ở bất kỳ đâu) bắt buộc có ADMIN_PASSWORD và ADMIN_PIN
if [ ! -f "$DATA_DIR/admins.json" ] && [ ! -f server/data/admins.json ]; then
  [ -n "$(read_env ADMIN_PASSWORD)" ] && [ -n "$(read_env ADMIN_PIN)" ] \
    || fail "Cài mới: hãy đặt ADMIN_PASSWORD (>=10 ký tự) và ADMIN_PIN (6-10 số) trong .env rồi chạy lại."
fi

# 1. Chuẩn bị dữ liệu NGOÀI repo (idempotent; luôn chạy TRƯỚC khi git reset)
log "💾 1. Chuẩn bị thư mục dữ liệu: $DATA_DIR"
bash scripts/prepare-data.sh prepare "$PWD"

# 2. Đồng bộ code mới nhất
git config core.fileMode false
if [ "$SYNC" = 1 ]; then
  log "📥 2. Đồng bộ mã nguồn mới nhất từ GitHub..."
  export PREV_COMMIT="${PREV_COMMIT:-$(git rev-parse HEAD)}"
  git fetch origin main
  NGINX_BACKUP="$(mktemp)"
  [ -f nginx/conf.d/app.conf ] && cp nginx/conf.d/app.conf "$NGINX_BACKUP" || true
  # Gỡ file dữ liệu cũ (từng nằm trong git) khỏi chỉ mục để git reset không xóa chúng khỏi thư mục làm việc
  # trong lúc container cũ còn đang dùng. Dữ liệu đã có bản sao ở DATA_DIR (bước 1).
  git ls-files -z server/data | xargs -0 -r git update-index --force-remove --
  git reset --hard origin/main
  if [ -s "$NGINX_BACKUP" ]; then cp "$NGINX_BACKUP" nginx/conf.d/app.conf; fi
  rm -f "$NGINX_BACKUP"
else
  log "📥 2. Bỏ qua đồng bộ code (--no-sync, CI đã thực hiện)."
fi
chmod +x deploy.sh init-ssl.sh scripts/*.sh 2>/dev/null || true

# 3. Build image mới (container cũ vẫn đang phục vụ khách)
log "🐳 3. Build image mới..."
if docker image inspect "$IMAGE" >/dev/null 2>&1; then
  docker tag "$IMAGE" fire-safety-shop-web:previous
fi
docker compose build web

# 4. Thử khởi động bản mới ở cổng phụ với một BẢN SAO dữ liệu thật; không đụng container đang chạy
smoke_test() {
  local dir ok=0
  dir="$(mktemp -d)"
  docker rm -f "$SMOKE_NAME" >/dev/null 2>&1 || true
  if [ -d "$DATA_DIR" ]; then cp -a "$DATA_DIR"/. "$dir"/ 2>/dev/null || true; fi
  if [ ! -f "$DATA_DIR/.migrated" ] && [ -d server/data ]; then cp -au server/data/. "$dir"/ 2>/dev/null || true; fi

  docker run -d --name "$SMOKE_NAME" -p "127.0.0.1:$SMOKE_PORT:3001" \
    -e NODE_ENV=production -e PORT=3001 -e DATA_DIR=/data -e TRUST_PROXY_HOPS=1 \
    -e ADMIN_PASSWORD="smoke-test-only-Pass-1" -e ADMIN_PIN="739204" \
    -v "$dir":/data "$IMAGE" >/dev/null

  for _ in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:$SMOKE_PORT/api/health" >/dev/null 2>&1 \
       && curl -fsS "http://127.0.0.1:$SMOKE_PORT/api/products" >/dev/null 2>&1; then
      ok=1
      break
    fi
    sleep 2
  done
  if [ "$ok" != 1 ]; then
    echo "---- log của container thử nghiệm ----" >&2
    docker logs --tail 60 "$SMOKE_NAME" >&2 || true
  fi
  docker rm -f "$SMOKE_NAME" >/dev/null 2>&1 || true
  rm -rf "$dir"
  [ "$ok" = 1 ]
}

if [ "${SKIP_SMOKE:-0}" = 1 ]; then
  log "⏭️ 4. Bỏ qua bước thử khởi động (SKIP_SMOKE=1)."
else
  log "🧪 4. Thử khởi động bản mới trên cổng phụ $SMOKE_PORT (với bản sao dữ liệu)..."
  if ! smoke_test; then
    echo "" >&2
    echo "❌ Bản mới KHÔNG khởi động được hoặc không đọc được dữ liệu. Đã HỦY deploy; website vẫn chạy bản cũ." >&2
    [ -n "${PREV_COMMIT:-}" ] && echo "   Commit đang chạy trước đó: $PREV_COMMIT" >&2
    exit 1
  fi
  log "✅ Bản mới khởi động tốt."
fi

# 5. Thay container thật. Lần chuyển dữ liệu đầu tiên: dừng container cũ để đồng bộ nốt dữ liệu rồi mới chạy bản mới
if [ ! -f "$DATA_DIR/.migrated" ]; then
  log "🔁 5. Lần đầu dùng DATA_DIR ngoài repo: dừng container cũ để đồng bộ nốt dữ liệu..."
  docker compose stop web || true
  bash scripts/prepare-data.sh finalize "$PWD"
fi
log "🚀 5. Khởi động container mới..."
docker compose up -d --remove-orphans

# 6. Kiểm tra sức khỏe sau deploy
log "🩺 6. Kiểm tra sức khỏe..."
HEALTHY=0
for _ in $(seq 1 30); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then HEALTHY=1; break; fi
  sleep 2
done
if [ "$HEALTHY" != 1 ]; then
  echo "❌ Container mới không phản hồi $HEALTH_URL sau 60 giây." >&2
  docker logs --tail 80 "$CONTAINER" >&2 || true
  [ -n "${PREV_COMMIT:-}" ] && echo "   Để quay lại bản trước: git reset --hard $PREV_COMMIT && ./deploy.sh --no-sync" >&2
  exit 1
fi

# 7. Dọn dẹp và nhắc việc
docker image prune -f >/dev/null 2>&1 || true

echo "=========================================="
echo "✅ DEPLOY THÀNH CÔNG!"
docker compose ps
echo "=========================================="

if docker logs --tail 200 "$CONTAINER" 2>&1 | grep -q "\[SECURITY\]"; then
  echo "🚨 Máy chủ báo cảnh báo bảo mật khi khởi động:"
  docker logs --tail 200 "$CONTAINER" 2>&1 | grep "\[SECURITY\]" | tail -n 3
fi
if ! ls /etc/cron.d/fire-safety-backup >/dev/null 2>&1; then
  echo "⚠️ Chưa có lịch sao lưu dữ liệu hằng ngày. Cài bằng: ./scripts/install-backup-cron.sh"
fi
