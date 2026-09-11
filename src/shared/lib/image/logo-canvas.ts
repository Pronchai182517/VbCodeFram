import { encodingPlan, dataUrlByteLength } from "./logo-encode";

export type LogoShape = "square" | "rounded" | "circle";

/**
 * ตำแหน่ง/ขนาด/มุมของภาพในกรอบ เก็บแบบไม่ผูกกับหน่วยพิกเซล เพื่อให้ภาพตัวอย่าง (เล็ก) กับ
 * ไฟล์ผลลัพธ์ (ใหญ่) วางเหมือนกันเป๊ะ:
 *   scale = 1 คือด้านสั้นของภาพพอดีกรอบ · offset เป็นสัดส่วนของกรอบ (0.5 = ครึ่งกรอบ)
 */
export interface LogoTransform {
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

export const DEFAULT_TRANSFORM: LogoTransform = { scale: 1, rotation: 0, offsetX: 0, offsetY: 0 };

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load"));
    img.src = src;
  });
}

export function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("load"));
    reader.readAsDataURL(blob);
  });
}

function shapePath(ctx: CanvasRenderingContext2D, shape: LogoShape, size: number): void {
  ctx.beginPath();
  if (shape === "circle") ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  else if (shape === "rounded") ctx.roundRect(0, 0, size, size, size * 0.22);
  else ctx.rect(0, 0, size, size);
  ctx.closePath();
}

/** วาดภาพลงกรอบสี่เหลี่ยมจัตุรัสขนาด `size` ตาม transform ที่กำหนด */
export function drawLogo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  t: LogoTransform,
  opts: { size: number; shape: LogoShape; background: string | null },
): void {
  const { size, shape, background } = opts;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  shapePath(ctx, shape, size);
  ctx.clip();
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
  }
  // ด้านสั้นของภาพพอดีกรอบเมื่อ scale = 1 — ซูมเข้าจะเต็มกรอบเสมอไม่ว่าภาพจะเป็นแนวตั้งหรือแนวนอน
  const base = size / Math.min(img.naturalWidth, img.naturalHeight);
  const w = img.naturalWidth * base * t.scale;
  const h = img.naturalHeight * base * t.scale;
  ctx.translate(size / 2 + t.offsetX * size, size / 2 + t.offsetY * size);
  ctx.rotate((t.rotation * Math.PI) / 180);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

export interface ExportResult { dataUrl: string; bytes: number; width: number }

/**
 * เรนเดอร์เป็นไฟล์จริงโดยไล่ลดคุณภาพ/ขนาดตาม `encodingPlan` จนไม่เกิน `maxBytes`
 * คืน null เมื่อทุกขั้นยังเกินเพดาน (ให้ผู้เรียกบอกผู้ใช้ให้เลือกขนาดผลลัพธ์เล็กลง)
 */
export async function exportLogo(opts: {
  img: HTMLImageElement;
  transform: LogoTransform;
  size: number;
  shape: LogoShape;
  transparent: boolean;
  maxBytes: number;
}): Promise<ExportResult | null> {
  const canvas = document.createElement("canvas");
  for (const attempt of encodingPlan(opts.transparent)) {
    const size = Math.max(48, Math.round(opts.size * attempt.scale));
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    drawLogo(ctx, opts.img, opts.transform, { size, shape: opts.shape, background: opts.transparent ? null : "#ffffff" });
    const dataUrl = canvas.toDataURL(attempt.type, attempt.quality);
    const bytes = dataUrlByteLength(dataUrl);
    if (bytes <= opts.maxBytes) return { dataUrl, bytes, width: size };
  }
  return null;
}
