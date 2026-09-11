import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { requirePermission, hasPermission } from "@/features/identity/server";
import { BOOKING_P } from "@/features/booking";
import {
  listResources,
  listReservations,
} from "@/features/booking/server";
import { BookingsClient } from "./_components/bookings-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: `${t("booking.title")} | ${t("app.name")}`,
    description: t("booking.subtitle"),
  };
}

export default async function AdminBookingsPage() {
  const ctx = await requirePermission(BOOKING_P.bookingRead);

  const canCreate = hasPermission(ctx, BOOKING_P.bookingCreate);
  const canApprove = hasPermission(ctx, BOOKING_P.bookingApprove);
  const canManage = hasPermission(ctx, BOOKING_P.bookingManage);

  const [initialReservations, resources] = await Promise.all([
    listReservations(ctx.tenantId, {}, ctx.userId),
    listResources(ctx.tenantId, {}),
  ]);

  return (
    <BookingsClient
      initialReservations={initialReservations}
      resources={resources}
      currentUserId={ctx.userId}
      canCreate={canCreate}
      canApprove={canApprove}
      canManage={canManage}
    />
  );
}
