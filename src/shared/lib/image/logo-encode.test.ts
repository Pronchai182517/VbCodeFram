import { describe, it, expect } from "vitest";
import { encodingPlan, dataUrlByteLength } from "./logo-encode";

describe("encodingPlan", () => {
  it("ภาพโปร่งใสใช้ PNG ทุกขั้น (ไม่แปลงเป็น JPEG จนพื้นหลังกลายเป็นดำ)", () => {
    const plan = encodingPlan(true);
    expect(plan.every((a) => a.type === "image/png")).toBe(true);
    expect(plan[0].scale).toBe(1);
  });

  it("ภาพทึบเริ่มที่ JPEG คุณภาพสูงเต็มขนาด", () => {
    const [first] = encodingPlan(false);
    expect(first).toEqual({ type: "image/jpeg", scale: 1, quality: 0.92 });
  });

  it("ลดคุณภาพจนสุดก่อนจึงลดขนาด", () => {
    const plan = encodingPlan(false);
    const firstShrink = plan.findIndex((a) => a.scale < 1);
    expect(plan.slice(0, firstShrink).every((a) => a.scale === 1)).toBe(true);
    expect(plan[firstShrink - 1].quality).toBeLessThan(plan[0].quality!);
  });

  it("ทุกขั้นตอนไล่จากหนักไปเบาเสมอ", () => {
    for (const plan of [encodingPlan(true), encodingPlan(false)]) {
      const cost = plan.map((a) => a.scale * a.scale * (a.quality ?? 1));
      expect(cost.every((c, i) => i === 0 || c <= cost[i - 1])).toBe(true);
    }
  });
});

describe("dataUrlByteLength", () => {
  it("นับไบต์จริงจาก data URL ไม่ใช่ความยาวสตริง", () => {
    const bytes = Uint8Array.from([1, 2, 3, 4, 5]);
    const url = `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
    expect(dataUrlByteLength(url)).toBe(5);
  });

  it("จัดการ padding ทั้งแบบ = และ == ได้ถูกต้อง", () => {
    for (const n of [1, 2, 3, 4, 300, 1024]) {
      const url = `data:image/jpeg;base64,${Buffer.from(new Uint8Array(n)).toString("base64")}`;
      expect(dataUrlByteLength(url)).toBe(n);
    }
  });

  it("คืน 0 เมื่อไม่ใช่ data URL", () => {
    expect(dataUrlByteLength("ไม่ใช่ data url")).toBe(0);
  });
});
