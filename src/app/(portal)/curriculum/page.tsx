import type { Metadata } from "next";
import { getT, getBrandLabels } from "@/i18n/server";
import { auth } from "@/features/identity/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { listPrograms, listCourses } from "@/features/curriculum/server";
import { CurriculumPortalClient } from "./_components/curriculum-portal-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const brand = await getBrandLabels();
  return {
    title: `${t("curriculum.portal.title")} | ${brand.name}`,
    description: t("curriculum.portal.subtitle"),
  };
}

export default async function CurriculumPortalPage() {
  const session = await auth().catch(() => null);
  const tenantId =
    session?.tenantId ||
    (await prisma.tenant.findFirst({ select: { id: true } }))?.id ||
    "";

  if (!tenantId) {
    return <CurriculumPortalClient programs={[]} courses={[]} />;
  }

  const [programs, courses] = await Promise.all([
    listPrograms(tenantId, { isActive: true }),
    listCourses(tenantId),
  ]);

  return <CurriculumPortalClient programs={programs} courses={courses} />;
}
