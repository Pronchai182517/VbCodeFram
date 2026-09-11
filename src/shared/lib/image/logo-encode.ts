/**
 * แผนการเข้ารหัสภาพโลโก้ให้ได้ไฟล์ไม่เกินเพดานที่กำหนด
 *
 * แยกเป็นฟังก์ชันบริสุทธิ์ (ไม่แตะ canvas/DOM) เพื่อให้ทดสอบลำดับการลดคุณภาพได้จริง
 * ตัวที่เรียก canvas จริงอยู่ที่ `renderToDataUrl` ในไฟล์เดียวกัน ซึ่งวนตามแผนนี้ทีละขั้น
 */
export interface EncodeAttempt {
  type: "image/png" | "image/jpeg";
  /** สัดส่วนของขนาดผลลัพธ์ที่ผู้ใช้เลือก (1 = เต็มขนาด) */
  scale: number;
  /** ใช้เฉพาะ JPEG */
  quality?: number;
}

/**
 * ภาพโปร่งใสต้องคง PNG ไว้ (แปลงเป็น JPEG แล้วพื้นหลังจะกลายเป็นดำ) จึงลดขนาดอย่างเดียว
 * ภาพทึบลดคุณภาพ JPEG ก่อน แล้วค่อยลดขนาด เพราะคุณภาพ 0.7 ยังดูดีกว่าภาพที่ถูกย่อครึ่ง
 */
export function encodingPlan(transparent: boolean): EncodeAttempt[] {
  if (transparent) {
    return [1, 0.85, 0.7, 0.55, 0.42, 0.32].map((scale) => ({ type: "image/png" as const, scale }));
  }
  const qualities = [0.92, 0.85, 0.78, 0.7, 0.6];
  return [1, 0.75, 0.55, 0.4].flatMap((scale) =>
    qualities.map((quality) => ({ type: "image/jpeg" as const, scale, quality })),
  );
}

/** ขนาดจริงของไบต์ใน data URL (base64 ยาวกว่าไบต์จริงราว 4/3 และมี padding '=' ท้ายสุด) */
export function dataUrlByteLength(dataUrl: string): number {
  const i = dataUrl.indexOf(",");
  if (i < 0) return 0;
  const b64 = dataUrl.slice(i + 1);
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding);
}
