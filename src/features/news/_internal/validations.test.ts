import { describe, it, expect } from "vitest";
import { generateSlug, createArticleSchema } from "./validations";

describe("news validations", () => {
  it("generateSlug creates lowercase hyphenated string from english title", () => {
    const slug = generateSlug("Faculty of Science Opening 2026!");
    expect(slug).toBe("faculty-of-science-opening-2026");
  });

  it("generateSlug handles empty or non-ascii string gracefully", () => {
    const slug = generateSlug("เปิดรับสมัครนักศึกษาใหม่");
    expect(slug.startsWith("article-")).toBe(true);
  });

  it("createArticleSchema validates valid input", () => {
    const input = {
      titleTh: "ข่าวประชาสัมพันธ์โครงการใหม่",
      titleEn: "New Project Announcement",
      contentTh: "รายละเอียดโครงการภาษาไทยครบถ้วน",
      contentEn: "Detailed English description of the project",
      category: "ANNOUNCEMENT" as const,
      status: "DRAFT" as const,
      isPinned: false,
    };
    const parsed = createArticleSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("createArticleSchema fails when title is too short", () => {
    const input = {
      titleTh: "ก",
      titleEn: "A",
      contentTh: "สั้น",
      contentEn: "Short",
    };
    const parsed = createArticleSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });
});
