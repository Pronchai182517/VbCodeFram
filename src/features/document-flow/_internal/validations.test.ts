import { describe, it, expect } from "vitest";
import {
  createDocumentRequestSchema,
  approveStepSchema,
  rejectStepSchema,
  listDocumentQuerySchema,
} from "./validations";

describe("document-flow validations", () => {
  const dummyApproverId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const dummyApproverId2 = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  it("should validate a valid document request input", () => {
    const raw = {
      docType: "LEAVE",
      title: "ขออนุมัติลาพักผ่อนประจำปี",
      description: "ไปปฏิบัติภารกิจส่วนตัว",
      fileAttachmentUrl: "https://example.com/files/leave-doc.pdf",
      routes: [
        {
          title: "หัวหน้าภาควิชา",
          approverId: dummyApproverId,
        },
        {
          title: "คณบดี",
          approverId: dummyApproverId2,
        },
      ],
    };

    const parsed = createDocumentRequestSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.docType).toBe("LEAVE");
      expect(parsed.data.routes).toHaveLength(2);
      expect(parsed.data.routes[0].title).toBe("หัวหน้าภาควิชา");
    }
  });

  it("should reject document request without approval routes", () => {
    const raw = {
      docType: "EXPENSE_REIMBURSE",
      title: "ขอเบิกค่าใช้จ่ายสัมมนา",
      routes: [],
    };

    const parsed = createDocumentRequestSchema.safeParse(raw);
    expect(parsed.success).toBe(false);
  });

  it("should validate approveStepSchema", () => {
    const parsed = approveStepSchema.safeParse({
      documentRequestId: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
      comment: "เห็นชอบตามเสนอ",
    });
    expect(parsed.success).toBe(true);
  });

  it("should require a reason when rejecting a step", () => {
    const invalid = rejectStepSchema.safeParse({
      documentRequestId: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
      comment: "   ",
    });
    expect(invalid.success).toBe(false);

    const valid = rejectStepSchema.safeParse({
      documentRequestId: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
      comment: "เอกสารแนบไม่ครบถ้วน กรุณาแนบใบเสร็จรับเงิน",
    });
    expect(valid.success).toBe(true);
  });

  it("should validate listDocumentQuerySchema defaults", () => {
    const parsed = listDocumentQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.tab).toBe("my");
      expect(parsed.data.page).toBe(1);
      expect(parsed.data.limit).toBe(20);
    }
  });
});
