-- ═══════════════════════════════════════════════════════════════════════════
-- 06 · ปิดช่องต่อฐานข้อมูลข้ามโปรเจกต์บนเซิร์ฟเวอร์ Postgres ที่ใช้ร่วมกัน
--      รันด้วยสิทธิ์ superuser บนฐาน `postgres`
--
-- โดยค่าเริ่มต้น Postgres ให้สิทธิ์ CONNECT กับ PUBLIC ทุกฐาน แปลว่า role ของแอปนี้
-- (vibe_app) ต่อเข้าฐาน app_db ของโปรเจกต์อื่นบนเซิร์ฟเวอร์เดียวกันได้ด้วย — ปิดทิ้ง
--
-- ผลกระทบกับโปรเจกต์อื่น: role `postgres` เป็น superuser จึงต่อได้เหมือนเดิมทุกฐาน
-- (pgAdmin และสคริปต์ของ postgresal ใช้ postgres อยู่แล้ว) ถ้าภายหลังสร้าง role ใหม่
-- ให้ใช้กับ app_db ต้อง GRANT CONNECT ให้ role นั้นอย่างชัดเจน
--
-- ย้อนกลับได้ด้วย:  GRANT CONNECT ON DATABASE app_db TO PUBLIC;
-- ═══════════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on

DO $$
DECLARE d text;
BEGIN
  FOR d IN SELECT datname FROM pg_database WHERE datname IN ('app_db', 'postgres') LOOP
    EXECUTE format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC', d);
    EXECUTE format('GRANT ALL ON DATABASE %I TO postgres', d);
    RAISE NOTICE 'ปิด CONNECT ของ PUBLIC บนฐาน % แล้ว', d;
  END LOOP;
END $$;

\echo '✅ 06 · role ของ VibeCore ต่อได้เฉพาะฐาน vibe_framework เท่านั้น'
