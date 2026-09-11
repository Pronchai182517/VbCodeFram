#!/usr/bin/env bash
# ตรวจว่าชั้นความปลอดภัยของฐานข้อมูลทำงานจริง — รันซ้ำได้ ไม่ทิ้งข้อมูลค้าง
#   db/verify-security.sh
set -uo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env.docker; set +a
DB_CONTAINER="${DB_CONTAINER:-postgres-db}"
DB_NAME="${DB_NAME:-vibe_framework}"
pass=0; fail=0

# รัน SQL ในฐานะ role ที่ระบุ (ผ่าน TCP ในคอนเทนเนอร์ จึงต้องยืนยันรหัสผ่านจริง)
as_role() {
  local role="$1" pw="$2" sql="$3"
  docker exec -i -e PGPASSWORD="$pw" "$DB_CONTAINER" \
    psql -X -A -t -q -h 127.0.0.1 -U "$role" -d "$DB_NAME" -c "$sql" 2>&1
}

check() {  # check "ชื่อการทดสอบ" "ค่าที่คาด" "ค่าที่ได้"
  if [[ "$3" == *"$2"* ]]; then printf '  ✅ %s\n' "$1"; pass=$((pass+1));
  else printf '  ❌ %s\n     คาด: %s\n     ได้: %s\n' "$1" "$2" "$3"; fail=$((fail+1)); fi
}

echo "🔒 ตรวจชั้นความปลอดภัยของฐานข้อมูล $DB_NAME"
echo
echo "── 1. Row Level Security: กั้นข้อมูลข้ามองค์กร"

# สร้างองค์กรทดสอบชั่วคราวด้วยสิทธิ์ superuser แล้วพิสูจน์ว่าแอปมองไม่เห็น/เขียนไม่ได้
OTHER_ID="$(docker exec -i "$DB_CONTAINER" psql -X -A -t -q -U postgres -d "$DB_NAME" -c "
  INSERT INTO tenants (id, code, name_th, name_en, updated_at)
  VALUES (gen_random_uuid(), 'ZZ_RLS_PROBE', 'องค์กรทดสอบ RLS', 'RLS probe tenant', now())
  ON CONFLICT (code) DO UPDATE SET name_th = EXCLUDED.name_th RETURNING id")"
docker exec -i "$DB_CONTAINER" psql -X -q -U postgres -d "$DB_NAME" -c "
  INSERT INTO sample_items (id, tenant_id, title, updated_at)
  VALUES ('11111111-1111-4111-8111-111111111111', '$OTHER_ID', 'ข้อมูลลับขององค์กรอื่น', now())
  ON CONFLICT (id) DO NOTHING" >/dev/null 2>&1

TOTAL_TENANTS="$(docker exec -i "$DB_CONTAINER" psql -X -A -t -q -U postgres -d "$DB_NAME" -c 'SELECT count(*) FROM tenants')"
check "แอปเห็นองค์กรเดียว (ในฐานมีทั้งหมด $TOTAL_TENANTS)" "1" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" 'SELECT count(*) FROM tenants')"
check "องค์กรที่แอปเห็นคือองค์กรที่ผูกไว้กับ role" "t" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" 'SELECT (SELECT id FROM tenants) = app.current_tenant_id()')"
check "แอปมองไม่เห็นข้อมูลขององค์กรอื่น" "0" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" "SELECT count(*) FROM sample_items WHERE tenant_id = '$OTHER_ID'")"
check "แอปมองไม่เห็นบทบาทขององค์กรอื่น" "0" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" "SELECT count(*) FROM roles WHERE tenant_id <> app.current_tenant_id()")"
check "เขียนข้อมูลขององค์กรอื่นไม่ได้ (WITH CHECK)" "row-level security" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" "INSERT INTO sample_items (id, tenant_id, title, updated_at) VALUES (gen_random_uuid(), '$OTHER_ID', 'ทดสอบเจาะข้ามองค์กร', now())")"
check "เขียนข้อมูลขององค์กรตัวเองได้" "1" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" "WITH ins AS (INSERT INTO sample_items (id, tenant_id, title, updated_at) VALUES (gen_random_uuid(), app.current_tenant_id(), 'ทดสอบเขียนของตัวเอง', now()) RETURNING 1) SELECT count(*) FROM ins")"
check "แอปมองเห็นข้อมูลขององค์กรตัวเอง (ไม่ใช่ศูนย์แถว)" "t" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" 'SELECT count(*) > 0 FROM sample_items')"
as_role vibe_app "$DB_APP_PASSWORD" "DELETE FROM sample_items WHERE title = 'ทดสอบเขียนของตัวเอง'" >/dev/null
docker exec -i "$DB_CONTAINER" psql -X -q -U postgres -d "$DB_NAME" -c "DELETE FROM tenants WHERE code = 'ZZ_RLS_PROBE'" >/dev/null 2>&1

