import { cache } from "react";
import { prisma } from "@/shared/lib/infra/prisma";
import { errors } from "@/shared/lib/errors";
import { writeAudit } from "../audit";
import { parseLogoDataUrl, LOGO_MAX_BYTES } from "../validations/logo";

export interface TenantLogo { bytes: Uint8Array; mime: string; updatedAt: Date }
/** ข้อมูลเท่าที่ layout ต้องใช้เพื่อวาดโลโก้ — ไม่ดึงไบต์มาด้วย (layout รันทุก request) */
export interface BrandingLogo { url: string; hasLogo: boolean }

/** เวลาที่แก้ล่าสุดใช้เป็นทั้ง ETag และ query string กัน cache ค้างหลังเปลี่ยนโลโก้ */
function versionOf(updatedAt: Date | null): string {
  return updatedAt ? String(updatedAt.getTime()) : "0";
}

export async function getTenantLogo(tenantId: string): Promise<TenantLogo | null> {
  const t = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { logoData: true, logoMime: true, logoUpdatedAt: true },
  });
  if (!t?.logoData || !t.logoMime) return null;
  return { bytes: Uint8Array.from(t.logoData), mime: t.logoMime, updatedAt: t.logoUpdatedAt ?? new Date(0) };
}

export async function updateTenantLogo(input: { tenantId: string; actorId: string; dataUrl: string }): Promise<void> {
  let parsed;
  try {
    parsed = parseLogoDataUrl(input.dataUrl);
  } catch (e) {
    // ข้อความจาก parseLogoDataUrl เป็นรหัสสั้น ๆ ที่ i18n ฝั่ง client แปลต่อได้
    throw errors.validation("validation", { logo: [e instanceof Error ? e.message : "logo_format"] });
  }

  const updatedAt = new Date();
  await prisma.$transaction(async (tx) => {
    const before = await tx.tenant.findUnique({ where: { id: input.tenantId }, select: { logoMime: true, logoUpdatedAt: true } });
    if (!before) throw errors.not_found();
    await tx.tenant.update({
      where: { id: input.tenantId },
      data: { logoData: Buffer.from(parsed.bytes), logoMime: parsed.mime, logoUpdatedAt: updatedAt },
    });
    // ไม่เก็บตัวรูปลง audit (ใหญ่และไม่ช่วยอะไร) — เก็บแค่ชนิดและขนาดไว้ไล่ย้อนหลัง
    await writeAudit({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "tenant.logo_update",
      entity: "tenant",
      entityId: input.tenantId,
      before: { mime: before.logoMime, updatedAt: before.logoUpdatedAt?.toISOString() ?? null },
      after: { mime: parsed.mime, bytes: parsed.bytes.length, maxBytes: LOGO_MAX_BYTES, updatedAt: updatedAt.toISOString() },
    }, tx);
  });
}

export async function removeTenantLogo(input: { tenantId: string; actorId: string }): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const before = await tx.tenant.findUnique({ where: { id: input.tenantId }, select: { logoMime: true } });
    if (!before) throw errors.not_found();
    await tx.tenant.update({
      where: { id: input.tenantId },
      data: { logoData: null, logoMime: null, logoUpdatedAt: new Date() },
    });
    await writeAudit({
      tenantId: input.tenantId, actorId: input.actorId, action: "tenant.logo_remove",
      entity: "tenant", entityId: input.tenantId, before: { mime: before.logoMime }, after: null,
    }, tx);
  });
}

/**
 * องค์กรที่ใช้แสดงแบรนด์ — session ถ้ามี ไม่งั้นองค์กรแรก (หน้า portal/login ยังไม่มี session)
 * รูปแบบเดียวกับ resolvePalette ใน tenant.service และไม่ throw เพราะถูกเรียกจาก layout ทุก request
 */
async function sessionTenantId(): Promise<string | null> {
  try {
    const { auth } = await import("../auth");
    return (await auth())?.tenantId || null;
  } catch {
    return null;
  }
}

export const resolveBrandingTenantId = cache(async (): Promise<string | null> => {
  try {
    return (await sessionTenantId()) || (await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }))?.id || null;
  } catch {
    return null;
  }
});

/** ใช้โดย layout — คืน URL พร้อม version ไว้ใส่ใน <img src> · hasLogo=false เมื่อยังไม่เคยอัปโหลด */
export const resolveBrandingLogo = cache(async (): Promise<BrandingLogo> => {
  try {
    const tenantId = await resolveBrandingTenantId();
    if (!tenantId) return { url: "/api/branding/logo", hasLogo: false };
    const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { logoMime: true, logoUpdatedAt: true } });
    return { url: `/api/branding/logo?v=${versionOf(t?.logoUpdatedAt ?? null)}`, hasLogo: !!t?.logoMime };
  } catch {
    return { url: "/api/branding/logo", hasLogo: false };
  }
});

export { versionOf as logoVersion };
