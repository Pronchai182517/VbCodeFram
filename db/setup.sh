#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# ติดตั้ง/อัปเดตฐานข้อมูลของ VibeCore บนเซิร์ฟเวอร์ Postgres กลาง (โปรเจกต์ postgresal)
#
#   db/setup.sh                 ทำครบทุกขั้น: สร้าง role/database → migrate → seed → ลงชั้นความปลอดภัย
#   db/setup.sh --security-only ลงเฉพาะชั้นความปลอดภัย (ใช้หลังเพิ่ม migration ใหม่)
#   db/setup.sh --no-seed       ข้ามการ seed ข้อมูล
#
# ต้องรันจากรากโปรเจกต์ และต้องมีคอนเทนเนอร์ postgres-db (สแตก postgresal) รันอยู่
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.docker"
DB_CONTAINER="${DB_CONTAINER:-postgres-db}"
SECURITY_ONLY=false
RUN_SEED=true
for arg in "$@"; do
  case "$arg" in
    --security-only) SECURITY_ONLY=true ;;
    --no-seed) RUN_SEED=false ;;
    *) echo "ไม่รู้จักตัวเลือก: $arg"; exit 2 ;;
  esac
done

[ -f "$ENV_FILE" ] || { echo "❌ ไม่พบ $ENV_FILE (คัดลอกจาก .env.docker.example ก่อน)"; exit 1; }
docker inspect "$DB_CONTAINER" >/dev/null 2>&1 || {
  echo "❌ ไม่พบคอนเทนเนอร์ $DB_CONTAINER — สตาร์ตสแตก postgresal ก่อน:"
  echo "   cd <โฟลเดอร์ของ postgresal> && docker compose up -d"
  exit 1
}

# ── เติมรหัสผ่านที่ยังไม่มีลง .env.docker (สุ่มใหม่ ไม่ต้องกรอกเอง) ────────
ensure_secret() {
  local key="$1"
  if ! grep -q "^${key}=..*" "$ENV_FILE"; then
    local value; value="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-28)"
    sed -i "/^${key}=/d" "$ENV_FILE"
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
    echo "   สุ่ม $key ใหม่และบันทึกลง $ENV_FILE"
  fi
}
echo "🔑 ตรวจรหัสผ่านของ role ฐานข้อมูล"
ensure_secret DB_OWNER_PASSWORD
ensure_secret DB_APP_PASSWORD
ensure_secret DB_READONLY_PASSWORD
chmod 600 "$ENV_FILE"

set -a; . "./$ENV_FILE"; set +a
DB_NAME="${DB_NAME:-vibe_framework}"

psql_super() {  # รัน SQL ด้วยสิทธิ์ superuser ภายในคอนเทนเนอร์ฐานข้อมูล
  local db="$1"; shift
  docker exec -i -e PGOPTIONS="--client-min-messages=warning" "$DB_CONTAINER" \
    psql -v ON_ERROR_STOP=1 -U postgres -d "$db" "$@"
}

if [ "$SECURITY_ONLY" = false ]; then
  echo
  echo "═══ 1/4 · สร้าง role และ database ═══"
  psql_super postgres \
    -v owner_pw="$DB_OWNER_PASSWORD" \
    -v app_pw="$DB_APP_PASSWORD" \
    -v ro_pw="$DB_READONLY_PASSWORD" < db/sql/00-roles-and-database.sql

  echo
  echo "═══ 2/4 · schema และสิทธิ์ตั้งต้น ═══"
  psql_super "$DB_NAME" < db/sql/01-schemas.sql

  echo
  echo "═══ 3/4 · migrate + seed (ผ่านคอนเทนเนอร์ migrate) ═══"
  SEED_ON_START="$RUN_SEED" docker compose --env-file "$ENV_FILE" run --rm --build migrate
fi

echo
echo "═══ 4/4 · ชั้นความปลอดภัยของข้อมูล ═══"
for f in db/sql/02-privileges.sql db/sql/03-rls.sql db/sql/04-integrity.sql db/sql/05-report-views.sql; do
  echo "── $f"
  psql_super "$DB_NAME" < "$f"
done
echo "── db/sql/06-shared-server-hardening.sql (ทั้งเซิร์ฟเวอร์)"
psql_super postgres < db/sql/06-shared-server-hardening.sql

echo
echo "═══ สรุป ═══"
psql_super "$DB_NAME" -c "
SELECT relname AS \"ตาราง\",
       CASE WHEN relrowsecurity THEN 'เปิด' ELSE '—' END AS \"RLS\",
       (SELECT count(*) FROM pg_policies p WHERE p.tablename = c.relname) AS \"policy\",
       pg_size_pretty(pg_total_relation_size(c.oid)) AS \"ขนาด\"
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r' AND relname <> '_prisma_migrations'
 ORDER BY relname;"
echo "✅ ฐานข้อมูล $DB_NAME พร้อมใช้งานพร้อมชั้นความปลอดภัยครบแล้ว"
