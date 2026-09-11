"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/shared/lib/result";
import { prisma } from "@/shared/lib/infra/prisma";
import {
  requirePermission,
  hasPermission,
  auth,
} from "@/features/identity/server";
import { BOOKING_P } from "../permissions";
import {
  createResourceSchema,
  updateResourceSchema,
  createReservationSchema,
  approveReservationSchema,
  rejectReservationSchema,
  listReservationsQuerySchema,
  listResourcesQuerySchema,
  type ResourceTypeEnum,
} from "./validations";
import {
  listResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  listReservations,
  getReservationById,
  getCalendarEvents,
  createReservation,
  approveReservation,
  rejectReservation,
  cancelReservation,
} from "./services";

// ---------------------------------------------------------------------------
// Resource Actions
// ---------------------------------------------------------------------------

export async function getResourcesAction(query?: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingRead);
    const parsed = listResourcesQuerySchema.parse(query ?? {});
    return listResources(ctx.tenantId, parsed);
  });
}

export async function getResourceByIdAction(id: string) {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingRead);
    return getResourceById(ctx.tenantId, id);
  });
}

export async function createResourceAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingManage);
    const parsed = createResourceSchema.parse(input);
    const r = await createResource(ctx.tenantId, parsed);
    revalidatePath("/admin/bookings");
    revalidatePath("/calendar");
    return r;
  });
}

export async function updateResourceAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingManage);
    const parsed = updateResourceSchema.parse(input);
    const r = await updateResource(ctx.tenantId, parsed);
    revalidatePath("/admin/bookings");
    revalidatePath("/calendar");
    return r;
  });
}

export async function deleteResourceAction(id: string) {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingManage);
    await deleteResource(ctx.tenantId, id);
    revalidatePath("/admin/bookings");
    revalidatePath("/calendar");
  });
}

// ---------------------------------------------------------------------------
// Reservation Actions
// ---------------------------------------------------------------------------

export async function getReservationsAction(query?: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingRead);
    const parsed = listReservationsQuerySchema.parse(query ?? {});
    return listReservations(ctx.tenantId, parsed, ctx.userId);
  });
}

export async function getReservationByIdAction(id: string) {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingRead);
    return getReservationById(ctx.tenantId, id);
  });
}

export async function getCalendarEventsAction(
  startDate?: string,
  endDate?: string,
  type?: string
) {
  return runAction(async () => {
    const session = await auth().catch(() => null);
    const tenantId =
      session?.tenantId ||
      (await prisma.tenant.findFirst({ select: { id: true } }))?.id ||
      "";

    if (!tenantId) {
      return [];
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const resType = type && type !== "ALL" ? (type as ResourceTypeEnum) : undefined;

    return getCalendarEvents(tenantId, start, end, resType);
  });
}

export async function createReservationAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingCreate);
    const parsed = createReservationSchema.parse(input);
    const res = await createReservation(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/admin/bookings");
    revalidatePath("/calendar");
    return res;
  });
}

export async function approveReservationAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingApprove);
    const parsed = approveReservationSchema.parse(input);
    const res = await approveReservation(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/admin/bookings");
    revalidatePath("/calendar");
    return res;
  });
}

export async function rejectReservationAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingApprove);
    const parsed = rejectReservationSchema.parse(input);
    const res = await rejectReservation(ctx.tenantId, ctx.userId, parsed);
    revalidatePath("/admin/bookings");
    revalidatePath("/calendar");
    return res;
  });
}

export async function cancelReservationAction(id: string) {
  return runAction(async () => {
    const ctx = await requirePermission(BOOKING_P.bookingCreate);
    const isManager = hasPermission(ctx, BOOKING_P.bookingManage);
    const res = await cancelReservation(ctx.tenantId, ctx.userId, id, isManager);
    revalidatePath("/admin/bookings");
    revalidatePath("/calendar");
    return res;
  });
}
