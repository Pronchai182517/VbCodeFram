"use client";

import { useState, useTransition } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Calendar,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { useT } from "@/shared/lib/i18n/client";
import { LiyonCard, StatusPill } from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import type { PublicTrackingDto } from "@/features/document-flow";
import { trackDocumentPublicAction } from "@/features/document-flow/actions";

export function DocumentTrackingClient() {
  const t = useT();
  const [trackingNoInput, setTrackingNoInput] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PublicTrackingDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const handleSearch = (overrideNo?: string) => {
    const no = (overrideNo ?? trackingNoInput).trim();
    if (!no) return;

    if (overrideNo) {
      setTrackingNoInput(overrideNo);
    }

    setErrorMessage(null);
    startTransition(async () => {
      setHasSearched(true);
      const res = await trackDocumentPublicAction(no);
      if (res.ok) {
        setResult(res.data);
        setErrorMessage(null);
      } else {
        setResult(null);
        setErrorMessage(res.error.message || t("documents.portal.notFound"));
      }
    });
  };

  const getStatusTone = (status: string) => {
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

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Faculty Transparent Document Flow</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("documents.portal.title")}
          </h1>
          <p className="max-w-2xl mx-auto text-base text-slate-600 dark:text-slate-400">
            {t("documents.portal.subtitle")}
          </p>
        </div>

        {/* Search Box Card */}
        <LiyonCard className="p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={trackingNoInput}
                  onChange={(e) => setTrackingNoInput(e.target.value)}
                  placeholder={t("documents.portal.searchPlaceholder")}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                />
              </div>
              <Button
                type="submit"
                disabled={pending || !trackingNoInput.trim()}
                className="py-3 px-6 h-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow transition-colors flex items-center justify-center gap-2"
              >
                {pending ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>{t("documents.portal.trackButton")}</span>
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">ตัวอย่างรหัสติดตาม:</span>
              {["DOC-2026-0001", "DOC-2026-0002", "DOC-2026-0003"].map((sample) => (
                <button
                  type="button"
                  key={sample}
                  onClick={() => handleSearch(sample)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded font-mono text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </form>
        </LiyonCard>

        {/* Not Found / Error Alert */}
        {hasSearched && errorMessage && !pending && (
          <LiyonCard className="p-6 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
            <div className="flex items-start gap-4 text-red-700 dark:text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-base mb-1">
                  ไม่พบข้อมูลเอกสารคำร้อง
                </h3>
                <p className="text-sm">{errorMessage}</p>
              </div>
            </div>
          </LiyonCard>
        )}

        {/* Found Result Display */}
        {result && !pending && (
          <div className="space-y-6">
            {/* Header Document Summary */}
            <LiyonCard className="p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                      {result.trackingNo}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                      {t(`documents.type.${result.docType}`)}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {result.title}
                  </h2>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    สถานะปัจจุบัน
                  </span>
                  <StatusPill tone={getStatusTone(result.status)}>
                    {t(`documents.status.${result.status}`)}
                  </StatusPill>
                </div>
              </div>

              {/* Meta details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    วันที่ยื่นคำร้อง:{" "}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {new Date(result.createdAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>
                    ขั้นตอนความคืบหน้า:{" "}
                    <strong className="text-slate-800 dark:text-slate-200">
                      ขั้นตอนที่ {result.currentStepIndex} จาก {result.totalSteps}
                    </strong>
                  </span>
                </div>
              </div>
            </LiyonCard>

            {/* Approval Route Stepper */}
            <LiyonCard className="p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t("documents.portal.progressTitle")}</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  สายงานอนุมัติตามลำดับขั้น (Sequential Approval Flow)
                </span>
              </div>

              {/* Stepper Timeline */}
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {result.routes.map((route) => {
                  const isApproved = route.status === "APPROVED";
                  const isRejected = route.status === "REJECTED";
                  const isCurrent =
                    route.status === "PENDING" &&
                    route.stepIndex === result.currentStepIndex &&
                    result.status === "PENDING";
                  const isWaiting =
                    route.status === "PENDING" &&
                    (route.stepIndex > result.currentStepIndex ||
                      result.status !== "PENDING");

                  return (
                    <div key={route.stepIndex} className="relative group">
                      {/* Step Indicator Dot / Icon */}
                      <div className="absolute -left-6 sm:-left-8 top-0.5 flex items-center justify-center">
                        {isApproved && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        {isRejected && (
                          <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                            <XCircle className="w-4 h-4" />
                          </div>
                        )}
                        {isCurrent && (
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center ring-4 ring-amber-100 dark:ring-amber-950/60 shadow-sm animate-pulse">
                            <Clock className="w-4 h-4" />
                          </div>
                        )}
                        {isWaiting && (
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center ring-4 ring-white dark:ring-slate-900 font-mono text-xs font-bold">
                            {route.stepIndex}
                          </div>
                        )}
                      </div>

                      {/* Step Content Box */}
                      <div
                        className={`p-4 rounded-xl border transition-all ${
                          isCurrent
                            ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 shadow-sm"
                            : isApproved
                              ? "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800"
                              : isRejected
                                ? "bg-red-50/30 dark:bg-red-950/20 border-red-200 dark:border-red-900/60"
                                : "bg-white dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-75"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm">
                              ลำดับที่ {route.stepIndex}: {route.title}
                            </span>
                            <span className="text-xs text-slate-400">({route.approverName})</span>
                          </div>

                          <StatusPill tone={getStatusTone(route.status)}>
                            {isCurrent
                              ? "กำลังรอพิจารณาในขั้นตอนนี้"
                              : t(`documents.stepStatus.${route.status}`)}
                          </StatusPill>
                        </div>

                        {/* Action timestamp */}
                        {route.actionAt && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              เวลาที่ดำเนินการ:{" "}
                              {new Date(route.actionAt).toLocaleString("th-TH")}
                            </span>
                          </p>
                        )}

                        {/* Reviewer Comment */}
                        {route.comment && (
                          <div className="mt-3 p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              ความเห็น / ข้อเสนอแนะ:
                            </span>{" "}
                            {route.comment}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </LiyonCard>

            {/* Help & Contact Notice */}
            <div className="p-4 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <div>
                <strong className="font-semibold block mb-0.5">
                  ข้อสังเกตและคำแนะนำในการติดตามเอกสาร
                </strong>
                <span>
                  กระบวนการอนุมัติเอกสารเป็นไปตามลำดับขั้นสายงานบังคับบัญชา
                  ผู้มีอำนาจในขั้นตอนถัดไปจะได้รับการแจ้งเตือนหลังจากขั้นตอนก่อนหน้าได้รับความเห็นชอบแล้วเท่านั้น
                  หากมีข้อสงสัยกรุณาติดต่อ งานสารบรรณและธุรการ คณะ
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
