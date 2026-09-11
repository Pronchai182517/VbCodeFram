-- ═══════════════════════════════════════════════════════════════════════════
-- 03 · Row Level Security — กั้นข้อมูลข้ามองค์กร (tenant isolation) ที่ชั้นฐานข้อมูล
--      รันด้วยสิทธิ์ superuser หรือ vibe_owner บนฐาน `vibe_framework`
--
-- แอปกรอง tenantId จาก session อยู่แล้วในโค้ด — ชั้นนี้คือ "ตาข่ายรับ" อีกชั้น
-- ถ้ามีบั๊กหรือ SQL injection ที่หลุดการกรองในโค้ด ฐานข้อมูลจะยังไม่คืนข้อมูลขององค์กรอื่น
--
-- ตัวระบุองค์กรปัจจุบันอ่านจากตัวแปร session `app.tenant_id`
--   • ค่าเริ่มต้นถูกผูกไว้กับ role vibe_app (ดูท้ายไฟล์) — deployment เดียว = องค์กรเดียว
--   • ถ้าจะทำหลายองค์กรในแอปเดียว ให้แอปสั่ง SET LOCAL app.tenant_id = '<uuid>' ต้นทุก transaction
--   • ถ้าไม่มีค่า → ฟังก์ชันคืน NULL → ทุก policy เป็นเท็จ → ไม่เห็นข้อมูลใดเลย (fail closed)
--
-- vibe_owner เป็นเจ้าของตาราง จึงข้าม RLS ได้ตามปกติของ Postgres (ใช้ตอน migrate/seed/backup)
-- ═══════════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on

CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS uuid
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $fn$
DECLARE
  raw_id   text := current_setting('app.tenant_id', true);
  raw_code text := current_setting('app.tenant_code', true);
  result   uuid;
BEGIN
  -- 1) แอปกำหนด uuid มาเองต่อ transaction (ใช้ตอนทำหลายองค์กร) → ใช้ค่านั้นก่อน
  IF raw_id IS NOT NULL AND raw_id <> '' THEN
    RETURN raw_id::uuid;
  END IF;
  -- 2) ไม่งั้นใช้ "รหัสองค์กร" ที่ผูกไว้กับ role แล้วแปลงเป็น uuid ให้ตอนใช้งาน
  --    ผูกด้วยรหัสไม่ใช่ uuid เพราะ seed ใหม่ทำให้ uuid เปลี่ยน แล้วแอปจะมองไม่เห็นข้อมูลทั้งหมดเงียบ ๆ
  IF raw_code IS NULL OR raw_code = '' THEN
    RETURN NULL;          -- ไม่มีทั้งสองค่า → คืน NULL → ทุก policy เป็นเท็จ → ไม่เห็นข้อมูลใด (fail closed)
  END IF;
  SELECT t.id INTO result FROM public.tenants t WHERE t.code = raw_code;
  RETURN result;
END
$fn$;
ALTER FUNCTION app.current_tenant_id() OWNER TO vibe_owner;
REVOKE ALL ON FUNCTION app.current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.current_tenant_id() TO vibe_app, vibe_readonly;

-- ── ตารางที่มีคอลัมน์ tenant_id ตรง ๆ ─────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_tenants', 'roles', 'audit_logs', 'sample_items',
    'articles', 'departments', 'staff_profiles', 'programs', 'courses',
    'document_requests', 'resources', 'reservations'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', t);
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON public.%I
        FOR ALL TO vibe_app
        USING (tenant_id = app.current_tenant_id())
        WITH CHECK (tenant_id = app.current_tenant_id())
    $f$, t);
  END LOOP;
END $$;

-- ── ตารางองค์กรเอง: เห็นได้เฉพาะแถวขององค์กรตัวเอง ───────────────────────
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.tenants;
CREATE POLICY tenant_isolation ON public.tenants
  FOR ALL TO vibe_app
  USING (id = app.current_tenant_id())
  WITH CHECK (id = app.current_tenant_id());

-- ── ตารางลูกที่ไม่มี tenant_id: สืบผ่านตารางแม่ที่ถูก RLS คุมอยู่แล้ว ─────
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.user_roles;
CREATE POLICY tenant_isolation ON public.user_roles
  FOR ALL TO vibe_app
  USING (EXISTS (SELECT 1 FROM public.user_tenants ut WHERE ut.id = user_roles.user_tenant_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_tenants ut WHERE ut.id = user_roles.user_tenant_id));

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.role_permissions;
CREATE POLICY tenant_isolation ON public.role_permissions
  FOR ALL TO vibe_app
  USING (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_permissions.role_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_permissions.role_id));

ALTER TABLE public.article_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.article_attachments;
CREATE POLICY tenant_isolation ON public.article_attachments
  FOR ALL TO vibe_app
  USING (EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_attachments.article_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_attachments.article_id));

ALTER TABLE public.approval_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.approval_routes;
CREATE POLICY tenant_isolation ON public.approval_routes
  FOR ALL TO vibe_app
  USING (EXISTS (SELECT 1 FROM public.document_requests d WHERE d.id = approval_routes.document_request_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.document_requests d WHERE d.id = approval_routes.document_request_id));

-- ── ผูกองค์กรตั้งต้นให้ role vibe_app ─────────────────────────────────────
-- ผูกด้วย "รหัสองค์กร" (code) ไม่ใช่ uuid — seed ใหม่ทีไร uuid เปลี่ยนทุกที
-- ถ้าผูกด้วย uuid แล้ว seed ใหม่ แอปจะมองไม่เห็นข้อมูลทั้งระบบโดยไม่มีข้อผิดพลาดใด ๆ ให้เห็น
DO $$
DECLARE
  v_code text := COALESCE(NULLIF(current_setting('vibe.tenant_code', true), ''), 'DEMO');
BEGIN
  EXECUTE format('ALTER ROLE vibe_app IN DATABASE vibe_framework SET app.tenant_code = %L', v_code);
  -- ล้างค่าที่ผูกด้วย uuid แบบเดิมทิ้ง (ถ้ามี) ไม่ให้ค่าเก่าที่ค้างอยู่มาทับค่าใหม่
  EXECUTE 'ALTER ROLE vibe_app IN DATABASE vibe_framework RESET app.tenant_id';
  IF NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.code = v_code) THEN
    RAISE WARNING 'ยังไม่มีองค์กรรหัส % ในฐานข้อมูล — ผูกไว้แล้วแต่แอปจะยังไม่เห็นข้อมูลจนกว่าจะ seed', v_code;
  ELSE
    RAISE NOTICE 'ผูก role vibe_app กับองค์กรรหัส % แล้ว', v_code;
  END IF;
END $$;

\echo '✅ 03 · RLS ทำงานครบทุกตารางที่มี tenant_id (+ ตารางลูกที่สืบผ่านตารางแม่)'
