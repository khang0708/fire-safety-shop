#!/usr/bin/env bash
# tests/migration-sim.sh
# Mô phỏng lần deploy ĐẦU TIÊN sau khi chuyển dữ liệu ra DATA_DIR, bằng git thật trong thư mục tạm.
# Bản cũ giữ dữ liệu trong git (server/data); bản mới chuyển sang server/seed. Khách/admin đã sửa dữ liệu trên VPS.
#   $1 = protect : thêm bước gỡ file dữ liệu khỏi chỉ mục git trước khi reset (cách workflow/deploy.sh làm)
#   $1 = plain   : reset trực tiếp (để chứng minh vì sao cần bước bảo vệ)
# Biến môi trường: REPO_ROOT = thư mục gốc dự án (để lấy scripts/prepare-data.sh thật)

set -uo pipefail
MODE="${1:-protect}"
ROOT="${REPO_ROOT:?cần đặt REPO_ROOT}"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT
cd "$T"

git init -q -b main repo
cd repo
git config user.email t@t
git config user.name t
git config core.autocrlf false
mkdir -p server/data scripts
echo '[{"id":"A-seed"}]' > server/data/orders.json
echo '[{"id":"fire-1"}]' > server/data/products.json
echo '{"v":"seed"}' > server/data/settings.json
git add -A
git commit -qm "A: du lieu nam trong git"

git checkout -qb new
git mv server/data server/seed
mkdir -p server/data
printf 'server/data/\n' > .gitignore
cp "$ROOT/scripts/prepare-data.sh" scripts/
git add -A
git commit -qm "B: ma moi"
git checkout -q main

# Trạng thái VPS: dữ liệu thật đã bị sửa + các file không nằm trong git
echo '[{"id":"FB-1","c":"khach A"},{"id":"FB-2","c":"khach B"}]' > server/data/orders.json
echo '{"v":"admin da sua cai dat"}' > server/data/settings.json
echo '[{"id":"admin_master_01"}]' > server/data/admins.json
echo 'khoa-phien' > server/data/.auth_secret

export DATA_DIR="$T/data" BACKUP_DIR="$T/bk"

# 1. Chuẩn bị dữ liệu bằng script bản MỚI (lấy từ ref mới) trước khi reset
git show new:scripts/prepare-data.sh > "$T/p.sh"
bash "$T/p.sh" prepare "$PWD" > /dev/null 2>&1

# 2. Đồng bộ code (đúng như workflow)
if [ "$MODE" = "protect" ]; then
  git ls-files -z server/data | xargs -0 -r git update-index --force-remove --
fi
git reset -q --hard new

# 3. Container CŨ (còn chạy trong lúc build) ghi thêm một đơn mới
sleep 1
if [ -f server/data/orders.json ]; then
  echo '[{"id":"FB-1","c":"khach A"},{"id":"FB-2","c":"khach B"},{"id":"FB-3","c":"khach C luc build"}]' > server/data/orders.json
else
  # file đã bị git xóa: mã cũ đọc thấy file mất nên chỉ ghi đơn mới
  echo '[{"id":"FB-3","c":"khach C luc build"}]' > server/data/orders.json
fi

# 4. Dừng container cũ, đồng bộ nốt
bash scripts/prepare-data.sh finalize "$PWD" > /dev/null 2>&1

echo "MODE=$MODE"
for k in "khach A" "khach B" "khach C luc build"; do
  if grep -q "$k" "$DATA_DIR/orders.json"; then echo "CON: $k"; else echo "MAT: $k"; fi
done
if grep -q "admin da sua cai dat" "$DATA_DIR/settings.json"; then echo "CON: cai dat admin"; else echo "MAT: cai dat admin"; fi
if [ -f "$DATA_DIR/admins.json" ] && [ -f "$DATA_DIR/.auth_secret" ]; then echo "CON: admins.json va .auth_secret"; else echo "MAT: admins.json va .auth_secret"; fi
if [ -f "$DATA_DIR/.migrated" ]; then echo "CON: co .migrated"; else echo "MAT: co .migrated"; fi
