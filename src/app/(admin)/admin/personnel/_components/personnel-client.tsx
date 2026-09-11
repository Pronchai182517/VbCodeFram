"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Building2,
  Mail,
  Phone,
  AlertCircle,
  Search,
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
  RowMenuItem,
  type DataTableColumn,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import type { DepartmentDto, StaffProfileDto } from "@/features/personnel";
import {
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
  createStaffProfileAction,
  updateStaffProfileAction,
  deleteStaffProfileAction,
  getStaffProfilesAction,
  getDepartmentsAction,
} from "@/features/personnel/actions";

interface Props {
  initialStaff: StaffProfileDto[];
  initialDepartments: DepartmentDto[];
  canManage: boolean;
}

export function PersonnelClient({
  initialStaff,
  initialDepartments,
  canManage,
}: Props) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<"staff" | "department">("staff");

  // State: Staff
  const [staffItems, setStaffItems] = useState<StaffProfileDto[]>(initialStaff);
  const [staffSearch, setStaffSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffProfileDto | null>(null);
  const [deleteStaffConfirm, setDeleteStaffConfirm] = useState<StaffProfileDto | null>(null);

  // State: Departments
  const [departments, setDepartments] = useState<DepartmentDto[]>(initialDepartments);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentDto | null>(null);
  const [deleteDeptConfirm, setDeleteDeptConfirm] = useState<DepartmentDto | null>(null);

  const [pending, startTransition] = useTransition();

  // Form State: Staff
  const [staffForm, setStaffForm] = useState({
    departmentId: "",
    prefixTh: "",
    prefixEn: "",
    firstNameTh: "",
    lastNameTh: "",
    firstNameEn: "",
    lastNameEn: "",
    academicPosition: "",
    adminPositionTh: "",
    adminPositionEn: "",
    email: "",
    phone: "",
    roomNumber: "",
    avatarUrl: "",
    bioTh: "",
    bioEn: "",
    expertiseText: "",
    orderIndex: 0,
    isActive: true,
  });

  // Form State: Department
  const [deptForm, setDeptForm] = useState({
    code: "",
    nameTh: "",
    nameEn: "",
    orderIndex: 0,
  });

  const refreshData = () => {
    startTransition(async () => {
      const [resStaff, resDepts] = await Promise.all([
        getStaffProfilesAction({ limit: 100 }),
        getDepartmentsAction(),
      ]);
      if (resStaff.ok) setStaffItems(resStaff.data.items);
      if (resDepts.ok) setDepartments(resDepts.data);
    });
  };

  // Staff Modal Helpers
  const openCreateStaff = () => {
    setEditingStaff(null);
    setStaffForm({
      departmentId: departments[0]?.id ?? "",
      prefixTh: "อ.",
      prefixEn: "Lecturer",
      firstNameTh: "",
      lastNameTh: "",
      firstNameEn: "",
      lastNameEn: "",
      academicPosition: "อาจารย์",
      adminPositionTh: "",
      adminPositionEn: "",
      email: "",
      phone: "",
      roomNumber: "",
      avatarUrl: "",
      bioTh: "",
      bioEn: "",
      expertiseText: "",
      orderIndex: staffItems.length,
      isActive: true,
    });
    setStaffModalOpen(true);
  };

  const openEditStaff = (staff: StaffProfileDto) => {
    setEditingStaff(staff);
    setStaffForm({
      departmentId: staff.departmentId,
      prefixTh: staff.prefixTh,
      prefixEn: staff.prefixEn,
      firstNameTh: staff.firstNameTh,
      lastNameTh: staff.lastNameTh,
      firstNameEn: staff.firstNameEn,
      lastNameEn: staff.lastNameEn,
      academicPosition: staff.academicPosition ?? "",
      adminPositionTh: staff.adminPositionTh ?? "",
      adminPositionEn: staff.adminPositionEn ?? "",
      email: staff.email,
      phone: staff.phone ?? "",
      roomNumber: staff.roomNumber ?? "",
      avatarUrl: staff.avatarUrl ?? "",
      bioTh: staff.bioTh ?? "",
      bioEn: staff.bioEn ?? "",
      expertiseText: staff.expertise.join(", "),
      orderIndex: staff.orderIndex,
      isActive: staff.isActive,
    });
    setStaffModalOpen(true);
  };

  const saveStaff = () => {
    if (!staffForm.firstNameTh || !staffForm.lastNameTh || !staffForm.email) {
      toast.error("กรุณากรอกชื่อ นามสกุล และอีเมล");
      return;
    }

    startTransition(async () => {
      const expertise = staffForm.expertiseText
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);

      const payload = {
        departmentId: staffForm.departmentId,
        prefixTh: staffForm.prefixTh,
        prefixEn: staffForm.prefixEn,
        firstNameTh: staffForm.firstNameTh,
        lastNameTh: staffForm.lastNameTh,
        firstNameEn: staffForm.firstNameEn,
        lastNameEn: staffForm.lastNameEn,
        academicPosition: staffForm.academicPosition || null,
        adminPositionTh: staffForm.adminPositionTh || null,
        adminPositionEn: staffForm.adminPositionEn || null,
        email: staffForm.email,
        phone: staffForm.phone || null,
        roomNumber: staffForm.roomNumber || null,
        avatarUrl: staffForm.avatarUrl || null,
        bioTh: staffForm.bioTh || null,
        bioEn: staffForm.bioEn || null,
        expertise,
        orderIndex: Number(staffForm.orderIndex) || 0,
        isActive: staffForm.isActive,
      };

      const res = editingStaff
        ? await updateStaffProfileAction({ ...payload, id: editingStaff.id })
        : await createStaffProfileAction(payload);

      if (!res.ok) {
        toast.error(res.error.message || t("common.error"));
        return;
      }

      toast.success(editingStaff ? t("personnel.updateSuccess") : t("personnel.createSuccess"));
      setStaffModalOpen(false);
      refreshData();
    });
  };

  const confirmDeleteStaff = () => {
    if (!deleteStaffConfirm) return;
    startTransition(async () => {
      const res = await deleteStaffProfileAction(deleteStaffConfirm.id);
      if (!res.ok) {
        toast.error(res.error.message || t("common.error"));
        return;
      }
      toast.success(t("personnel.deleteSuccess"));
      setDeleteStaffConfirm(null);
      refreshData();
    });
  };

  // Department Modal Helpers
  const openCreateDept = () => {
    setEditingDept(null);
    setDeptForm({
      code: "",
      nameTh: "",
      nameEn: "",
      orderIndex: departments.length + 1,
    });
    setDeptModalOpen(true);
  };

  const openEditDept = (dept: DepartmentDto) => {
    setEditingDept(dept);
    setDeptForm({
      code: dept.code,
      nameTh: dept.nameTh,
      nameEn: dept.nameEn,
      orderIndex: dept.orderIndex,
    });
    setDeptModalOpen(true);
  };

  const saveDept = () => {
    if (!deptForm.code || !deptForm.nameTh || !deptForm.nameEn) {
      toast.error("กรุณากรอกรหัสและชื่อภาควิชาให้ครบถ้วน");
      return;
    }

    startTransition(async () => {
      const res = editingDept
        ? await updateDepartmentAction({ ...deptForm, id: editingDept.id })
        : await createDepartmentAction(deptForm);

      if (!res.ok) {
        toast.error(res.error.message || t("common.error"));
        return;
      }

      toast.success("บันทึกภาควิชาเรียบร้อยแล้ว");
      setDeptModalOpen(false);
      refreshData();
    });
  };

  const confirmDeleteDept = () => {
    if (!deleteDeptConfirm) return;
    startTransition(async () => {
      const res = await deleteDepartmentAction(deleteDeptConfirm.id);
      if (!res.ok) {
        toast.error(res.error.message || t("common.error"));
        return;
      }
      toast.success("ลบภาควิชาเรียบร้อยแล้ว");
      setDeleteDeptConfirm(null);
      refreshData();
    });
  };

  // Filtered Staff
  const filteredStaff = staffItems.filter((s: StaffProfileDto) => {
    const matchDept = deptFilter === "ALL" || s.departmentId === deptFilter;
    if (!matchDept) return false;
    if (!staffSearch.trim()) return true;
    const q = staffSearch.toLowerCase();
    return (
      s.firstNameTh.toLowerCase().includes(q) ||
      s.lastNameTh.toLowerCase().includes(q) ||
      s.firstNameEn.toLowerCase().includes(q) ||
      s.lastNameEn.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.academicPosition?.toLowerCase().includes(q) ?? false)
    );
  });

  // Table Columns: Staff
  const staffColumns: DataTableColumn<StaffProfileDto>[] = [
    {
      key: "name",
      header: t("personnel.fullName"),
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold overflow-hidden border border-border/60 shrink-0">
            {row.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{row.firstNameTh.charAt(0) || "อ"}</span>
            )}
          </div>
          <div>
            <div className="font-medium text-foreground">
              {row.prefixTh} {row.firstNameTh} {row.lastNameTh}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.prefixEn} {row.firstNameEn} {row.lastNameEn}
            </div>
            {row.academicPosition && (
              <div className="text-xs text-primary font-medium mt-0.5">
                {row.academicPosition}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: t("personnel.department"),
      render: (row) => (
        <span className="text-xs font-medium text-foreground">
          {row.departmentNameTh ?? "-"}
        </span>
      ),
    },
    {
      key: "adminPosition",
      header: t("personnel.adminPositionTh"),
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.adminPositionTh || "—"}
        </span>
      ),
    },
    {
      key: "contact",
      header: t("personnel.email"),
      render: (row) => (
        <div className="space-y-0.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3 text-muted-foreground/70" />
            <span>{row.email}</span>
          </div>
          {row.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-muted-foreground/70" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: t("personnel.isActive"),
      render: (row) => (
        <StatusPill tone={row.isActive ? "ok" : "off"}>
          {row.isActive ? t("personnel.active") : t("personnel.inactive")}
        </StatusPill>
      ),
    },
  ];

  // Table Columns: Department
  const deptColumns: DataTableColumn<DepartmentDto>[] = [
    {
      key: "code",
      header: t("personnel.dept.code"),
      render: (row) => (
        <span className="font-mono font-bold text-xs bg-muted px-2 py-0.5 rounded">
          {row.code}
        </span>
      ),
    },
    {
      key: "nameTh",
      header: t("personnel.dept.nameTh"),
      render: (row) => (
        <div>
          <div className="font-medium text-foreground">{row.nameTh}</div>
          <div className="text-xs text-muted-foreground">{row.nameEn}</div>
        </div>
      ),
    },
    {
      key: "staffCount",
      header: t("personnel.dept.staffCount"),
      render: (row) => (
        <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
          {row.staffCount} ท่าน
        </span>
      ),
    },
    {
      key: "orderIndex",
      header: t("personnel.dept.orderIndex"),
      render: (row) => <span className="text-xs text-muted-foreground">{row.orderIndex}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("personnel.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("personnel.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          {canManage && activeTab === "staff" && (
            <Button onClick={openCreateStaff} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("personnel.staff.create")}
            </Button>
          )}
          {canManage && activeTab === "department" && (
            <Button onClick={openCreateDept} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("personnel.dept.create")}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("staff")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "staff"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Users className="h-4 w-4" />
          {t("personnel.tab.staff")} ({staffItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("department")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "department"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Building2 className="h-4 w-4" />
          {t("personnel.tab.department")} ({departments.length})
        </button>
      </div>

      {/* TAB 1: Staff Profiles */}
      {activeTab === "staff" && (
        <LiyonCard>
          {/* Filters Bar */}
          <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs rounded-xl border border-border/60 bg-background px-3 py-2 font-medium"
              >
                <option value="ALL">{t("personnel.portal.allDepartments")}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameTh}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border/60 bg-background"
              />
            </div>
          </div>

          <DataTable<StaffProfileDto>
            state={filteredStaff.length === 0 ? "empty" : "data"}
            rows={filteredStaff}
            columns={staffColumns}
            getRowId={(row) => row.id}
            renderRowMenu={
              canManage
                ? (row) => (
                    <>
                      <RowMenuItem
                        icon={<Edit2 className="h-4 w-4" />}
                        onSelect={() => openEditStaff(row)}
                      >
                        {t("personnel.staff.edit")}
                      </RowMenuItem>
                      <RowMenuItem
                        icon={<Trash2 className="h-4 w-4" />}
                        danger
                        onSelect={() => setDeleteStaffConfirm(row)}
                      >
                        {t("personnel.staff.delete")}
                      </RowMenuItem>
                    </>
                  )
                : undefined
            }
            empty={{
              icon: <Users className="h-10 w-10 text-muted-foreground/50" />,
              title: t("personnel.empty"),
              description: t("personnel.subtitle"),
            }}
            error={{
              icon: <AlertCircle className="h-10 w-10 text-destructive" />,
              title: t("common.error"),
            }}
            headHeading={t("personnel.tab.staff")}
          />
        </LiyonCard>
      )}

      {/* TAB 2: Departments */}
      {activeTab === "department" && (
        <LiyonCard>
          <DataTable<DepartmentDto>
            state={departments.length === 0 ? "empty" : "data"}
            rows={departments}
            columns={deptColumns}
            getRowId={(row) => row.id}
            renderRowMenu={
              canManage
                ? (row) => (
                    <>
                      <RowMenuItem
                        icon={<Edit2 className="h-4 w-4" />}
                        onSelect={() => openEditDept(row)}
                      >
                        {t("personnel.dept.edit")}
                      </RowMenuItem>
                      <RowMenuItem
                        icon={<Trash2 className="h-4 w-4" />}
                        danger
                        onSelect={() => setDeleteDeptConfirm(row)}
                      >
                        {t("personnel.dept.delete")}
                      </RowMenuItem>
                    </>
                  )
                : undefined
            }
            empty={{
              icon: <Building2 className="h-10 w-10 text-muted-foreground/50" />,
              title: "ยังไม่มีภาควิชาในระบบ",
              description: "เพิ่มภาควิชาหรือหน่วยงานเพื่อจัดโครงสร้างบุคลากร",
            }}
            error={{
              icon: <AlertCircle className="h-10 w-10 text-destructive" />,
              title: t("common.error"),
            }}
            headHeading={t("personnel.tab.department")}
          />
        </LiyonCard>
      )}

      {/* Dialog: Create/Edit Staff */}
      <LiyonDialog open={staffModalOpen} onOpenChange={setStaffModalOpen}>
        <LiyonDialogCloseButton label={t("common.close")} />
        <LiyonDialogHeader
          title={editingStaff ? t("personnel.staff.edit") : t("personnel.staff.create")}
          description="กรอกข้อมูลประวัติ ตำแหน่ง และช่องทางติดต่อของคณาจารย์/บุคลากร"
        />
        <LiyonDialogBody className="space-y-4 max-h-[75vh] overflow-y-auto">
          <LiyonField label={t("personnel.department")}>
            <select
              value={staffForm.departmentId}
              onChange={(e) => setStaffForm({ ...staffForm, departmentId: e.target.value })}
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameTh} ({d.code})
                </option>
              ))}
            </select>
          </LiyonField>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("personnel.prefixTh")}>
              <input
                type="text"
                value={staffForm.prefixTh}
                onChange={(e) => setStaffForm({ ...staffForm, prefixTh: e.target.value })}
                placeholder="เช่น ผศ.ดร., รศ., อาจารย์"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
            <LiyonField label={t("personnel.prefixEn")}>
              <input
                type="text"
                value={staffForm.prefixEn}
                onChange={(e) => setStaffForm({ ...staffForm, prefixEn: e.target.value })}
                placeholder="e.g. Asst. Prof. Dr., Dr."
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("personnel.firstNameTh")}>
              <input
                type="text"
                value={staffForm.firstNameTh}
                onChange={(e) => setStaffForm({ ...staffForm, firstNameTh: e.target.value })}
                placeholder="ชื่อ (ไทย)"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
            <LiyonField label={t("personnel.lastNameTh")}>
              <input
                type="text"
                value={staffForm.lastNameTh}
                onChange={(e) => setStaffForm({ ...staffForm, lastNameTh: e.target.value })}
                placeholder="นามสกุล (ไทย)"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("personnel.firstNameEn")}>
              <input
                type="text"
                value={staffForm.firstNameEn}
                onChange={(e) => setStaffForm({ ...staffForm, firstNameEn: e.target.value })}
                placeholder="First Name (English)"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
            <LiyonField label={t("personnel.lastNameEn")}>
              <input
                type="text"
                value={staffForm.lastNameEn}
                onChange={(e) => setStaffForm({ ...staffForm, lastNameEn: e.target.value })}
                placeholder="Last Name (English)"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("personnel.academicPosition")}>
              <input
                type="text"
                value={staffForm.academicPosition}
                onChange={(e) => setStaffForm({ ...staffForm, academicPosition: e.target.value })}
                placeholder="เช่น ผู้ช่วยศาสตราจารย์, รองศาสตราจารย์"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
            <LiyonField label={t("personnel.adminPositionTh")}>
              <input
                type="text"
                value={staffForm.adminPositionTh}
                onChange={(e) => setStaffForm({ ...staffForm, adminPositionTh: e.target.value })}
                placeholder="เช่น หัวหน้าภาควิชา, รองคณบดี"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("personnel.email")}>
              <input
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                placeholder="professor@faculty.ac.th"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
            <LiyonField label={t("personnel.phone")}>
              <input
                type="text"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                placeholder="02-xxx-xxxx"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("personnel.roomNumber")}>
              <input
                type="text"
                value={staffForm.roomNumber}
                onChange={(e) => setStaffForm({ ...staffForm, roomNumber: e.target.value })}
                placeholder="เช่น อาคาร 4 ห้อง 402"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
            <LiyonField label={t("personnel.avatarUrl")}>
              <input
                type="url"
                value={staffForm.avatarUrl}
                onChange={(e) => setStaffForm({ ...staffForm, avatarUrl: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
          </div>

          <LiyonField label={t("personnel.expertise")}>
            <input
              type="text"
              value={staffForm.expertiseText}
              onChange={(e) => setStaffForm({ ...staffForm, expertiseText: e.target.value })}
              placeholder="AI, Machine Learning, Data Science, Cybersecurity"
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>

          <LiyonField label={t("personnel.bioTh")}>
            <textarea
              rows={2}
              value={staffForm.bioTh}
              onChange={(e) => setStaffForm({ ...staffForm, bioTh: e.target.value })}
              placeholder="ประวัติการศึกษาและผลงานวิจัยโดยย่อ"
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="staffIsActive"
              checked={staffForm.isActive}
              onChange={(e) => setStaffForm({ ...staffForm, isActive: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor="staffIsActive" className="text-xs font-medium cursor-pointer">
              {t("personnel.active")}
            </label>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setStaffModalOpen(false)}>
            {t("personnel.cancel")}
          </Button>
          <Button onClick={saveStaff} disabled={pending}>
            {t("personnel.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Dialog: Create/Edit Department */}
      <LiyonDialog open={deptModalOpen} onOpenChange={setDeptModalOpen}>
        <LiyonDialogCloseButton label={t("common.close")} />
        <LiyonDialogHeader
          title={editingDept ? t("personnel.dept.edit") : t("personnel.dept.create")}
          description="จัดการรหัสและชื่อภาควิชาเพื่อจำแนกสังกัดบุคลากรและหลักสูตร"
        />
        <LiyonDialogBody className="space-y-4">
          <LiyonField label={t("personnel.dept.code")}>
            <input
              type="text"
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
              placeholder="เช่น CPE, EE, ME, DEAN_OFFICE"
              className="w-full font-mono text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>
          <LiyonField label={t("personnel.dept.nameTh")}>
            <input
              type="text"
              value={deptForm.nameTh}
              onChange={(e) => setDeptForm({ ...deptForm, nameTh: e.target.value })}
              placeholder="เช่น ภาควิชาวิศวกรรมคอมพิวเตอร์"
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>
          <LiyonField label={t("personnel.dept.nameEn")}>
            <input
              type="text"
              value={deptForm.nameEn}
              onChange={(e) => setDeptForm({ ...deptForm, nameEn: e.target.value })}
              placeholder="e.g. Department of Computer Engineering"
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>
          <LiyonField label={t("personnel.dept.orderIndex")}>
            <input
              type="number"
              value={deptForm.orderIndex}
              onChange={(e) => setDeptForm({ ...deptForm, orderIndex: Number(e.target.value) })}
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDeptModalOpen(false)}>
            {t("personnel.cancel")}
          </Button>
          <Button onClick={saveDept} disabled={pending}>
            {t("personnel.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Delete Staff Confirmation */}
      <LiyonDialog
        open={Boolean(deleteStaffConfirm)}
        onOpenChange={(open) => !open && setDeleteStaffConfirm(null)}
      >
        <LiyonDialogCloseButton label={t("common.close")} />
        <LiyonDialogHeader
          title={t("personnel.staff.delete")}
          description={t("personnel.staff.deleteConfirm")}
        />
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDeleteStaffConfirm(null)}>
            {t("personnel.cancel")}
          </Button>
          <Button variant="destructive" onClick={confirmDeleteStaff} disabled={pending}>
            {t("personnel.staff.delete")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Delete Department Confirmation */}
      <LiyonDialog
        open={Boolean(deleteDeptConfirm)}
        onOpenChange={(open) => !open && setDeleteDeptConfirm(null)}
      >
        <LiyonDialogCloseButton label={t("common.close")} />
        <LiyonDialogHeader
          title={t("personnel.dept.delete")}
          description={t("personnel.dept.deleteConfirm")}
        />
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDeleteDeptConfirm(null)}>
            {t("personnel.cancel")}
          </Button>
          <Button variant="destructive" onClick={confirmDeleteDept} disabled={pending}>
            {t("personnel.dept.delete")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
