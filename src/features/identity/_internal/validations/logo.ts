import { z } from "zod";

/** เพดานขนาดไฟล์โลโก้หลังบีบอัด — เบราว์เซอร์ต้องย่อ/บีบให้ได้ก่อนส่งมา */
export const LOGO_MAX_BYTES = 200 * 1024;

/** ชนิดไฟล์ที่รับ — PNG (โปร่งใสได้) และ JPEG เท่านั้น */
export const LOGO_MIME_TYPES = ["image/png", "image/jpeg"] as const;
export type LogoMime = (typeof LOGO_MIME_TYPES)[number];

/** ค่าของ input[accept] และตัวกรองไฟล์ฝั่งเบราว์เซอร์ */
export const LOGO_ACCEPT = ".png,.jpg,.jpeg,image/png,image/jpeg";

export interface ParsedLogo { mime: LogoMime; bytes: Uint8Array }

const DATA_URL_RE = /^data:(image\/png|image\/jpeg);base64,([A-Za-z0-9+/]+={0,2})$/;

/**
 * แปลง data URL เป็นไบต์พร้อมตรวจความถูกต้อง — ใช้ได้ทั้งฝั่ง client (ตรวจก่อนส่ง) และ server (ด่านจริง)
 *
 * ตรวจ 3 ชั้นเพราะเชื่อค่าที่ส่งมาจากเบราว์เซอร์ไม่ได้:
 *   1) รูปแบบ data URL และชนิดไฟล์ต้องอยู่ในรายการที่อนุญาต
 *   2) ขนาดหลังถอด base64 ต้องไม่เกินเพดาน (ไม่ใช่ขนาดของสตริง base64 ซึ่งใหญ่กว่าจริง ~33%)
 *   3) ไบต์ต้นไฟล์ (magic number) ต้องตรงกับชนิดที่อ้าง — กันการยัดไฟล์อื่นโดยแค่แก้ MIME ในสตริง
 */
export function parseLogoDataUrl(dataUrl: string): ParsedLogo {
  const m = DATA_URL_RE.exec(dataUrl.trim());
  if (!m) throw new Error("logo_format");

  const mime = m[1] as LogoMime;
  const bytes = Uint8Array.from(Buffer.from(m[2], "base64"));
  if (bytes.length === 0) throw new Error("logo_empty");
  if (bytes.length > LOGO_MAX_BYTES) throw new Error("logo_too_large");
  if (!matchesMagicNumber(mime, bytes)) throw new Error("logo_format");

  return { mime, bytes };
}

/** PNG ขึ้นต้นด้วย 89 50 4E 47 · JPEG ขึ้นต้นด้วย FF D8 FF */
function matchesMagicNumber(mime: LogoMime, bytes: Uint8Array): boolean {
  if (mime === "image/png") {
    return bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export const updateLogoSchema = z.object({
  // ตรวจแค่รูปแบบคร่าว ๆ ที่นี่ ส่วนการตรวจเนื้อในทำที่ parseLogoDataUrl (ให้ข้อความผิดพลาดละเอียดกว่า)
  dataUrl: z.string().min(32).max(Math.ceil(LOGO_MAX_BYTES * 1.4)),
});
export type UpdateLogoInput = z.infer<typeof updateLogoSchema>;
