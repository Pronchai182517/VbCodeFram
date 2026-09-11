import { z } from "zod";

export const articleCategoryEnum = z.enum(["GENERAL", "ACTIVITY", "ACADEMIC", "ANNOUNCEMENT"]);
export const articleStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export type ArticleCategoryType = z.infer<typeof articleCategoryEnum>;
export type ArticleStatusType = z.infer<typeof articleStatusEnum>;

export function generateSlug(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `article-${Date.now()}`;
}

export const articleAttachmentSchema = z.object({
  id: z.string().uuid().optional(),
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url(),
  fileSize: z.coerce.number().min(1),
  mimeType: z.string().min(1).max(100),
});

export const createArticleSchema = z.object({
  titleTh: z.string().min(3, "ระบุหัวข้อภาษาไทยอย่างน้อย 3 ตัวอักษร").max(255),
  titleEn: z.string().min(3, "Title must be at least 3 characters").max(255),
  slug: z.string().max(255).optional(),
  category: articleCategoryEnum.default("GENERAL"),
  contentTh: z.string().min(5, "ระบุเนื้อหาภาษาไทยอย่างน้อย 5 ตัวอักษร"),
  contentEn: z.string().min(5, "Content must be at least 5 characters"),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  isPinned: z.boolean().default(false),
  status: articleStatusEnum.default("DRAFT"),
  attachments: z.array(articleAttachmentSchema).optional().default([]),
});

export const updateArticleSchema = createArticleSchema.extend({
  id: z.string().uuid(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticleAttachmentInput = z.infer<typeof articleAttachmentSchema>;
