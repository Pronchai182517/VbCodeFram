import { prisma } from "@/shared/lib/infra/prisma";
import { errors } from "@/shared/lib/errors";
import type { Prisma } from "@prisma/client";
import type {
  CreateResourceInput,
  UpdateResourceInput,
  CreateReservationInput,
  ApproveReservationInput,
  RejectReservationInput,
  ListReservationsQuery,
  ListResourcesQuery,
  ResourceTypeEnum,
  ReservationStatusEnum,
} from "./validations";

export interface ResourceDto {
  id: string;
  tenantId: string;
  type: ResourceTypeEnum;
  nameTh: string;
  nameEn: string;
  code: string;
  capacity: number;
  locationTh: string;
  locationEn: string;
  imageUrl: string | null;
  facilities: string[];
  driverName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationDto {
  id: string;
  tenantId: string;
  resourceId: string;
  resourceNameTh: string;
  resourceNameEn: string;
  resourceCode: string;
  resourceType: ResourceTypeEnum;
  userId: string;
  userName: string;
  userEmail: string;
  purpose: string;
  attendeeCount: number;
  startTime: string;
  endTime: string;
  status: ReservationStatusEnum;
  approverId: string | null;
  approverName: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventDto {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceCode: string;
  resourceType: ResourceTypeEnum;
  title: string;
  bookerName: string;
  attendeeCount: number;
  start: string;
  end: string;
  status: ReservationStatusEnum;
}

// ---------------------------------------------------------------------------
// Zero-overlap Collision Detection Algorithm
// ---------------------------------------------------------------------------

/**
 * Checks whether the requested time window [startTime, endTime) overlaps with
 * any existing reservations for the same resource in PENDING or CONFIRMED state.
 *
 * Interval overlap condition:
 *   (Existing.startTime < Requested.endTime) AND (Existing.endTime > Requested.startTime)
 */
export async function checkOverlap(
  tx: Prisma.TransactionClient,
  params: {
    tenantId: string;
    resourceId: string;
    startTime: Date;
    endTime: Date;
    excludeReservationId?: string;
  }
): Promise<boolean> {
  const overlapping = await tx.reservation.findFirst({
    where: {
      tenantId: params.tenantId,
      resourceId: params.resourceId,
      status: { in: ["CONFIRMED", "PENDING"] },
      startTime: { lt: params.endTime },
      endTime: { gt: params.startTime },
      ...(params.excludeReservationId
        ? { id: { not: params.excludeReservationId } }
        : {}),
    },
    select: { id: true },
  });

  return !!overlapping;
}

// ---------------------------------------------------------------------------
// Resource Queries & Mutations
// ---------------------------------------------------------------------------

export async function listResources(
  tenantId: string,
  query?: Partial<ListResourcesQuery>
): Promise<ResourceDto[]> {
  const where: Record<string, unknown> = { tenantId };

  if (query?.type) {
    where.type = query.type;
  }

  if (typeof query?.isActive === "boolean") {
    where.isActive = query.isActive;
  }

  if (query?.search?.trim()) {
    const s = query.search.trim();
    where.OR = [
      { nameTh: { contains: s, mode: "insensitive" } },
      { nameEn: { contains: s, mode: "insensitive" } },
      { code: { contains: s, mode: "insensitive" } },
      { locationTh: { contains: s, mode: "insensitive" } },
      { locationEn: { contains: s, mode: "insensitive" } },
    ];
  }

  const items = await prisma.resource.findMany({
    where,
    orderBy: [{ type: "asc" }, { code: "asc" }],
  });

  return items.map((r) => {
    let facilities: string[] = [];
    if (Array.isArray(r.facilities)) {
      facilities = r.facilities as string[];
    }

    return {
      id: r.id,
      tenantId: r.tenantId,
      type: r.type as ResourceTypeEnum,
      nameTh: r.nameTh,
      nameEn: r.nameEn,
      code: r.code,
      capacity: r.capacity,
      locationTh: r.locationTh,
      locationEn: r.locationEn,
      imageUrl: r.imageUrl,
      facilities,
      driverName: r.driverName,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  });
}

export async function getResourceById(
  tenantId: string,
  id: string
): Promise<ResourceDto> {
  const r = await prisma.resource.findFirst({
    where: { id, tenantId },
  });

  if (!r) {
    throw errors.not_found("ไม่พบทรัพยากรที่ระบุ");
  }

  let facilities: string[] = [];
  if (Array.isArray(r.facilities)) {
    facilities = r.facilities as string[];
  }

  return {
    id: r.id,
    tenantId: r.tenantId,
    type: r.type as ResourceTypeEnum,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    code: r.code,
    capacity: r.capacity,
    locationTh: r.locationTh,
    locationEn: r.locationEn,
    imageUrl: r.imageUrl,
    facilities,
    driverName: r.driverName,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function createResource(
  tenantId: string,
  input: CreateResourceInput
): Promise<ResourceDto> {
  const existing = await prisma.resource.findUnique({
    where: {
      tenantId_code: { tenantId, code: input.code },
    },
  });

  if (existing) {
    throw errors.conflict(`รหัสทรัพยากร ${input.code} นี้มีอยู่ในระบบแล้ว`);
  }

  const r = await prisma.resource.create({
    data: {
      tenantId,
      type: input.type,
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      code: input.code,
      capacity: input.capacity,
      locationTh: input.locationTh,
      locationEn: input.locationEn,
      imageUrl: input.imageUrl ?? null,
      facilities: input.facilities,
      driverName: input.driverName ?? null,
      isActive: input.isActive,
    },
  });

  return {
    id: r.id,
    tenantId: r.tenantId,
    type: r.type as ResourceTypeEnum,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    code: r.code,
    capacity: r.capacity,
    locationTh: r.locationTh,
    locationEn: r.locationEn,
    imageUrl: r.imageUrl,
    facilities: input.facilities,
    driverName: r.driverName,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function updateResource(
  tenantId: string,
  input: UpdateResourceInput
): Promise<ResourceDto> {
  const existing = await prisma.resource.findFirst({
    where: { id: input.id, tenantId },
  });

  if (!existing) {
    throw errors.not_found("ไม่พบทรัพยากรที่ต้องการแก้ไข");
  }

  if (input.code && input.code !== existing.code) {
    const codeConflict = await prisma.resource.findUnique({
      where: { tenantId_code: { tenantId, code: input.code } },
    });
    if (codeConflict) {
      throw errors.conflict(`รหัสทรัพยากร ${input.code} นี้มีอยู่ในระบบแล้ว`);
    }
  }

  const r = await prisma.resource.update({
    where: { id: input.id },
    data: {
      ...(input.type ? { type: input.type } : {}),
      ...(input.nameTh ? { nameTh: input.nameTh } : {}),
      ...(input.nameEn ? { nameEn: input.nameEn } : {}),
      ...(input.code ? { code: input.code } : {}),
      ...(typeof input.capacity === "number" ? { capacity: input.capacity } : {}),
      ...(input.locationTh ? { locationTh: input.locationTh } : {}),
      ...(input.locationEn ? { locationEn: input.locationEn } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.facilities ? { facilities: input.facilities } : {}),
      ...(input.driverName !== undefined ? { driverName: input.driverName } : {}),
      ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
    },
  });

  let facilities: string[] = [];
  if (Array.isArray(r.facilities)) {
    facilities = r.facilities as string[];
  }

  return {
    id: r.id,
    tenantId: r.tenantId,
    type: r.type as ResourceTypeEnum,
    nameTh: r.nameTh,
    nameEn: r.nameEn,
    code: r.code,
    capacity: r.capacity,
    locationTh: r.locationTh,
    locationEn: r.locationEn,
    imageUrl: r.imageUrl,
    facilities,
    driverName: r.driverName,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function deleteResource(
  tenantId: string,
  id: string
): Promise<void> {
  const existing = await prisma.resource.findFirst({
    where: { id, tenantId },
    include: {
      _count: {
        select: { reservations: true },
      },
    },
  });

  if (!existing) {
    throw errors.not_found("ไม่พบทรัพยากรที่ต้องการลบ");
  }

  if (existing._count.reservations > 0) {
    throw errors.validation(
      "ไม่สามารถลบทรัพยากรนี้ได้เนื่องจากมีประวัติการจองอยู่ในระบบ (แนะนำให้ปิดสถานะแทน)"
    );
  }

  await prisma.resource.delete({
    where: { id },
  });
}

// ---------------------------------------------------------------------------
// Reservation Queries & Mutations
// ---------------------------------------------------------------------------

export async function listReservations(
  tenantId: string,
  query?: Partial<ListReservationsQuery>,
  currentUserId?: string
): Promise<ReservationDto[]> {
  const where: Record<string, unknown> = { tenantId };

  if (query?.myOnly && currentUserId) {
    where.userId = currentUserId;
  } else if (query?.userId) {
    where.userId = query.userId;
  }

  if (query?.resourceId) {
    where.resourceId = query.resourceId;
  }

  if (query?.status) {
    where.status = query.status;
  }

  if (query?.type) {
    where.resource = { type: query.type };
  }

  if (query?.startDate || query?.endDate) {
    const timeFilter: Record<string, unknown> = {};
    if (query.startDate) timeFilter.gte = query.startDate;
    if (query.endDate) timeFilter.lte = query.endDate;
    where.startTime = timeFilter;
  }

  if (query?.search?.trim()) {
    const s = query.search.trim();
    where.OR = [
      { purpose: { contains: s, mode: "insensitive" } },
      { resource: { nameTh: { contains: s, mode: "insensitive" } } },
      { resource: { code: { contains: s, mode: "insensitive" } } },
      { user: { name: { contains: s, mode: "insensitive" } } },
    ];
  }

  const items = await prisma.reservation.findMany({
    where,
    orderBy: { startTime: "desc" },
    include: {
      resource: true,
      user: {
        select: { id: true, name: true, email: true },
      },
      approver: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return items.map((res) => ({
    id: res.id,
    tenantId: res.tenantId,
    resourceId: res.resourceId,
    resourceNameTh: res.resource.nameTh,
    resourceNameEn: res.resource.nameEn,
    resourceCode: res.resource.code,
    resourceType: res.resource.type as ResourceTypeEnum,
    userId: res.userId,
    userName: res.user.name ?? res.user.email,
    userEmail: res.user.email,
    purpose: res.purpose,
    attendeeCount: res.attendeeCount,
    startTime: res.startTime.toISOString(),
    endTime: res.endTime.toISOString(),
    status: res.status as ReservationStatusEnum,
    approverId: res.approverId,
    approverName: res.approver ? res.approver.name ?? res.approver.email : null,
    rejectReason: res.rejectReason,
    createdAt: res.createdAt.toISOString(),
    updatedAt: res.updatedAt.toISOString(),
  }));
}

export async function getReservationById(
  tenantId: string,
  id: string
): Promise<ReservationDto> {
  const res = await prisma.reservation.findFirst({
    where: { id, tenantId },
    include: {
      resource: true,
      user: {
        select: { id: true, name: true, email: true },
      },
      approver: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!res) {
    throw errors.not_found("ไม่พบรายการจองที่ระบุ");
  }

  return {
    id: res.id,
    tenantId: res.tenantId,
    resourceId: res.resourceId,
    resourceNameTh: res.resource.nameTh,
    resourceNameEn: res.resource.nameEn,
    resourceCode: res.resource.code,
    resourceType: res.resource.type as ResourceTypeEnum,
    userId: res.userId,
    userName: res.user.name ?? res.user.email,
    userEmail: res.user.email,
    purpose: res.purpose,
    attendeeCount: res.attendeeCount,
    startTime: res.startTime.toISOString(),
    endTime: res.endTime.toISOString(),
    status: res.status as ReservationStatusEnum,
    approverId: res.approverId,
    approverName: res.approver ? res.approver.name ?? res.approver.email : null,
    rejectReason: res.rejectReason,
    createdAt: res.createdAt.toISOString(),
    updatedAt: res.updatedAt.toISOString(),
  };
}

export async function getCalendarEvents(
  tenantId: string,
  startDate?: Date,
  endDate?: Date,
  type?: ResourceTypeEnum
): Promise<CalendarEventDto[]> {
  const where: Record<string, unknown> = {
    tenantId,
    status: { in: ["CONFIRMED", "PENDING"] },
  };

  if (type) {
    where.resource = { type };
  }

  if (startDate || endDate) {
    where.AND = [
      ...(startDate ? [{ endTime: { gte: startDate } }] : []),
      ...(endDate ? [{ startTime: { lte: endDate } }] : []),
    ];
  }

  const items = await prisma.reservation.findMany({
    where,
    orderBy: { startTime: "asc" },
    include: {
      resource: {
        select: { id: true, nameTh: true, code: true, type: true },
      },
      user: {
        select: { name: true, email: true },
      },
    },
  });

  return items.map((r) => ({
    id: r.id,
    resourceId: r.resource.id,
    resourceName: r.resource.nameTh,
    resourceCode: r.resource.code,
    resourceType: r.resource.type as ResourceTypeEnum,
    title: r.purpose,
    bookerName: r.user.name ?? r.user.email,
    attendeeCount: r.attendeeCount,
    start: r.startTime.toISOString(),
    end: r.endTime.toISOString(),
    status: r.status as ReservationStatusEnum,
  }));
}

export async function createReservation(
  tenantId: string,
  userId: string,
  input: CreateReservationInput
): Promise<ReservationDto> {
  return prisma.$transaction(async (tx) => {
    // 1. Verify resource exists, belongs to tenant, and is active
    const resource = await tx.resource.findFirst({
      where: { id: input.resourceId, tenantId },
    });

    if (!resource) {
      throw errors.not_found("ไม่พบข้อมูลห้องหรือยานพาหนะที่ต้องการจอง");
    }

    if (!resource.isActive) {
      throw errors.validation("ทรัพยากรนี้ปิดปรับปรุงชั่วคราว ไม่สามารถทำการจองได้");
    }

    if (input.attendeeCount > resource.capacity) {
      throw errors.validation(
        `จำนวนผู้เข้าร่วม (${input.attendeeCount} คน) เกินความจุของ ${resource.nameTh} (${resource.capacity} คน)`
      );
    }

    // 2. Zero-overlap Collision Detection
    const hasOverlap = await checkOverlap(tx, {
      tenantId,
      resourceId: input.resourceId,
      startTime: input.startTime,
      endTime: input.endTime,
    });

    if (hasOverlap) {
      throw errors.conflict(
        "ช่วงเวลาดังกล่าวมีผู้ใช้งานหรือจองคิวไว้แล้ว กรุณาเลือกช่วงเวลาอื่น (Zero-overlap Conflict)"
      );
    }

    // 3. Create Reservation
    const res = await tx.reservation.create({
      data: {
        tenantId,
        resourceId: input.resourceId,
        userId,
        purpose: input.purpose,
        attendeeCount: input.attendeeCount,
        startTime: input.startTime,
        endTime: input.endTime,
        status: "PENDING",
      },
      include: {
        resource: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      id: res.id,
      tenantId: res.tenantId,
      resourceId: res.resourceId,
      resourceNameTh: res.resource.nameTh,
      resourceNameEn: res.resource.nameEn,
      resourceCode: res.resource.code,
      resourceType: res.resource.type as ResourceTypeEnum,
      userId: res.userId,
      userName: res.user.name ?? res.user.email,
      userEmail: res.user.email,
      purpose: res.purpose,
      attendeeCount: res.attendeeCount,
      startTime: res.startTime.toISOString(),
      endTime: res.endTime.toISOString(),
      status: res.status as ReservationStatusEnum,
      approverId: null,
      approverName: null,
      rejectReason: null,
      createdAt: res.createdAt.toISOString(),
      updatedAt: res.updatedAt.toISOString(),
    };
  });
}

export async function approveReservation(
  tenantId: string,
  approverId: string,
  input: ApproveReservationInput
): Promise<ReservationDto> {
  return prisma.$transaction(async (tx) => {
    const res = await tx.reservation.findFirst({
      where: { id: input.id, tenantId },
      include: { resource: true },
    });

    if (!res) {
      throw errors.not_found("ไม่พบรายการจองที่ระบุ");
    }

    if (res.status !== "PENDING") {
      throw errors.validation("สามารถอนุมัติได้เฉพาะรายการที่อยู่ในสถานะรอพิจารณาเท่านั้น");
    }

    // Double-check collision with any already CONFIRMED bookings
    const hasOverlap = await tx.reservation.findFirst({
      where: {
        tenantId,
        resourceId: res.resourceId,
        status: "CONFIRMED",
        id: { not: res.id },
        startTime: { lt: res.endTime },
        endTime: { gt: res.startTime },
      },
    });

    if (hasOverlap) {
      throw errors.conflict(
        "ไม่สามารถอนุมัติได้ เนื่องจากช่วงเวลานี้ได้รับการอนุมัติให้รายการอื่นไปแล้ว"
      );
    }

    const updated = await tx.reservation.update({
      where: { id: res.id },
      data: {
        status: "CONFIRMED",
        approverId,
      },
      include: {
        resource: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        approver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      resourceId: updated.resourceId,
      resourceNameTh: updated.resource.nameTh,
      resourceNameEn: updated.resource.nameEn,
      resourceCode: updated.resource.code,
      resourceType: updated.resource.type as ResourceTypeEnum,
      userId: updated.userId,
      userName: updated.user.name ?? updated.user.email,
      userEmail: updated.user.email,
      purpose: updated.purpose,
      attendeeCount: updated.attendeeCount,
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime.toISOString(),
      status: updated.status as ReservationStatusEnum,
      approverId: updated.approverId,
      approverName: updated.approver ? updated.approver.name ?? updated.approver.email : null,
      rejectReason: null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}

export async function rejectReservation(
  tenantId: string,
  approverId: string,
  input: RejectReservationInput
): Promise<ReservationDto> {
  return prisma.$transaction(async (tx) => {
    const res = await tx.reservation.findFirst({
      where: { id: input.id, tenantId },
    });

    if (!res) {
      throw errors.not_found("ไม่พบรายการจองที่ระบุ");
    }

    if (res.status !== "PENDING") {
      throw errors.validation("สามารถปฏิเสธได้เฉพาะรายการที่อยู่ในสถานะรอพิจารณาเท่านั้น");
    }

    const updated = await tx.reservation.update({
      where: { id: res.id },
      data: {
        status: "REJECTED",
        approverId,
        rejectReason: input.reason,
      },
      include: {
        resource: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        approver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      resourceId: updated.resourceId,
      resourceNameTh: updated.resource.nameTh,
      resourceNameEn: updated.resource.nameEn,
      resourceCode: updated.resource.code,
      resourceType: updated.resource.type as ResourceTypeEnum,
      userId: updated.userId,
      userName: updated.user.name ?? updated.user.email,
      userEmail: updated.user.email,
      purpose: updated.purpose,
      attendeeCount: updated.attendeeCount,
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime.toISOString(),
      status: updated.status as ReservationStatusEnum,
      approverId: updated.approverId,
      approverName: updated.approver ? updated.approver.name ?? updated.approver.email : null,
      rejectReason: updated.rejectReason,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}

export async function cancelReservation(
  tenantId: string,
  userId: string,
  id: string,
  isManager = false
): Promise<ReservationDto> {
  return prisma.$transaction(async (tx) => {
    const res = await tx.reservation.findFirst({
      where: { id, tenantId },
    });

    if (!res) {
      throw errors.not_found("ไม่พบรายการจองที่ระบุ");
    }

    if (!isManager && res.userId !== userId) {
      throw errors.forbidden("คุณไม่มีสิทธิ์ยกเลิกรายการจองของผู้อื่น");
    }

    if (res.status === "CANCELLED" || res.status === "REJECTED") {
      throw errors.validation("รายการนี้ถูกยกเลิกหรือปฏิเสธไปแล้ว");
    }

    const updated = await tx.reservation.update({
      where: { id: res.id },
      data: {
        status: "CANCELLED",
      },
      include: {
        resource: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        approver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      resourceId: updated.resourceId,
      resourceNameTh: updated.resource.nameTh,
      resourceNameEn: updated.resource.nameEn,
      resourceCode: updated.resource.code,
      resourceType: updated.resource.type as ResourceTypeEnum,
      userId: updated.userId,
      userName: updated.user.name ?? updated.user.email,
      userEmail: updated.user.email,
      purpose: updated.purpose,
      attendeeCount: updated.attendeeCount,
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime.toISOString(),
      status: updated.status as ReservationStatusEnum,
      approverId: updated.approverId,
      approverName: updated.approver ? updated.approver.name ?? updated.approver.email : null,
      rejectReason: updated.rejectReason,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}
