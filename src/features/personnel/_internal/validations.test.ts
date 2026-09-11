import { describe, it, expect } from "vitest";
import {
  createDepartmentSchema,
  createStaffProfileSchema,
} from "./validations";

describe("personnel validations", () => {
  describe("createDepartmentSchema", () => {
    it("ยอมรับข้อมูลภาควิชาที่ถูกต้อง", () => {
      const parsed = createDepartmentSchema.safeParse({
        nameTh: "ภาควิชาวิศวกรรมคอมพิวเตอร์",
        nameEn: "Department of Computer Engineering",
        code: "CPE",
        orderIndex: 1,
      });
      expect(parsed.success).toBe(true);
    });

    it("ปฏิเสธเมื่อรหัสภาควิชามีอักขระพิเศษที่ไม่ถูกต้อง", () => {
      const parsed = createDepartmentSchema.safeParse({
        nameTh: "ภาควิชา",
        nameEn: "Department",
        code: "CPE#1!",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("createStaffProfileSchema", () => {
    const validStaff = {
      departmentId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      prefixTh: "ผศ.ดร.",
      prefixEn: "Asst. Prof. Dr.",
      firstNameTh: "สมชาย",
      lastNameTh: "สายวิทย์",
      firstNameEn: "Somchai",
      lastNameEn: "Saiwit",
      academicPosition: "ผู้ช่วยศาสตราจารย์",
      adminPositionTh: "รองคณบดี",
      adminPositionEn: "Associate Dean",
      email: "somchai@faculty.ac.th",
      phone: "02-123-4567",
      expertise: ["Artificial Intelligence", "Machine Learning"],
      isActive: true,
    };

    it("ยอมรับข้อมูลบุคลากรที่ถูกต้อง", () => {
      const parsed = createStaffProfileSchema.safeParse(validStaff);
      expect(parsed.success).toBe(true);
    });

    it("ปฏิเสธเมื่อรูปแบบอีเมลไม่ถูกต้อง", () => {
      const parsed = createStaffProfileSchema.safeParse({
        ...validStaff,
        email: "not-an-email",
      });
      expect(parsed.success).toBe(false);
    });
  });
});
