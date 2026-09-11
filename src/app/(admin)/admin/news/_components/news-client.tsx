"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, Newspaper, Eye, Pin, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { formatDate } from "@/shared/lib/format";
import {
  LiyonCard,
  DataTable,
  StatusPill,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogCloseButton,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonField,
  RowMenuItem,
  type DataTableColumn,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import type { ArticleDto } from "@/features/news";
import {
  createArticleAction,
  updateArticleAction,
  deleteArticleAction,
  getArticlesAction,
} from "@/features/news/actions";

interface Props {
  initialItems: ArticleDto[];
  totalCount: number;
  canManage: boolean;
  canPublish: boolean;
}

export function NewsClient({ initialItems, canManage, canPublish }: Props) {
  const t = useT();
  const locale = useLocale();
  const [items, setItems] = useState<ArticleDto[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ArticleDto | null>(null);
  const [editingItem, setEditingItem] = useState<ArticleDto | null>(null);

  // Form states
  const [titleTh, setTitleTh] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [category, setCategory] = useState<"GENERAL" | "ACTIVITY" | "ACADEMIC" | "ANNOUNCEMENT">("GENERAL");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [contentTh, setContentTh] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const openCreateDialog = () => {
    setEditingItem(null);
    setTitleTh("");
    setTitleEn("");
    setCategory("GENERAL");
    setStatus("DRAFT");
    setContentTh("");
    setContentEn("");
    setCoverImageUrl("");
    setIsPinned(false);
    setModalOpen(true);
  };

  const openEditDialog = (item: ArticleDto) => {
    setEditingItem(item);
    setTitleTh(item.titleTh);
    setTitleEn(item.titleEn);
    setCategory(item.category as typeof category);
    setStatus(item.status as typeof status);
    setContentTh(item.contentTh);
    setContentEn(item.contentEn);
    setCoverImageUrl(item.coverImageUrl ?? "");
    setIsPinned(item.isPinned);
    setModalOpen(true);
  };

  const refreshItems = async () => {
    const res = await getArticlesAction();
    if (res.ok) {
      setItems(res.data.items);
    }
  };

  const handleSave = () => {
    if (!titleTh.trim() || !titleEn.trim() || !contentTh.trim() || !contentEn.trim()) {
      toast.error(t("error.validation"));
      return;
    }

    startTransition(async () => {
      if (editingItem) {
        const res = await updateArticleAction({
          id: editingItem.id,
          titleTh: titleTh.trim(),
          titleEn: titleEn.trim(),
          category,
          status,
          contentTh: contentTh.trim(),
          contentEn: contentEn.trim(),
          coverImageUrl: coverImageUrl.trim() || undefined,
          isPinned,
        });
        if (res.ok) {
          toast.success(t("news.updateSuccess"));
          setModalOpen(false);
          await refreshItems();
        } else {
          toast.error(t("common.error"));
        }
      } else {
        const res = await createArticleAction({
          titleTh: titleTh.trim(),
          titleEn: titleEn.trim(),
          category,
          status,
          contentTh: contentTh.trim(),
          contentEn: contentEn.trim(),
          coverImageUrl: coverImageUrl.trim() || undefined,
          isPinned,
        });
        if (res.ok) {
          toast.success(t("news.createSuccess"));
          setModalOpen(false);
          await refreshItems();
        } else {
          toast.error(t("common.error"));
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteArticleAction(id);
      if (res.ok) {
        toast.success(t("news.deleteSuccess"));
        setDeleteConfirmItem(null);
        await refreshItems();
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  const handleTogglePublish = (item: ArticleDto) => {
    startTransition(async () => {
      const nextStatus = item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      const res = await updateArticleAction({
        id: item.id,
        titleTh: item.titleTh,
        titleEn: item.titleEn,
        category: item.category as typeof category,
        status: nextStatus,
        contentTh: item.contentTh,
        contentEn: item.contentEn,
        coverImageUrl: item.coverImageUrl || undefined,
        isPinned: item.isPinned,
      });
      if (res.ok) {
        toast.success(nextStatus === "PUBLISHED" ? t("news.publish") : t("news.unpublish"));
        await refreshItems();
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  const columns: DataTableColumn<ArticleDto>[] = [
    {
      key: "title",
      header: t("news.titleTh"),
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {item.isPinned && (
              <span className="flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                <Pin className="h-3 w-3" /> Pin
              </span>
            )}
            <span className="font-medium text-foreground">
              {locale === "en" ? item.titleEn : item.titleTh}
            </span>
          </div>
          <span className="text-xs text-muted-foreground line-clamp-1">
            {locale === "en" ? item.titleTh : item.titleEn}
          </span>
        </div>
      ),
    },
    {
      key: "category",
      header: t("news.category"),
      render: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border">
          {t(`news.category.${item.category}`)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("news.status"),
      render: (item) => {
        const tone =
          item.status === "PUBLISHED" ? "ok" : item.status === "DRAFT" ? "off" : "warn";
        return <StatusPill tone={tone}>{t(`news.status.${item.status}`)}</StatusPill>;
      },
    },
    {
      key: "viewCount",
      header: t("news.viewCount"),
      render: (item) => (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          {item.viewCount.toLocaleString()} {t("news.views")}
        </span>
      ),
    },
    {
      key: "publishedAt",
      header: t("news.publishedAt"),
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {item.publishedAt ? formatDate(new Date(item.publishedAt), locale) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" />
            {t("news.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("news.subtitle")}</p>
        </div>
        {canManage && (
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("news.create")}
          </Button>
        )}
      </div>

      {/* Main Table Card */}
      <LiyonCard>
        <DataTable<ArticleDto>
          state={items.length === 0 ? "empty" : "data"}
          rows={items}
          columns={columns}
          getRowId={(row) => row.id}
          renderRowMenu={
            canManage
              ? (row) => (
                  <>
                    {canPublish && (
                      <RowMenuItem
                        icon={row.status === "PUBLISHED" ? <Clock className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        onSelect={() => handleTogglePublish(row)}
                      >
                        {row.status === "PUBLISHED" ? t("news.unpublish") : t("news.publish")}
                      </RowMenuItem>
                    )}
                    <RowMenuItem icon={<Edit2 className="h-4 w-4" />} onSelect={() => openEditDialog(row)}>
                      {t("news.edit")}
                    </RowMenuItem>
                    <RowMenuItem
                      icon={<Trash2 className="h-4 w-4" />}
                      danger
                      onSelect={() => setDeleteConfirmItem(row)}
                    >
                      {t("news.delete")}
                    </RowMenuItem>
                  </>
                )
              : undefined
          }
          empty={{
            icon: <Newspaper className="h-10 w-10 text-muted-foreground/50" />,
            title: t("news.empty"),
            description: t("news.subtitle"),
          }}
          error={{
            icon: <AlertCircle className="h-10 w-10 text-destructive" />,
            title: t("common.error"),
          }}
          headHeading={t("news.title")}
        />
      </LiyonCard>

      {/* Create / Edit Dialog */}
      <LiyonDialog open={modalOpen} onOpenChange={setModalOpen}>
        <LiyonDialogCloseButton label={t("common.close")} />
        <LiyonDialogHeader
          title={editingItem ? t("news.edit") : t("news.create")}
          description={t("news.subtitle")}
        />

        <LiyonDialogBody>
          <div className="fields space-y-4">
            <LiyonField label={t("news.titleTh")} htmlFor="news-title-th">
              <input
                id="news-title-th"
                type="text"
                value={titleTh}
                onChange={(e) => setTitleTh(e.target.value)}
                placeholder="เช่น ขอเชิญร่วมงานประชุมวิชาการประจำปี 2569"
                required
              />
            </LiyonField>

            <LiyonField label={t("news.titleEn")} htmlFor="news-title-en">
              <input
                id="news-title-en"
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Invitation to Annual Academic Conference 2026"
                required
              />
            </LiyonField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LiyonField label={t("news.category")} htmlFor="news-cat">
                <select
                  id="news-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as typeof category)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                >
                  <option value="GENERAL">{t("news.category.GENERAL")}</option>
                  <option value="ACTIVITY">{t("news.category.ACTIVITY")}</option>
                  <option value="ACADEMIC">{t("news.category.ACADEMIC")}</option>
                  <option value="ANNOUNCEMENT">{t("news.category.ANNOUNCEMENT")}</option>
                </select>
              </LiyonField>

              <LiyonField label={t("news.status")} htmlFor="news-status">
                <select
                  id="news-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                >
                  <option value="DRAFT">{t("news.status.DRAFT")}</option>
                  <option value="PUBLISHED">{t("news.status.PUBLISHED")}</option>
                  <option value="ARCHIVED">{t("news.status.ARCHIVED")}</option>
                </select>
              </LiyonField>
            </div>

            <LiyonField label={t("news.coverImageUrl")} htmlFor="news-cover">
              <input
                id="news-cover"
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://example.com/images/cover.jpg"
              />
            </LiyonField>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="isPinned" className="text-sm font-medium text-foreground cursor-pointer select-none">
                {t("news.isPinned")}
              </label>
            </div>

            <LiyonField label={t("news.contentTh")} htmlFor="news-content-th">
              <textarea
                id="news-content-th"
                rows={4}
                value={contentTh}
                onChange={(e) => setContentTh(e.target.value)}
                placeholder="รายละเอียดเนื้อหาข่าวประชาสัมพันธ์..."
                required
              />
            </LiyonField>

            <LiyonField label={t("news.contentEn")} htmlFor="news-content-en">
              <textarea
                id="news-content-en"
                rows={4}
                value={contentEn}
                onChange={(e) => setContentEn(e.target.value)}
                placeholder="Detailed content of the announcement..."
                required
              />
            </LiyonField>
          </div>
        </LiyonDialogBody>

        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isPending}>
            {t("news.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? t("common.saving") : t("news.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Delete Confirm Dialog */}
      <LiyonDialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <LiyonDialogCloseButton label={t("common.close")} />
        <LiyonDialogHeader title={t("news.delete")} description={t("news.deleteConfirm")} />

        <LiyonDialogBody>
          {deleteConfirmItem && (
            <p className="text-sm font-semibold text-muted-foreground">
              &quot;{locale === "en" ? deleteConfirmItem.titleEn : deleteConfirmItem.titleTh}&quot;
            </p>
          )}
        </LiyonDialogBody>

        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirmItem(null)} disabled={isPending}>
            {t("news.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteConfirmItem && handleDelete(deleteConfirmItem.id)}
            disabled={isPending}
          >
            {isPending ? t("common.deleting") : t("news.delete")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
