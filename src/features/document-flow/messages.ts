import type { Dictionary } from "@/shared/lib/i18n/translate";

export const MESSAGES: Dictionary = {
  // Navigation & General
  "documents.nav": { th: "บริหารและอนุมัติเอกสาร", en: "Document Approval Flow" },
  "documents.title": { th: "ระบบบริหารและอนุมัติเอกสาร", en: "Document Approval & Workflow System" },
  "documents.subtitle": { th: "ติดตามคำร้อง บันทึกข้อความ อนุมัติเอกสารตามสายบังคับบัญชาแบบลำดับขั้น", en: "Track document requests, electronic memos, and sequential approval workflows" },

  // Tabs
  "documents.tab.myRequests": { th: "คำร้องของฉัน", en: "My Requests" },
  "documents.tab.pendingMyApproval": { th: "รอฉันพิจารณาอนุมัติ", en: "Pending My Approval" },
  "documents.tab.allDocuments": { th: "เอกสารทั้งหมดในระบบ", en: "All Documents" },

  // Document Types
  "documents.type.LEAVE": { th: "ใบลาปฏิบัติงาน / ลาพักผ่อน", en: "Leave of Absence" },
  "documents.type.EXPENSE_REIMBURSE": { th: "ขออนุมัติเบิกจ่ายงบประมาณ", en: "Expense Reimbursement" },
  "documents.type.OFFICIAL_LETTER": { th: "หนังสือราชการ / หนังสือรับรอง", en: "Official Letter / Certificate" },
  "documents.type.PROJECT_PROPOSAL": { th: "ข้อเสนอโครงการ / ขอทุนวิจัย", en: "Project Proposal / Research Grant" },
  "documents.type.all": { th: "ทุกประเภทเอกสาร", en: "All Document Types" },

  // Document Statuses
  "documents.status.DRAFT": { th: "ฉบับร่าง", en: "Draft" },
  "documents.status.PENDING": { th: "กำลังรอพิจารณา", en: "Pending Review" },
  "documents.status.APPROVED": { th: "อนุมัติเรียบร้อย", en: "Approved" },
  "documents.status.REJECTED": { th: "ไม่อนุมัติ / ตีกลับ", en: "Rejected" },
  "documents.status.CANCELLED": { th: "ยกเลิกคำร้อง", en: "Cancelled" },
  "documents.status.all": { th: "ทุกสถานะ", en: "All Statuses" },

  // Step Statuses
  "documents.stepStatus.PENDING": { th: "รอดำเนินการ", en: "Pending" },
  "documents.stepStatus.APPROVED": { th: "ลงนามอนุมัติแล้ว", en: "Approved" },
  "documents.stepStatus.REJECTED": { th: "ไม่อนุมัติ", en: "Rejected" },

  // Fields
  "documents.trackingNo": { th: "เลขที่คำร้อง (Tracking No.)", en: "Tracking Number" },
  "documents.docType": { th: "ประเภทเอกสาร", en: "Document Type" },
  "documents.docTitle": { th: "หัวข้อ / เรื่อง", en: "Subject / Title" },
  "documents.description": { th: "รายละเอียด / เหตุผลความจำเป็น", en: "Description / Justification" },
  "documents.requester": { th: "ผู้ยื่นคำร้อง", en: "Requester" },
  "documents.createdAt": { th: "วันที่ยื่นคำร้อง", en: "Submitted Date" },
  "documents.currentStep": { th: "ขั้นตอนปัจจุบัน", en: "Current Step" },
  "documents.fileAttachmentUrl": { th: "URL ไฟล์เอกสารแนบ (PDF)", en: "Attachment URL (PDF)" },
  "documents.routes": { th: "สายการอนุมัติ (Approval Route)", en: "Approval Route" },
  "documents.approver": { th: "ผู้อนุมัติ", en: "Approver" },
  "documents.stepTitle": { th: "ชื่อขั้นตอน / บทบาท", en: "Step Title / Role" },
  "documents.comment": { th: "ความเห็น / หมายเหตุ", en: "Comment / Remark" },
  "documents.actionAt": { th: "เวลาที่ดำเนินการ", en: "Action Timestamp" },

  // Actions & Buttons
  "documents.create": { th: "ยื่นคำร้องใหม่", en: "New Request" },
  "documents.viewDetails": { th: "ดูรายละเอียดและสายงาน", en: "View Details & Route" },
  "documents.cancelRequest": { th: "ยกเลิกคำร้อง", en: "Cancel Request" },
  "documents.cancelConfirm": { th: "คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำร้องนี้?", en: "Are you sure you want to cancel this document request?" },
  "documents.approve": { th: "อนุมัติคำร้อง", en: "Approve" },
  "documents.reject": { th: "ไม่อนุมัติ / ตีกลับ", en: "Reject" },
  "documents.approveTitle": { th: "พิจารณาอนุมัติเอกสารคำร้อง", en: "Approve Document Request" },
  "documents.rejectTitle": { th: "พิจารณาไม่อนุมัติ / ส่งกลับแก้ไข", en: "Reject Document Request" },
  "documents.enterComment": { th: "ระบุความเห็นหรือข้อเสนอแนะเพิ่มเติม (ถ้ามี)", en: "Enter comment or feedback (optional)" },
  "documents.rejectReason": { th: "กรุณาระบุเหตุผลที่ไม่อนุมัติ", en: "Please specify the reason for rejection" },
  "documents.addStep": { th: "เพิ่มผู้อนุมัติในสายงาน", en: "Add Approver Step" },
  "documents.removeStep": { th: "ลบขั้นตอนนี้", en: "Remove Step" },
  "documents.save": { th: "ยื่นเอกสารเข้าสู่ระบบ", en: "Submit Request" },
  "documents.empty": { th: "ไม่พบรายการเอกสาร", en: "No document requests found" },

  // Public Tracking Portal
  "documents.portal.title": { th: "ระบบติดตามสถานะเอกสารคำร้อง", en: "Public Document Tracking Portal" },
  "documents.portal.subtitle": { th: "ตรวจสอบความคืบหน้าของคำร้องและขั้นตอนการอนุมัติด้วยเลขที่ Tracking No.", en: "Check the status and sequential approval progress using your Tracking Number" },
  "documents.portal.searchPlaceholder": { th: "กรอกเลขที่ Tracking No. เช่น DOC-2026-0001", en: "Enter Tracking No. e.g. DOC-2026-0001" },
  "documents.portal.trackButton": { th: "ตรวจสอบสถานะ", en: "Track Status" },
  "documents.portal.notFound": { th: "ไม่พบเอกสารที่มีเลขที่ระบุ กรุณาตรวจสอบความถูกต้องของ Tracking Number", en: "Document not found. Please verify your Tracking Number." },
  "documents.portal.progressTitle": { th: "ความคืบหน้าของสายการอนุมัติ", en: "Approval Progress Overview" },

  // Permissions & Roles
  "roles.module.document_flow": { th: "ระบบบริหารและอนุมัติเอกสาร", en: "Document Approval Flow" },
  "perm.documents:read": { th: "ดูรายการเอกสารและติดตามสถานะคำร้อง", en: "View document requests and tracking" },
  "perm.documents:create": { th: "สร้างและยื่นคำร้องขออนุมัติเอกสาร", en: "Create and submit document requests" },
  "perm.documents:approve": { th: "พิจารณาอนุมัติหรือปฏิเสธเอกสารตามสายงาน", en: "Review and approve/reject document requests" },
  "perm.documents:manage": { th: "จัดการและกำกับดูแลระบบเอกสารทั้งหมด", en: "Manage all document workflows and settings" },

  // Errors & Validations
  "documents.error.notFound": { th: "ไม่พบเอกสารคำร้องที่ระบุ", en: "Document request not found" },
  "documents.error.notInPending": { th: "เอกสารไม่อยู่ในสถานะที่สามารถอนุมัติได้", en: "Document is not in pending status" },
  "documents.error.stepMismatch": { th: "ไม่สามารถอนุมัติข้ามขั้นตอนได้ ต้องรอขั้นตอนก่อนหน้าดำเนินการก่อน", en: "Sequential step mismatch. Prior step must be completed first." },
  "documents.error.notAuthorizedApprover": { th: "คุณไม่ใช่ผู้อนุมัติที่ได้รับมอบหมายในขั้นตอนนี้", en: "You are not the designated approver for this step" },
  "documents.error.atLeastOneStep": { th: "ต้องกำหนดสายการอนุมัติอย่างน้อย 1 ขั้นตอน", en: "Approval route must have at least 1 step" },
  "documents.error.cannotCancel": { th: "สามารถยกเลิกได้เฉพาะคำร้องที่ยังไม่อนุมัติเสร็จสิ้นเท่านั้น", en: "Can only cancel requests that are not yet approved" },
};
