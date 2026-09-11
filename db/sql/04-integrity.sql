-- ═══════════════════════════════════════════════════════════════════════════
-- 04 · ความถูกต้อง/ตรวจสอบย้อนหลังของข้อมูล (data integrity & tamper evidence)
--      รันด้วยสิทธิ์ superuser หรือ vibe_owner บนฐาน `vibe_framework`
--
--   1) audit_logs เป็น append-only จริง ๆ — บังคับทั้งด้วยสิทธิ์ (ไฟล์ 02) และ trigger (ไฟล์นี้)
--      ต่อให้ผู้โจมตีได้สิทธิ์ vibe_app ไปก็ลบร่องรอยของตัวเองไม่ได้
--   2) security.data_changes บันทึกการเปลี่ยนแปลงตารางสำคัญที่ระดับฐานข้อมูล
--      เป็นคนละชั้นกับ audit_logs ของแอป (แอปเขียนเอง = เชื่อได้เท่าที่โค้ดถูก)
--      ชั้นนี้ trigger เขียนให้เอง แม้แก้ผ่าน psql ตรง ๆ ก็ถูกบันทึก
--   3) ค่าที่อ่อนไหว (password_hash, token_hash) ไม่ถูกเก็บลง log และอีเมลถูกปิดบัง
-- ═══════════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on

-- ── ตารางบันทึกการเปลี่ยนแปลงระดับฐานข้อมูล ──────────────────────────────
CREATE TABLE IF NOT EXISTS security.data_changes (
  id              bigserial PRIMARY KEY,
  changed_at      timestamptz NOT NULL DEFAULT now(),
  db_user         text        NOT NULL DEFAULT session_user,
  client_addr     inet                 DEFAULT inet_client_addr(),
  table_name      text        NOT NULL,
  operation       text        NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  row_pk          text,
  changed_columns text[],
  before_data     jsonb,
  after_data      jsonb
);
CREATE INDEX IF NOT EXISTS data_changes_table_time_idx ON security.data_changes (table_name, changed_at DESC);
CREATE INDEX IF NOT EXISTS data_changes_pk_idx ON security.data_changes (row_pk);
ALTER TABLE security.data_changes OWNER TO vibe_owner;
REVOKE ALL ON security.data_changes FROM PUBLIC, vibe_app, vibe_readonly;

-- ── ปิดบังค่าอ่อนไหวก่อนเก็บลง log ───────────────────────────────────────
CREATE OR REPLACE FUNCTION security.redact(data jsonb) RETURNS jsonb
  LANGUAGE sql IMMUTABLE
  SET search_path = pg_catalog, public
AS $$
  SELECT CASE WHEN data IS NULL THEN NULL ELSE
    (data - 'password_hash' - 'token_hash')
    || CASE WHEN data ? 'password_hash' THEN jsonb_build_object('password_hash', '[redacted]') ELSE '{}'::jsonb END
    || CASE WHEN data ? 'token_hash'    THEN jsonb_build_object('token_hash', '[redacted]')    ELSE '{}'::jsonb END
    || CASE WHEN data ? 'email' THEN jsonb_build_object('email',
         regexp_replace(data->>'email', '^(.).*(.)@', '\1***\2@')) ELSE '{}'::jsonb END
  END
$$;
ALTER FUNCTION security.redact(jsonb) OWNER TO vibe_owner;

