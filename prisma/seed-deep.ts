import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { seedCore } from "./lib/seed-core";
import { requireDatabaseUrl } from "./lib/require-database-url";
import { ALL_PERMISSIONS } from "../src/permissions";
import { resolveSeedPassword, printSeedPassword } from "./lib/seed-password";

/**
 * ชุดข้อมูลตั้งต้นแบบละเอียด — ครอบคลุมทุกองค์ประกอบหลักของ framework
 * (องค์กร · ผู้ใช้ทุกสถานะ · บทบาท/สิทธิ์ · ขอบเขตสิทธิ์ · โทเคน · การล็อกบัญชี · ข้อมูลตัวอย่าง · ร่องรอยการใช้งาน)
 *
 * ต้องรันด้วย role `vibe_owner` เท่านั้น — เจ้าของตารางเป็น role เดียวที่ข้าม RLS ได้
 * รันซ้ำได้: ทุกอย่าง upsert ด้วยคีย์คงที่ และแถว log ใช้ id ที่คำนวณจากลำดับ (skipDuplicates)
 *
 *   npm run db:seed:deep
 */

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }) });

/** UUID จากข้อความคงที่ — ให้ข้อมูลชุดเดิมได้ id เดิมทุกครั้งที่รันซ้ำ */
function stableId(seed: string): string {
  const h = crypto.createHash("sha256").update(seed).digest();
  h[6] = (h[6] & 0x0f) | 0x40;
  h[8] = (h[8] & 0x3f) | 0x80;
  const hex = h.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/** สุ่มแบบกำหนดผลได้ (deterministic) เพื่อให้ข้อมูลชุดเดิมเหมือนกันทุกครั้ง */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
}

const daysAgo = (d: number, hour = 9) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(hour, (d * 7) % 60, 0, 0);
  return dt;
};

const seedPassword = resolveSeedPassword();
export const DEEP_PASSWORD = seedPassword.password;

/** บทบาทเพิ่มเติมนอกเหนือจาก DEFAULT_ROLES — แสดงการผสมสิทธิ์แบบต่าง ๆ */
const EXTRA_ROLES = [
  { code: "AUDITOR", nameTh: "ผู้ตรวจสอบ", nameEn: "Auditor", description: "ดูผู้ใช้และร่องรอยการใช้งานได้ แต่แก้ไขอะไรไม่ได้", permissions: ["users:read", "audit:read"] },
  { code: "SAMPLE_EDITOR", nameTh: "ผู้จัดการข้อมูลตัวอย่าง", nameEn: "Sample editor", description: "จัดการเฉพาะโมดูลตัวอย่าง", permissions: ["sample:read", "sample:manage"] },
  { code: "HELPDESK", nameTh: "ฝ่ายสนับสนุน", nameEn: "Help desk", description: "ดูข้อมูลผู้ใช้เพื่อช่วยเหลือ และดูข้อมูลตัวอย่าง", permissions: ["users:read", "sample:read"] },
  { code: "BRAND_MANAGER", nameTh: "ผู้ดูแลแบรนด์", nameEn: "Brand manager", description: "ปรับตั้งค่าองค์กรและธีมสีได้", permissions: ["settings:manage", "sample:read"] },
] as const;

