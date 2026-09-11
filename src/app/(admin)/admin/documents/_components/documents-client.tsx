"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  FileCheck,
  Check,
  X,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/shared/lib/i18n/client";
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
  type DataTableColumn,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import type {
  DocumentRequestDto,
  ApproverOptionDto,
  DocumentTypeEnum,
  DocumentStatusEnum,
} from "@/features/document-flow";
import {
  getDocumentsAction,
  createDocumentRequestAction,
  approveStepAction,
  rejectStepAction,
  cancelDocumentRequestAction,
} from "@/features/document-flow/actions";

interface DocumentsClientProps {
  initialDocuments: DocumentRequestDto[];
  availableApprovers: ApproverOptionDto[];
  currentUserId: string;
  canCreate: boolean;
  canApprove: boolean;
  canManage: boolean;
}

export function DocumentsClient({
  initialDocuments,
  availableApprovers,
  currentUserId,
  canCreate,
  canApprove,
  canManage,
}: DocumentsClientProps) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"my" | "pending" | "all">("my");
  const [documents, setDocuments] =
    useState<DocumentRequestDto[]>(initialDocuments);

  // Filters
  const [search, setSearch] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Request Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{
    docType: DocumentTypeEnum;
    title: string;
    description: string;
    fileAttachmentUrl: string;
    routes: { title: string; approverId: string }[];
  }>({
    docType: "LEAVE",
    title: "",
    description: "",
    fileAttachmentUrl: "",
    routes: [
      {
        title: "หัวหน้าภาควิชา / ผู้บังคับบัญชาเบื้องต้น",
        approverId: availableApprovers[0]?.id || "",
      },
      {
        title: "คณบดี / ผู้มีอำนาจลงนาม",
        approverId:
          availableApprovers[1]?.id || availableApprovers[0]?.id || "",
      },
    ],
  });

  // View Details Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRequestDto | null>(
    null
  );

  // Approve / Reject Action Modals State
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetDoc, setTargetDoc] = useState<DocumentRequestDto | null>(null);
  const [actionComment, setActionComment] = useState("");

  // Refresh Documents for current tab
  const refreshDocuments = (targetTab = activeTab) => {
    startTransition(async () => {
      const res = await getDocumentsAction({
        tab: targetTab,
      });
      if (res.ok) {
        setDocuments(res.data);
      } else {
        toast.error(res.error.message);
      }
    });
  };

  const handleTabChange = (tab: "my" | "pending" | "all") => {
    setActiveTab(tab);
    refreshDocuments(tab);
  };

  // Add & remove routes in Create Modal
  const handleAddRouteStep = () => {
    setCreateForm((prev) => ({
      ...prev,
      routes: [
        ...prev.routes,
        {
          title: `ผู้อนุมัติลำดับที่ ${prev.routes.length + 1}`,
          approverId: availableApprovers[0]?.id || "",
        },
      ],
    }));
  };

  const handleRemoveRouteStep = (index: number) => {
    if (createForm.routes.length <= 1) {
      toast.error(t("documents.error.atLeastOneStep"));
      return;
    }
    setCreateForm((prev) => ({
      ...prev,
      routes: prev.routes.filter((_, i) => i !== index),
    }));
  };

  // Submit New Request
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      toast.error("กรุณากรอกหัวข้อเอกสารคำร้อง");
      return;
    }
    if (createForm.routes.some((r) => !r.title.trim() || !r.approverId)) {
      toast.error("กรุณาระบุข้อมูลผู้อนุมัติในสายงานให้ครบถ้วน");
      return;
    }

    startTransition(async () => {
      const res = await createDocumentRequestAction(createForm);
      if (res.ok) {
        toast.success("ยื่นเอกสารคำร้องสำเร็จ เลขที่ " + res.data.trackingNo);
        setCreateModalOpen(false);
        setCreateForm({
          docType: "LEAVE",
          title: "",
          description: "",
          fileAttachmentUrl: "",
          routes: [
            {
              title: "หัวหน้าภาควิชา / ผู้บังคับบัญชาเบื้องต้น",
              approverId: availableApprovers[0]?.id || "",
            },
            {
              title: "คณบดี / ผู้มีอำนาจลงนาม",
              approverId:
                availableApprovers[1]?.id || availableApprovers[0]?.id || "",
            },
          ],
        });
        refreshDocuments();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  // Execute Approve Step
  const handleApproveConfirm = () => {
    if (!targetDoc) return;
    startTransition(async () => {
      const res = await approveStepAction({
        documentRequestId: targetDoc.id,
        comment: actionComment.trim() || undefined,
      });
      if (res.ok) {
        toast.success("พิจารณาอนุมัติเอกสารเรียบร้อยแล้ว");
        setApproveModalOpen(false);
        setTargetDoc(null);
        setActionComment("");
        if (detailModalOpen) setDetailModalOpen(false);
        refreshDocuments();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  // Execute Reject Step
  const handleRejectConfirm = () => {
    if (!targetDoc) return;
    if (!actionComment.trim()) {
      toast.error(t("documents.rejectReason"));
      return;
    }
    startTransition(async () => {
      const res = await rejectStepAction({
        documentRequestId: targetDoc.id,
        comment: actionComment.trim(),
      });
      if (res.ok) {
        toast.success("บันทึกการไม่อนุมัติเอกสารเรียบร้อย");
        setRejectModalOpen(false);
        setTargetDoc(null);
        setActionComment("");
        if (detailModalOpen) setDetailModalOpen(false);
        refreshDocuments();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  // Cancel Request
  const handleCancelRequest = (doc: DocumentRequestDto) => {
    if (!confirm(t("documents.cancelConfirm"))) return;
    startTransition(async () => {
      const res = await cancelDocumentRequestAction(doc.id);
      if (res.ok) {
        toast.success("ยกเลิกคำร้องเรียบร้อย");
        refreshDocuments();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  const getStatusTone = (status: DocumentStatusEnum) => {
    switch (status) {
      case "APPROVED":
        return "ok" as const;
      case "PENDING":
        return "warn" as const;
      case "REJECTED":
      case "CANCELLED":
      default:
        return "off" as const;
    }
  };

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchType =
      docTypeFilter === "ALL" || doc.docType === docTypeFilter;
    const matchStatus =
      statusFilter === "ALL" || doc.status === statusFilter;
    const matchSearch =
      !search.trim() ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.trackingNo.toLowerCase().includes(search.toLowerCase()) ||
      (doc.requesterName &&
        doc.requesterName.toLowerCase().includes(search.toLowerCase()));

    return matchType && matchStatus && matchSearch;
  });

  // Table Columns
  const columns: DataTableColumn<DocumentRequestDto>[] = [
    {
      key: "trackingNo",
      header: t("documents.trackingNo"),
      render: (r: DocumentRequestDto) => (
        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
          {r.trackingNo}
        </span>
      ),
    },
    {
      key: "docType",
      header: t("documents.docType"),
      render: (r: DocumentRequestDto) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {t(`documents.type.${r.docType}`)}
        </span>
      ),
    },
    {
      key: "title",
      header: t("documents.docTitle"),
      render: (r: DocumentRequestDto) => (
        <div className="max-w-xs sm:max-w-md">
          <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
            {r.title}
          </div>
          {r.description && (
            <div className="text-xs text-slate-500 truncate">
              {r.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "requester",
      header: t("documents.requester"),
      render: (r: DocumentRequestDto) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {r.requesterName || r.requesterEmail}
        </span>
      ),
    },
    {
      key: "progress",
      header: t("documents.currentStep"),
      render: (r: DocumentRequestDto) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          ขั้นตอน {r.currentStepIndex} / {r.totalSteps}
        </span>
      ),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (r: DocumentRequestDto) => (
        <StatusPill tone={getStatusTone(r.status)}>
          {t(`documents.status.${r.status}`)}
        </StatusPill>
      ),
    },
    {
      key: "actions",
      header: "การจัดการ",
      render: (r: DocumentRequestDto) => {
        const isCurrentApprover =
          r.status === "PENDING" &&
          r.routes?.some(
            (route) =>
              route.stepIndex === r.currentStepIndex &&
              route.approverId === currentUserId &&
              route.status === "PENDING"
          );
        const canCancel =
          (r.requesterId === currentUserId || canManage) &&
          (r.status === "PENDING" || r.status === "DRAFT");

        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDoc(r);
                setDetailModalOpen(true);
              }}
              title={t("documents.viewDetails")}
              className="h-8 px-2 text-xs"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>

            {isCurrentApprover && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    setTargetDoc(r);
                    setActionComment("");
                    setApproveModalOpen(true);
                  }}
                  title={t("documents.approve")}
                  className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t("documents.approve")}</span>
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setTargetDoc(r);
                    setActionComment("");
                    setRejectModalOpen(true);
                  }}
                  title={t("documents.reject")}
                  className="h-8 px-2.5 text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t("documents.reject")}</span>
                </Button>
              </>
            )}

            {canCancel && !isCurrentApprover && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancelRequest(r)}
                title={t("documents.cancelRequest")}
                className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                {t("documents.cancelRequest")}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>{t("documents.title")}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("documents.subtitle")}
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>{t("documents.create")}</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => handleTabChange("my")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === "my"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {t("documents.tab.myRequests")}
        </button>

        {canApprove && (
          <button
            type="button"
            onClick={() => handleTabChange("pending")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>{t("documents.tab.pendingMyApproval")}</span>
          </button>
        )}

        {canManage && (
          <button
            type="button"
            onClick={() => handleTabChange("all")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {t("documents.tab.allDocuments")}
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <LiyonCard className="p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อเรื่อง, Tracking No หรือผู้ยื่น..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              aria-label={t("documents.docType")}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">{t("documents.type.all")}</option>
              <option value="LEAVE">{t("documents.type.LEAVE")}</option>
              <option value="EXPENSE_REIMBURSE">
                {t("documents.type.EXPENSE_REIMBURSE")}
              </option>
              <option value="OFFICIAL_LETTER">
                {t("documents.type.OFFICIAL_LETTER")}
              </option>
              <option value="PROJECT_PROPOSAL">
                {t("documents.type.PROJECT_PROPOSAL")}
              </option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="สถานะเอกสาร"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">{t("documents.status.all")}</option>
              <option value="PENDING">{t("documents.status.PENDING")}</option>
              <option value="APPROVED">{t("documents.status.APPROVED")}</option>
              <option value="REJECTED">{t("documents.status.REJECTED")}</option>
              <option value="CANCELLED">
                {t("documents.status.CANCELLED")}
              </option>
            </select>
          </div>
        </div>
      </LiyonCard>

      {/* Documents Data Table */}
      <LiyonCard className="shadow-sm overflow-hidden">
        <DataTable<DocumentRequestDto>
          state={filteredDocs.length === 0 ? "empty" : "data"}
          headHeading={t("documents.title")}
          columns={columns}
          rows={filteredDocs}
          getRowId={(r: DocumentRequestDto) => r.id}
          empty={{
            icon: <FileCheck className="w-10 h-10 text-slate-300 dark:text-slate-600" />,
            title: t("documents.empty"),
            description: "ยังไม่มีข้อมูลเอกสารคำร้องในส่วนนี้",
          }}
          error={{
            icon: <FileCheck className="w-10 h-10 text-red-400" />,
            title: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
            description: "โปรดลองใหม่อีกครั้ง",
          }}
        />
      </LiyonCard>

      {/* ========================================================================= */}
      {/* 1. View Document Details & Approval Stepper Modal */}
      {/* ========================================================================= */}
      {detailModalOpen && selectedDoc && (
        <LiyonDialog
          open={detailModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDetailModalOpen(false);
              setSelectedDoc(null);
            }
          }}
        >
          <LiyonDialogCloseButton label="ปิดหน้าต่าง" />
          <LiyonDialogHeader
            title={`${selectedDoc.trackingNo} - ${selectedDoc.title}`}
            description={t(`documents.type.${selectedDoc.docType}`)}
          />

          <LiyonDialogBody className="space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Summary Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block mb-0.5">ประเภทเอกสาร</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {t(`documents.type.${selectedDoc.docType}`)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">ผู้ยื่นคำร้อง</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {selectedDoc.requesterName} ({selectedDoc.requesterEmail})
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">
                  วันที่ยื่นคำร้อง
                </span>
                <span className="text-slate-800 dark:text-slate-200">
                  {new Date(selectedDoc.createdAt).toLocaleString("th-TH")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">
                  ขั้นตอนปัจจุบัน
                </span>
                <span className="text-slate-800 dark:text-slate-200">
                  ลำดับที่ {selectedDoc.currentStepIndex} จาก{" "}
                  {selectedDoc.totalSteps}
                </span>
              </div>
              {selectedDoc.fileAttachmentUrl && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-slate-400 block mb-1">
                    ไฟล์เอกสารแนบ
                  </span>
                  <a
                    href={selectedDoc.fileAttachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิดดูเอกสารแนบ (คลิกเพื่อดูไฟล์)</span>
                  </a>
                </div>
              )}
            </div>

            {/* Description / Content */}
            {selectedDoc.description && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  รายละเอียด / เหตุผล
                </span>
                <p className="text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  {selectedDoc.description}
                </p>
              </div>
            )}

            {/* Stepper Timeline */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>สายการอนุมัติ (Approval Route Progress)</span>
              </h3>

              <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {selectedDoc.routes?.map((route) => {
                  const isApproved = route.status === "APPROVED";
                  const isRejected = route.status === "REJECTED";
                  const isCurrent =
                    route.status === "PENDING" &&
                    route.stepIndex === selectedDoc.currentStepIndex &&
                    selectedDoc.status === "PENDING";

                  return (
                    <div key={route.id} className="relative">
                      {/* Dot icon */}
                      <div className="absolute -left-6 top-1 flex items-center justify-center">
                        {isApproved && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {isRejected && (
                          <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                            <XCircle className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {isCurrent && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center ring-4 ring-amber-100 dark:ring-amber-950/60 shadow-sm animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {!isApproved && !isRejected && !isCurrent && (
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center ring-4 ring-white dark:ring-slate-900 font-mono text-[10px] font-bold">
                            {route.stepIndex}
                          </div>
                        )}
                      </div>

                      {/* Content Box */}
                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            ขั้นตอนที่ {route.stepIndex}: {route.title}
                          </span>
                          <StatusPill tone={getStatusTone(route.status as DocumentStatusEnum)}>
                            {t(`documents.stepStatus.${route.status}`)}
                          </StatusPill>
                        </div>
                        <div className="text-slate-500">
                          ผู้อนุมัติ:{" "}
                          <strong className="text-slate-700 dark:text-slate-300">
                            {route.approverName} ({route.approverEmail})
                          </strong>
                        </div>
                        {route.actionAt && (
                          <div className="text-[11px] text-slate-400">
                            เวลาดำเนินการ:{" "}
                            {new Date(route.actionAt).toLocaleString("th-TH")}
                          </div>
                        )}
                        {route.comment && (
                          <div className="mt-1 p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">ความเห็น:</span>{" "}
                            {route.comment}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </LiyonDialogBody>

          <LiyonDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDetailModalOpen(false);
                setSelectedDoc(null);
              }}
            >
              ปิดหน้าต่าง
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* ========================================================================= */}
      {/* 2. Create Document Request Modal */}
      {/* ========================================================================= */}
      {createModalOpen && (
        <LiyonDialog
          open={createModalOpen}
          onOpenChange={(open) => {
            if (!open) setCreateModalOpen(false);
          }}
        >
          <form onSubmit={handleCreateSubmit}>
            <LiyonDialogCloseButton label="ปิดหน้าต่าง" />
            <LiyonDialogHeader
              title={t("documents.create")}
              description="กรอกข้อมูลคำร้องและกำหนดสายการอนุมัติแบบลำดับขั้น"
            />

            <LiyonDialogBody className="space-y-4 max-h-[75vh] overflow-y-auto">
              <LiyonField label={t("documents.docType")}>
                <select
                  value={createForm.docType}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      docType: e.target.value as DocumentTypeEnum,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="LEAVE">{t("documents.type.LEAVE")}</option>
                  <option value="EXPENSE_REIMBURSE">
                    {t("documents.type.EXPENSE_REIMBURSE")}
                  </option>
                  <option value="OFFICIAL_LETTER">
                    {t("documents.type.OFFICIAL_LETTER")}
                  </option>
                  <option value="PROJECT_PROPOSAL">
                    {t("documents.type.PROJECT_PROPOSAL")}
                  </option>
                </select>
              </LiyonField>

              <LiyonField label={t("documents.docTitle")}>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="เช่น ขออนุมัติลาพักผ่อนประจำปี หรือ ขอเบิกงบประมาณ..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </LiyonField>

              <LiyonField label={t("documents.description")}>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  placeholder="ระบุเหตุผลความจำเป็น รายละเอียดของงาน หรือข้อมูลประกอบ..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </LiyonField>

              <LiyonField label={t("documents.fileAttachmentUrl")}>
                <input
                  type="url"
                  value={createForm.fileAttachmentUrl}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      fileAttachmentUrl: e.target.value,
                    }))
                  }
                  placeholder="https://... (URL ไฟล์เอกสารแนบ PDF หรือ ลิงก์ระบบจัดเก็บไฟล์)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </LiyonField>

              {/* Sequential Approval Routes Builder */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {t("documents.routes")}
                    </h3>
                    <p className="text-xs text-slate-500">
                      กำหนดลำดับขั้นตอนและผู้พิจารณาอนุมัติ (ดำเนินการตามลำดับขั้น 1 &rarr; 2 &rarr; 3)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRouteStep}
                    className="text-xs h-8 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t("documents.addStep")}</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {createForm.routes.map((route, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          ขั้นตอนลำดับที่ {idx + 1}
                        </span>
                        {createForm.routes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRouteStep(idx)}
                            className="text-red-500 hover:text-red-700 p-1 text-xs cursor-pointer"
                            title={t("documents.removeStep")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={route.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCreateForm((p) => {
                              const newRoutes = [...p.routes];
                              newRoutes[idx].title = val;
                              return { ...p, routes: newRoutes };
                            });
                          }}
                          placeholder="ชื่อขั้นตอน เช่น หัวหน้าภาควิชา"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                        />

                        <select
                          value={route.approverId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCreateForm((p) => {
                              const newRoutes = [...p.routes];
                              newRoutes[idx].approverId = val;
                              return { ...p, routes: newRoutes };
                            });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white"
                        >
                          {availableApprovers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </LiyonDialogBody>

            <LiyonDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                disabled={pending}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {pending ? "กำลังบันทึก..." : t("documents.save")}
              </Button>
            </LiyonDialogFooter>
          </form>
        </LiyonDialog>
      )}

      {/* ========================================================================= */}
      {/* 3. Approve Step Modal */}
      {/* ========================================================================= */}
      {approveModalOpen && targetDoc && (
        <LiyonDialog
          open={approveModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setApproveModalOpen(false);
              setTargetDoc(null);
            }
          }}
        >
          <LiyonDialogCloseButton label="ปิดหน้าต่าง" />
          <LiyonDialogHeader
            title={t("documents.approveTitle")}
            description={`${targetDoc.trackingNo}: ${targetDoc.title}`}
          />

          <LiyonDialogBody className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
              <div className="font-semibold text-emerald-900 dark:text-emerald-300">
                {targetDoc.title}
              </div>
              <div className="text-emerald-700 dark:text-emerald-400">
                เลขที่: {targetDoc.trackingNo} | ขั้นตอนที่{" "}
                {targetDoc.currentStepIndex} จาก {targetDoc.totalSteps}
              </div>
            </div>

            <LiyonField label={t("documents.comment")}>
              <textarea
                rows={3}
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder={t("documents.enterComment")}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </LiyonField>
          </LiyonDialogBody>

          <LiyonDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveModalOpen(false);
                setTargetDoc(null);
              }}
              disabled={pending}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleApproveConfirm}
              disabled={pending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>ยืนยันการอนุมัติ</span>
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* ========================================================================= */}
      {/* 4. Reject Step Modal */}
      {/* ========================================================================= */}
      {rejectModalOpen && targetDoc && (
        <LiyonDialog
          open={rejectModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setRejectModalOpen(false);
              setTargetDoc(null);
            }
          }}
        >
          <LiyonDialogCloseButton label="ปิดหน้าต่าง" />
          <LiyonDialogHeader
            title={t("documents.rejectTitle")}
            description={`${targetDoc.trackingNo}: ${targetDoc.title}`}
          />

          <LiyonDialogBody className="space-y-4">
            <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs space-y-1">
              <div className="font-semibold text-red-900 dark:text-red-300">
                {targetDoc.title}
              </div>
              <div className="text-red-700 dark:text-red-400">
                เลขที่: {targetDoc.trackingNo} | ผู้ยื่น:{" "}
                {targetDoc.requesterName}
              </div>
            </div>

            <LiyonField label={t("documents.rejectReason")}>
              <textarea
                rows={3}
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder="โปรดระบุเหตุผล เช่น เอกสารไม่ครบถ้วน หรือไม่สอดคล้องกับระเบียบ..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </LiyonField>
          </LiyonDialogBody>

          <LiyonDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectModalOpen(false);
                setTargetDoc(null);
              }}
              disabled={pending}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={pending || !actionComment.trim()}
              className="flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>ยืนยันการไม่อนุมัติ</span>
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}
    </div>
  );
}
