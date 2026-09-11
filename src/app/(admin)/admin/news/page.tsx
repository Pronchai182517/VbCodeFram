import { requirePermission, hasPermission } from "@/features/identity/server";
import { NEWS_P, listArticles } from "@/features/news/server";
import { NewsClient } from "./_components/news-client";

export default async function NewsPage() {
  const ctx = await requirePermission(NEWS_P.newsRead);
  const initialData = await listArticles(ctx.tenantId, { limit: 50 });

  return (
    <NewsClient
      initialItems={initialData.items}
      totalCount={initialData.total}
      canManage={hasPermission(ctx, NEWS_P.newsManage)}
      canPublish={hasPermission(ctx, NEWS_P.newsPublish)}
    />
  );
}
