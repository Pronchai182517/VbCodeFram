"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/shared/lib/result";
import { prisma } from "@/shared/lib/infra/prisma";
import {
  requirePermission,
  hasPermission,
  auth,
} from "@/features/identity/server";
import { DOCUMENTS_P } from "../permissions";
import {
  createDocumentRequestSchema,
  approveStepSchema,
  rejectStepSchema,
  listDocumentQuerySchema,
} from "./validations";
import {
  listDocuments,
  getDocumentById,
  getDocumentByTrackingNo,
  getAvailableApprovers,
  createDocumentRequest,
  approveStep,
  rejectStep,
  cancelDocumentRequest,
} from "./services";

export async function getDocumentsAction(query?: unknown) {
  return runAction(async () => {
    const parsed = listDocumentQuerySchema.parse(query ?? {});

    // Permission enforcement according to requested tab
    let requiredPerm: string = DOCUMENTS_P.documentsRead;
    if (parsed.tab === "pending") {
      requiredPerm = DOCUMENTS_P.documentsApprove;
    } else if (parsed.tab === "all") {
      requiredPerm = DOCUMENTS_P.documentsManage;
    }

    const ctx = await requirePermission(requiredPerm);
    return listDocuments(ctx.tenantId, ctx.userId, parsed);
  });
}

export async function getDocumentByIdAction(id: string) {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENTS_P.documentsRead);
    return getDocumentById(ctx.tenantId, id);
  });
}

export async function getAvailableApproversAction() {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENTS_P.documentsRead);
    return getAvailableApprovers(ctx.tenantId);
  });
}

export async function createDocumentRequestAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENTS_P.documentsCreate);
    const parsed = createDocumentRequestSchema.parse(input);
    const doc = await createDocumentRequest(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/admin/documents");
    revalidatePath("/documents");
    return doc;
  });
}

export async function approveStepAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENTS_P.documentsApprove);
    const parsed = approveStepSchema.parse(input);
    const doc = await approveStep(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/admin/documents");
    revalidatePath("/documents");
    return doc;
  });
}

export async function rejectStepAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENTS_P.documentsApprove);
    const parsed = rejectStepSchema.parse(input);
    const doc = await rejectStep(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/admin/documents");
    revalidatePath("/documents");
    return doc;
  });
}

export async function cancelDocumentRequestAction(id: string) {
  return runAction(async () => {
    const ctx = await requirePermission(DOCUMENTS_P.documentsRead);
    const isManager = hasPermission(ctx, DOCUMENTS_P.documentsManage);
    const doc = await cancelDocumentRequest(
      ctx.tenantId,
      ctx.userId,
      id,
      isManager
    );
    revalidatePath("/admin/documents");
    revalidatePath("/documents");
    return doc;
  });
}

export async function trackDocumentPublicAction(trackingNo: string) {
  return runAction(async () => {
    if (!trackingNo || !trackingNo.trim()) {
      throw new Error("กรุณากรอกเลขที่ Tracking Number");
    }

    const session = await auth().catch(() => null);
    const tenantId =
      session?.tenantId ||
      (await prisma.tenant.findFirst({ select: { id: true } }))?.id ||
      "";

    if (!tenantId) {
      throw new Error("ไม่พบข้อมูลหน่วยงานในระบบ");
    }

    return getDocumentByTrackingNo(tenantId, trackingNo.trim());
  });
}
