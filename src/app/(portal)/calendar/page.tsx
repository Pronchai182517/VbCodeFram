import type { Metadata } from "next";
import { getT, getBrandLabels } from "@/i18n/server";
import { auth } from "@/features/identity/server";
import { prisma } from "@/shared/lib/infra/prisma";
import {
  listResources,
  getCalendarEvents,
} from "@/features/booking/server";
import { BookingCalendarClient } from "./_components/booking-calendar-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const brand = await getBrandLabels();
  return {
    title: `${t("booking.portal.title")} | ${brand.name}`,
    description: t("booking.portal.subtitle"),
  };
}

export default async function BookingCalendarPortalPage() {
  const session = await auth().catch(() => null);
  const tenantId =
    session?.tenantId ||
    (await prisma.tenant.findFirst({ select: { id: true } }))?.id ||
    "";

  if (!tenantId) {
    return <BookingCalendarClient resources={[]} events={[]} />;
  }

  const [resources, events] = await Promise.all([
    listResources(tenantId, { isActive: true }),
    getCalendarEvents(tenantId),
  ]);

  return <BookingCalendarClient resources={resources} events={events} />;
}
