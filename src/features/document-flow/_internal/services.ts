import { prisma } from "@/shared/lib/infra/prisma";
import { errors } from "@/shared/lib/errors";
import type { Prisma } from "@prisma/client";
import type {
  CreateDocumentRequestInput,
  ApproveStepInput,
  RejectStepInput,
  ListDocumentQuery,
  DocumentTypeEnum,
  DocumentStatusEnum,
  StepStatusEnum,
} from "./validations";

export interface ApprovalRouteDto {
  id: string;
  documentRequestId: string;
  stepIndex: number;
  title: string;
  approverId: string;
  approverName?: string;
  approverEmail?: string;
  status: StepStatusEnum;
  comment: string | null;
  actionAt: string | null;
  createdAt: string;
}

export interface DocumentRequestDto {
  id: string;
  tenantId: string;
  trackingNo: string;
  docType: DocumentTypeEnum;
  title: string;
  description: string | null;
  status: DocumentStatusEnum;
  currentStepIndex: number;
  totalSteps: number;
  requesterId: string;
  requesterName?: string;
  requesterEmail?: string;
  fileAttachmentUrl: string | null;
  routes?: ApprovalRouteDto[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetailDto extends DocumentRequestDto {
  routes: ApprovalRouteDto[];
}

export interface PublicTrackingDto {
  trackingNo: string;
  docType: DocumentTypeEnum;
  title: string;
  status: DocumentStatusEnum;
  currentStepIndex: number;
  totalSteps: number;
  createdAt: string;
  updatedAt: string;
  routes: {
    stepIndex: number;
    title: string;
    approverName: string;
    status: StepStatusEnum;
    comment: string | null;
    actionAt: string | null;
  }[];
}

export interface ApproverOptionDto {
  id: string;
  name: string;
  email: string;
}

// ---------------------------------------------------------------------------
// Tracking Number Generator
// ---------------------------------------------------------------------------

export async function generateTrackingNo(
  tx: Prisma.TransactionClient,
  tenantId: string
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DOC-${year}-`;

  const count = await tx.documentRequest.count({
    where: {
      tenantId,
      trackingNo: {
        startsWith: prefix,
      },
    },
  });

  let seq = count + 1;
  let trackingNo = `${prefix}${String(seq).padStart(4, "0")}`;

  let exists = await tx.documentRequest.findUnique({
    where: { tenantId_trackingNo: { tenantId, trackingNo } },
    select: { id: true },
  });

  while (exists) {
    seq++;
    trackingNo = `${prefix}${String(seq).padStart(4, "0")}`;
    exists = await tx.documentRequest.findUnique({
      where: { tenantId_trackingNo: { tenantId, trackingNo } },
      select: { id: true },
    });
  }

  return trackingNo;
}

// ---------------------------------------------------------------------------
// Document Queries
// ---------------------------------------------------------------------------

export async function listDocuments(
  tenantId: string,
  userId: string,
  query?: Partial<ListDocumentQuery>
): Promise<DocumentRequestDto[]> {
  const tab = query?.tab ?? "my";

  let idFilter: string[] | undefined;

  if (tab === "pending") {
    // Find approval routes where current user is approver, status is PENDING,
    // and the parent request is currently at this exact stepIndex.
    const pendingRoutes = await prisma.approvalRoute.findMany({
      where: {
        approverId: userId,
        status: "PENDING",
        request: {
          tenantId,
          status: "PENDING",
        },
      },
      select: {
        stepIndex: true,
        documentRequestId: true,
        request: {
          select: {
            currentStepIndex: true,
          },
        },
      },
    });

    const activeIds = pendingRoutes
      .filter((r) => r.request.currentStepIndex === r.stepIndex)
      .map((r) => r.documentRequestId);

    if (activeIds.length === 0) {
      return [];
    }

    idFilter = activeIds;
  }

  const where: Record<string, unknown> = { tenantId };

  if (tab === "my") {
    where.requesterId = userId;
  } else if (tab === "pending" && idFilter) {
    where.id = { in: idFilter };
  }

  if (query?.docType) {
    where.docType = query.docType;
  }

  if (query?.status) {
    where.status = query.status;
  }

  if (query?.search?.trim()) {
    const s = query.search.trim();
    where.OR = [
      { title: { contains: s, mode: "insensitive" } },
      { trackingNo: { contains: s, mode: "insensitive" } },
    ];
  }

  const items = await prisma.documentRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      requester: {
        select: { id: true, name: true, email: true },
      },
      routes: {
        orderBy: { stepIndex: "asc" },
        include: {
          approver: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  return items.map((doc) => ({
    id: doc.id,
    tenantId: doc.tenantId,
    trackingNo: doc.trackingNo,
    docType: doc.docType as DocumentTypeEnum,
    title: doc.title,
    description: doc.description,
    status: doc.status as DocumentStatusEnum,
    currentStepIndex: doc.currentStepIndex,
    totalSteps: doc.totalSteps,
    requesterId: doc.requesterId,
    requesterName: doc.requester.name ?? doc.requester.email,
    requesterEmail: doc.requester.email,
    fileAttachmentUrl: doc.fileAttachmentUrl,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    routes: doc.routes.map((r) => ({
      id: r.id,
      documentRequestId: r.documentRequestId,
      stepIndex: r.stepIndex,
      title: r.title,
      approverId: r.approverId,
      approverName: r.approver.name ?? r.approver.email,
      approverEmail: r.approver.email,
      status: r.status as StepStatusEnum,
      comment: r.comment,
      actionAt: r.actionAt ? r.actionAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    })),
  }));
}

export async function getDocumentById(
  tenantId: string,
  id: string
): Promise<DocumentDetailDto> {
  const doc = await prisma.documentRequest.findFirst({
    where: { id, tenantId },
    include: {
      requester: {
        select: { id: true, name: true, email: true },
      },
      routes: {
        orderBy: { stepIndex: "asc" },
        include: {
          approver: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!doc) {
    throw errors.not_found("ไม่พบเอกสารคำร้องที่ระบุ");
  }

  return {
    id: doc.id,
    tenantId: doc.tenantId,
    trackingNo: doc.trackingNo,
    docType: doc.docType as DocumentTypeEnum,
    title: doc.title,
    description: doc.description,
    status: doc.status as DocumentStatusEnum,
    currentStepIndex: doc.currentStepIndex,
    totalSteps: doc.totalSteps,
    requesterId: doc.requesterId,
    requesterName: doc.requester.name ?? doc.requester.email,
    requesterEmail: doc.requester.email,
    fileAttachmentUrl: doc.fileAttachmentUrl,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    routes: doc.routes.map((r) => ({
      id: r.id,
      documentRequestId: r.documentRequestId,
      stepIndex: r.stepIndex,
      title: r.title,
      approverId: r.approverId,
      approverName: r.approver.name ?? r.approver.email,
      approverEmail: r.approver.email,
      status: r.status as StepStatusEnum,
      comment: r.comment,
      actionAt: r.actionAt ? r.actionAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function getDocumentByTrackingNo(
  tenantId: string,
  trackingNo: string
): Promise<PublicTrackingDto> {
  const doc = await prisma.documentRequest.findFirst({
    where: {
      tenantId,
      trackingNo: {
        equals: trackingNo.trim(),
        mode: "insensitive",
      },
    },
    include: {
      routes: {
        orderBy: { stepIndex: "asc" },
        include: {
          approver: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  if (!doc) {
    throw errors.not_found("ไม่พบเอกสารคำร้องที่มี Tracking Number นี้");
  }

  return {
    trackingNo: doc.trackingNo,
    docType: doc.docType as DocumentTypeEnum,
    title: doc.title,
    status: doc.status as DocumentStatusEnum,
    currentStepIndex: doc.currentStepIndex,
    totalSteps: doc.totalSteps,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    routes: doc.routes.map((r) => ({
      stepIndex: r.stepIndex,
      title: r.title,
      approverName: r.approver.name ?? "เจ้าหน้าที่ผู้มีอำนาจลงนาม",
      status: r.status as StepStatusEnum,
      comment: r.comment,
      actionAt: r.actionAt ? r.actionAt.toISOString() : null,
    })),
  };
}

export async function getAvailableApprovers(
  tenantId: string
): Promise<ApproverOptionDto[]> {
  const users = await prisma.user.findMany({
    where: {
      userTenants: {
        some: { tenantId, isActive: true },
      },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name ?? u.email,
    email: u.email,
  }));
}

// ---------------------------------------------------------------------------
// Document Mutations (State Machine)
// ---------------------------------------------------------------------------

export async function createDocumentRequest(
  tenantId: string,
  requesterId: string,
  input: CreateDocumentRequestInput
): Promise<DocumentDetailDto> {
  return prisma.$transaction(async (tx) => {
    const trackingNo = await generateTrackingNo(tx, tenantId);

    const doc = await tx.documentRequest.create({
      data: {
        tenantId,
        trackingNo,
        docType: input.docType,
        title: input.title,
        description: input.description ?? null,
        status: "PENDING",
        currentStepIndex: 1,
        totalSteps: input.routes.length,
        requesterId,
        fileAttachmentUrl: input.fileAttachmentUrl ?? null,
        routes: {
          create: input.routes.map(
            (
              route: CreateDocumentRequestInput["routes"][number],
              idx: number
            ) => ({
              stepIndex: idx + 1,
              title: route.title,
              approverId: route.approverId,
              status: "PENDING",
            })
          ),
        },
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        routes: {
          orderBy: { stepIndex: "asc" },
          include: {
            approver: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return {
      id: doc.id,
      tenantId: doc.tenantId,
      trackingNo: doc.trackingNo,
      docType: doc.docType as DocumentTypeEnum,
      title: doc.title,
      description: doc.description,
      status: doc.status as DocumentStatusEnum,
      currentStepIndex: doc.currentStepIndex,
      totalSteps: doc.totalSteps,
      requesterId: doc.requesterId,
      requesterName: doc.requester.name ?? doc.requester.email,
      requesterEmail: doc.requester.email,
      fileAttachmentUrl: doc.fileAttachmentUrl,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      routes: doc.routes.map((r) => ({
        id: r.id,
        documentRequestId: r.documentRequestId,
        stepIndex: r.stepIndex,
        title: r.title,
        approverId: r.approverId,
        approverName: r.approver.name ?? r.approver.email,
        approverEmail: r.approver.email,
        status: r.status as StepStatusEnum,
        comment: r.comment,
        actionAt: r.actionAt ? r.actionAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  });
}

export async function approveStep(
  tenantId: string,
  approverId: string,
  input: ApproveStepInput
): Promise<DocumentDetailDto> {
  return prisma.$transaction(async (tx) => {
    const doc = await tx.documentRequest.findFirst({
      where: { id: input.documentRequestId, tenantId },
      include: {
        routes: {
          orderBy: { stepIndex: "asc" },
        },
      },
    });

    if (!doc) {
      throw errors.not_found("ไม่พบเอกสารคำร้องที่ระบุ");
    }

    if (doc.status !== "PENDING") {
      throw errors.validation("เอกสารไม่อยู่ในสถานะที่สามารถอนุมัติได้");
    }

    const currentRoute = doc.routes.find(
      (r) => r.stepIndex === doc.currentStepIndex
    );

    if (!currentRoute) {
      throw errors.validation("ไม่พบข้อมูลขั้นตอนปัจจุบันในสายการอนุมัติ");
    }

    if (currentRoute.status !== "PENDING") {
      throw errors.validation("ขั้นตอนนี้ได้รับการดำเนินการไปแล้ว");
    }

    if (currentRoute.approverId !== approverId) {
      throw errors.forbidden("คุณไม่ใช่ผู้อนุมัติที่ได้รับมอบหมายในขั้นตอนนี้");
    }

    // 1. Update current route
    await tx.approvalRoute.update({
      where: { id: currentRoute.id },
      data: {
        status: "APPROVED",
        comment: input.comment ?? null,
        actionAt: new Date(),
      },
    });

    // 2. State Machine transition
    const isFinalStep = doc.currentStepIndex >= doc.totalSteps;
    const nextStatus = isFinalStep ? "APPROVED" : "PENDING";
    const nextStepIndex = isFinalStep
      ? doc.currentStepIndex
      : doc.currentStepIndex + 1;

    const updatedDoc = await tx.documentRequest.update({
      where: { id: doc.id },
      data: {
        status: nextStatus,
        currentStepIndex: nextStepIndex,
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        routes: {
          orderBy: { stepIndex: "asc" },
          include: {
            approver: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return {
      id: updatedDoc.id,
      tenantId: updatedDoc.tenantId,
      trackingNo: updatedDoc.trackingNo,
      docType: updatedDoc.docType as DocumentTypeEnum,
      title: updatedDoc.title,
      description: updatedDoc.description,
      status: updatedDoc.status as DocumentStatusEnum,
      currentStepIndex: updatedDoc.currentStepIndex,
      totalSteps: updatedDoc.totalSteps,
      requesterId: updatedDoc.requesterId,
      requesterName: updatedDoc.requester.name ?? updatedDoc.requester.email,
      requesterEmail: updatedDoc.requester.email,
      fileAttachmentUrl: updatedDoc.fileAttachmentUrl,
      createdAt: updatedDoc.createdAt.toISOString(),
      updatedAt: updatedDoc.updatedAt.toISOString(),
      routes: updatedDoc.routes.map((r) => ({
        id: r.id,
        documentRequestId: r.documentRequestId,
        stepIndex: r.stepIndex,
        title: r.title,
        approverId: r.approverId,
        approverName: r.approver.name ?? r.approver.email,
        approverEmail: r.approver.email,
        status: r.status as StepStatusEnum,
        comment: r.comment,
        actionAt: r.actionAt ? r.actionAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  });
}

export async function rejectStep(
  tenantId: string,
  approverId: string,
  input: RejectStepInput
): Promise<DocumentDetailDto> {
  return prisma.$transaction(async (tx) => {
    const doc = await tx.documentRequest.findFirst({
      where: { id: input.documentRequestId, tenantId },
      include: {
        routes: {
          orderBy: { stepIndex: "asc" },
        },
      },
    });

    if (!doc) {
      throw errors.not_found("ไม่พบเอกสารคำร้องที่ระบุ");
    }

    if (doc.status !== "PENDING") {
      throw errors.validation("เอกสารไม่อยู่ในสถานะที่สามารถดำเนินการได้");
    }

    const currentRoute = doc.routes.find(
      (r) => r.stepIndex === doc.currentStepIndex
    );

    if (!currentRoute) {
      throw errors.validation("ไม่พบข้อมูลขั้นตอนปัจจุบันในสายการอนุมัติ");
    }

    if (currentRoute.status !== "PENDING") {
      throw errors.validation("ขั้นตอนนี้ได้รับการดำเนินการไปแล้ว");
    }

    if (currentRoute.approverId !== approverId) {
      throw errors.forbidden("คุณไม่ใช่ผู้อนุมัติที่ได้รับมอบหมายในขั้นตอนนี้");
    }

    // 1. Update current route as REJECTED
    await tx.approvalRoute.update({
      where: { id: currentRoute.id },
      data: {
        status: "REJECTED",
        comment: input.comment,
        actionAt: new Date(),
      },
    });

    // 2. Reject the entire document workflow
    const updatedDoc = await tx.documentRequest.update({
      where: { id: doc.id },
      data: {
        status: "REJECTED",
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        routes: {
          orderBy: { stepIndex: "asc" },
          include: {
            approver: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return {
      id: updatedDoc.id,
      tenantId: updatedDoc.tenantId,
      trackingNo: updatedDoc.trackingNo,
      docType: updatedDoc.docType as DocumentTypeEnum,
      title: updatedDoc.title,
      description: updatedDoc.description,
      status: updatedDoc.status as DocumentStatusEnum,
      currentStepIndex: updatedDoc.currentStepIndex,
      totalSteps: updatedDoc.totalSteps,
      requesterId: updatedDoc.requesterId,
      requesterName: updatedDoc.requester.name ?? updatedDoc.requester.email,
      requesterEmail: updatedDoc.requester.email,
      fileAttachmentUrl: updatedDoc.fileAttachmentUrl,
      createdAt: updatedDoc.createdAt.toISOString(),
      updatedAt: updatedDoc.updatedAt.toISOString(),
      routes: updatedDoc.routes.map((r) => ({
        id: r.id,
        documentRequestId: r.documentRequestId,
        stepIndex: r.stepIndex,
        title: r.title,
        approverId: r.approverId,
        approverName: r.approver.name ?? r.approver.email,
        approverEmail: r.approver.email,
        status: r.status as StepStatusEnum,
        comment: r.comment,
        actionAt: r.actionAt ? r.actionAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  });
}

export async function cancelDocumentRequest(
  tenantId: string,
  requesterId: string,
  id: string,
  isManager = false
): Promise<DocumentDetailDto> {
  return prisma.$transaction(async (tx) => {
    const doc = await tx.documentRequest.findFirst({
      where: { id, tenantId },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        routes: {
          orderBy: { stepIndex: "asc" },
          include: {
            approver: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!doc) {
      throw errors.not_found("ไม่พบเอกสารคำร้องที่ระบุ");
    }

    if (!isManager && doc.requesterId !== requesterId) {
      throw errors.forbidden("คุณไม่มีสิทธิ์ยกเลิกคำร้องนี้");
    }

    if (doc.status !== "PENDING" && doc.status !== "DRAFT") {
      throw errors.validation(
        "สามารถยกเลิกได้เฉพาะคำร้องที่ยังไม่อนุมัติเสร็จสิ้นเท่านั้น"
      );
    }

    const updatedDoc = await tx.documentRequest.update({
      where: { id: doc.id },
      data: {
        status: "CANCELLED",
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        routes: {
          orderBy: { stepIndex: "asc" },
          include: {
            approver: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return {
      id: updatedDoc.id,
      tenantId: updatedDoc.tenantId,
      trackingNo: updatedDoc.trackingNo,
      docType: updatedDoc.docType as DocumentTypeEnum,
      title: updatedDoc.title,
      description: updatedDoc.description,
      status: updatedDoc.status as DocumentStatusEnum,
      currentStepIndex: updatedDoc.currentStepIndex,
      totalSteps: updatedDoc.totalSteps,
      requesterId: updatedDoc.requesterId,
      requesterName: updatedDoc.requester.name ?? updatedDoc.requester.email,
      requesterEmail: updatedDoc.requester.email,
      fileAttachmentUrl: updatedDoc.fileAttachmentUrl,
      createdAt: updatedDoc.createdAt.toISOString(),
      updatedAt: updatedDoc.updatedAt.toISOString(),
      routes: updatedDoc.routes.map((r) => ({
        id: r.id,
        documentRequestId: r.documentRequestId,
        stepIndex: r.stepIndex,
        title: r.title,
        approverId: r.approverId,
        approverName: r.approver.name ?? r.approver.email,
        approverEmail: r.approver.email,
        status: r.status as StepStatusEnum,
        comment: r.comment,
        actionAt: r.actionAt ? r.actionAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  });
}
