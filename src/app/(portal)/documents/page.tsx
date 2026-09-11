import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { DocumentTrackingClient } from "./_components/document-tracking-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: `${t("documents.portal.title")} | ${t("app.name")}`,
    description: t("documents.portal.subtitle"),
  };
}

export default function DocumentTrackingPortalPage() {
  return <DocumentTrackingClient />;
}
