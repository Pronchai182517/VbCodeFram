-- ═══════════════════════════════════════════════════════════════════════════
-- 00 · สร้าง role และ database ของ VibeCore บนเซิร์ฟเวอร์ Postgres ที่ใช้ร่วมกัน
--      รันด้วยสิทธิ์ superuser บนฐาน `postgres`
--      ตัวแปรที่ต้องส่งเข้ามา: -v owner_pw=... -v app_pw=... -v ro_pw=...
--
-- แยกเป็น 3 role ตามหลัก least privilege — ไม่มี role ไหนเป็น superuser และไม่มีสิทธิ์ CREATEDB/CREATEROLE
--   vibe_owner    เจ้าของ schema/ตาราง ใช้เฉพาะตอน migrate + seed (DDL)
--   vibe_app      ที่แอปใช้ตอนรันจริง — DML เท่านั้น, ถูกบังคับด้วย RLS, ไม่มีสิทธิ์ DDL
--   vibe_readonly สำหรับรายงาน/ตรวจสอบ — เห็นเฉพาะ view ที่ปิดบังข้อมูลส่วนบุคคลแล้ว
-- ═══════════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on

-- ── role ──────────────────────────────────────────────────────────────────
-- หมายเหตุ: psql ไม่แทนค่าตัวแปร :'...' ข้างใน dollar-quote ($$) จึงใช้ \gexec สร้างคำสั่งแทน
SELECT format('CREATE ROLE %I LOGIN', r)
  FROM (VALUES ('vibe_owner'), ('vibe_app'), ('vibe_readonly')) AS v(r)
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = v.r)\gexec

SELECT format('ALTER ROLE vibe_owner PASSWORD %L', :'owner_pw')\gexec
SELECT format('ALTER ROLE vibe_app PASSWORD %L', :'app_pw')\gexec
SELECT format('ALTER ROLE vibe_readonly PASSWORD %L', :'ro_pw')\gexec

-- ปิดสิทธิ์ที่ไม่จำเป็นทั้งหมดอย่างชัดเจน (เผื่อ role เคยถูกสร้างไว้ก่อนหน้า)
ALTER ROLE vibe_owner    NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE vibe_app      NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS INHERIT;
ALTER ROLE vibe_readonly NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

-- ── database ──────────────────────────────────────────────────────────────
SELECT 'CREATE DATABASE vibe_framework OWNER vibe_owner ENCODING ''UTF8'' TEMPLATE template0'
 WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'vibe_framework')\gexec

-- ฐานนี้ต่อได้เฉพาะ 3 role ข้างบน — ผู้ใช้อื่นในเซิร์ฟเวอร์ร่วม (เช่น app_db) ต่อเข้ามาไม่ได้
REVOKE ALL ON DATABASE vibe_framework FROM PUBLIC;
GRANT CONNECT, TEMPORARY ON DATABASE vibe_framework TO vibe_owner;
GRANT CONNECT ON DATABASE vibe_framework TO vibe_app, vibe_readonly;

-- ── ขีดจำกัดระดับ session ของแต่ละ role (กัน query ค้าง/ล็อกยาว) ──────────
ALTER ROLE vibe_app IN DATABASE vibe_framework SET statement_timeout = '20s';
ALTER ROLE vibe_app IN DATABASE vibe_framework SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE vibe_app IN DATABASE vibe_framework SET row_security = on;
ALTER ROLE vibe_app IN DATABASE vibe_framework SET default_transaction_read_only = off;

ALTER ROLE vibe_readonly IN DATABASE vibe_framework SET statement_timeout = '60s';
ALTER ROLE vibe_readonly IN DATABASE vibe_framework SET default_transaction_read_only = on;

ALTER ROLE vibe_owner IN DATABASE vibe_framework SET statement_timeout = '15min';

\echo '✅ 00 · role vibe_owner / vibe_app / vibe_readonly และ database vibe_framework พร้อมแล้ว'
