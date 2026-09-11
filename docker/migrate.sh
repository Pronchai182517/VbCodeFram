#!/usr/bin/env bash
# รอฐานข้อมูล → migrate → seed  (เรียกโดย service `migrate` ใน docker-compose ก่อนแอปสตาร์ต)
#
# ใช้ 2 บัญชีฐานข้อมูลแยกกันตามหลัก least privilege:
#   MIGRATE_DATABASE_URL  role เจ้าของ schema (vibe_owner) — สร้าง/แก้ตาราง และ seed ได้ (ข้าม RLS ในฐานะ owner)
#   DATABASE_URL          role ของแอป (vibe_app) — ที่นี่ใช้แค่ตรวจว่าเชื่อมต่อได้จริง
set -euo pipefail

MIGRATE_URL="${MIGRATE_DATABASE_URL:-${DATABASE_URL:?ต้องมี DATABASE_URL}}"

echo "⏳ รอฐานข้อมูลพร้อมรับการเชื่อมต่อ ..."
node -e '
const net = require("net");
const u = new URL(process.argv[1]);
const host = u.hostname, port = Number(u.port || 5432);
let left = 60;
const tick = () => {
  const s = net.connect({ host, port });
  s.setTimeout(2000);
  s.on("connect", () => { s.destroy(); console.log(`   เชื่อมต่อ ${host}:${port} ได้แล้ว`); process.exit(0); });
  s.on("error", retry); s.on("timeout", retry);
  function retry() { s.destroy(); if (--left <= 0) { console.error(`   ต่อ ${host}:${port} ไม่ได้`); process.exit(1); } setTimeout(tick, 2000); }
};
tick();
' "$MIGRATE_URL"

echo "🗄️  prisma migrate deploy (role เจ้าของ schema) ..."
DATABASE_URL="$MIGRATE_URL" npx prisma migrate deploy

if [ "${SEED_ON_START:-false}" = "true" ]; then
  case "${SEED_PROFILE:-basic}" in
    deep)
      echo "🌱 seed ชุดข้อมูลละเอียด (prisma/seed-deep.ts) ..."
      DATABASE_URL="$MIGRATE_URL" npx tsx prisma/seed-deep.ts
      ;;
    *)
      echo "🌱 seed ชุดข้อมูลพื้นฐาน (prisma/seed.ts) ..."
      DATABASE_URL="$MIGRATE_URL" npx tsx prisma/seed.ts
      ;;
  esac
else
  echo "⏭️  ข้าม seed (ตั้ง SEED_ON_START=true ถ้าต้องการข้อมูลตั้งต้น)"
fi

if [ -n "${BOOTSTRAP_ADMIN_EMAIL:-}" ] && [ -n "${BOOTSTRAP_ADMIN_PASSWORD:-}" ]; then
  echo "👤 bootstrap ผู้ดูแลระบบสำหรับ production ..."
  DATABASE_URL="$MIGRATE_URL" npx tsx prisma/bootstrap.ts
fi

echo "🔐 ตรวจว่าบัญชีของแอป (vibe_app) เชื่อมต่อได้และถูก RLS คุมอยู่ ..."
node -e '
const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const t = await c.query("SELECT app.current_tenant_id() AS tenant").catch(() => null);
  const n = await c.query("SELECT count(*)::int AS n FROM tenants").catch(() => ({ rows: [{ n: "?" }] }));
  console.log(`   ต่อได้ · องค์กรที่มองเห็น = ${n.rows[0].n} · app.tenant_id = ${t ? t.rows[0].tenant : "(ยังไม่ตั้ง)"}`);
  await c.end();
})().catch((e) => { console.error("   ⚠️  แอปต่อฐานข้อมูลไม่ได้:", e.message); process.exit(1); });
'

echo "✅ ฐานข้อมูลพร้อมใช้งาน"
