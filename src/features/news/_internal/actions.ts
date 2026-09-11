"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission } from "@/features/identity/server";
import { NEWS_P } from "../permissions";
import { createArticleSchema, updateArticleSchema } from "./validations";
import {
  createArticle,
  updateArticle,
  deleteArticle,
  listArticles,
  incrementArticleViewCount,
  type ArticleDto,
  type ArticleDetailDto,
} from "./services";

export async function getArticlesAction(options?: {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ items: ArticleDto[]; total: number }>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsRead);
    return listArticles(ctx.tenantId, options);
  });
}

export async function createArticleAction(input: unknown): Promise<ActionResult<ArticleDetailDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsManage);
    const parsed = createArticleSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await createArticle(ctx.tenantId, parsed, ctx.userId);
    revalidatePath("/admin/news");
    revalidatePath("/news");
    return result;
  });
}

export async function updateArticleAction(input: unknown): Promise<ActionResult<ArticleDetailDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsManage);
    const parsed = updateArticleSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await updateArticle(ctx.tenantId, parsed);
    revalidatePath("/admin/news");
    revalidatePath("/news");
    return result;
  });
}

export async function deleteArticleAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsManage);
    await deleteArticle(ctx.tenantId, id);
    revalidatePath("/admin/news");
    revalidatePath("/news");
  });
}

export async function incrementArticleViewAction(tenantId: string, id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    await incrementArticleViewCount(tenantId, id);
  });
}
