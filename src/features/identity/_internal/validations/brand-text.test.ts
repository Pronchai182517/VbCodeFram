import { describe, it, expect } from "vitest";
import { updateBrandTextSchema, BRAND_NAME_MAX, BRAND_TAGLINE_MAX } from "./brand-text";

const valid = { nameTh: "คณะวิทยาศาสตร์", nameEn: "Faculty of Science", taglineTh: "เรียนรู้ วิจัย บริการ", taglineEn: "Learn, research, serve" };

describe("updateBrandTextSchema", () => {
  it("รับข้อมูลครบถ้วนและตัดช่องว่างหัวท้ายให้", () => {
    const r = updateBrandTextSchema.parse({ ...valid, nameTh: "  คณะวิทยาศาสตร์  " });
    expect(r.nameTh).toBe("คณะวิทยาศาสตร์");
    expect(r.taglineEn).toBe("Learn, research, serve");
  });

  it("คำโปรยเป็นค่าว่างได้ (ไม่บังคับกรอก)", () => {
    expect(updateBrandTextSchema.parse({ ...valid, taglineTh: "", taglineEn: "" }).taglineTh).toBe("");
    const r = updateBrandTextSchema.safeParse({ nameTh: "ก", nameEn: "A" });
    expect(r.success).toBe(true);
    expect(r.data?.taglineTh).toBe("");
  });

  it("ชื่อต้องไม่ว่างทั้งสองภาษา", () => {
    expect(updateBrandTextSchema.safeParse({ ...valid, nameTh: "" }).success).toBe(false);
    expect(updateBrandTextSchema.safeParse({ ...valid, nameEn: "   " }).success).toBe(false);
  });

  it("จำกัดความยาวชื่อและคำโปรย", () => {
    expect(updateBrandTextSchema.safeParse({ ...valid, nameTh: "ก".repeat(BRAND_NAME_MAX + 1) }).success).toBe(false);
    expect(updateBrandTextSchema.safeParse({ ...valid, nameTh: "ก".repeat(BRAND_NAME_MAX) }).success).toBe(true);
    expect(updateBrandTextSchema.safeParse({ ...valid, taglineEn: "x".repeat(BRAND_TAGLINE_MAX + 1) }).success).toBe(false);
  });

  it("รายงาน field ที่ผิดเป็นรายช่อง เพื่อให้ UI ชี้จุดผิดได้", () => {
    const r = updateBrandTextSchema.safeParse({ nameTh: "", nameEn: "", taglineTh: "x".repeat(999), taglineEn: "" });
    expect(r.success).toBe(false);
    const paths = r.error?.issues.map((i) => i.path.join(".")).sort();
    expect(paths).toEqual(["nameEn", "nameTh", "taglineTh"]);
  });
});
