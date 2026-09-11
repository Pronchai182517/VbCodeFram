-- ═══════════════════════════════════════════════════════════════════════════
-- 02 · สิทธิ์ระดับตาราง (รันหลัง prisma migrate deploy ทุกครั้ง)
--      รันด้วยสิทธิ์ superuser หรือ vibe_owner บนฐาน `vibe_framework`
--
-- หลักการ: vibe_app ได้เฉพาะ DML ที่จำเป็นจริง ๆ ของแต่ละตาราง
--   • ห้าม DDL ทุกชนิด (CREATE/ALTER/DROP/TRUNCATE)
--   • ตาราง audit_logs เขียนได้อย่างเดียว ลบ/แก้ไม่ได้ (append-only)
--   • ตาราง permissions อ่านได้อย่างเดียว — ทะเบียนสิทธิ์มาจากโค้ด seed เท่านั้น
--   • ตาราง _prisma_migrations แตะไม่ได้เลย
-- ═══════════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on

-- ล้างสิทธิ์เดิมทั้งหมดก่อน แล้วให้ใหม่เฉพาะที่ต้องการ (idempotent)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM vibe_app, vibe_readonly;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM vibe_app, vibe_readonly;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- ── ตารางที่แอปอ่าน/เขียนได้เต็มรูปแบบ ────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.tenants,
  public.users,
  public.user_tenants,
  public.roles,
  public.user_roles,
  public.role_permissions,
  public.auth_tokens,
  public.login_throttles,
  public.sample_items,
  public.articles,
  public.article_attachments,
  public.departments,
  public.staff_profiles,
  public.programs,
  public.courses,
  public.document_requests,
  public.approval_routes,
  public.resources,
  public.reservations
TO vibe_app;

-- ── ทะเบียนสิทธิ์: อ่านอย่างเดียว ─────────────────────────────────────────
GRANT SELECT ON public.permissions TO vibe_app;

-- ── บันทึกการตรวจสอบ: เขียนเพิ่มได้ ห้ามแก้/ลบ ────────────────────────────
GRANT SELECT, INSERT ON public.audit_logs TO vibe_app;

-- ── ตารางระบบของ Prisma: แอปไม่ต้องรู้จัก ────────────────────────────────
REVOKE ALL ON public."_prisma_migrations" FROM vibe_app, vibe_readonly;

-- ── ตารางใหม่ที่ vibe_owner สร้างในอนาคต (feature ใหม่ของนักเรียน) ────────
-- ให้สิทธิ์ DML อัตโนมัติ เพื่อไม่ให้ migrate แล้วแอปพังเพราะลืม grant
-- (แต่ RLS ของตารางใหม่ยังต้องสั่ง db/apply-security.sh เองเมื่อเป็นตารางที่มี tenant_id)
ALTER DEFAULT PRIVILEGES FOR ROLE vibe_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO vibe_app;
ALTER DEFAULT PRIVILEGES FOR ROLE vibe_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO vibe_app;

-- ── จำกัดจำนวน connection ของแอป (กัน connection storm ไปกินฐานร่วม) ─────
ALTER ROLE vibe_app CONNECTION LIMIT 30;
ALTER ROLE vibe_readonly CONNECTION LIMIT 5;
ALTER ROLE vibe_owner CONNECTION LIMIT 10;

\echo '✅ 02 · สิทธิ์ระดับตารางของ vibe_app ถูกจำกัดตาม least privilege แล้ว'