/** ผู้ใช้ครอบคลุมทุกสถานะที่ระบบรองรับ */
const PEOPLE = [
  { key: "admin",     email: "admin@app.local",      name: "ผู้ดูแลสูงสุด",            roles: ["SUPER_ADMIN"], scope: "ALL" },
  { key: "somchai",   email: "somchai@app.local",    name: "สมชาย ใจดี",              roles: ["ADMIN"], scope: "ALL", lastLogin: 1 },
  { key: "kanya",     email: "kanya@app.local",      name: "กัญญา ศรีสุข",             roles: ["ADMIN", "AUDITOR"], scope: "ALL", lastLogin: 2, locale: "th" },
  { key: "prasit",    email: "prasit@app.local",     name: "ประสิทธิ์ วงศ์ทอง",        roles: ["STAFF"], scope: "CAMPUS", lastLogin: 3 },
  { key: "malee",     email: "malee@app.local",      name: "มาลี ดอกไม้",              roles: ["STAFF"], scope: "CAMPUS", lastLogin: 5 },
  { key: "nattapong", email: "nattapong@app.local",  name: "ณัฐพงศ์ พูลทรัพย์",        roles: ["STAFF", "SAMPLE_EDITOR"], scope: "ORG_UNIT", lastLogin: 4 },
  { key: "siriporn",  email: "siriporn@app.local",   name: "ศิริพร แก้วมณี",           roles: ["HELPDESK"], scope: "ORG_UNIT", lastLogin: 8 },
  { key: "wichai",    email: "wichai@app.local",     name: "วิชัย รุ่งเรือง",           roles: ["BRAND_MANAGER"], scope: "ALL", lastLogin: 12, locale: "en" },
  { key: "orawan",    email: "orawan@app.local",     name: "อรวรรณ สุขสันต์",          roles: ["AUDITOR"], scope: "ALL", lastLogin: 6 },
  { key: "staff",     email: "staff@app.local",      name: "เจ้าหน้าที่",              roles: ["STAFF"], scope: "ALL", lastLogin: 1 },
  { key: "viewer",    email: "viewer@app.local",     name: "ผู้ดู",                    roles: ["VIEWER"], scope: "ALL", lastLogin: 9 },
  { key: "sample",    email: "sample@app.local",     name: "ผู้ดูแลข้อมูลตัวอย่าง",     roles: ["SAMPLE_EDITOR"], scope: "ALL", lastLogin: 2 },
  { key: "forced",    email: "forced@app.local",     name: "บัญชีบังคับเปลี่ยนรหัส",    roles: ["VIEWER"], scope: "ALL", mustChangePassword: true },
  { key: "lockme",    email: "lockme@app.local",     name: "บัญชีทดสอบล็อก",           roles: ["VIEWER"], scope: "ALL", lastLogin: 30 },
  { key: "suspended", email: "suspended@app.local",  name: "บัญชีถูกระงับ",            roles: ["STAFF"], scope: "ALL", isActive: false, lastLogin: 45 },
  { key: "unverified",email: "unverified@app.local", name: "บัญชียังไม่ยืนยันอีเมล",    roles: ["VIEWER"], scope: "ALL", emailVerified: false },
  { key: "dormant",   email: "dormant@app.local",    name: "บัญชีไม่ได้ใช้งานนาน",      roles: ["VIEWER"], scope: "ALL", lastLogin: 200 },
  { key: "google",    email: "google.user@app.local",name: "ผู้ใช้ผ่าน Google",         roles: ["STAFF"], scope: "ALL", provider: "google", lastLogin: 3 },
  { key: "microsoft", email: "ms.user@app.local",    name: "ผู้ใช้ผ่าน Microsoft",      roles: ["VIEWER"], scope: "ALL", provider: "microsoft", lastLogin: 7 },
  { key: "leaver",    email: "leaver@app.local",     name: "บัญชีที่ออกจากองค์กรแล้ว",  roles: ["VIEWER"], scope: "ALL", membershipActive: false, lastLogin: 120 },
] as const;

/** ผู้ใช้ขององค์กรที่สอง — มีไว้พิสูจน์ว่า RLS กันข้ามองค์กรได้จริง (แอปต้องมองไม่เห็นเลย) */
const ACME_PEOPLE = [
  { key: "acme-admin", email: "admin@acme.local", name: "ACME Administrator", roles: ["ADMIN"] },
  { key: "acme-staff", email: "staff@acme.local", name: "ACME Staff", roles: ["STAFF"] },
] as const;

const SAMPLE_TITLES = [
  "แบบฟอร์มขอใช้ห้องประชุม", "ทะเบียนครุภัณฑ์สำนักงาน", "แผนการอบรมบุคลากร ไตรมาส 1",
  "รายการจัดซื้อวัสดุสิ้นเปลือง", "คู่มือการใช้งานระบบสำหรับผู้ใช้ใหม่", "ตารางเวรปฏิบัติงานนอกเวลา",
  "บันทึกการประชุมคณะทำงาน", "รายชื่อผู้เข้าร่วมโครงการ", "แบบประเมินความพึงพอใจ",
  "ทะเบียนหนังสือรับ-ส่ง", "แผนบำรุงรักษาอุปกรณ์ประจำปี", "รายงานสรุปผลการดำเนินงาน",
  "ข้อมูลติดต่อหน่วยงานภายนอก", "ปฏิทินกิจกรรมประจำเดือน", "รายการคำขอสนับสนุนงบประมาณ",
  "แบบฟอร์มลาพักร้อน", "ทะเบียนสัญญาจ้าง", "รายการเอกสารรอตรวจสอบ",
  "แผนความต่อเนื่องทางธุรกิจ", "บัญชีรายชื่อผู้ดูแลระบบ",
];

