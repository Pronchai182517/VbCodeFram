"use client";

import { useState, useMemo } from "react";
import {
  GraduationCap,
  Search,
  BookOpen,
  Briefcase,
  Coins,
  Award,
  FileText,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import { useT } from "@/shared/lib/i18n/client";
import {
  LiyonCard,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogCloseButton,
  LiyonDialogBody,
  LiyonDialogFooter,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import type { ProgramDto, CourseDto, DegreeLevelEnum } from "@/features/curriculum";

interface CurriculumPortalClientProps {
  programs: ProgramDto[];
  courses: CourseDto[];
}

export function CurriculumPortalClient({
  programs,
  courses,
}: CurriculumPortalClientProps) {
  const t = useT();

  const [selectedDegree, setSelectedDegree] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<ProgramDto | null>(null);

  // Filter programs
  const filteredPrograms = useMemo(() => {
    return programs.filter((p: ProgramDto) => {
      const matchDegree = selectedDegree === "ALL" || p.degreeLevel === selectedDegree;
      if (!matchDegree) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inName =
        p.nameTh.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.shortNameTh.toLowerCase().includes(q) ||
        p.shortNameEn.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q);

      const inCareers = p.careerProspects.some((c: string) =>
        c.toLowerCase().includes(q)
      );

      return inName || inCareers;
    });
  }, [programs, selectedDegree, searchQuery]);

  // Courses for the selected program grouped by categoryGroup
  const groupedCourses = useMemo(() => {
    if (!selectedProgram) return {};
    const programCourses = courses.filter((c: CourseDto) => c.programId === selectedProgram.id);
    const groups: Record<string, CourseDto[]> = {};

    for (const c of programCourses) {
      const cat = c.categoryGroup || t("curriculum.cat.core");
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(c);
    }
    return groups;
  }, [selectedProgram, courses, t]);

  const getDegreeBadge = (degree: DegreeLevelEnum) => {
    switch (degree) {
      case "BACHELOR":
        return {
          label: t("curriculum.degree.bachelor"),
          className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
        };
      case "MASTER":
        return {
          label: t("curriculum.degree.master"),
          className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
        };
      case "DOCTORAL":
        return {
          label: t("curriculum.degree.doctoral"),
          className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
        };
      default:
        return {
          label: degree,
          className: "bg-muted text-muted-foreground border border-border",
        };
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-16 sm:py-20 border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(0,0,0,0))]" />
        <div className="container relative mx-auto px-4 max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-4 backdrop-blur-sm">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Faculty Curricula & Academic Programs</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            {t("curriculum.portal.title")}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t("curriculum.portal.subtitle")}
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("curriculum.search.placeholder")}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-border/80 bg-background/80 backdrop-blur-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          {/* Degree Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: "ALL", label: t("curriculum.degree.all") },
              { id: "BACHELOR", label: t("curriculum.degree.bachelor") },
              { id: "MASTER", label: t("curriculum.degree.master") },
              { id: "DOCTORAL", label: t("curriculum.degree.doctoral") },
            ].map((deg) => (
              <button
                key={deg.id}
                type="button"
                onClick={() => setSelectedDegree(deg.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedDegree === deg.id
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {deg.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Program Grid */}
      <main className="container mx-auto px-4 max-w-6xl mt-12">
        {filteredPrograms.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex p-4 rounded-full bg-muted/60 mb-4">
              <GraduationCap className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {t("curriculum.program.empty")}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              ลองเปลี่ยนคำค้นหาหรือระดับการศึกษาที่เลือก
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program: ProgramDto) => {
              const badge = getDegreeBadge(program.degreeLevel);
              return (
                <LiyonCard
                  key={program.id}
                  className="flex flex-col justify-between hover:shadow-lg hover:border-primary/40 transition-all duration-300 group overflow-hidden border-border/60"
                >
                  <div className="p-5 space-y-4">
                    {/* Top Row: Degree Badge + Code */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {program.code}
                      </span>
                    </div>

                    {/* Program Title & Short Degrees */}
                    <div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        {program.nameTh}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {program.nameEn}
                      </p>
                    </div>

                    <div className="text-xs font-medium text-foreground/80 bg-muted/40 p-2.5 rounded-xl border border-border/40 space-y-0.5">
                      <div>
                        <span className="text-muted-foreground text-[11px]">ชื่อปริญญา: </span>
                        {program.shortNameTh}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {program.shortNameEn}
                      </div>
                    </div>

                    {/* Key Metrics: Credits & Tuition */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background border border-border/50">
                        <Award className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <div className="text-[10px] text-muted-foreground">{t("curriculum.portal.creditsTotal")}</div>
                          <div className="font-semibold text-foreground">{program.totalCredits} นก.</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background border border-border/50">
                        <Coins className="h-4 w-4 text-amber-500 shrink-0" />
                        <div>
                          <div className="text-[10px] text-muted-foreground">ค่าเทอม</div>
                          <div className="font-semibold text-foreground">
                            {program.tuitionFeeTerm ? `${program.tuitionFeeTerm.toLocaleString()} ฿` : "ตามประกาศ"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Career Prospects Highlights */}
                    {program.careerProspects.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          <Briefcase className="h-3 w-3" />
                          <span>{t("curriculum.portal.careerHighlight")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {program.careerProspects.slice(0, 3).map((career: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
                            >
                              {career}
                            </span>
                          ))}
                          {program.careerProspects.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              +{program.careerProspects.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Action Buttons */}
                  <div className="p-4 border-t border-border/40 bg-muted/20 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProgram(program)}
                      className="text-xs w-full gap-1.5 font-semibold"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      {t("curriculum.program.viewCourses")} ({program.coursesCount})
                    </Button>

                    {program.leafletPdfUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-xs shrink-0 px-2.5"
                        title={t("curriculum.portal.downloadLeaflet")}
                      >
                        <a
                          href={program.leafletPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </a>
                      </Button>
                    )}
                  </div>
                </LiyonCard>
              );
            })}
          </div>
        )}
      </main>

      {/* Program Courses Structure Dialog */}
      <LiyonDialog
        open={Boolean(selectedProgram)}
        onOpenChange={(open) => !open && setSelectedProgram(null)}
      >
        <LiyonDialogCloseButton label={t("common.close")} />
        {selectedProgram && (
          <>
            <LiyonDialogHeader
              title={selectedProgram.nameTh}
              description={`${selectedProgram.nameEn} • ${selectedProgram.shortNameTh} • รวม ${selectedProgram.totalCredits} หน่วยกิต (พ.ศ. ${selectedProgram.yearIssued})`}
            />

            <LiyonDialogBody className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Program Overview */}
              {selectedProgram.descriptionTh && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs text-foreground/90 leading-relaxed">
                  <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    รายละเอียดหลักสูตร
                  </div>
                  <p>{selectedProgram.descriptionTh}</p>
                </div>
              )}

              {/* Career Opportunities List */}
              {selectedProgram.careerProspects.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                    {t("curriculum.portal.careerHighlight")}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProgram.careerProspects.map((career: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium"
                      >
                        {career}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses grouped by Category */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  {t("curriculum.portal.structureModalTitle")}
                </h4>

                {Object.keys(groupedCourses).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">
                    {t("curriculum.course.empty")}
                  </p>
                ) : (
                  Object.entries(groupedCourses).map(([category, courseList]) => (
                    <div
                      key={category}
                      className="rounded-xl border border-border/60 overflow-hidden bg-card"
                    >
                      <div className="bg-muted/60 px-3.5 py-2 text-xs font-bold text-foreground border-b border-border/50 flex items-center justify-between">
                        <span>{category}</span>
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {courseList.length} วิชา
                        </span>
                      </div>

                      <div className="divide-y divide-border/40">
                        {courseList.map((course: CourseDto) => (
                          <div
                            key={course.id}
                            className="p-3 hover:bg-muted/30 transition-colors space-y-1"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                  {course.code}
                                </span>
                                <span className="text-xs font-medium text-foreground">
                                  {course.nameTh}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">
                                {course.credits}
                              </span>
                            </div>

                            <div className="text-[11px] text-muted-foreground pl-1">
                              {course.nameEn}
                            </div>

                            {course.descriptionTh && (
                              <p className="text-[11px] text-muted-foreground/80 mt-1 pl-1 line-clamp-2">
                                {course.descriptionTh}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </LiyonDialogBody>

            <LiyonDialogFooter>
              {selectedProgram.leafletPdfUrl && (
                <Button variant="outline" asChild className="text-xs gap-1.5">
                  <a
                    href={selectedProgram.leafletPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("curriculum.portal.downloadLeaflet")}
                  </a>
                </Button>
              )}
              <Button onClick={() => setSelectedProgram(null)}>
                {t("common.close")}
              </Button>
            </LiyonDialogFooter>
          </>
        )}
      </LiyonDialog>
    </div>
  );
}
