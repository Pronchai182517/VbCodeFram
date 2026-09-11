"use client";
import { useState } from "react";
import { BrandMarkIcon } from "./icons";

/**
 * สัญลักษณ์แบรนด์บนหน้า auth — ใช้โลโก้ที่องค์กรอัปโหลดไว้ถ้ามี
 * โหลดไม่ได้ (ยังไม่ได้ตั้ง = 404) ก็ถอยกลับไปใช้ไอคอนตั้งต้นเงียบ ๆ
 */
export function BrandMark() {
  const [failed, setFailed] = useState(false);
  if (failed) return <BrandMarkIcon />;
  return (
    // โลโก้มาจาก route handler ของระบบเอง จึงไม่ผ่าน next/image
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/api/branding/logo" alt="" aria-hidden="true" onError={() => setFailed(true)} />
  );
}
