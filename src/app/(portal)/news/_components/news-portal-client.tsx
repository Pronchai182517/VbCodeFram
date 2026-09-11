"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Pin,
  Calendar,
  Eye,
  FileText,
  ArrowRight,
  Newspaper,
  BookOpen,
  Sparkles,
  Megaphone,
} from "lucide-react";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { formatDate } from "@/shared/lib/format";
import type { ArticleDto } from "@/features/news";

interface Props {
  articles: ArticleDto[];
}

const CATEGORY_ICONS: Record<string, typeof Newspaper> = {
  GENERAL: Newspaper,
  ACTIVITY: Sparkles,
  ACADEMIC: BookOpen,
  ANNOUNCEMENT: Megaphone,
};

export function NewsPortalClient({ articles }: Props) {
  const t = useT();
  const locale = useLocale();

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { key: "ALL", label: t("news.portal.allCategories") },
    { key: "GENERAL", label: t("news.category.GENERAL") },
    { key: "ACTIVITY", label: t("news.category.ACTIVITY") },
    { key: "ACADEMIC", label: t("news.category.ACADEMIC") },
    { key: "ANNOUNCEMENT", label: t("news.category.ANNOUNCEMENT") },
  ];

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchCategory = selectedCategory === "ALL" || a.category === selectedCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTh = a.titleTh.toLowerCase().includes(q) || a.contentTh.toLowerCase().includes(q);
      const inEn = (a.titleEn?.toLowerCase().includes(q)) || (a.contentEn?.toLowerCase().includes(q));
      return inTh || inEn;
    });
  }, [articles, selectedCategory, searchQuery]);

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
          <Newspaper className="h-3.5 w-3.5" />
          {t("news.nav")}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {t("news.portal.title")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          {t("news.portal.subtitle")}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/60 pb-6">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSelectedCategory(c.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === c.key
                  ? "bg-primary text-primary-foreground shadow-sm scale-102"
                  : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("news.portal.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border/60 bg-muted/10 space-y-3">
          <div className="h-12 w-12 rounded-full bg-muted/80 text-muted-foreground flex items-center justify-center mx-auto">
            <Newspaper className="h-6 w-6" />
          </div>
          <div className="font-semibold text-foreground text-base">
            {t("news.portal.noResults")}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("news.empty")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => {
            const title =
              locale === "en" && article.titleEn ? article.titleEn : article.titleTh;
            const content =
              locale === "en" && article.contentEn ? article.contentEn : article.contentTh;
            const preview = content.slice(0, 140) + (content.length > 140 ? "..." : "");
            const Icon = CATEGORY_ICONS[article.category] || Newspaper;

            return (
              <article
                key={article.id}
                className={`group flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden bg-card hover:shadow-lg hover:-translate-y-0.5 ${
                  article.isPinned
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : "border-border/60 hover:border-border"
                }`}
              >
                {/* Image Cover or Fallback */}
                <Link
                  href={`/news/${article.slug}`}
                  className="relative aspect-video w-full overflow-hidden bg-muted flex items-center justify-center block"
                >
                  {article.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.coverImageUrl}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 via-muted to-muted/80 flex flex-col items-center justify-center gap-2 text-primary/40 group-hover:scale-105 transition-transform duration-300">
                      <Icon className="h-10 w-10 text-primary/30" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        {t(`news.category.${article.category}`)}
                      </span>
                    </div>
                  )}

                  {/* Pinned Tag */}
                  {article.isPinned && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-md">
                      <Pin className="h-3 w-3 fill-current" />
                      <span>{t("news.portal.featured")}</span>
                    </div>
                  )}

                  {/* Category Pill on Image */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md bg-background/90 backdrop-blur-sm text-[11px] font-semibold text-foreground shadow-sm">
                    {t(`news.category.${article.category}`)}
                  </div>
                </Link>

                {/* Card Content */}
                <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    {/* Meta info: Date & Views */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {article.publishedAt
                          ? formatDate(article.publishedAt, locale)
                          : "-"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {article.viewCount}
                      </span>
                      {article.attachmentsCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-primary">
                            <FileText className="h-3.5 w-3.5" />
                            {article.attachmentsCount}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="font-bold text-base leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                      <Link href={`/news/${article.slug}`}>{title}</Link>
                    </h2>

                    {/* Preview Text */}
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {preview}
                    </p>
                  </div>

                  {/* Read More Link */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <Link
                      href={`/news/${article.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform"
                    >
                      {t("news.portal.readMore")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
