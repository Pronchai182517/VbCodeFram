import { describe, it, expect } from "vitest";
import {
  createProgramSchema,
  createCourseSchema,
  listProgramsQuerySchema,
} from "./validations";

describe("curriculum validations", () => {
  it("should validate and transform valid program data", () => {
    const raw = {
      code: " cpe-beng-2565 ",
      degreeLevel: "BACHELOR",
      nameTh: "หลักสูตรวิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมคอมพิวเตอร์",
      nameEn: "Bachelor of Engineering Program in Computer Engineering",
      shortNameTh: "วศ.บ. (วิศวกรรมคอมพิวเตอร์)",
      shortNameEn: "B.Eng. (Computer Engineering)",
      totalCredits: "140",
      yearIssued: "2565",
      tuitionFeeTerm: "28000",
      careerProspects: ["Software Engineer", "DevOps Engineer"],
    };

    const parsed = createProgramSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe("CPE-BENG-2565");
      expect(parsed.data.totalCredits).toBe(140);
      expect(parsed.data.yearIssued).toBe(2565);
      expect(parsed.data.careerProspects).toHaveLength(2);
    }
  });

  it("should reject invalid degreeLevel and negative credits", () => {
    const raw = {
      code: "TEST",
      degreeLevel: "HIGH_SCHOOL",
      nameTh: "ทดสอบ",
      nameEn: "Test",
      shortNameTh: "ท.บ.",
      shortNameEn: "T.B.",
      totalCredits: -5,
      yearIssued: 2565,
    };

    const parsed = createProgramSchema.safeParse(raw);
    expect(parsed.success).toBe(false);
  });

  it("should validate and transform course code to uppercase", () => {
    const raw = {
      programId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      code: " cpe101 ",
      nameTh: "การเขียนโปรแกรมคอมพิวเตอร์พื้นฐาน",
      nameEn: "Computer Programming Fundamentals",
      credits: "3(3-0-6)",
      categoryGroup: "หมวดวิชาเฉพาะด้าน",
    };

    const parsed = createCourseSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe("CPE101");
      expect(parsed.data.credits).toBe("3(3-0-6)");
    }
  });

  it("should parse listProgramsQuery with degreeLevel", () => {
    const parsed = listProgramsQuerySchema.safeParse({ degreeLevel: "MASTER" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.degreeLevel).toBe("MASTER");
    }
  });
});
