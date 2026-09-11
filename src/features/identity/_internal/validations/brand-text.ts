import { z } from "zod";

/** ความยาวสูงสุดของข้อความแบรนด์ — ชื่อยาวเกินนี้จะถูกตัดด้วย ellipsis บนแถบบนอยู่แล้ว */
export const BRAND_NAME_MAX = 60;
export const BRAND_TAGLINE_MAX = 120;

const name = z.string().trim().min(1).max(BRAND_NAME_MAX);
const tagline = z.string().trim().max(BRAND_TAGLINE_MAX).default("");

export const updateBrandTextSchema = z.object({
  nameTh: name,
  nameEn: name,
  taglineTh: tagline,
  taglineEn: tagline,
});
export type UpdateBrandTextInput = z.infer<typeof updateBrandTextSchema>;
