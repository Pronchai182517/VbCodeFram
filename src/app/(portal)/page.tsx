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
import { resolveBrandText } from "@/features/identity/server";
import { PortalHomeClient } from "./_components/portal-home-client";

export async function generateMetadata(): Promise<Metadata> {
  // ชื่อบนแท็บเบราว์เซอร์ตามข้อความที่องค์กรตั้งไว้ (ถอยไปใช้ค่าตั้งต้นถ้ายังไม่ได้ตั้ง)
  const [t, brand] = await Promise.all([getT(), resolveBrandText()]);
  const name = brand?.nameTh?.trim() || t("app.name");
  const tagline = brand?.taglineTh?.trim() || t("app.tagline");
  return {
    title: `${name} | ${tagline}`,
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
