"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { BrandText } from "@/features/identity";
import { useLocale, useT } from "@/shared/lib/i18n/client";

const Ctx = createContext<BrandText | null>(null);

/**
 * ข้อความแบรนด์ขององค์กรที่ root layout (server) อ่านมาแล้วส่งลงมาครั้งเดียวต่อคำขอ
 * ทำเป็น context เพราะ layout ของหลังบ้านเป็น client component จึงอ่านฐานข้อมูลเองไม่ได้
 */
export function BrandingProvider({ brand, children }: { brand: BrandText | null; children: ReactNode }) {
  return <Ctx.Provider value={brand}>{children}</Ctx.Provider>;
}

export interface ResolvedBrand { name: string | null; tagline: string | null }

/** คืนข้อความตามภาษาปัจจุบัน — null เมื่อองค์กรยังไม่ได้ตั้งค่า ให้ผู้เรียกถอยไปใช้ข้อความตั้งต้น */
export function useBranding(): ResolvedBrand {
  const brand = useContext(Ctx);
  const locale = useLocale();
  return useMemo(() => {
    if (!brand) return { name: null, tagline: null };
    const pick = (th: string, en: string) => (locale === "en" && en.trim() !== "" ? en : th).trim() || null;
    return { name: pick(brand.nameTh, brand.nameEn), tagline: pick(brand.taglineTh, brand.taglineEn) };
  }, [brand, locale]);
}

/**
 * ข้อความแบรนด์ที่พร้อมแสดงผล — ถอยไปใช้ข้อความตั้งต้นของระบบให้เลย
 * ใช้กับทุกจุดที่เคยเรียก t("app.name") / t("app.tagline") ตรง ๆ
 */
export function useBrandLabels(): { name: string; tagline: string } {
  const brand = useBranding();
  const t = useT();
  return { name: brand.name ?? t("app.name"), tagline: brand.tagline ?? t("app.tagline") };
}
