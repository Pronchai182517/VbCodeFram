import type { Metadata } from "next";
import { getT, getBrandLabels } from "@/i18n/server";
import { DocumentTrackingClient } from "./_components/document-tracking-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const brand = await getBrandLabels();
  return {
    title: `${t("documents.portal.title")} | ${brand.name}`,
    description: t("documents.portal.subtitle"),
  };
}

export default function DocumentTrackingPortalPage() {
  return <DocumentTrackingClient />;
}