const AUDIT_ACTIONS = [
  { action: "user.login", entity: "user" }, { action: "user.create", entity: "user" },
  { action: "user.update", entity: "user" }, { action: "user.suspend", entity: "user" },
  { action: "user.reset_password", entity: "user" }, { action: "role.create", entity: "role" },
  { action: "role.update", entity: "role" }, { action: "role.assign", entity: "user_role" },
  { action: "settings.update", entity: "tenant" }, { action: "sample.create", entity: "sample_item" },
  { action: "sample.update", entity: "sample_item" }, { action: "sample.delete", entity: "sample_item" },
  { action: "auth.login_failed", entity: "user" }, { action: "auth.password_changed", entity: "user" },
];

async function main() {
  console.log("🌱 สร้างชุดข้อมูลตั้งต้นแบบละเอียด...\n");
  const hash = await bcrypt.hash(DEEP_PASSWORD, 12);
  const rand = rng(20260910);

  // ── 1. องค์กรหลัก + ทะเบียนสิทธิ์ + บทบาทตั้งต้น ────────────────────────
  const demo = await seedCore(prisma, { tenantCode: "DEMO", nameTh: "องค์กรตัวอย่าง", nameEn: "Sample Organization" });
  await prisma.tenant.update({
    where: { id: demo.tenantId },
    data: { nameTh: "มหาวิทยาลัยตัวอย่าง", nameEn: "Sample University", settings: { palette: "blue" } },
  });
  console.log(`✓ องค์กรหลัก DEMO (${demo.tenantId})`);
  console.log(`✓ ทะเบียนสิทธิ์ ${ALL_PERMISSIONS.length} รายการ`);

  // ── 2. องค์กรที่สอง (ใช้พิสูจน์การกั้นข้อมูลด้วย RLS) ───────────────────
  const acme = await seedCore(prisma, { tenantCode: "ACME", nameTh: "บริษัท เอซีเอ็มอี จำกัด", nameEn: "ACME Co., Ltd." });
  await prisma.tenant.update({ where: { id: acme.tenantId }, data: { settings: { palette: "green" } } });
  console.log(`✓ องค์กรที่สอง ACME (${acme.tenantId}) — แอปต้องมองไม่เห็นข้อมูลชุดนี้`);

  // ── 3. บทบาทเพิ่มเติมขององค์กรหลัก ─────────────────────────────────────
  const permByCode = new Map((await prisma.permission.findMany()).map((p) => [p.code, p.id]));
  const roleIds: Record<string, string> = { ...demo.roleIds };
  for (const r of EXTRA_ROLES) {
    const role = await prisma.role.upsert({
      where: { tenantId_code: { tenantId: demo.tenantId, code: r.code } },
      update: { nameTh: r.nameTh, nameEn: r.nameEn, description: r.description },
      create: { tenantId: demo.tenantId, code: r.code, nameTh: r.nameTh, nameEn: r.nameEn, description: r.description },
    });
    roleIds[r.code] = role.id;
    for (const code of r.permissions) {
      const permissionId = permByCode.get(code);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }
  console.log(`✓ บทบาท ${Object.keys(roleIds).length} บทบาท (ตั้งต้น 4 + เพิ่มเติม ${EXTRA_ROLES.length})`);

  // ── 4. ผู้ใช้ทุกสถานะ + สมาชิกภาพ + บทบาทตามขอบเขต ────────────────────
  const campusId = stableId("scope:campus:main");
  const orgUnitId = stableId("scope:org-unit:registrar");
  const userIds: Record<string, string> = {};

  for (const p of PEOPLE) {
    const provider = "provider" in p ? p.provider : "credentials";
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {
        name: p.name,
        isActive: "isActive" in p ? p.isActive : true,
        emailVerified: "emailVerified" in p ? p.emailVerified : true,
        mustChangePassword: "mustChangePassword" in p ? p.mustChangePassword : false,
        locale: "locale" in p ? p.locale : null,
        provider,
        lastLoginAt: "lastLogin" in p ? daysAgo(p.lastLogin as number, 8) : null,
      },
      create: {
        email: p.email,
        name: p.name,
        // ผู้ใช้ที่มาจาก OAuth ไม่มีรหัสผ่านในระบบ (password_hash = NULL)
        passwordHash: provider === "credentials" ? hash : null,
        provider,
        providerId: provider === "credentials" ? null : stableId(`provider:${p.email}`),
        isActive: "isActive" in p ? p.isActive : true,
        emailVerified: "emailVerified" in p ? p.emailVerified : true,
        mustChangePassword: "mustChangePassword" in p ? p.mustChangePassword : false,
        locale: "locale" in p ? p.locale : null,
        lastLoginAt: "lastLogin" in p ? daysAgo(p.lastLogin as number, 8) : null,
      },
    });
    userIds[p.key] = user.id;

    const ut = await prisma.userTenant.upsert({
      where: { userId_tenantId: { userId: user.id, tenantId: demo.tenantId } },
      update: { isActive: "membershipActive" in p ? p.membershipActive : true },
      create: { userId: user.id, tenantId: demo.tenantId, isActive: "membershipActive" in p ? p.membershipActive : true },
    });

    await prisma.userRole.deleteMany({ where: { userTenantId: ut.id } });
    const scopeType = ("scope" in p ? p.scope : "ALL") as "ALL" | "CAMPUS" | "ORG_UNIT";
    const scopeId = scopeType === "CAMPUS" ? campusId : scopeType === "ORG_UNIT" ? orgUnitId : null;
    await prisma.userRole.createMany({
      data: p.roles.filter((c) => roleIds[c]).map((c) => ({ userTenantId: ut.id, roleId: roleIds[c], scopeType, scopeId })),
    });
  }
  console.log(`✓ ผู้ใช้องค์กรหลัก ${PEOPLE.length} บัญชี (ใช้งานได้ / ถูกระงับ / ยังไม่ยืนยันอีเมล / บังคับเปลี่ยนรหัส / OAuth / ออกจากองค์กรแล้ว)`);

  for (const p of ACME_PEOPLE) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { name: p.name },
      create: { email: p.email, name: p.name, passwordHash: hash, emailVerified: true },
    });
    const ut = await prisma.userTenant.upsert({
      where: { userId_tenantId: { userId: user.id, tenantId: acme.tenantId } },
      update: {},
      create: { userId: user.id, tenantId: acme.tenantId },
    });
    await prisma.userRole.deleteMany({ where: { userTenantId: ut.id } });
    await prisma.userRole.createMany({ data: p.roles.map((c) => ({ userTenantId: ut.id, roleId: acme.roleIds[c], scopeType: "ALL" as const })) });
  }
  console.log(`✓ ผู้ใช้องค์กร ACME ${ACME_PEOPLE.length} บัญชี`);

  // ── 5. โทเคนใช้ครั้งเดียว (เก็บเฉพาะ sha256 ไม่เก็บโทเคนจริง) ───────────
  const tokens = [
    { key: "verify-live", userKey: "unverified", purpose: "EMAIL_VERIFY" as const, expiresIn: 2, used: false, payload: { newEmail: "unverified@app.local" } },
    { key: "verify-used", userKey: "kanya", purpose: "EMAIL_VERIFY" as const, expiresIn: -3, used: true, payload: { newEmail: "kanya@app.local" } },
    { key: "reset-live", userKey: "forced", purpose: "PASSWORD_RESET" as const, expiresIn: 1, used: false, payload: null },
    { key: "reset-expired", userKey: "dormant", purpose: "PASSWORD_RESET" as const, expiresIn: -10, used: false, payload: null },
    { key: "reset-used", userKey: "somchai", purpose: "PASSWORD_RESET" as const, expiresIn: -1, used: true, payload: null },
  ];
  for (const t of tokens) {
    const tokenHash = crypto.createHash("sha256").update(`seed-token:${t.key}`).digest("hex");
    const expiresAt = new Date(Date.now() + t.expiresIn * 24 * 3600 * 1000);
    await prisma.authToken.upsert({
      where: { tokenHash },
      update: { expiresAt, usedAt: t.used ? daysAgo(2, 10) : null },
      create: {
        id: stableId(`token:${t.key}`),
        userId: userIds[t.userKey],
        purpose: t.purpose,
        tokenHash,
        payload: t.payload ?? undefined,
        expiresAt,
        usedAt: t.used ? daysAgo(2, 10) : null,
      },
    });
  }
  console.log(`✓ โทเคน ${tokens.length} ใบ (ยังใช้ได้ / ใช้ไปแล้ว / หมดอายุ)`);

  // ── 6. ตัวนับการล็อกอินผิด (กัน brute-force) ───────────────────────────
  const throttles = [
    { key: "email:lockme@app.local", failCount: 5, lockedUntil: new Date(Date.now() + 10 * 60 * 1000) },
    { key: "email:suspended@app.local", failCount: 3, lockedUntil: null },
    { key: "ip:203.0.113.44", failCount: 9, lockedUntil: new Date(Date.now() + 30 * 60 * 1000) },
    { key: "ip:198.51.100.7", failCount: 2, lockedUntil: null },
  ];
  for (const t of throttles) {
    await prisma.loginThrottle.upsert({ where: { key: t.key }, update: { failCount: t.failCount, lockedUntil: t.lockedUntil }, create: t });
  }
  console.log(`✓ ตัวนับการล็อกอินผิด ${throttles.length} รายการ (ล็อกอยู่ 2)`);

  // ── 7. ข้อมูลตัวอย่างของโมดูล sample ───────────────────────────────────
  const sampleRows = SAMPLE_TITLES.flatMap((title, i) =>
    [0, 1].map((n) => {
      const idx = i * 2 + n;
      return {
        id: stableId(`sample:demo:${idx}`),
        tenantId: demo.tenantId,
        title: n === 0 ? title : `${title} (ฉบับปรับปรุง)`,
        description: n === 0 ? `รายละเอียดของ${title} สำหรับใช้เป็นตัวอย่างข้อมูลในระบบ` : null,
        status: idx % 5 === 0 ? "INACTIVE" : "ACTIVE",
        createdAt: daysAgo(60 - idx, 10),
        updatedAt: daysAgo(Math.max(0, 30 - Math.floor(idx / 2)), 14),
      };
    }),
  );
  await prisma.sampleItem.createMany({ data: sampleRows, skipDuplicates: true });
  await prisma.sampleItem.createMany({
    data: [0, 1, 2].map((i) => ({
      id: stableId(`sample:acme:${i}`),
      tenantId: acme.tenantId,
      title: `ACME confidential record #${i + 1}`,
      description: "ข้อมูลขององค์กรอื่น — ใช้ทดสอบว่า RLS กันไม่ให้แอปมองเห็น",
      status: "ACTIVE",
    })),
    skipDuplicates: true,
  });
  console.log(`✓ ข้อมูลตัวอย่าง ${sampleRows.length} รายการ (+ ขององค์กรอื่นอีก 3)`);

  // ── 8. ร่องรอยการใช้งานย้อนหลัง 60 วัน ─────────────────────────────────
  const actorKeys = ["admin", "somchai", "kanya", "prasit", "malee", "nattapong", "siriporn", "wichai", "orawan", "staff"];
  const auditRows = Array.from({ length: 120 }, (_, i) => {
    const spec = AUDIT_ACTIONS[Math.floor(rand() * AUDIT_ACTIONS.length)];
    const actorKey = actorKeys[Math.floor(rand() * actorKeys.length)];
    const day = Math.floor(rand() * 60);
    const isUpdate = spec.action.endsWith(".update");
    return {
      id: stableId(`audit:demo:${i}`),
      tenantId: demo.tenantId,
      actorId: userIds[actorKey],
      action: spec.action,
      entity: spec.entity,
      entityId: stableId(`entity:${spec.entity}:${i % 20}`).slice(0, 36),
      before: isUpdate ? { isActive: true, name: "ค่าก่อนแก้ไข" } : undefined,
      after: spec.action.endsWith(".delete") ? undefined : { isActive: spec.action !== "user.suspend", name: "ค่าหลังแก้ไข" },
      ip: `192.168.1.${10 + (i % 200)}`,
      createdAt: daysAgo(day, 8 + (i % 10)),
    };
  });
  await prisma.auditLog.createMany({ data: auditRows, skipDuplicates: true });
  await prisma.auditLog.createMany({
    data: [0, 1].map((i) => ({
      id: stableId(`audit:acme:${i}`),
      tenantId: acme.tenantId,
      action: "user.login",
      entity: "user",
      entityId: "acme",
      ip: "10.9.9.9",
    })),
    skipDuplicates: true,
  });
  console.log(`✓ ร่องรอยการใช้งาน ${auditRows.length} รายการ ย้อนหลัง 60 วัน`);

  // ── สรุป ────────────────────────────────────────────────────────────────
  const counts = {
    tenants: await prisma.tenant.count(),
    users: await prisma.user.count(),
    userTenants: await prisma.userTenant.count(),
    roles: await prisma.role.count(),
    userRoles: await prisma.userRole.count(),
    permissions: await prisma.permission.count(),
    rolePermissions: await prisma.rolePermission.count(),
    authTokens: await prisma.authToken.count(),
    loginThrottles: await prisma.loginThrottle.count(),
    sampleItems: await prisma.sampleItem.count(),
    auditLogs: await prisma.auditLog.count(),
  };
  console.log("\n📊 จำนวนแถวในฐานข้อมูล");
  for (const [k, v] of Object.entries(counts)) console.log(`   ${k.padEnd(18)} ${v}`);
  printSeedPassword(DEEP_PASSWORD, seedPassword.generated);
  console.log("   ผู้ดูแลสูงสุด: admin@app.local\n");
}

main()
  .catch((e) => {
    console.error("[seed-deep] ล้มเหลว:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
