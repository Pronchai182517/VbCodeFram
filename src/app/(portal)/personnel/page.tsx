import type { Metadata } from "next";
import { getT, getBrandLabels } from "@/i18n/server";
import { auth } from "@/features/identity/server";
import { prisma } from "@/shared/lib/infra/prisma";
import {
  listPublicStaffProfiles,
  listDepartments,
} from "@/features/personnel/server";
import { PersonnelPortalClient } from "./_components/personnel-portal-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const brand = await getBrandLabels();
  return {
    title: `${t("personnel.portal.title")} | ${brand.name}`,
    description: t("personnel.portal.subtitle"),
  };
}

export default async function PersonnelPortalPage() {
  const session = await auth().catch(() => null);
  const tenantId =
    session?.tenantId ||
    (await prisma.tenant.findFirst({ select: { id: true } }))?.id ||
    "";

  if (!tenantId) {
    return <PersonnelPortalClient staffList={[]} departments={[]} />;
  }

  const [staff, departments] = await Promise.all([
    listPublicStaffProfiles(tenantId),
    listDepartments(tenantId),
  ]);

  return <PersonnelPortalClient staffList={staff} departments={departments} />;
}
