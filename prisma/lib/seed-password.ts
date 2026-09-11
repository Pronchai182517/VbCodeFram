import crypto from "node:crypto";

/**
 * รหัสผ่านของบัญชีตัวอย่างที่ seed สร้าง — **ห้าม hardcode ลงโค้ด**
 *
 * รหัสผ่านตั้งต้นที่ฝังไว้ในซอร์สคือช่องโหว่ที่ถูกใช้บ่อยที่สุดช่องหนึ่ง เพราะทุกคนที่อ่านรีโปสาธารณะ
 * ได้ก็รู้รหัสของทุก deployment ที่ยังไม่ได้เปลี่ยน ที่นี่จึงอ่านจาก `SEED_PASSWORD` (ไฟล์ .env ซึ่งไม่ถูก
 * commit) และถ้าไม่ได้ตั้งไว้ก็สุ่มให้ใหม่ทุกครั้ง แล้วพิมพ์ออกหน้าจอครั้งเดียวตอน seed
 *
 * e2e test ต้องรู้รหัสล่วงหน้าจึงต้องตั้ง `SEED_PASSWORD` ไว้ใน .env ก่อนรัน
 */
export function resolveSeedPassword(): { password: string; generated: boolean } {
  const fromEnv = process.env.SEED_PASSWORD?.trim();
  if (fromEnv) {
    if (fromEnv.length < 8) throw new Error("SEED_PASSWORD ต้องยาวอย่างน้อย 8 ตัวอักษร");
    return { password: fromEnv, generated: false };
  }
  // สุ่มให้อ่านออกพอสมควรแต่เดาไม่ได้ · ผสมตัวพิมพ์ใหญ่/เล็ก/ตัวเลข/อักขระพิเศษ ให้ผ่านกติกาของระบบ
  const body = crypto.randomBytes(9).toString("base64url").replace(/[-_]/g, "x");
  return { password: `Vb${body}!7`, generated: true };
}

/** พิมพ์รหัสผ่านที่ใช้ seed ครั้งนี้ — เรียกครั้งเดียวตอนจบ seed */
export function printSeedPassword(password: string, generated: boolean): void {
  console.log(`\n🔑 รหัสผ่านของบัญชีตัวอย่างรอบนี้: ${password}`);
  if (generated) {
    console.log("   (สุ่มขึ้นใหม่เพราะไม่ได้ตั้ง SEED_PASSWORD — จดไว้ หรือกำหนดเองใน .env แล้ว seed ใหม่)");
  } else {
    console.log("   (มาจากตัวแปร SEED_PASSWORD ในไฟล์ .env)");
  }
}
