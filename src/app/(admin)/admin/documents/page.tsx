import type { Metadata } from "next";
import { getT, getBrandLabels } from "@/i18n/server";
import {
  requirePermission,
  hasPermission,
} from "@/features/identity/server";
import { DOCUMENTS_P } from "@/features/document-flow";
import {
  listDocuments,
  getAvailableApprovers,
} from "@/features/document-flow/server";
import { DocumentsClient } from "./_components/documents-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const brand = await getBrandLabels();
  return {
    title: `${t("documents.title")} | ${brand.name}`,
    description: t("documents.subtitle"),
  };
}

export default async function AdminDocumentsPage() {
  const ctx = await requirePermission(DOCUMENTS_P.documentsRead);

  const canCreate = hasPermission(ctx, DOCUMENTS_P.documentsCreate);
  const canApprove = hasPermission(ctx, DOCUMENTS_P.documentsApprove);
  const canManage = hasPermission(ctx, DOCUMENTS_P.documentsManage);

  const [initialDocuments, availableApprovers] = await Promise.all([
    listDocuments(ctx.tenantId, ctx.userId, { tab: "my" }),
    getAvailableApprovers(ctx.tenantId),
  ]);

  return (
    <DocumentsClient
      initialDocuments={initialDocuments}
      availableApprovers={availableApprovers}
      currentUserId={ctx.userId}
      canCreate={canCreate}
      canApprove={canApprove}
      canManage={canManage}
    />
  );
}
