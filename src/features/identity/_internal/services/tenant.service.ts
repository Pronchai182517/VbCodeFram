import { cache } from "react";
import { prisma, type Db } from "@/shared/lib/infra/prisma";
import {
  DEFAULT_PALETTE, isPalette, type PaletteId,
  DEFAULT_THEME, isTheme, type ThemeId,
  DEFAULT_FONT_FAMILY, isFontFamily, type FontFamilyId,
  DEFAULT_FONT_SIZE, isFontSize, type FontSizeId,
} from "@/shared/lib/palette";
import { errors } from "@/shared/lib/errors";
import { writeAudit } from "../audit";
import type { UpdateSettingsInput } from "../validations/settings";
import type { UpdateBrandTextInput } from "../validations/brand-text";

export interface TenantSettings {
  code: string;
  nameTh: string;
  nameEn: string;
  logoUrl: string | null;
  palette: PaletteId;
  theme: ThemeId;
  fontFamily: FontFamilyId;
  fontSize: FontSizeId;
}

/** ข้อความแบรนด์ที่แสดงคู่โลโก้บนแถบบน — ชื่อบังคับกรอก คำโปรยไม่บังคับ (ว่าง = ใช้ค่าตั้งต้นของระบบ) */
export interface BrandText { nameTh: string; nameEn: string; taglineTh: string; taglineEn: string }

function readTagline(settings: unknown, key: "taglineTh" | "taglineEn"): string {
  const v = (settings as Record<string, unknown> | null)?.[key];
  return typeof v === "string" ? v : "";
}

async function readTenantSettings(tenantId: string, db: Db): Promise<TenantSettings> {
  const t = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!t) throw errors.not_found();
  const s = (t.settings ?? {}) as Record<string, unknown>;
  return {
    code: t.code,
    nameTh: t.nameTh,
    nameEn: t.nameEn,
    logoUrl: t.logoUrl,
    palette: isPalette(s.palette) ? s.palette : DEFAULT_PALETTE,
    theme: isTheme(s.theme) ? s.theme : DEFAULT_THEME,
    fontFamily: isFontFamily(s.fontFamily) ? s.fontFamily : DEFAULT_FONT_FAMILY,
    fontSize: isFontSize(s.fontSize) ? s.fontSize : DEFAULT_FONT_SIZE,
  };
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettings> {
  return readTenantSettings(tenantId, prisma);
}

/** เก็บคีย์อื่น ๆ ใน settings JSON ไว้ทั้งหมด — merge เฉพาะที่เปลี่ยน ไม่ทับทั้งก้อน */
export async function updateTenantSettings(input: { tenantId: string; actorId: string } & UpdateSettingsInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // อ่านผ่าน tx เดียวกัน ไม่ใช่ client กลาง — ไม่งั้นทรานแซกชันนี้กินคอนเนกชันจากพูลเพิ่มอีกเส้นเพื่ออ่าน
    // ค่าเดิม และค่าที่อ่านได้ก็อยู่นอกสแนปช็อตของทรานแซกชัน (ค่า before ของ audit อาจไม่ตรงกับที่กำลังจะทับ)
    const before = await readTenantSettings(input.tenantId, tx);
    const t = await tx.tenant.findUniqueOrThrow({ where: { id: input.tenantId }, select: { settings: true } });
    await tx.tenant.update({
      where: { id: input.tenantId },
      data: {
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        logoUrl: input.logoUrl || null,
        settings: {
          ...(t.settings as object),
          palette: input.palette,
          theme: input.theme,
          fontFamily: input.fontFamily,
          fontSize: input.fontSize,
        },
      },
    });
    await writeAudit({ tenantId: input.tenantId, actorId: input.actorId, action: "tenant.settings_update", entity: "tenant", entityId: input.tenantId, before, after: input }, tx);
  });
}

export async function getBrandText(tenantId: string): Promise<BrandText> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { nameTh: true, nameEn: true, settings: true } });
  if (!t) throw errors.not_found();
  return { nameTh: t.nameTh, nameEn: t.nameEn, taglineTh: readTagline(t.settings, "taglineTh"), taglineEn: readTagline(t.settings, "taglineEn") };
}

