-- ═══════════════════════════════════════════════════════════════════════════
-- 01 · schema, extension และค่าตั้งต้นด้านสิทธิ์ของฐาน vibe_framework
--      รันด้วยสิทธิ์ superuser บนฐาน `vibe_framework`
--
-- แบ่ง schema ตามหน้าที่ เพื่อไม่ให้ออบเจ็กต์ด้านความปลอดภัยไปปนกับตารางที่ Prisma ดูแล
--   public    ตารางธุรกิจทั้งหมดที่ Prisma migrate สร้าง (เจ้าของคือ vibe_owner)
--   app       ฟังก์ชันช่วยของระบบสิทธิ์ (RLS helper)
--   security  ตารางบันทึกการเปลี่ยนแปลงระดับฐานข้อมูล + ฟังก์ชัน trigger
--   report    view สำหรับรายงาน/ตรวจสอบ ที่ปิดบังข้อมูลส่วนบุคคลแล้ว
-- ═══════════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── public: ปิดสิทธิ์ตั้งต้นที่ Postgres แจกให้ PUBLIC ─────────────────────
ALTER SCHEMA public OWNER TO vibe_owner;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO vibe_owner;
GRANT USAGE ON SCHEMA public TO vibe_app;

-- ── schema เสริม ──────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION vibe_owner;
CREATE SCHEMA IF NOT EXISTS security AUTHORIZATION vibe_owner;
CREATE SCHEMA IF NOT EXISTS report AUTHORIZATION vibe_owner;

REVOKE ALL ON SCHEMA app, security, report FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO vibe_app, vibe_readonly;
GRANT USAGE ON SCHEMA security TO vibe_app;
GRANT USAGE ON SCHEMA report TO vibe_readonly;

-- ป้องกัน search_path hijacking: ทุก role มองเห็นเฉพาะลำดับที่กำหนดไว้แน่นอน
ALTER ROLE vibe_owner    IN DATABASE vibe_framework SET search_path = public, app, security;
ALTER ROLE vibe_app      IN DATABASE vibe_framework SET search_path = public, app;
ALTER ROLE vibe_readonly IN DATABASE vibe_framework SET search_path = report, app;

\echo '✅ 01 · schema public/app/security/report พร้อมแล้ว'
