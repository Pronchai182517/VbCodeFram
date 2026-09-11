import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { auth } from "@/features/identity/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { listPublicArticles } from "@/features/news/server";
import { listPrograms } from "@/features/curriculum/server";
import {
  listDepartments,
  listPublicStaffProfiles,
} from "@/features/personnel/server";
import { listResources } from "@/features/booking/server";
import { PortalHomeClient } from "./_components/portal-home-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: `${t("app.name")} | ${t("app.tagline")}`,
    description: "ระบบสารสนเทศและบริการดิจิทัล คณะวิทยาศาสตร์และเทคโนโลยีสารสนเทศ - ข่าวสาร ทำเนียบบุคลากร หลักสูตร คำร้องออนไลน์ และระบบจองทรัพยากร",
  };
}

export default async function PortalHomePage() {
  const session = await auth().catch(() => null);
  const tenantId =
    session?.tenantId ||
    (await prisma.tenant.findFirst({ select: { id: true } }))?.id ||
    "";

  if (!tenantId) {
    return (
      <PortalHomeClient
        articles={[]}
        programs={[]}
        departments={[]}
        staffCount={0}
        resourceCount={0}
      />
    );
  }

  const [articlesRes, programs, departments, staff, resources] =
    await Promise.all([
      listPublicArticles(tenantId, { limit: 4 }),
      listPrograms(tenantId, { isActive: true }),
      listDepartments(tenantId),
      listPublicStaffProfiles(tenantId),
      listResources(tenantId, { isActive: true }),
    ]);

  return (
    <PortalHomeClient
      articles={articlesRes.items}
      programs={programs}
      departments={departments}
      staffCount={staff.length}
      resourceCount={resources.length}
    />
  );
}