/** แก้ชื่อ/คำโปรยขององค์กร — ชื่ออยู่ในคอลัมน์ ส่วนคำโปรยอยู่ใน settings JSON (ไม่ต้อง migrate เพิ่ม) */
export async function updateBrandText(input: { tenantId: string; actorId: string } & UpdateBrandTextInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const t = await tx.tenant.findUnique({ where: { id: input.tenantId }, select: { nameTh: true, nameEn: true, settings: true } });
    if (!t) throw errors.not_found();
    const before: BrandText = { nameTh: t.nameTh, nameEn: t.nameEn, taglineTh: readTagline(t.settings, "taglineTh"), taglineEn: readTagline(t.settings, "taglineEn") };
    await tx.tenant.update({
      where: { id: input.tenantId },
      data: {
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        // spread ของเดิมไว้ก่อนเสมอ ไม่งั้นการแก้ข้อความจะลบ palette (และคีย์อื่นที่ feature อื่นเก็บไว้) ทิ้ง
        settings: { ...(t.settings as object), taglineTh: input.taglineTh, taglineEn: input.taglineEn },
      },
    });
    await writeAudit({
      tenantId: input.tenantId, actorId: input.actorId, action: "tenant.brand_text_update",
      entity: "tenant", entityId: input.tenantId, before,
      after: { nameTh: input.nameTh, nameEn: input.nameEn, taglineTh: input.taglineTh, taglineEn: input.taglineEn },
    }, tx);
  });
}

export async function getTenantPalette(tenantId: string): Promise<PaletteId> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
  const p = (t?.settings as { palette?: unknown } | null)?.palette;
  return isPalette(p) ? p : DEFAULT_PALETTE;
}

/**
 * tenant ของ session ถ้ามี — import แบบ dynamic เพราะ `../auth` ดึง next-auth ทั้งก้อนเข้ามา และ
 * โมดูลนี้ถูก import จาก root layout ที่รันทุก request · แยก try ของตัวเองไว้ต่างหากโดยเจตนา: เดิมมันอยู่
 * ใน try เดียวกับการอ่านฐานข้อมูล ทำให้ "โหลด auth ไม่ได้" กับ "ฐานข้อมูลล้ม" กลืนหายไปเป็นค่าเดียวกัน
 * และเส้นทางอ่าน tenant ทั้งเส้นทดสอบไม่ได้เลย (ในสภาพแวดล้อมเทสต์ next-auth resolve ไม่ผ่าน)
 */
async function sessionTenantId(): Promise<string | null> {
  try {
    const { auth } = await import("../auth");
    return (await auth())?.tenantId || null;
  } catch {
    return null;
  }
}

/**
 * ข้อความแบรนด์สำหรับ layout ทุกหน้า (รวมหน้าสาธารณะที่ยังไม่มี session) — ไม่ throw
 * คืน null เมื่ออ่านไม่ได้ ให้ผู้เรียกถอยไปใช้ข้อความตั้งต้นจากพจนานุกรม i18n
 */
export const resolveBrandText = cache(async (): Promise<BrandText | null> => {
  try {
    const tenantId = (await sessionTenantId()) || (await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }))?.id;
    return tenantId ? await getBrandText(tenantId) : null;
  } catch {
    return null;
  }
});

/** ใช้โดย root layout ทุก request — tenant จาก session ถ้ามี ไม่งั้น tenant แรก (หน้า login ยังไม่มี session) · ไม่ throw */
export const resolvePalette = cache(async (): Promise<PaletteId> => {
  try {
    const tenantId = (await sessionTenantId()) || (await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }))?.id;
    return tenantId ? await getTenantPalette(tenantId) : DEFAULT_PALETTE;
  } catch {
    return DEFAULT_PALETTE;
  }
});

export interface AppearanceData { palette: PaletteId; theme: ThemeId; fontFamily: FontFamilyId; fontSize: FontSizeId }

/** ดึงค่ารูปลักษณ์ทั้งหมดในครั้งเดียว — ใช้ใน root layout */
export const resolveAppearance = cache(async (): Promise<AppearanceData> => {
  const defaults: AppearanceData = { palette: DEFAULT_PALETTE, theme: DEFAULT_THEME, fontFamily: DEFAULT_FONT_FAMILY, fontSize: DEFAULT_FONT_SIZE };
  try {
    const tenantId = (await sessionTenantId()) || (await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }))?.id;
    if (!tenantId) return defaults;
    const s = (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } }))?.settings as Record<string, unknown> | null;
    if (!s) return defaults;
    return {
      palette: isPalette(s.palette) ? s.palette : DEFAULT_PALETTE,
      theme: isTheme(s.theme) ? s.theme : DEFAULT_THEME,
      fontFamily: isFontFamily(s.fontFamily) ? s.fontFamily : DEFAULT_FONT_FAMILY,
      fontSize: isFontSize(s.fontSize) ? s.fontSize : DEFAULT_FONT_SIZE,
    };
  } catch {
    return defaults;
  }
});
