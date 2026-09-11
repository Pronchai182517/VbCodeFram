import { prisma } from "@/shared/lib/infra/prisma";
import { generateSlug, type CreateArticleInput, type UpdateArticleInput } from "./validations";

export interface ArticleAttachmentDto {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface ArticleDto {
  id: string;
  tenantId: string;
  category: string;
  status: string;
  titleTh: string;
  titleEn: string;
  slug: string;
  contentTh: string;
  contentEn: string;
  coverImageUrl: string | null;
  isPinned: boolean;
  viewCount: number;
  publishedAt: string | null;
  authorName: string | null;
  attachmentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleDetailDto extends ArticleDto {
  attachments: ArticleAttachmentDto[];
}

export async function listArticles(
  tenantId: string,
  options?: { category?: string; status?: string; search?: string; page?: number; limit?: number }
): Promise<{ items: ArticleDto[]; total: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { tenantId };
  if (options?.category) where.category = options.category;
  if (options?.status) where.status = options.status;
  if (options?.search) {
    where.OR = [
      { titleTh: { contains: options.search, mode: "insensitive" } },
      { titleEn: { contains: options.search, mode: "insensitive" } },
      { contentTh: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: {
        author: { select: { name: true } },
        _count: { select: { attachments: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return {
    items: items.map((a) => ({
      id: a.id,
      tenantId: a.tenantId,
      category: a.category,
      status: a.status,
      titleTh: a.titleTh,
      titleEn: a.titleEn,
      slug: a.slug,
      contentTh: a.contentTh,
      contentEn: a.contentEn,
      coverImageUrl: a.coverImageUrl,
      isPinned: a.isPinned,
      viewCount: a.viewCount,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      authorName: a.author?.name ?? null,
      attachmentsCount: a._count.attachments,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    total,
  };
}

export async function listPublicArticles(
  tenantId: string,
  options?: { category?: string; search?: string; page?: number; limit?: number }
): Promise<{ items: ArticleDto[]; total: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 12;
  const skip = (page - 1) * limit;

  const now = new Date();
  const where: Record<string, unknown> = {
    tenantId,
    status: "PUBLISHED",
    publishedAt: { lte: now },
  };

  if (options?.category) where.category = options.category;
  if (options?.search) {
    where.OR = [
      { titleTh: { contains: options.search, mode: "insensitive" } },
      { titleEn: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      skip,
      take: limit,
      include: {
        author: { select: { name: true } },
        _count: { select: { attachments: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return {
    items: items.map((a) => ({
      id: a.id,
      tenantId: a.tenantId,
      category: a.category,
      status: a.status,
      titleTh: a.titleTh,
      titleEn: a.titleEn,
      slug: a.slug,
      contentTh: a.contentTh,
      contentEn: a.contentEn,
      coverImageUrl: a.coverImageUrl,
      isPinned: a.isPinned,
      viewCount: a.viewCount,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      authorName: a.author?.name ?? null,
      attachmentsCount: a._count.attachments,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    total,
  };
}

export async function getArticleBySlug(tenantId: string, slug: string): Promise<ArticleDetailDto | null> {
  const a = await prisma.article.findFirst({
    where: { tenantId, slug },
    include: {
      author: { select: { name: true } },
      attachments: true,
      _count: { select: { attachments: true } },
    },
  });

  if (!a) return null;

  return {
    id: a.id,
    tenantId: a.tenantId,
    category: a.category,
    status: a.status,
    titleTh: a.titleTh,
    titleEn: a.titleEn,
    slug: a.slug,
    contentTh: a.contentTh,
    contentEn: a.contentEn,
    coverImageUrl: a.coverImageUrl,
    isPinned: a.isPinned,
    viewCount: a.viewCount,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    authorName: a.author?.name ?? null,
    attachmentsCount: a._count.attachments,
    attachments: a.attachments.map((att) => ({
      id: att.id,
      fileName: att.fileName,
      fileUrl: att.fileUrl,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
    })),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export async function getArticleById(tenantId: string, id: string): Promise<ArticleDetailDto | null> {
  const a = await prisma.article.findFirst({
    where: { tenantId, id },
    include: {
      author: { select: { name: true } },
      attachments: true,
      _count: { select: { attachments: true } },
    },
  });

  if (!a) return null;

  return {
    id: a.id,
    tenantId: a.tenantId,
    category: a.category,
    status: a.status,
    titleTh: a.titleTh,
    titleEn: a.titleEn,
    slug: a.slug,
    contentTh: a.contentTh,
    contentEn: a.contentEn,
    coverImageUrl: a.coverImageUrl,
    isPinned: a.isPinned,
    viewCount: a.viewCount,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    authorName: a.author?.name ?? null,
    attachmentsCount: a._count.attachments,
    attachments: a.attachments.map((att) => ({
      id: att.id,
      fileName: att.fileName,
      fileUrl: att.fileUrl,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
    })),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export async function createArticle(
  tenantId: string,
  input: CreateArticleInput,
  authorId?: string
): Promise<ArticleDetailDto> {
  const slug = input.slug?.trim() || generateSlug(input.titleEn || input.titleTh);

  // ตรวจสอบ slug ซ้ำใน tenant เดียวกัน
  let finalSlug = slug;
  let counter = 1;
  while (await prisma.article.findUnique({ where: { tenantId_slug: { tenantId, slug: finalSlug } } })) {
    finalSlug = `${slug}-${counter++}`;
  }

  const publishedAt = input.status === "PUBLISHED" ? new Date() : null;

  const created = await prisma.article.create({
    data: {
      tenantId,
      authorId: authorId ?? null,
      titleTh: input.titleTh,
      titleEn: input.titleEn,
      slug: finalSlug,
      category: input.category,
      status: input.status,
      contentTh: input.contentTh,
      contentEn: input.contentEn,
      coverImageUrl: input.coverImageUrl || null,
      isPinned: input.isPinned,
      publishedAt,
      attachments: input.attachments?.length
        ? {
            create: input.attachments.map((att: { fileName: string; fileUrl: string; fileSize: number; mimeType: string }) => ({
              fileName: att.fileName,
              fileUrl: att.fileUrl,
              fileSize: att.fileSize,
              mimeType: att.mimeType,
            })),
          }
        : undefined,
    },
    include: {
      author: { select: { name: true } },
      attachments: true,
      _count: { select: { attachments: true } },
    },
  });

  return {
    id: created.id,
    tenantId: created.tenantId,
    category: created.category,
    status: created.status,
    titleTh: created.titleTh,
    titleEn: created.titleEn,
    slug: created.slug,
    contentTh: created.contentTh,
    contentEn: created.contentEn,
    coverImageUrl: created.coverImageUrl,
    isPinned: created.isPinned,
    viewCount: created.viewCount,
    publishedAt: created.publishedAt?.toISOString() ?? null,
    authorName: created.author?.name ?? null,
    attachmentsCount: created._count.attachments,
    attachments: created.attachments.map((att) => ({
      id: att.id,
      fileName: att.fileName,
      fileUrl: att.fileUrl,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
    })),
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateArticle(tenantId: string, input: UpdateArticleInput): Promise<ArticleDetailDto> {
  const existing = await prisma.article.findFirst({
    where: { tenantId, id: input.id },
  });
  if (!existing) {
    throw new Error("Article not found");
  }

  const publishedAt =
    input.status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt;

  const updated = await prisma.article.update({
    where: { id: input.id },
    data: {
      titleTh: input.titleTh,
      titleEn: input.titleEn,
      category: input.category,
      status: input.status,
      contentTh: input.contentTh,
      contentEn: input.contentEn,
      coverImageUrl: input.coverImageUrl || null,
      isPinned: input.isPinned,
      publishedAt,
    },
    include: {
      author: { select: { name: true } },
      attachments: true,
      _count: { select: { attachments: true } },
    },
  });

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    category: updated.category,
    status: updated.status,
    titleTh: updated.titleTh,
    titleEn: updated.titleEn,
    slug: updated.slug,
    contentTh: updated.contentTh,
    contentEn: updated.contentEn,
    coverImageUrl: updated.coverImageUrl,
    isPinned: updated.isPinned,
    viewCount: updated.viewCount,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
    authorName: updated.author?.name ?? null,
    attachmentsCount: updated._count.attachments,
    attachments: updated.attachments.map((att) => ({
      id: att.id,
      fileName: att.fileName,
      fileUrl: att.fileUrl,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
    })),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteArticle(tenantId: string, id: string): Promise<void> {
  await prisma.article.deleteMany({
    where: { tenantId, id },
  });
}

export async function incrementArticleViewCount(tenantId: string, id: string): Promise<void> {
  await prisma.article.updateMany({
    where: { tenantId, id },
    data: { viewCount: { increment: 1 } },
  });
}
