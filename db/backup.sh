#!/usr/bin/env bash
# สำรองฐานข้อมูล vibe_framework (รูปแบบ custom ของ pg_dump — คืนค่าแบบเลือกตารางได้)
#   db/backup.sh              สำรองหนึ่งครั้ง
# ไฟล์เก็บที่ ~/backups/vibe-framework/ สิทธิ์ 600 และลบไฟล์ที่เก่ากว่า RETAIN_DAYS วันอัตโนมัติ
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env.docker; set +a

DB_CONTAINER="${DB_CONTAINER:-postgres-db}"
DB_NAME="${DB_NAME:-vibe_framework}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/vibe-framework}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
stamp="$(date +%Y%m%d_%H%M%S)"
out="$BACKUP_DIR/${DB_NAME}_${stamp}.dump"

echo "💾 สำรอง $DB_NAME → $out"
tmp_in_container="/tmp/vibe_backup_${stamp}.dump"

# ดัมป์ลงไฟล์ในคอนเทนเนอร์ก่อน แล้วตรวจสอบสารบัญของไฟล์ให้ผ่านค่อยดึงออกมา
# (ไฟล์สำรองที่เสียเงียบ ๆ คือฝันร้ายของงานสำรองข้อมูล — ต้องรู้ตั้งแต่ตอนสำรอง ไม่ใช่ตอนกู้)
docker exec -i -e PGPASSWORD="$DB_OWNER_PASSWORD" "$DB_CONTAINER" \
  pg_dump -h 127.0.0.1 -U "${DB_OWNER_USER:-vibe_owner}" -d "$DB_NAME" -Fc --no-owner --no-acl -f "$tmp_in_container"

if ! docker exec -i "$DB_CONTAINER" pg_restore --list "$tmp_in_container" > /dev/null 2>&1; then
  docker exec -i "$DB_CONTAINER" rm -f "$tmp_in_container" || true
  echo "❌ ไฟล์สำรองเสียหาย — ยกเลิก"
  exit 1
fi

tables=$(docker exec -i "$DB_CONTAINER" pg_restore --list "$tmp_in_container" | grep -c "TABLE DATA" || true)
docker exec -i "$DB_CONTAINER" cat "$tmp_in_container" > "$out"
docker exec -i "$DB_CONTAINER" rm -f "$tmp_in_container"
chmod 600 "$out"

deleted=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.dump" -mtime "+$RETAIN_DAYS" -print -delete | wc -l)
echo "✅ สำเร็จ $(du -h "$out" | cut -f1) · ข้อมูล $tables ตาราง · เก็บย้อนหลัง $RETAIN_DAYS วัน (ลบไฟล์เก่า $deleted ไฟล์)"
echo "   คืนค่า: docker exec -i $DB_CONTAINER pg_restore -h 127.0.0.1 -U vibe_owner -d $DB_NAME --clean --if-exists < <ไฟล์>"
