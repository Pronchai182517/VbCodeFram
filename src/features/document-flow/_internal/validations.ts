import { z } from "zod";

export const DOCUMENT_TYPES = [
  "LEAVE",
  "EXPENSE_REIMBURSE",
  "OFFICIAL_LETTER",
  "PROJECT_PROPOSAL",
] as const;
export type DocumentTypeEnum = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_STATUSES = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;
export type DocumentStatusEnum = (typeof DOCUMENT_STATUSES)[number];

export const STEP_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type StepStatusEnum = (typeof STEP_STATUSES)[number];

export const approvalStepInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "กรุณาระบุชื่อขั้นตอนหรือบทบาทผู้อนุมัติ")
    .max(100),
  approverId: z.string().uuid("Invalid Approver ID"),
});

export type ApprovalStepInput = z.infer<typeof approvalStepInputSchema>;

export const createDocumentRequestSchema = z.object({
  docType: z.enum(DOCUMENT_TYPES, {
    message: "กรุณาระบุประเภทเอกสารที่ถูกต้อง",
  }),
  title: z
    .string()
    .trim()
    .min(2, "กรุณากรอกหัวข้อเอกสารคำร้อง")
    .max(255),
  description: z.string().trim().nullable().optional(),
  fileAttachmentUrl: z
    .string()
    .trim()
    .url("URL ไฟล์แนบต้องเป็นลิงก์ที่ถูกต้อง")
    .or(z.literal(""))
    .nullable()
    .optional()
    .transform((v: string | null | undefined) => (v ? v : null)),
  routes: z
    .array(approvalStepInputSchema)
    .min(1, "ต้องระบุสายการอนุมัติอย่างน้อย 1 ขั้นตอน"),
});

export type CreateDocumentRequestInput = z.infer<
  typeof createDocumentRequestSchema
>;

export const approveStepSchema = z.object({
  documentRequestId: z.string().uuid("Invalid Document Request ID"),
  comment: z.string().trim().nullable().optional(),
});

export type ApproveStepInput = z.infer<typeof approveStepSchema>;

export const rejectStepSchema = z.object({
  documentRequestId: z.string().uuid("Invalid Document Request ID"),
  comment: z
    .string()
    .trim()
    .min(1, "กรุณาระบุเหตุผลหรือข้อเสนอแนะในการไม่อนุมัติ"),
});

export type RejectStepInput = z.infer<typeof rejectStepSchema>;

export const listDocumentQuerySchema = z.object({
  tab: z.enum(["my", "pending", "all"]).default("my"),
  docType: z.enum(DOCUMENT_TYPES).optional(),
  status: z.enum(DOCUMENT_STATUSES).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListDocumentQuery = z.infer<typeof listDocumentQuerySchema>;