echo "── 2. สิทธิ์ของบัญชีแอป (least privilege)"
check "ลบร่องรอยการใช้งานไม่ได้" "denied" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" 'DELETE FROM audit_logs WHERE true')"
check "แก้ร่องรอยการใช้งานไม่ได้" "denied" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" "UPDATE audit_logs SET action='hacked'")"
check "สร้างตารางใหม่ไม่ได้ (ไม่มีสิทธิ์ DDL)" "denied" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" 'CREATE TABLE evil (x int)')"
check "ล้างตารางผู้ใช้ไม่ได้" "denied" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" 'TRUNCATE users')"
check "แก้ทะเบียนสิทธิ์ไม่ได้ (อ่านอย่างเดียว)" "denied" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" "UPDATE permissions SET code='x'")"
check "อ่านตารางระบบของ Prisma ไม่ได้" "denied" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" 'SELECT count(*) FROM _prisma_migrations')"
check "อ่าน log ระดับฐานข้อมูลไม่ได้" "denied" \
  "$(as_role vibe_app "$DB_APP_PASSWORD" 'SELECT count(*) FROM security.data_changes')"
check "ต่อไปฐาน app_db ของโปรเจกต์อื่นไม่ได้" "denied" \
  "$(docker exec -i -e PGPASSWORD="$DB_APP_PASSWORD" "$DB_CONTAINER" psql -X -A -t -q -h 127.0.0.1 -U vibe_app -d app_db -c 'SELECT 1' 2>&1)"

echo
echo "── 3. บัญชีสำหรับรายงาน (vibe_readonly)"
check "อ่านตารางผู้ใช้จริงไม่ได้" "denied" \
  "$(as_role vibe_readonly "$DB_READONLY_PASSWORD" 'SELECT count(*) FROM public.users')"
USERS_TOTAL="$(docker exec -i "$DB_CONTAINER" psql -X -A -t -q -U postgres -d "$DB_NAME" -c 'SELECT count(*) FROM users')"
check "อ่าน view รายงานได้ครบทุกผู้ใช้ ($USERS_TOTAL คน)" "$USERS_TOTAL" \
  "$(as_role vibe_readonly "$DB_READONLY_PASSWORD" 'SELECT count(*) FROM report.users_masked')"
check "อีเมลในรายงานถูกปิดบัง" "a***n@app.local" \
  "$(as_role vibe_readonly "$DB_READONLY_PASSWORD" "SELECT email_masked FROM report.users_masked WHERE email_masked LIKE 'a%@app.local' LIMIT 1")"
check "เขียนตารางจริงไม่ได้" "permission denied" \
  "$(as_role vibe_readonly "$DB_READONLY_PASSWORD" "INSERT INTO public.sample_items (id, tenant_id, title, updated_at) VALUES (gen_random_uuid(), gen_random_uuid(), 'x', now())")"

echo
echo "── 4. ร่องรอยระดับฐานข้อมูล (trigger)"
docker exec -i "$DB_CONTAINER" psql -X -q -U postgres -d "$DB_NAME" \
  -c "UPDATE users SET name = name WHERE email='viewer@app.local'" \
  -c "UPDATE users SET name='ผู้ดู (ทดสอบ trigger)' WHERE email='viewer@app.local'" >/dev/null 2>&1
check "การแก้ไขผู้ใช้ถูกบันทึกลง security.data_changes" "name" \
  "$(docker exec -i "$DB_CONTAINER" psql -X -A -t -q -U postgres -d "$DB_NAME" -c "SELECT changed_columns::text FROM security.data_changes WHERE table_name='users' ORDER BY id DESC LIMIT 1")"
check "log ไม่เก็บรหัสผ่าน (ถูกปิดบัง)" "[redacted]" \
  "$(docker exec -i "$DB_CONTAINER" psql -X -A -t -q -U postgres -d "$DB_NAME" -c "SELECT after_data->>'password_hash' FROM security.data_changes WHERE table_name='users' ORDER BY id DESC LIMIT 1")"
check "log ปิดบังอีเมล" "v***r@app.local" \
  "$(docker exec -i "$DB_CONTAINER" psql -X -A -t -q -U postgres -d "$DB_NAME" -c "SELECT after_data->>'email' FROM security.data_changes WHERE table_name='users' ORDER BY id DESC LIMIT 1")"
check "แก้ไข log ไม่ได้แม้เป็น superuser (append-only)" "append-only" \
  "$(docker exec -i "$DB_CONTAINER" psql -X -A -t -q -U postgres -d "$DB_NAME" -c "UPDATE security.data_changes SET table_name='x' WHERE id=(SELECT max(id) FROM security.data_changes)" 2>&1)"
check "นโยบายเก็บ log ขั้นต่ำ 30 วันถูกบังคับ" "อย่างน้อย 30 วัน" \
  "$(docker exec -i "$DB_CONTAINER" psql -X -A -t -q -U postgres -d "$DB_NAME" -c "SELECT security.purge_logs(5)" 2>&1)"
docker exec -i "$DB_CONTAINER" psql -X -q -U postgres -d "$DB_NAME" -c "UPDATE users SET name='ผู้ดู' WHERE email='viewer@app.local'" >/dev/null 2>&1

echo
echo "── 5. บัญชีฐานข้อมูลไม่มีสิทธิ์ระดับเซิร์ฟเวอร์"
check "ไม่มี role ใดเป็น superuser/createrole/bypassrls" "0" \
  "$(docker exec -i "$DB_CONTAINER" psql -X -A -t -q -U postgres -c "SELECT count(*) FROM pg_roles WHERE rolname LIKE 'vibe\_%' AND (rolsuper OR rolcreaterole OR rolcreatedb OR rolbypassrls)")"

echo
echo "═══ ผ่าน $pass · ไม่ผ่าน $fail ═══"
[ "$fail" -eq 0 ]
