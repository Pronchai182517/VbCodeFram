import type { PermissionDef } from "@/shared/lib/permission-def";

export const DOCUMENTS_P = {
  documentsRead: "documents:read",
  documentsCreate: "documents:create",
  documentsApprove: "documents:approve",
  documentsManage: "documents:manage",
} as const;

export const DOCUMENTS_PERMISSIONS: readonly PermissionDef[] = [
  {
    code: DOCUMENTS_P.documentsRead,
    module: "document_flow",
    action: "read",
    description: "ดูรายการเอกสารและติดตามสถานะคำร้อง",
  },
  {
    code: DOCUMENTS_P.documentsCreate,
    module: "document_flow",
    action: "create",
    description: "สร้างและยื่นคำร้องขออนุมัติเอกสาร",
  },
  {
    code: DOCUMENTS_P.documentsApprove,
    module: "document_flow",
    action: "approve",
    description: "พิจารณาอนุมัติหรือปฏิเสธเอกสารตามสายงาน",
  },
  {
    code: DOCUMENTS_P.documentsManage,
    module: "document_flow",
    action: "manage",
    description: "จัดการและกำกับดูแลระบบเอกสารทั้งหมด",
  },
];
