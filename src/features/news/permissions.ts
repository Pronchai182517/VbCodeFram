import type { PermissionDef } from "@/shared/lib/permission-def";

export const NEWS_P = {
  newsRead: "news:read",
  newsManage: "news:manage",
  newsPublish: "news:publish",
} as const;

export const NEWS_PERMISSIONS: readonly PermissionDef[] = [
  { code: NEWS_P.newsRead, module: "news", action: "read" },
  { code: NEWS_P.newsManage, module: "news", action: "manage" },
  { code: NEWS_P.newsPublish, module: "news", action: "publish" },
];
