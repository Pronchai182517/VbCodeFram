"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  BookOpen,
  Search,
  AlertCircle,
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
import type {
  ProgramDto,
  CourseDto,
  DegreeLevelEnum,
} from "@/features/curriculum";
import {
  createProgramAction,
  updateProgramAction,
  deleteProgramAction,
  createCourseAction,
  updateCourseAction,
  deleteCourseAction,
  getProgramsAction,
  getCoursesAction,
} from "@/features/curriculum/actions";

interface CurriculumClientProps {
  initialPrograms: ProgramDto[];
  initialCourses: CourseDto[];
  canManage: boolean;
}

export function CurriculumClient({
  initialPrograms,
  initialCourses,
  canManage,
}: CurriculumClientProps) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"programs" | "courses">("programs");

  // Data states
  const [programs, setPrograms] = useState<ProgramDto[]>(initialPrograms);
  const [courses, setCourses] = useState<CourseDto[]>(initialCourses);

  // Filters
  const [programSearch, setProgramSearch] = useState<string>("");
  const [degreeFilter, setDegreeFilter] = useState<string>("ALL");
  const [courseSearch, setCourseSearch] = useState<string>("");
  const [courseProgramFilter, setCourseProgramFilter] = useState<string>("ALL");

  // Program Modal State
  const [programModalOpen, setProgramModalOpen] = useState<boolean>(false);
  const [editingProgram, setEditingProgram] = useState<ProgramDto | null>(null);
  const [programForm, setProgramForm] = useState({
    code: "",
    degreeLevel: "BACHELOR" as DegreeLevelEnum,
    nameTh: "",
    nameEn: "",
    shortNameTh: "",
    shortNameEn: "",
    totalCredits: 140,
    yearIssued: 2565,
    tuitionFeeTerm: 25000,
    descriptionTh: "",
    descriptionEn: "",
    careerProspectsText: "",
    leafletPdfUrl: "",
    isActive: true,
  });

  // Course Modal State
  const [courseModalOpen, setCourseModalOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<CourseDto | null>(null);
  const [courseForm, setCourseForm] = useState({
    programId: "",
    code: "",
    nameTh: "",
    nameEn: "",
    credits: "3(3-0-6)",
    categoryGroup: "หมวดวิชาเฉพาะด้าน",
    descriptionTh: "",
    descriptionEn: "",
  });

  // Delete Confirmations
  const [deleteProgramConfirm, setDeleteProgramConfirm] = useState<ProgramDto | null>(null);
  const [deleteCourseConfirm, setDeleteCourseConfirm] = useState<CourseDto | null>(null);

  // Refresh helper
  const refreshData = () => {
    startTransition(async () => {
      const [resProg, resCourse] = await Promise.all([
        getProgramsAction(),
        getCoursesAction(),
      ]);
      if (resProg.ok && resProg.data) {
        setPrograms(resProg.data);
      }
      if (resCourse.ok && resCourse.data) {
        setCourses(resCourse.data);
      }
    });
  };

  // Open Program Modals
  const openCreateProgram = () => {
    setEditingProgram(null);
    setProgramForm({
      code: "",
      degreeLevel: "BACHELOR",
      nameTh: "",
      nameEn: "",
      shortNameTh: "",
      shortNameEn: "",
      totalCredits: 140,
      yearIssued: 2565,
      tuitionFeeTerm: 25000,
      descriptionTh: "",
      descriptionEn: "",
      careerProspectsText: "",
      leafletPdfUrl: "",
      isActive: true,
    });
    setProgramModalOpen(true);
  };

  const openEditProgram = (prog: ProgramDto) => {
    setEditingProgram(prog);
    setProgramForm({
      code: prog.code,
      degreeLevel: prog.degreeLevel,
      nameTh: prog.nameTh,
      nameEn: prog.nameEn,
      shortNameTh: prog.shortNameTh,
      shortNameEn: prog.shortNameEn,
      totalCredits: prog.totalCredits,
      yearIssued: prog.yearIssued,
      tuitionFeeTerm: prog.tuitionFeeTerm ?? 0,
      descriptionTh: prog.descriptionTh || "",
      descriptionEn: prog.descriptionEn || "",
      careerProspectsText: prog.careerProspects.join(", "),
      leafletPdfUrl: prog.leafletPdfUrl || "",
      isActive: prog.isActive,
    });
    setProgramModalOpen(true);
  };

  // Open Course Modals
  const openCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm({
      programId: programs[0]?.id || "",
      code: "",
      nameTh: "",
      nameEn: "",
      credits: "3(3-0-6)",
      categoryGroup: "หมวดวิชาเฉพาะด้าน",
      descriptionTh: "",
      descriptionEn: "",
    });
    setCourseModalOpen(true);
  };

  const openEditCourse = (c: CourseDto) => {
    setEditingCourse(c);
    setCourseForm({
      programId: c.programId,
      code: c.code,
      nameTh: c.nameTh,
      nameEn: c.nameEn,
      credits: c.credits,
      categoryGroup: c.categoryGroup,
      descriptionTh: c.descriptionTh || "",
      descriptionEn: c.descriptionEn || "",
    });
    setCourseModalOpen(true);
  };

  // Program Handlers
  const saveProgram = () => {
    if (!programForm.code.trim() || !programForm.nameTh.trim() || !programForm.nameEn.trim()) {
      toast.error("กรุณากรอกรหัสหลักสูตรและชื่อหลักสูตรให้ครบถ้วน");
      return;
    }

    startTransition(async () => {
      const careers = programForm.careerProspectsText
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);

      const payload = {
        code: programForm.code,
        degreeLevel: programForm.degreeLevel,
        nameTh: programForm.nameTh,
        nameEn: programForm.nameEn,
        shortNameTh: programForm.shortNameTh,
        shortNameEn: programForm.shortNameEn,
        totalCredits: Number(programForm.totalCredits),
        yearIssued: Number(programForm.yearIssued),
        tuitionFeeTerm: Number(programForm.tuitionFeeTerm) || null,
        descriptionTh: programForm.descriptionTh || null,
        descriptionEn: programForm.descriptionEn || null,
        careerProspects: careers,
        leafletPdfUrl: programForm.leafletPdfUrl || null,
        isActive: programForm.isActive,
      };

      if (editingProgram) {
        const res = await updateProgramAction({ ...payload, id: editingProgram.id });
        if (!res.ok) {
          toast.error(res.error.message || t("common.error"));
          return;
        }
        toast.success("บันทึกการแก้ไขหลักสูตรเรียบร้อยแล้ว");
        setProgramModalOpen(false);
        refreshData();
      } else {
        const res = await createProgramAction(payload);
        if (!res.ok) {
          toast.error(res.error.message || t("common.error"));
          return;
        }
        toast.success("สร้างหลักสูตรใหม่เรียบร้อยแล้ว");
        setProgramModalOpen(false);
        refreshData();
      }
    });
  };

  const confirmDeleteProgram = () => {
    if (!deleteProgramConfirm) return;
    startTransition(async () => {
      const res = await deleteProgramAction(deleteProgramConfirm.id);
      if (!res.ok) {
        toast.error(res.error.message || t("common.error"));
      } else {
        toast.success("ลบหลักสูตรเรียบร้อยแล้ว");
      }
      setDeleteProgramConfirm(null);
      refreshData();
    });
  };

  // Course Handlers
  const saveCourse = () => {
    if (!courseForm.programId || !courseForm.code.trim() || !courseForm.nameTh.trim()) {
      toast.error("กรุณาเลือกรหัสวิชา สังกัดหลักสูตร และชื่อวิชา");
      return;
    }

    startTransition(async () => {
      const payload = {
        programId: courseForm.programId,
        code: courseForm.code,
        nameTh: courseForm.nameTh,
        nameEn: courseForm.nameEn,
        credits: courseForm.credits,
        categoryGroup: courseForm.categoryGroup,
        descriptionTh: courseForm.descriptionTh || null,
        descriptionEn: courseForm.descriptionEn || null,
      };

      if (editingCourse) {
        const res = await updateCourseAction({ ...payload, id: editingCourse.id });
        if (!res.ok) {
          toast.error(res.error.message || t("common.error"));
          return;
        }
        toast.success("บันทึกการแก้ไขรายวิชาเรียบร้อยแล้ว");
        setCourseModalOpen(false);
        refreshData();
      } else {
        const res = await createCourseAction(payload);
        if (!res.ok) {
          toast.error(res.error.message || t("common.error"));
          return;
        }
        toast.success("เพิ่มรายวิชาเรียบร้อยแล้ว");
        setCourseModalOpen(false);
        refreshData();
      }
    });
  };

  const confirmDeleteCourse = () => {
    if (!deleteCourseConfirm) return;
    startTransition(async () => {
      const res = await deleteCourseAction(deleteCourseConfirm.id);
      if (!res.ok) {
        toast.error(res.error.message || t("common.error"));
      } else {
        toast.success("ลบรายวิชาเรียบร้อยแล้ว");
      }
      setDeleteCourseConfirm(null);
      refreshData();
    });
  };

  // Filtered Programs
  const filteredPrograms = programs.filter((p: ProgramDto) => {
    const matchDegree = degreeFilter === "ALL" || p.degreeLevel === degreeFilter;
    if (!matchDegree) return false;
    if (!programSearch.trim()) return true;
    const q = programSearch.toLowerCase();
    return (
      p.nameTh.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.shortNameTh.toLowerCase().includes(q)
    );
  });

  // Filtered Courses
  const filteredCourses = courses.filter((c: CourseDto) => {
    const matchProgram =
      courseProgramFilter === "ALL" || c.programId === courseProgramFilter;
    if (!matchProgram) return false;
    if (!courseSearch.trim()) return true;
    const q = courseSearch.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.nameTh.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.categoryGroup.toLowerCase().includes(q)
    );
  });

  // Columns: Programs
  const programColumns: DataTableColumn<ProgramDto>[] = [
    {
      key: "code",
      header: t("curriculum.program.code"),
      render: (row: ProgramDto) => (
        <span className="font-mono font-bold text-xs bg-muted px-2 py-0.5 rounded">
          {row.code}
        </span>
      ),
    },
    {
      key: "name",
      header: t("curriculum.program.nameTh"),
      render: (row: ProgramDto) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground text-xs">{row.nameTh}</div>
          <div className="text-[11px] text-muted-foreground">{row.nameEn}</div>
        </div>
      ),
    },
    {
      key: "degreeLevel",
      header: t("curriculum.program.degreeLevel"),
      render: (row: ProgramDto) => {
        const map: Record<DegreeLevelEnum, { label: string; tone: string }> = {
          BACHELOR: { label: t("curriculum.degree.bachelor"), tone: "bg-blue-500/10 text-blue-600" },
          MASTER: { label: t("curriculum.degree.master"), tone: "bg-indigo-500/10 text-indigo-600" },
          DOCTORAL: { label: t("curriculum.degree.doctoral"), tone: "bg-purple-500/10 text-purple-600" },
        };
        const info = map[row.degreeLevel] || { label: row.degreeLevel, tone: "bg-muted" };
        return (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${info.tone}`}>
            {info.label}
          </span>
        );
      },
    },
    {
      key: "credits",
      header: t("curriculum.program.totalCredits"),
      render: (row: ProgramDto) => (
        <span className="text-xs font-medium text-foreground">
          {row.totalCredits} นก. (พ.ศ. {row.yearIssued})
        </span>
      ),
    },
    {
      key: "coursesCount",
      header: t("curriculum.program.coursesCount"),
      render: (row: ProgramDto) => (
        <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
          {row.coursesCount} วิชา
        </span>
      ),
    },
    {
      key: "status",
      header: t("curriculum.program.status"),
      render: (row: ProgramDto) => (
        <StatusPill tone={row.isActive ? "ok" : "off"}>
          {row.isActive ? t("curriculum.program.active") : t("curriculum.program.inactive")}
        </StatusPill>
      ),
    },
  ];

  // Columns: Courses
  const courseColumns: DataTableColumn<CourseDto>[] = [
    {
      key: "code",
      header: t("curriculum.course.code"),
      render: (row: CourseDto) => (
        <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
          {row.code}
        </span>
      ),
    },
    {
      key: "name",
      header: t("curriculum.course.nameTh"),
      render: (row: CourseDto) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground text-xs">{row.nameTh}</div>
          <div className="text-[11px] text-muted-foreground">{row.nameEn}</div>
        </div>
      ),
    },
    {
      key: "program",
      header: t("curriculum.course.program"),
      render: (row: CourseDto) => (
        <span className="text-xs text-muted-foreground font-medium">
          {row.programNameTh || row.programCode}
        </span>
      ),
    },
    {
      key: "categoryGroup",
      header: t("curriculum.course.categoryGroup"),
      render: (row: CourseDto) => (
        <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
          {row.categoryGroup}
        </span>
      ),
    },
    {
      key: "credits",
      header: t("curriculum.course.credits"),
      render: (row: CourseDto) => (
        <span className="text-xs font-semibold text-foreground">
          {row.credits}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("curriculum.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("curriculum.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          {canManage && activeTab === "programs" && (
            <Button onClick={openCreateProgram} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("curriculum.program.create")}
            </Button>
          )}
          {canManage && activeTab === "courses" && (
            <Button onClick={openCreateCourse} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("curriculum.course.create")}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("programs")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "programs"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          {t("curriculum.tab.programs")} ({programs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("courses")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "courses"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          {t("curriculum.tab.courses")} ({courses.length})
        </button>
      </div>

      {/* TAB 1: Programs */}
      {activeTab === "programs" && (
        <LiyonCard>
          {/* Filter Toolbar */}
          <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={degreeFilter}
                onChange={(e) => setDegreeFilter(e.target.value)}
                className="text-xs rounded-xl border border-border/60 bg-background px-3 py-2 font-medium"
              >
                <option value="ALL">{t("curriculum.degree.all")}</option>
                <option value="BACHELOR">{t("curriculum.degree.bachelor")}</option>
                <option value="MASTER">{t("curriculum.degree.master")}</option>
                <option value="DOCTORAL">{t("curriculum.degree.doctoral")}</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={programSearch}
                onChange={(e) => setProgramSearch(e.target.value)}
                placeholder="ค้นหารหัส, ชื่อหลักสูตร..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border/60 bg-background"
              />
            </div>
          </div>

          <DataTable<ProgramDto>
            state={filteredPrograms.length === 0 ? "empty" : "data"}
            rows={filteredPrograms}
            columns={programColumns}
            getRowId={(row: ProgramDto) => row.id}
            renderRowMenu={
              canManage
                ? (row: ProgramDto) => (
                    <>
                      <RowMenuItem
                        icon={<Edit2 className="h-4 w-4" />}
                        onSelect={() => openEditProgram(row)}
                      >
                        {t("curriculum.program.edit")}
                      </RowMenuItem>
                      <RowMenuItem
                        icon={<Trash2 className="h-4 w-4" />}
                        danger
                        onSelect={() => setDeleteProgramConfirm(row)}
                      >
                        {t("curriculum.program.delete")}
                      </RowMenuItem>
                    </>
                  )
                : undefined
            }
            empty={{
              icon: <GraduationCap className="h-10 w-10 text-muted-foreground/50" />,
              title: t("curriculum.program.empty"),
              description: t("curriculum.subtitle"),
            }}
            error={{
              icon: <AlertCircle className="h-10 w-10 text-destructive" />,
              title: t("common.error"),
            }}
            headHeading={t("curriculum.tab.programs")}
          />
        </LiyonCard>
      )}

      {/* TAB 2: Courses */}
      {activeTab === "courses" && (
        <LiyonCard>
          {/* Filter Toolbar */}
          <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={courseProgramFilter}
                onChange={(e) => setCourseProgramFilter(e.target.value)}
                className="text-xs rounded-xl border border-border/60 bg-background px-3 py-2 font-medium max-w-xs truncate"
              >
                <option value="ALL">{t("curriculum.filter.allPrograms")}</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameTh} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder={t("curriculum.search.placeholder")}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border/60 bg-background"
              />
            </div>
          </div>

          <DataTable<CourseDto>
            state={filteredCourses.length === 0 ? "empty" : "data"}
            rows={filteredCourses}
            columns={courseColumns}
            getRowId={(row: CourseDto) => row.id}
            renderRowMenu={
              canManage
                ? (row: CourseDto) => (
                    <>
                      <RowMenuItem
                        icon={<Edit2 className="h-4 w-4" />}
                        onSelect={() => openEditCourse(row)}
                      >
                        {t("curriculum.course.edit")}
                      </RowMenuItem>
                      <RowMenuItem
                        icon={<Trash2 className="h-4 w-4" />}
                        danger
                        onSelect={() => setDeleteCourseConfirm(row)}
                      >
                        {t("curriculum.course.delete")}
                      </RowMenuItem>
                    </>
                  )
                : undefined
            }
            empty={{
              icon: <BookOpen className="h-10 w-10 text-muted-foreground/50" />,
              title: t("curriculum.course.empty"),
              description: "เพิ่มรายวิชาในหลักสูตรเพื่อจัดการโครงสร้างการเรียนการสอน",
            }}
            error={{
              icon: <AlertCircle className="h-10 w-10 text-destructive" />,
              title: t("common.error"),
            }}
            headHeading={t("curriculum.tab.courses")}
          />
        </LiyonCard>
      )}

      {/* Dialog: Create/Edit Program */}
      <LiyonDialog open={programModalOpen} onOpenChange={setProgramModalOpen}>
        <LiyonDialogCloseButton label={t("common.close")} />
        <LiyonDialogHeader
          title={editingProgram ? t("curriculum.program.edit") : t("curriculum.program.create")}
          description="กำหนดรหัสหลักสูตร ระดับการศึกษา ค่าธรรมเนียม และแนวทางอาชีพ"
        />
        <LiyonDialogBody className="space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("curriculum.program.code")}>
              <input
                type="text"
                value={programForm.code}
                onChange={(e) => setProgramForm({ ...programForm, code: e.target.value.toUpperCase() })}
                placeholder="เช่น CPE-BENG-2565"
                className="w-full font-mono text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>

            <LiyonField label={t("curriculum.program.degreeLevel")}>
              <select
                value={programForm.degreeLevel}
                onChange={(e) =>
                  setProgramForm({
                    ...programForm,
                    degreeLevel: e.target.value as DegreeLevelEnum,
                  })
                }
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              >
                <option value="BACHELOR">{t("curriculum.degree.bachelor")}</option>
                <option value="MASTER">{t("curriculum.degree.master")}</option>
                <option value="DOCTORAL">{t("curriculum.degree.doctoral")}</option>
              </select>
            </LiyonField>
          </div>

          <LiyonField label={t("curriculum.program.nameTh")}>
            <input
              type="text"
              value={programForm.nameTh}
              onChange={(e) => setProgramForm({ ...programForm, nameTh: e.target.value })}
              placeholder="เช่น หลักสูตรวิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมคอมพิวเตอร์"
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>

          <LiyonField label={t("curriculum.program.nameEn")}>
            <input
              type="text"
              value={programForm.nameEn}
              onChange={(e) => setProgramForm({ ...programForm, nameEn: e.target.value })}
              placeholder="e.g. Bachelor of Engineering in Computer Engineering"
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("curriculum.program.shortNameTh")}>
              <input
                type="text"
                value={programForm.shortNameTh}
                onChange={(e) => setProgramForm({ ...programForm, shortNameTh: e.target.value })}
                placeholder="เช่น วศ.บ. (วิศวกรรมคอมพิวเตอร์)"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>

            <LiyonField label={t("curriculum.program.shortNameEn")}>
              <input
                type="text"
                value={programForm.shortNameEn}
                onChange={(e) => setProgramForm({ ...programForm, shortNameEn: e.target.value })}
                placeholder="e.g. B.Eng. (Computer Engineering)"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <LiyonField label={t("curriculum.program.totalCredits")}>
              <input
                type="number"
                value={programForm.totalCredits}
                onChange={(e) => setProgramForm({ ...programForm, totalCredits: Number(e.target.value) })}
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>

            <LiyonField label={t("curriculum.program.yearIssued")}>
              <input
                type="number"
                value={programForm.yearIssued}
                onChange={(e) => setProgramForm({ ...programForm, yearIssued: Number(e.target.value) })}
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>

            <LiyonField label={t("curriculum.program.tuitionFeeTerm")}>
              <input
                type="number"
                value={programForm.tuitionFeeTerm}
                onChange={(e) => setProgramForm({ ...programForm, tuitionFeeTerm: Number(e.target.value) })}
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
          </div>

          <LiyonField label={t("curriculum.program.careerProspects")}>
            <input
              type="text"
              value={programForm.careerProspectsText}
              onChange={(e) => setProgramForm({ ...programForm, careerProspectsText: e.target.value })}
              placeholder="Software Engineer, Cloud Architect, DevOps, AI Specialist"
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>

          <LiyonField label={t("curriculum.program.leafletPdfUrl")}>
            <input
              type="url"
              value={programForm.leafletPdfUrl}
              onChange={(e) => setProgramForm({ ...programForm, leafletPdfUrl: e.target.value })}
              placeholder="https://example.com/curriculum-brochure.pdf"
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>

          <LiyonField label={t("curriculum.program.descriptionTh")}>
            <textarea
              rows={2}
              value={programForm.descriptionTh}
              onChange={(e) => setProgramForm({ ...programForm, descriptionTh: e.target.value })}
              placeholder="ข้อมูลภาพรวม วัตถุประสงค์การผลิตบัณฑิต"
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="programIsActive"
              checked={programForm.isActive}
              onChange={(e) => setProgramForm({ ...programForm, isActive: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor="programIsActive" className="text-xs font-medium cursor-pointer">
              {t("curriculum.program.active")}
            </label>
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setProgramModalOpen(false)}>
            {t("curriculum.cancel")}
          </Button>
          <Button onClick={saveProgram} disabled={pending}>
            {t("curriculum.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Dialog: Create/Edit Course */}
      <LiyonDialog open={courseModalOpen} onOpenChange={setCourseModalOpen}>
        <LiyonDialogCloseButton label={t("common.close")} />
        <LiyonDialogHeader
          title={editingCourse ? t("curriculum.course.edit") : t("curriculum.course.create")}
          description="จัดการรหัสวิชา ชื่อวิชา หน่วยกิต และหมวดหมู่วิชาในหลักสูตร"
        />
        <LiyonDialogBody className="space-y-4">
          <LiyonField label={t("curriculum.course.program")}>
            <select
              value={courseForm.programId}
              onChange={(e) => setCourseForm({ ...courseForm, programId: e.target.value })}
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameTh} ({p.code})
                </option>
              ))}
            </select>
          </LiyonField>

          <div className="grid grid-cols-2 gap-3">
            <LiyonField label={t("curriculum.course.code")}>
              <input
                type="text"
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
                placeholder="เช่น CPE101, ENG201"
                className="w-full font-mono text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>

            <LiyonField label={t("curriculum.course.credits")}>
              <input
                type="text"
                value={courseForm.credits}
                onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })}
                placeholder="เช่น 3(3-0-6)"
                className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
              />
            </LiyonField>
          </div>

          <LiyonField label={t("curriculum.course.nameTh")}>
            <input
              type="text"
              value={courseForm.nameTh}
              onChange={(e) => setCourseForm({ ...courseForm, nameTh: e.target.value })}
              placeholder="ชื่อวิชา (ภาษาไทย)"
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>

          <LiyonField label={t("curriculum.course.nameEn")}>
            <input
              type="text"
              value={courseForm.nameEn}
              onChange={(e) => setCourseForm({ ...courseForm, nameEn: e.target.value })}
              placeholder="Course Title (English)"
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>

          <LiyonField label={t("curriculum.course.categoryGroup")}>
            <select
              value={courseForm.categoryGroup}
              onChange={(e) => setCourseForm({ ...courseForm, categoryGroup: e.target.value })}
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            >
              <option value="หมวดวิชาศึกษาทั่วไป">{t("curriculum.cat.general")}</option>
              <option value="หมวดวิชาเฉพาะด้าน">{t("curriculum.cat.core")}</option>
              <option value="หมวดวิชาเอกบังคับ">{t("curriculum.cat.major")}</option>
              <option value="หมวดวิชาเอกเลือก">{t("curriculum.cat.elective")}</option>
              <option value="หมวดวิชาเลือกเสรี">{t("curriculum.cat.free")}</option>
              <option value="หมวดวิทยานิพนธ์/โครงงาน">{t("curriculum.cat.thesis")}</option>
            </select>
          </LiyonField>

          <LiyonField label={t("curriculum.course.descriptionTh")}>
            <textarea
              rows={2}
              value={courseForm.descriptionTh}
              onChange={(e) => setCourseForm({ ...courseForm, descriptionTh: e.target.value })}
              placeholder="คำอธิบายสาระสำคัญของรายวิชา"
              className="w-full text-xs rounded-xl border border-border/60 bg-background px-3 py-2"
            />
          </LiyonField>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setCourseModalOpen(false)}>
            {t("curriculum.cancel")}
          </Button>
          <Button onClick={saveCourse} disabled={pending}>
            {t("curriculum.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Delete Program Confirmation */}
      <LiyonDialog
        open={Boolean(deleteProgramConfirm)}
        onOpenChange={(open) => !open && setDeleteProgramConfirm(null)}
      >
        <LiyonDialogCloseButton label={t("common.close")} />
        <LiyonDialogHeader
          title={t("curriculum.program.delete")}
          description={t("curriculum.program.deleteConfirm")}
        />
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDeleteProgramConfirm(null)}>
            {t("curriculum.cancel")}
          </Button>
          <Button variant="destructive" onClick={confirmDeleteProgram} disabled={pending}>
            {t("curriculum.program.delete")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Delete Course Confirmation */}
      <LiyonDialog
        open={Boolean(deleteCourseConfirm)}
        onOpenChange={(open) => !open && setDeleteCourseConfirm(null)}
      >
        <LiyonDialogCloseButton label={t("common.close")} />
        <LiyonDialogHeader
          title={t("curriculum.course.delete")}
          description={t("curriculum.course.deleteConfirm")}
        />
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDeleteCourseConfirm(null)}>
            {t("curriculum.cancel")}
          </Button>
          <Button variant="destructive" onClick={confirmDeleteCourse} disabled={pending}>
            {t("curriculum.course.delete")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}
