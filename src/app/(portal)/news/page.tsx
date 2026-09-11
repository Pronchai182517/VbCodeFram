import type { Metadata } from "next";
import { getT, getBrandLabels } from "@/i18n/server";
import { auth } from "@/features/identity/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { listPublicArticles } from "@/features/news/server";
import { NewsPortalClient } from "./_components/news-portal-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const brand = await getBrandLabels();
  return {
    title: `${t("news.portal.title")} | ${brand.name}`,
    description: t("news.portal.subtitle"),
  };
}

export default async function NewsPortalPage() {
  const session = await auth().catch(() => null);
  const tenantId =
    session?.tenantId ||
    (await prisma.tenant.findFirst({ select: { id: true } }))?.id ||
    "";

  if (!tenantId) {
    return <NewsPortalClient articles={[]} />;
  }

  const { items } = await listPublicArticles(tenantId, { limit: 60 });

  return <NewsPortalClient articles={items} />;
}
