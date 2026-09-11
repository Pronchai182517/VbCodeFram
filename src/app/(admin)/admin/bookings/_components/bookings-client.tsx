"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Plus,
  Search,
  Clock,
  XCircle,
  Eye,
  Check,
  X,
  Trash2,
  Edit2,
  DoorOpen,
  Car,
  CalendarDays,
  Users,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useT, useLocale } from "@/shared/lib/i18n/client";
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
  type StatusPillTone,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import type {
  ResourceDto,
  ReservationDto,
} from "@/features/booking/server";
import {
  getReservationsAction,
  getResourcesAction,
  createReservationAction,
  approveReservationAction,
  rejectReservationAction,
  cancelReservationAction,
  createResourceAction,
  updateResourceAction,
  deleteResourceAction,
} from "@/features/booking/actions";
import type {
  ResourceTypeEnum,
  ReservationStatusEnum,
} from "@/features/booking";

interface Props {
  initialReservations: ReservationDto[];
  resources: ResourceDto[];
  currentUserId: string;
  canCreate: boolean;
  canApprove: boolean;
  canManage: boolean;
}

export function BookingsClient({
  initialReservations,
  resources: initialResources,
  currentUserId,
  canCreate,
  canApprove,
  canManage,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  // Active Tab: "reservations" | "resources"
  const [activeTab, setActiveTab] = useState<"reservations" | "resources">("reservations");
  const [reservations, setReservations] = useState<ReservationDto[]>(initialReservations);
  const [resources, setResources] = useState<ResourceDto[]>(initialResources);

  // Filters for Reservations
  const [reservationSearch, setReservationSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [resourceFilter, setResourceFilter] = useState<string>("ALL");

  // Filters for Resources
  const [resourceSearch, setResourceSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Modals state
  const [createBookingOpen, setCreateBookingOpen] = useState(false);
  const [bookingConflictError, setBookingConflictError] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    resourceId: initialResources[0]?.id || "",
    purpose: "",
    attendeeCount: 1,
    startTime: "",
    endTime: "",
  });

  // Action modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationDto | null>(null);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetReservation, setTargetReservation] = useState<ReservationDto | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Resource Create/Edit Modal
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceDto | null>(null);
  const [resourceForm, setResourceForm] = useState<{
    nameTh: string;
    nameEn: string;
    code: string;
    type: ResourceTypeEnum;
    capacity: number;
    locationTh: string;
    locationEn: string;
    facilities: string;
    driverName: string;
    imageUrl: string;
    isActive: boolean;
  }>({
    nameTh: "",
    nameEn: "",
    code: "",
    type: "ROOM",
    capacity: 10,
    locationTh: "",
    locationEn: "",
    facilities: "",
    driverName: "",
    imageUrl: "",
    isActive: true,
  });

  // Refresh helpers
  const refreshReservations = () => {
    startTransition(async () => {
      const res = await getReservationsAction({});
      if (res.ok) {
        setReservations(res.data);
      }
    });
  };

  const refreshResources = () => {
    startTransition(async () => {
      const res = await getResourcesAction({});
      if (res.ok) {
        setResources(res.data);
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Reservation Filters & Columns
  // ---------------------------------------------------------------------------
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (resourceFilter !== "ALL" && r.resourceId !== resourceFilter) return false;

      if (!reservationSearch.trim()) return true;
      const q = reservationSearch.toLowerCase();
      return (
        r.purpose.toLowerCase().includes(q) ||
        r.resourceNameTh.toLowerCase().includes(q) ||
        r.resourceCode.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q)
      );
    });
  }, [reservations, statusFilter, resourceFilter, reservationSearch]);

  const formatDateTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString(locale === "th" ? "th-TH" : "en-US", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const getStatusTone = (status: ReservationStatusEnum): StatusPillTone => {
    switch (status) {
      case "CONFIRMED":
        return "ok";
      case "PENDING":
        return "warn";
      case "REJECTED":
        return "bad";
      case "CANCELLED":
        return "off";
      default:
        return "off";
    }
  };

  const reservationColumns: DataTableColumn<ReservationDto>[] = [
    {
      key: "resource",
      header: t("booking.reservation.resource"),
      render: (r: ReservationDto) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              {r.resourceCode}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                r.resourceType === "ROOM"
                  ? "bg-blue-500/10 text-blue-600 border border-blue-200 dark:border-blue-800"
                  : "bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-800"
              }`}
            >
              {r.resourceType === "ROOM" ? (
                <DoorOpen className="w-3 h-3 mr-1 inline" />
              ) : (
                <Car className="w-3 h-3 mr-1 inline" />
              )}
              {r.resourceType === "ROOM" ? t("booking.type.ROOM") : t("booking.type.VEHICLE")}
            </span>
          </div>
          <div className="font-medium text-sm text-slate-900 dark:text-white">
            {locale === "th" ? r.resourceNameTh : r.resourceNameEn || r.resourceNameTh}
          </div>
        </div>
      ),
    },
    {
      key: "purpose",
      header: t("booking.reservation.purpose"),
      render: (r: ReservationDto) => (
        <div className="max-w-xs">
          <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
            {r.purpose}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Users className="w-3 h-3" />
            <span>{r.attendeeCount} คน</span>
          </div>
        </div>
      ),
    },
    {
      key: "timeRange",
      header: "ช่วงเวลาที่จอง",
      render: (r: ReservationDto) => (
        <div className="text-xs space-y-0.5">
          <div className="text-slate-700 dark:text-slate-300 font-medium">
            {formatDateTime(r.startTime)}
          </div>
          <div className="text-slate-400">
            ถึง {formatDateTime(r.endTime)}
          </div>
        </div>
      ),
    },
    {
      key: "user",
      header: t("booking.reservation.user"),
      render: (r: ReservationDto) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800 dark:text-slate-200">{r.userName}</div>
          <div className="text-slate-400 text-[11px]">{r.userEmail}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (r: ReservationDto) => (
        <StatusPill tone={getStatusTone(r.status)}>
          {t(`booking.status.${r.status}`)}
        </StatusPill>
      ),
    },
    {
      key: "actions",
      header: "การจัดการ",
      render: (r: ReservationDto) => {
        const isOwner = r.userId === currentUserId;
        const canCancel = (isOwner || canManage) && (r.status === "PENDING" || r.status === "CONFIRMED");

        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedReservation(r);
                setDetailModalOpen(true);
              }}
              title="ดูรายละเอียด"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>

            {canApprove && r.status === "PENDING" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setTargetReservation(r);
                    setApproveModalOpen(true);
                  }}
                  title={t("booking.approve")}
                  className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetReservation(r);
                    setRejectReason("");
                    setRejectModalOpen(true);
                  }}
                  title={t("booking.reject")}
                  className="p-1.5 text-rose-600 hover:text-rose-700 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => handleCancelReservation(r.id)}
                title={t("booking.cancel")}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-xs"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // Resource Filters & Columns
  // ---------------------------------------------------------------------------
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      if (typeFilter !== "ALL" && res.type !== typeFilter) return false;

      if (!resourceSearch.trim()) return true;
      const q = resourceSearch.toLowerCase();
      return (
        res.nameTh.toLowerCase().includes(q) ||
        res.nameEn.toLowerCase().includes(q) ||
        res.code.toLowerCase().includes(q) ||
        (res.locationTh?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [resources, typeFilter, resourceSearch]);

  const resourceColumns: DataTableColumn<ResourceDto>[] = [
    {
      key: "code",
      header: t("booking.resource.code"),
      render: (r: ResourceDto) => (
        <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
          {r.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "ชื่อทรัพยากร",
      render: (r: ResourceDto) => (
        <div>
          <div className="font-medium text-sm text-slate-900 dark:text-white">
            {r.nameTh}
          </div>
          {r.nameEn && <div className="text-xs text-slate-400">{r.nameEn}</div>}
        </div>
      ),
    },
    {
      key: "type",
      header: t("booking.resource.type"),
      render: (r: ResourceDto) => (
        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${
            r.type === "ROOM"
              ? "bg-blue-500/10 text-blue-600 border border-blue-200 dark:border-blue-800"
              : "bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-800"
          }`}
        >
          {r.type === "ROOM" ? t("booking.type.ROOM") : t("booking.type.VEHICLE")}
        </span>
      ),
    },
    {
      key: "capacity",
      header: t("booking.resource.capacity"),
      render: (r: ResourceDto) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          {r.capacity} ที่นั่ง
        </span>
      ),
    },
    {
      key: "location",
      header: "สถานที่ / คนขับ",
      render: (r: ResourceDto) => (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          <div>{locale === "th" ? r.locationTh || "-" : r.locationEn || r.locationTh || "-"}</div>
          {r.driverName && <div className="text-slate-400">คนขับ: {r.driverName}</div>}
        </div>
      ),
    },
    {
      key: "status",
      header: t("booking.resource.status"),
      render: (r: ResourceDto) => (
        <StatusPill tone={r.isActive ? "ok" : "bad"}>
          {r.isActive ? t("booking.resource.active") : t("booking.resource.inactive")}
        </StatusPill>
      ),
    },
    {
      key: "actions",
      header: "การจัดการ",
      render: (r: ResourceDto) => {
        if (!canManage) return null;
        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenEditResource(r)}
              title={t("booking.editResource")}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteResource(r.id)}
              title={t("booking.deleteResource")}
              className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingConflictError(null);

    startTransition(async () => {
      const res = await createReservationAction({
        resourceId: bookingForm.resourceId,
        purpose: bookingForm.purpose,
        attendeeCount: Number(bookingForm.attendeeCount),
        startTime: new Date(bookingForm.startTime).toISOString(),
        endTime: new Date(bookingForm.endTime).toISOString(),
      });

      if (res.ok) {
        toast.success("บันทึกคำขอจองเรียบร้อยแล้ว");
        setCreateBookingOpen(false);
        setBookingForm({
          resourceId: initialResources[0]?.id || "",
          purpose: "",
          attendeeCount: 1,
          startTime: "",
          endTime: "",
        });
        refreshReservations();
      } else {
        setBookingConflictError(res.error.message);
        toast.error(res.error.message);
      }
    });
  };

  const handleApprove = () => {
    if (!targetReservation) return;
    startTransition(async () => {
      const res = await approveReservationAction({ id: targetReservation.id });
      if (res.ok) {
        toast.success("อนุมัติการจองเรียบร้อยแล้ว");
        setApproveModalOpen(false);
        setTargetReservation(null);
        refreshReservations();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  const handleReject = () => {
    if (!targetReservation) return;
    if (!rejectReason.trim()) {
      toast.error("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }
    startTransition(async () => {
      const res = await rejectReservationAction({
        id: targetReservation.id,
        reason: rejectReason.trim(),
      });
      if (res.ok) {
        toast.success("ปฏิเสธคำขอจองเรียบร้อยแล้ว");
        setRejectModalOpen(false);
        setTargetReservation(null);
        setRejectReason("");
        refreshReservations();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  const handleCancelReservation = (id: string) => {
    if (!confirm(t("booking.cancelConfirm"))) return;
    startTransition(async () => {
      const res = await cancelReservationAction(id);
      if (res.ok) {
        toast.success("ยกเลิกการจองเรียบร้อยแล้ว");
        refreshReservations();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  // Resource CRUD Handlers
  const handleOpenCreateResource = () => {
    setEditingResource(null);
    setResourceForm({
      nameTh: "",
      nameEn: "",
      code: "",
      type: "ROOM",
      capacity: 10,
      locationTh: "",
      locationEn: "",
      facilities: "",
      driverName: "",
      imageUrl: "",
      isActive: true,
    });
    setResourceModalOpen(true);
  };

  const handleOpenEditResource = (r: ResourceDto) => {
    setEditingResource(r);
    setResourceForm({
      nameTh: r.nameTh,
      nameEn: r.nameEn || "",
      code: r.code,
      type: r.type,
      capacity: r.capacity,
      locationTh: r.locationTh || "",
      locationEn: r.locationEn || "",
      facilities: r.facilities.join(", "),
      driverName: r.driverName || "",
      imageUrl: r.imageUrl || "",
      isActive: r.isActive,
    });
    setResourceModalOpen(true);
  };

  const handleSaveResource = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const facilitiesArr = resourceForm.facilities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingResource) {
        const res = await updateResourceAction({
          id: editingResource.id,
          nameTh: resourceForm.nameTh,
          nameEn: resourceForm.nameEn || undefined,
          code: resourceForm.code,
          type: resourceForm.type,
          capacity: Number(resourceForm.capacity),
          locationTh: resourceForm.locationTh || undefined,
          locationEn: resourceForm.locationEn || undefined,
          facilities: facilitiesArr,
          driverName: resourceForm.driverName || undefined,
          imageUrl: resourceForm.imageUrl || undefined,
          isActive: resourceForm.isActive,
        });

        if (res.ok) {
          toast.success("แก้ไขข้อมูลทรัพยากรเรียบร้อยแล้ว");
          setResourceModalOpen(false);
          refreshResources();
        } else {
          toast.error(res.error.message);
        }
      } else {
        const res = await createResourceAction({
          nameTh: resourceForm.nameTh,
          nameEn: resourceForm.nameEn || undefined,
          code: resourceForm.code,
          type: resourceForm.type,
          capacity: Number(resourceForm.capacity),
          locationTh: resourceForm.locationTh || undefined,
          locationEn: resourceForm.locationEn || undefined,
          facilities: facilitiesArr,
          driverName: resourceForm.driverName || undefined,
          imageUrl: resourceForm.imageUrl || undefined,
          isActive: resourceForm.isActive,
        });

        if (res.ok) {
          toast.success("เพิ่มทรัพยากรใหม่เรียบร้อยแล้ว");
          setResourceModalOpen(false);
          refreshResources();
        } else {
          toast.error(res.error.message);
        }
      }
    });
  };

  const handleDeleteResource = (id: string) => {
    if (!confirm(t("booking.deleteResourceConfirm"))) return;
    startTransition(async () => {
      const res = await deleteResourceAction(id);
      if (res.ok) {
        toast.success("ลบทรัพยากรเรียบร้อยแล้ว");
        refreshResources();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-primary" />
            {t("booking.title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("booking.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <Button
              onClick={() => {
                setBookingConflictError(null);
                setCreateBookingOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>{t("booking.newBooking")}</span>
            </Button>
          )}

          {canManage && activeTab === "resources" && (
            <Button
              variant="outline"
              onClick={handleOpenCreateResource}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t("booking.newResource")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("reservations")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "reservations"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          {t("booking.tab.reservations")}
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {reservations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("resources")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "resources"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          {t("booking.tab.resources")}
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {resources.length}
          </span>
        </button>
      </div>

      {/* TAB 1: RESERVATIONS */}
      {activeTab === "reservations" && (
        <div className="space-y-4">
          {/* Filters */}
          <LiyonCard className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาวัตถุประสงค์, รหัสห้อง, ผู้จอง..."
                  value={reservationSearch}
                  onChange={(e) => setReservationSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="สถานะการจอง"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ALL">{t("booking.status.all")}</option>
                  <option value="PENDING">{t("booking.status.PENDING")}</option>
                  <option value="CONFIRMED">{t("booking.status.CONFIRMED")}</option>
                  <option value="REJECTED">{t("booking.status.REJECTED")}</option>
                  <option value="CANCELLED">{t("booking.status.CANCELLED")}</option>
                </select>
              </div>

              <div>
                <select
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  aria-label="เลือกทรัพยากร"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ALL">{t("booking.type.all")}</option>
                  {resources.map((res) => (
                    <option key={res.id} value={res.id}>
                      [{res.code}] {res.nameTh}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </LiyonCard>

          {/* DataTable */}
          <LiyonCard className="shadow-sm overflow-hidden">
            <DataTable<ReservationDto>
              state={filteredReservations.length === 0 ? "empty" : "data"}
              headHeading={t("booking.tab.reservations")}
              columns={reservationColumns}
              rows={filteredReservations}
              getRowId={(r) => r.id}
              empty={{
                icon: <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600" />,
                title: t("booking.empty.reservations"),
                description: "ไม่พบรายการจองตามเงื่อนไขที่กำหนด",
              }}
              error={{
                icon: <CalendarDays className="w-10 h-10 text-red-400" />,
                title: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
                description: "โปรดลองใหม่อีกครั้ง",
              }}
            />
          </LiyonCard>
        </div>
      )}

      {/* TAB 2: RESOURCES */}
      {activeTab === "resources" && (
        <div className="space-y-4">
          {/* Filters */}
          <LiyonCard className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหารหัส, ชื่อห้อง, สถานที่ตั้ง..."
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="ประเภททรัพยากร"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ALL">{t("booking.type.all")}</option>
                  <option value="ROOM">{t("booking.type.ROOM")}</option>
                  <option value="VEHICLE">{t("booking.type.VEHICLE")}</option>
                </select>
              </div>
            </div>
          </LiyonCard>

          {/* DataTable */}
          <LiyonCard className="shadow-sm overflow-hidden">
            <DataTable<ResourceDto>
              state={filteredResources.length === 0 ? "empty" : "data"}
              headHeading={t("booking.tab.resources")}
              columns={resourceColumns}
              rows={filteredResources}
              getRowId={(r) => r.id}
              empty={{
                icon: <DoorOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />,
                title: t("booking.empty.resources"),
                description: "ไม่พบข้อมูลห้องหรือยานพาหนะ",
              }}
              error={{
                icon: <DoorOpen className="w-10 h-10 text-red-400" />,
                title: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
                description: "โปรดลองใหม่อีกครั้ง",
              }}
            />
          </LiyonCard>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: CREATE RESERVATION WITH LIVE ZERO-OVERLAP COLLISION DETECTION    */}
      {/* ======================================================================= */}
      <LiyonDialog
        open={createBookingOpen}
        onOpenChange={(open) => {
          setCreateBookingOpen(open);
          if (!open) setBookingConflictError(null);
        }}
      >
        <LiyonDialogHeader
          title={t("booking.newBooking")}
          description="ระบบมีอัลกอริทึม Zero-overlap Collision Detection ตรวจจับการทับซ้อนของช่วงเวลาโดยอัตโนมัติ"
        />
        <LiyonDialogCloseButton label="ปิดหน้าต่าง" />

        <form onSubmit={handleCreateBooking}>
          <LiyonDialogBody className="space-y-4">
            {bookingConflictError && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">เกิดข้อผิดพลาดในการจอง:</div>
                  <div>{bookingConflictError}</div>
                </div>
              </div>
            )}

            <LiyonField label={t("booking.reservation.resource")}>
              <select
                value={bookingForm.resourceId}
                onChange={(e) =>
                  setBookingForm((prev) => ({ ...prev, resourceId: e.target.value }))
                }
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {resources
                  .filter((r) => r.isActive)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.code}] {r.nameTh} ({r.capacity} ที่นั่ง -{" "}
                      {r.type === "ROOM" ? t("booking.type.ROOM") : t("booking.type.VEHICLE")})
                    </option>
                  ))}
              </select>
            </LiyonField>

            <LiyonField label={t("booking.reservation.purpose")}>
              <input
                type="text"
                required
                placeholder="เช่น การประชุมคณะกรรมการประจำคณะ วาระพิเศษ"
                value={bookingForm.purpose}
                onChange={(e) =>
                  setBookingForm((prev) => ({ ...prev, purpose: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </LiyonField>

            <LiyonField label={t("booking.reservation.attendeeCount")}>
              <input
                type="number"
                min={1}
                max={500}
                required
                value={bookingForm.attendeeCount}
                onChange={(e) =>
                  setBookingForm((prev) => ({
                    ...prev,
                    attendeeCount: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </LiyonField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LiyonField label={t("booking.reservation.startTime")}>
                <input
                  type="datetime-local"
                  required
                  value={bookingForm.startTime}
                  onChange={(e) =>
                    setBookingForm((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </LiyonField>

              <LiyonField label={t("booking.reservation.endTime")}>
                <input
                  type="datetime-local"
                  required
                  value={bookingForm.endTime}
                  onChange={(e) =>
                    setBookingForm((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </LiyonField>
            </div>
          </LiyonDialogBody>

          <LiyonDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateBookingOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending} className="gap-2">
              <Check className="w-4 h-4" />
              {t("booking.save")}
            </Button>
          </LiyonDialogFooter>
        </form>
      </LiyonDialog>

      {/* ======================================================================= */}
      {/* MODAL: VIEW RESERVATION DETAIL                                          */}
      {/* ======================================================================= */}
      {selectedReservation && (
        <LiyonDialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <LiyonDialogHeader
            title="รายละเอียดการจอง"
            description={`รหัสการจอง: ${selectedReservation.id}`}
          />
          <LiyonDialogCloseButton label="ปิดหน้าต่าง" />
          <LiyonDialogBody className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block">ทรัพยากร</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  [{selectedReservation.resourceCode}] {selectedReservation.resourceNameTh}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">ประเภท</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium inline-block mt-0.5">
                  {selectedReservation.resourceType === "ROOM"
                    ? t("booking.type.ROOM")
                    : t("booking.type.VEHICLE")}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">ผู้จอง</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {selectedReservation.userName} ({selectedReservation.userEmail})
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">จำนวนผู้เข้าร่วม</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {selectedReservation.attendeeCount} คน
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-400 block">วัตถุประสงค์</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {selectedReservation.purpose}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">เวลาเริ่มต้น</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {formatDateTime(selectedReservation.startTime)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">เวลาสิ้นสุด</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {formatDateTime(selectedReservation.endTime)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">สถานะ</span>
                <StatusPill tone={getStatusTone(selectedReservation.status)}>
                  {t(`booking.status.${selectedReservation.status}`)}
                </StatusPill>
              </div>
              {selectedReservation.approverName && (
                <div>
                  <span className="text-xs text-slate-400 block">ผู้อนุมัติ</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {selectedReservation.approverName}
                  </span>
                </div>
              )}
              {selectedReservation.rejectReason && (
                <div className="col-span-2 text-rose-600 dark:text-rose-400">
                  <span className="text-xs block">เหตุผลที่ไม่อนุมัติ:</span>
                  <span>{selectedReservation.rejectReason}</span>
                </div>
              )}
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
              ปิด
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* ======================================================================= */}
      {/* MODAL: APPROVE RESERVATION                                              */}
      {/* ======================================================================= */}
      {targetReservation && (
        <LiyonDialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
          <LiyonDialogHeader
            title={t("booking.approve")}
            description="ตรวจสอบความพร้อมและยืนยันการอนุมัติการจอง"
          />
          <LiyonDialogCloseButton label="ปิดหน้าต่าง" />
          <LiyonDialogBody className="space-y-3 text-sm">
            <p>คุณต้องการอนุมัติคำขอจองนี้ใช่หรือไม่?</p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border text-xs space-y-1">
              <div>
                <strong>ทรัพยากร:</strong> [{targetReservation.resourceCode}]{" "}
                {targetReservation.resourceNameTh}
              </div>
              <div>
                <strong>วัตถุประสงค์:</strong> {targetReservation.purpose}
              </div>
              <div>
                <strong>เวลา:</strong> {formatDateTime(targetReservation.startTime)} -{" "}
                {formatDateTime(targetReservation.endTime)}
              </div>
              <div>
                <strong>ผู้จอง:</strong> {targetReservation.userName}
              </div>
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleApprove}
              disabled={pending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Check className="w-4 h-4" />
              ยืนยันอนุมัติ
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* ======================================================================= */}
      {/* MODAL: REJECT RESERVATION                                               */}
      {/* ======================================================================= */}
      {targetReservation && (
        <LiyonDialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
          <LiyonDialogHeader
            title={t("booking.reject")}
            description="ระบุเหตุผลในการปฏิเสธคำขอจอง"
          />
          <LiyonDialogCloseButton label="ปิดหน้าต่าง" />
          <LiyonDialogBody className="space-y-4">
            <LiyonField label={t("booking.reservation.rejectReason")}>
              <textarea
                required
                rows={3}
                placeholder="เช่น ห้องปิดปรับปรุงระบบเครื่องปรับอากาศ, มีคำขอใช้งานสำคัญระดับมหาวิทยาลัยแทรกด่วน"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </LiyonField>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleReject}
              disabled={pending}
              variant="destructive"
              className="gap-2"
            >
              <X className="w-4 h-4" />
              ยืนยันปฏิเสธ
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* ======================================================================= */}
      {/* MODAL: CREATE / EDIT RESOURCE                                           */}
      {/* ======================================================================= */}
      <LiyonDialog open={resourceModalOpen} onOpenChange={setResourceModalOpen}>
        <LiyonDialogHeader
          title={editingResource ? t("booking.editResource") : t("booking.newResource")}
          description="จัดการข้อมูลห้องประชุม สัมมนา และยานพาหนะส่วนกลาง"
        />
        <LiyonDialogCloseButton label="ปิดหน้าต่าง" />

        <form onSubmit={handleSaveResource}>
          <LiyonDialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LiyonField label={t("booking.resource.code")}>
                <input
                  type="text"
                  required
                  placeholder="เช่น ROOM-301, VAN-01"
                  value={resourceForm.code}
                  onChange={(e) =>
                    setResourceForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </LiyonField>

              <LiyonField label={t("booking.resource.type")}>
                <select
                  value={resourceForm.type}
                  onChange={(e) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      type: e.target.value as ResourceTypeEnum,
                    }))
                  }
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ROOM">{t("booking.type.ROOM")}</option>
                  <option value="VEHICLE">{t("booking.type.VEHICLE")}</option>
                </select>
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LiyonField label={t("booking.resource.nameTh")}>
                <input
                  type="text"
                  required
                  value={resourceForm.nameTh}
                  onChange={(e) =>
                    setResourceForm((prev) => ({ ...prev, nameTh: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </LiyonField>

              <LiyonField label={t("booking.resource.nameEn")}>
                <input
                  type="text"
                  value={resourceForm.nameEn}
                  onChange={(e) =>
                    setResourceForm((prev) => ({ ...prev, nameEn: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LiyonField label={t("booking.resource.capacity")}>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  required
                  value={resourceForm.capacity}
                  onChange={(e) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      capacity: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </LiyonField>

              {resourceForm.type === "VEHICLE" && (
                <LiyonField label={t("booking.resource.driverName")}>
                  <input
                    type="text"
                    placeholder="เช่น นายสมชาย ขยันขับ"
                    value={resourceForm.driverName}
                    onChange={(e) =>
                      setResourceForm((prev) => ({ ...prev, driverName: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </LiyonField>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LiyonField label={t("booking.resource.locationTh")}>
                <input
                  type="text"
                  placeholder="เช่น อาคาร 1 ชั้น 3 ห้อง 301"
                  value={resourceForm.locationTh}
                  onChange={(e) =>
                    setResourceForm((prev) => ({ ...prev, locationTh: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </LiyonField>

              <LiyonField label={t("booking.resource.locationEn")}>
                <input
                  type="text"
                  placeholder="e.g. Building 1, 3rd Floor"
                  value={resourceForm.locationEn}
                  onChange={(e) =>
                    setResourceForm((prev) => ({ ...prev, locationEn: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </LiyonField>
            </div>

            <LiyonField label={t("booking.resource.facilities")}>
              <input
                type="text"
                placeholder="เช่น โปรเจคเตอร์ 4K, ไมโครโฟนไร้สาย 4 ตัว, วิดีโอคอนเฟอเรนซ์ Zoom"
                value={resourceForm.facilities}
                onChange={(e) =>
                  setResourceForm((prev) => ({ ...prev, facilities: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </LiyonField>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActiveResource"
                checked={resourceForm.isActive}
                onChange={(e) =>
                  setResourceForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isActiveResource" className="text-sm font-medium">
                {t("booking.resource.active")} (เปิดให้จองในระบบ)
              </label>
            </div>
          </LiyonDialogBody>

          <LiyonDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setResourceModalOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending} className="gap-2">
              <Check className="w-4 h-4" />
              บันทึกทรัพยากร
            </Button>
          </LiyonDialogFooter>
        </form>
      </LiyonDialog>
    </div>
  );
}