-- ── trigger บันทึกการเปลี่ยนแปลง (SECURITY DEFINER: vibe_app ไม่ต้องมีสิทธิ์เขียน log เอง) ──
CREATE OR REPLACE FUNCTION security.log_change() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = pg_catalog, public, security
AS $$
DECLARE
  -- เทียบค่า "ก่อนปิดบัง" เพื่อหาว่าคอลัมน์ไหนเปลี่ยนจริง แล้วค่อยปิดบังตอนเก็บลง log
  -- (ถ้าเทียบหลังปิดบัง การเปลี่ยนรหัสผ่านจะมองไม่เห็นเลย เพราะทั้งก่อนและหลังเป็น '[redacted]' เท่ากัน)
  raw_before jsonb := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END;
  raw_after  jsonb := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END;
  before_j jsonb := security.redact(raw_before);
  after_j  jsonb := security.redact(raw_after);
  cols     text[];
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key ORDER BY key) INTO cols
      FROM jsonb_each(raw_after) n
     WHERE n.value IS DISTINCT FROM raw_before -> n.key;
    IF cols IS NULL OR cols = ARRAY['updated_at'] THEN
      RETURN NULL;  -- แก้แค่ timestamp ไม่ต้องบันทึก
    END IF;
  END IF;

  INSERT INTO security.data_changes (table_name, operation, row_pk, changed_columns, before_data, after_data)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(after_j ->> 'id', before_j ->> 'id', after_j ->> 'key', before_j ->> 'key'),
    cols,
    before_j,
    after_j
  );
  RETURN NULL;
END $$;
ALTER FUNCTION security.log_change() OWNER TO vibe_owner;
REVOKE ALL ON FUNCTION security.log_change() FROM PUBLIC;

-- ติด trigger บนตารางที่กระทบสิทธิ์และตัวตนผู้ใช้
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users', 'user_tenants', 'user_roles', 'roles', 'role_permissions', 'tenants', 'permissions'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS zz_log_change ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER zz_log_change AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION security.log_change()', t);
  END LOOP;
END $$;

-- ── audit_logs: เขียนได้อย่างเดียว ───────────────────────────────────────
CREATE OR REPLACE FUNCTION security.deny_mutation() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = pg_catalog
AS $$
BEGIN
  -- ช่องทางเดียวที่ลบได้คือฟังก์ชัน purge ตามนโยบายเก็บข้อมูล (ตั้งธงไว้ใน session)
  IF TG_OP = 'DELETE' AND current_setting('security.allow_purge', true) = 'on' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'ตาราง % เป็น append-only — แก้ไขหรือลบไม่ได้ (%)', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END $$;
ALTER FUNCTION security.deny_mutation() OWNER TO vibe_owner;

DROP TRIGGER IF EXISTS zz_append_only ON public.audit_logs;
CREATE TRIGGER zz_append_only BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION security.deny_mutation();

DROP TRIGGER IF EXISTS zz_append_only ON security.data_changes;
CREATE TRIGGER zz_append_only BEFORE UPDATE OR DELETE ON security.data_changes
  FOR EACH ROW EXECUTE FUNCTION security.deny_mutation();

-- ── นโยบายเก็บข้อมูล: ลบ log ที่เกินอายุได้เฉพาะผ่านฟังก์ชันนี้ ───────────
CREATE OR REPLACE FUNCTION security.purge_logs(retain_days int DEFAULT 365)
  RETURNS TABLE (audit_logs_deleted bigint, data_changes_deleted bigint)
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = pg_catalog, public, security
AS $$
DECLARE a bigint; d bigint;
BEGIN
  IF retain_days < 30 THEN
    RAISE EXCEPTION 'นโยบายกำหนดให้เก็บ log อย่างน้อย 30 วัน (ขอมา % วัน)', retain_days;
  END IF;
  PERFORM set_config('security.allow_purge', 'on', true);
  DELETE FROM public.audit_logs WHERE created_at < now() - make_interval(days => retain_days);
  GET DIAGNOSTICS a = ROW_COUNT;
  DELETE FROM security.data_changes WHERE changed_at < now() - make_interval(days => retain_days);
  GET DIAGNOSTICS d = ROW_COUNT;
  PERFORM set_config('security.allow_purge', 'off', true);
  RETURN QUERY SELECT a, d;
END $$;
ALTER FUNCTION security.purge_logs(int) OWNER TO vibe_owner;
REVOKE ALL ON FUNCTION security.purge_logs(int) FROM PUBLIC;

\echo '✅ 04 · audit_logs เป็น append-only + trigger บันทึกการเปลี่ยนแปลงลง security.data_changes แล้ว'
