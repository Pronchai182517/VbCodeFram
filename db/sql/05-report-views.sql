-- ═══════════════════════════════════════════════════════════════════════════
-- 05 · view สำหรับรายงาน/ตรวจสอบ — เห็นภาพรวมได้โดยไม่เห็นข้อมูลส่วนบุคคล
--      รันด้วยสิทธิ์ superuser หรือ vibe_owner บนฐาน `vibe_framework`
--
-- role vibe_readonly (ใช้กับ pgAdmin / BI / คนตรวจสอบ) เข้าถึงได้เฉพาะ schema report
-- ตารางจริงใน public แตะไม่ได้เลย จึงไม่มีทางอ่าน password_hash หรืออีเมลเต็มได้
-- ═══════════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on

CREATE OR REPLACE FUNCTION report.mask_email(addr text) RETURNS text
  LANGUAGE sql IMMUTABLE
  SET search_path = pg_catalog
AS $$ SELECT regexp_replace(addr, '^(.).*(.)@', '\1***\2@') $$;
ALTER FUNCTION report.mask_email(text) OWNER TO vibe_owner;

-- ผู้ใช้ + องค์กร + บทบาท (อีเมลถูกปิดบัง, ไม่มีคอลัมน์รหัสผ่าน)
CREATE OR REPLACE VIEW report.users_masked AS
SELECT
  u.id,
  report.mask_email(u.email)                              AS email_masked,
  u.name,
  u.provider,
  u.email_verified,
  u.is_active,
  u.must_change_password,
  u.locale,
  u.last_login_at,
  u.created_at,
  t.code                                                  AS tenant_code,
  ut.is_active                                            AS membership_active,
  COALESCE(array_agg(r.code ORDER BY r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
FROM public.users u
LEFT JOIN public.user_tenants ut ON ut.user_id = u.id
LEFT JOIN public.tenants t       ON t.id = ut.tenant_id
LEFT JOIN public.user_roles ur   ON ur.user_tenant_id = ut.id
LEFT JOIN public.roles r         ON r.id = ur.role_id
GROUP BY u.id, t.code, ut.is_active;

-- เมทริกซ์บทบาท ↔ สิทธิ์
CREATE OR REPLACE VIEW report.role_matrix AS
SELECT
  t.code AS tenant_code,
  r.code AS role_code,
  r.name_th,
  r.is_system,
  COUNT(DISTINCT ur.user_tenant_id)                                          AS member_count,
  COALESCE(array_agg(p.code ORDER BY p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
FROM public.roles r
JOIN public.tenants t             ON t.id = r.tenant_id
LEFT JOIN public.role_permissions rp ON rp.role_id = r.id
LEFT JOIN public.permissions p       ON p.id = rp.permission_id
LEFT JOIN public.user_roles ur       ON ur.role_id = r.id
GROUP BY t.code, r.code, r.name_th, r.is_system;

-- ร่องรอยการใช้งานจากแอป (ผู้กระทำถูกปิดบัง, IP ตัด octet สุดท้าย)
CREATE OR REPLACE VIEW report.audit_trail AS
SELECT
  a.id,
  a.created_at,
  t.code AS tenant_code,
  report.mask_email(u.email) AS actor_masked,
  a.action,
  a.entity,
  a.entity_id,
  regexp_replace(a.ip, '\d+$', 'x') AS ip_masked,
  (a.before IS NOT NULL)     AS has_before,
  (a.after IS NOT NULL)      AS has_after
FROM public.audit_logs a
JOIN public.tenants t  ON t.id = a.tenant_id
LEFT JOIN public.users u ON u.id = a.actor_id;

-- ร่องรอยระดับฐานข้อมูล (จาก trigger — เห็นแม้แก้ผ่าน psql ตรง ๆ)
CREATE OR REPLACE VIEW report.data_changes AS
SELECT id, changed_at, db_user, table_name, operation, row_pk, changed_columns
FROM security.data_changes;

-- ภาพรวมองค์กร
CREATE OR REPLACE VIEW report.tenant_overview AS
SELECT
  t.code,
  t.name_th,
  t.is_active,
  t.settings ->> 'palette'                                      AS palette,
  (SELECT COUNT(*) FROM public.user_tenants ut WHERE ut.tenant_id = t.id) AS users_total,
  (SELECT COUNT(*) FROM public.user_tenants ut JOIN public.users u ON u.id = ut.user_id
     WHERE ut.tenant_id = t.id AND u.is_active)                 AS users_active,
  (SELECT COUNT(*) FROM public.roles r WHERE r.tenant_id = t.id)        AS roles_total,
  (SELECT COUNT(*) FROM public.sample_items s WHERE s.tenant_id = t.id) AS sample_items,
  (SELECT COUNT(*) FROM public.audit_logs a WHERE a.tenant_id = t.id)   AS audit_entries,
  (SELECT MAX(a.created_at) FROM public.audit_logs a WHERE a.tenant_id = t.id) AS last_activity
FROM public.tenants t;

-- สรุปสถานะความปลอดภัยของบัญชี (ใช้เฝ้าระวัง)
CREATE OR REPLACE VIEW report.security_posture AS
SELECT
  (SELECT COUNT(*) FROM public.users WHERE NOT is_active)              AS suspended_users,
  (SELECT COUNT(*) FROM public.users WHERE NOT email_verified)         AS unverified_users,
  (SELECT COUNT(*) FROM public.users WHERE must_change_password)       AS must_change_password,
  (SELECT COUNT(*) FROM public.users WHERE password_hash IS NULL)      AS oauth_only_users,
  (SELECT COUNT(*) FROM public.users WHERE last_login_at < now() - interval '90 days') AS dormant_90d,
  (SELECT COUNT(*) FROM public.login_throttles WHERE locked_until > now())             AS locked_accounts,
  (SELECT COUNT(*) FROM public.auth_tokens WHERE used_at IS NULL AND expires_at > now()) AS live_tokens,
  (SELECT COUNT(*) FROM public.auth_tokens WHERE used_at IS NULL AND expires_at <= now()) AS expired_tokens;

ALTER VIEW report.users_masked     OWNER TO vibe_owner;
ALTER VIEW report.role_matrix      OWNER TO vibe_owner;
ALTER VIEW report.audit_trail      OWNER TO vibe_owner;
ALTER VIEW report.data_changes     OWNER TO vibe_owner;
ALTER VIEW report.tenant_overview  OWNER TO vibe_owner;
ALTER VIEW report.security_posture OWNER TO vibe_owner;

GRANT SELECT ON ALL TABLES IN SCHEMA report TO vibe_readonly;
GRANT EXECUTE ON FUNCTION report.mask_email(text) TO vibe_readonly;

\echo '✅ 05 · view รายงานใน schema report พร้อมแล้ว (vibe_readonly เห็นเฉพาะข้อมูลที่ปิดบังแล้ว)'
