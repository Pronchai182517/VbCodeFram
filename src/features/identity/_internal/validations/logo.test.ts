import { describe, it, expect } from "vitest";
import { parseLogoDataUrl, updateLogoSchema, LOGO_MAX_BYTES } from "./logo";

const PNG_HEAD = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00];
const JPEG_HEAD = [0xff, 0xd8, 0xff, 0xe0, 0x00];

function dataUrl(mime: string, bytes: number[]): string {
  return `data:${mime};base64,${Buffer.from(Uint8Array.from(bytes)).toString("base64")}`;
}

describe("parseLogoDataUrl", () => {
  it("รับ PNG และ JPEG ที่ถูกต้อง", () => {
    expect(parseLogoDataUrl(dataUrl("image/png", PNG_HEAD)).mime).toBe("image/png");
    expect(parseLogoDataUrl(dataUrl("image/jpeg", JPEG_HEAD)).mime).toBe("image/jpeg");
  });

  it("ปฏิเสธชนิดไฟล์นอกรายการ", () => {
    expect(() => parseLogoDataUrl(dataUrl("image/svg+xml", PNG_HEAD))).toThrow("logo_format");
    expect(() => parseLogoDataUrl(dataUrl("image/gif", PNG_HEAD))).toThrow("logo_format");
  });

  it("ปฏิเสธไฟล์ที่อ้าง MIME ไม่ตรงกับไบต์จริง (เปลี่ยนแค่ MIME ในสตริงไม่ผ่าน)", () => {
    expect(() => parseLogoDataUrl(dataUrl("image/png", JPEG_HEAD))).toThrow("logo_format");
    expect(() => parseLogoDataUrl(dataUrl("image/jpeg", PNG_HEAD))).toThrow("logo_format");
  });

  it("ปฏิเสธไฟล์ว่างและไฟล์เกินเพดาน 200KB", () => {
    expect(() => parseLogoDataUrl("data:image/png;base64,")).toThrow("logo_format");
    const tooBig = [...PNG_HEAD, ...new Array(LOGO_MAX_BYTES).fill(0)];
    expect(() => parseLogoDataUrl(dataUrl("image/png", tooBig))).toThrow("logo_too_large");
  });

  it("ปฏิเสธสตริงที่ไม่ใช่ data URL", () => {
    expect(() => parseLogoDataUrl("https://example.com/logo.png")).toThrow("logo_format");
    expect(() => parseLogoDataUrl("data:image/png;base64,ไม่ใช่base64")).toThrow("logo_format");
  });

  it("นับขนาดจากไบต์จริง ไม่ใช่ความยาวสตริง base64", () => {
    // base64 ยาวกว่าไบต์จริง ~33% — ไฟล์ 199KB จึงได้สตริงยาวเกิน 200K แต่ต้องผ่าน
    const nearLimit = [...PNG_HEAD, ...new Array(LOGO_MAX_BYTES - 2000).fill(1)];
    const url = dataUrl("image/png", nearLimit);
    expect(url.length).toBeGreaterThan(LOGO_MAX_BYTES);
    expect(parseLogoDataUrl(url).bytes.length).toBeLessThanOrEqual(LOGO_MAX_BYTES);
  });
});

describe("updateLogoSchema", () => {
  it("ปฏิเสธสตริงสั้นเกินไปและยาวเกินเพดาน", () => {
    expect(updateLogoSchema.safeParse({ dataUrl: "data:image/png" }).success).toBe(false);
    expect(updateLogoSchema.safeParse({ dataUrl: "x".repeat(LOGO_MAX_BYTES * 2) }).success).toBe(false);
    expect(updateLogoSchema.safeParse({ dataUrl: dataUrl("image/png", PNG_HEAD) }).success).toBe(true);
  });
});
