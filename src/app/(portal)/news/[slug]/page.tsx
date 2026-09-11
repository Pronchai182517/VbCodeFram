import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Eye,
  FileText,
  Download,
  Pin,
  User,
  ArrowLeft,
} from "lucide-react";
import { getT, getBrandLabels } from "@/i18n/server";
import { getLocaleCookie } from "@/shared/lib/i18n/server";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n/config";
import { formatDate } from "@/shared/lib/format";
import { auth } from "@/features/identity/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { getArticleBySlug, incrementArticleViewCount } from "@/features/news/server";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getT();
  const brand = await getBrandLabels();
  const session = await auth().catch(() => null);
  const tenantId =
    session?.tenantId ||
    (await prisma.tenant.findFirst({ select: { id: true } }))?.id ||
    "";

  if (!tenantId) return { title: t("news.portal.title") };

  const article = await getArticleBySlug(tenantId, slug);
  if (!article) return { title: t("news.portal.title") };

  const locale = (await getLocaleCookie()) ?? DEFAULT_LOCALE;
  const title = locale === "en" && article.titleEn ? article.titleEn : article.titleTh;
  const content = locale === "en" && article.contentEn ? article.contentEn : article.contentTh;

  return {
    title: `${title} | ${brand.name}`,
    description: content.slice(0, 160),
    openGraph: {
      title,
      description: content.slice(0, 160),
      images: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const t = await getT();
  const locale = (await getLocaleCookie()) ?? DEFAULT_LOCALE;

  const session = await auth().catch(() => null);
  const tenantId =
    session?.tenantId ||
    (await prisma.tenant.findFirst({ select: { id: true } }))?.id ||
    "";

  if (!tenantId) notFound();

  const article = await getArticleBySlug(tenantId, slug);
  if (!article || article.status !== "PUBLISHED") {
    notFound();
  }

  // Increment view count asynchronously
  incrementArticleViewCount(tenantId, article.id).catch(() => {
    // Non-blocking view increment
  });

  const title = locale === "en" && article.titleEn ? article.titleEn : article.titleTh;
  const content = locale === "en" && article.contentEn ? article.contentEn : article.contentTh;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Navigation / Back Button */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/news">
            <ArrowLeft className="h-4 w-4" />
            {t("news.portal.backToList")}
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {article.isPinned && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Pin className="h-3.5 w-3.5 fill-current" />
              {t("news.portal.featured")}
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            {t(`news.category.${article.category}`)}
          </span>
        </div>
      </div>

      {/* Main Article Header */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-foreground">
          {title}
        </h1>

        {/* Metadata Bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground border-y border-border/40 py-3">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            {article.publishedAt
              ? formatDate(article.publishedAt, locale)
              : "-"}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-primary" />
            {article.viewCount + 1} {t("news.views")}
          </span>
          {article.authorName && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" />
                {article.authorName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Cover Image (if present) */}
      {article.coverImageUrl && (
        <div className="rounded-2xl overflow-hidden border border-border/60 shadow-sm aspect-video sm:aspect-21/9 bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.coverImageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground text-base leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
        {content}
      </div>

      {/* Attachments Section */}
      {article.attachments && article.attachments.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-foreground text-base">
            <FileText className="h-5 w-5 text-primary" />
            {t("news.attachments")} ({article.attachments.length})
          </div>
          <div className="divide-y divide-border/40">
            {article.attachments.map((att) => (
              <div
                key={att.id}
                className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-sm text-foreground truncate">
                      {att.fileName}
                    </div>
                    {att.fileSize && (
                      <div className="text-xs text-muted-foreground">
                        {(att.fileSize / 1024).toFixed(1)} KB
                      </div>
                    )}
                  </div>
                </div>

                <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
                  <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4" />
                    <span>{t("news.portal.download")}</span>
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer / Share & Return */}
      <div className="pt-8 border-t border-border/60 flex items-center justify-between">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/news">
            <ArrowLeft className="h-4 w-4" />
            {t("news.portal.backToList")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
