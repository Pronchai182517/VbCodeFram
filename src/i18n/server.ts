import "server-only";
import { getLocale } from "@/shared/lib/i18n/server";
import { makeT, type TFunction } from "@/shared/lib/i18n/translate";
import { UI_MESSAGES } from "./index";
import { resolveBrandText } from "@/features/identity/server";

export { getLocale };
export async function getT(): Promise<TFunction> {
  return makeT(UI_MESSAGES, await getLocale());
}

/**
 * ชื่อ/คำโปรยขององค์กรสำหรับ server component และ generateMetadata
 * ถอยไปใช้ข้อความตั้งต้นของระบบเมื่อองค์กรยังไม่ได้ตั้งค่า (คู่กับ useBrandLabels ฝั่ง client)
 */
export async function getBrandLabels(): Promise<{ name: string; tagline: string }> {
  const [t, locale, brand] = await Promise.all([getT(), getLocale(), resolveBrandText()]);
  const pick = (th: string | undefined, en: string | undefined) =>
    ((locale === "en" && en?.trim() ? en : th) ?? "").trim();
  return {
    name: pick(brand?.nameTh, brand?.nameEn) || t("app.name"),
    tagline: pick(brand?.taglineTh, brand?.taglineEn) || t("app.tagline"),
  };
}
