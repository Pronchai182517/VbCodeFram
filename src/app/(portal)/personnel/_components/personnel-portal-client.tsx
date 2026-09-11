"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Users,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import type { DepartmentDto, StaffProfileDto } from "@/features/personnel";

interface Props {
  staffList: StaffProfileDto[];
  departments: DepartmentDto[];
}

export function PersonnelPortalClient({ staffList, departments }: Props) {
  const t = useT();
  const locale = useLocale();

  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<StaffProfileDto | null>(null);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchDept = selectedDept === "ALL" || s.departmentId === selectedDept;
      if (!matchDept) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inNameTh =
        s.firstNameTh.toLowerCase().includes(q) || s.lastNameTh.toLowerCase().includes(q);
      const inNameEn =
        s.firstNameEn.toLowerCase().includes(q) || s.lastNameEn.toLowerCase().includes(q);
      const inEmail = s.email.toLowerCase().includes(q);
      const inPos =
        (s.academicPosition?.toLowerCase().includes(q) ?? false) ||
        (s.adminPositionTh?.toLowerCase().includes(q) ?? false);
      const inExpertise = s.expertise.some((exp) => exp.toLowerCase().includes(q));

      return inNameTh || inNameEn || inEmail || inPos || inExpertise;
    });
  }, [staffList, selectedDept, searchQuery]);

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
          <GraduationCap className="h-3.5 w-3.5" />
          {t("personnel.nav")}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {t("personnel.portal.title")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          {t("personnel.portal.subtitle")}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/60 pb-6">
        {/* Department Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setSelectedDept("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedDept === "ALL"
                ? "bg-primary text-primary-foreground shadow-sm scale-102"
                : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("personnel.portal.allDepartments")}
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDept(d.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedDept === d.id
                  ? "bg-primary text-primary-foreground shadow-sm scale-102"
                  : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {locale === "en" ? d.nameEn : d.nameTh}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("personnel.portal.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border/60 bg-muted/10 space-y-3">
          <div className="h-12 w-12 rounded-full bg-muted/80 text-muted-foreground flex items-center justify-center mx-auto">
            <Users className="h-6 w-6" />
          </div>
          <div className="font-semibold text-foreground text-base">
            {t("personnel.portal.noResults")}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("personnel.empty")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => {
            const fullNameTh = `${staff.prefixTh} ${staff.firstNameTh} ${staff.lastNameTh}`;
            const fullNameEn = `${staff.prefixEn} ${staff.firstNameEn} ${staff.lastNameEn}`;
            const primaryName = locale === "en" ? fullNameEn : fullNameTh;
            const secondaryName = locale === "en" ? fullNameTh : fullNameEn;
            const deptName =
              locale === "en" && staff.departmentNameEn
                ? staff.departmentNameEn
                : staff.departmentNameTh;
            const adminPos =
              locale === "en" && staff.adminPositionEn
                ? staff.adminPositionEn
                : staff.adminPositionTh;

            return (
              <div
                key={staff.id}
                className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 relative overflow-hidden"
              >
                {/* Admin Position Badge (if any) */}
                {adminPos && (
                  <div className="absolute top-0 right-0 bg-primary/10 text-primary border-b border-l border-primary/20 text-[11px] font-semibold px-3 py-1 rounded-bl-xl">
                    {adminPos}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Avatar & Header */}
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl overflow-hidden border border-border/60 shrink-0 group-hover:scale-105 transition-transform">
                      {staff.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={staff.avatarUrl}
                          alt={primaryName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{staff.firstNameTh.charAt(0) || "อ"}</span>
                      )}
                    </div>

                    <div className="space-y-1 pr-14">
                      {staff.academicPosition && (
                        <div className="text-xs font-semibold text-primary">
                          {staff.academicPosition}
                        </div>
                      )}
                      <h3 className="font-bold text-base leading-snug text-foreground">
                        {primaryName}
                      </h3>
                      <div className="text-xs text-muted-foreground">{secondaryName}</div>
                    </div>
                  </div>

                  {/* Department & Office */}
                  <div className="space-y-1.5 text-xs text-muted-foreground border-y border-border/40 py-3">
                    <div className="flex items-center gap-2 text-foreground/80 font-medium">
                      <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{deptName}</span>
                    </div>
                    {staff.roomNumber && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                        <span>{staff.roomNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Expertise Tags */}
                  {staff.expertise.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        {t("personnel.portal.expertiseArea")}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {staff.expertise.slice(0, 4).map((exp, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-muted text-[11px] text-muted-foreground font-medium"
                          >
                            {exp}
                          </span>
                        ))}
                        {staff.expertise.length > 4 && (
                          <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            +{staff.expertise.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Footer */}
                <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <a
                      href={`mailto:${staff.email}`}
                      className="p-2 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary transition-colors"
                      title={staff.email}
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                    {staff.phone && (
                      <a
                        href={`tel:${staff.phone}`}
                        className="p-2 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary transition-colors"
                        title={staff.phone}
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  {(staff.bioTh || staff.bioEn) && (
                    <button
                      type="button"
                      onClick={() => setSelectedStaff(staff)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {t("personnel.portal.viewProfile")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Staff Bio Modal */}
      {selectedStaff && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedStaff(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg overflow-hidden border">
                  {selectedStaff.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedStaff.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{selectedStaff.firstNameTh.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-base">
                    {selectedStaff.prefixTh} {selectedStaff.firstNameTh} {selectedStaff.lastNameTh}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedStaff.prefixEn} {selectedStaff.firstNameEn} {selectedStaff.lastNameEn}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm text-foreground/90 leading-relaxed border-t border-border/40 pt-3">
              <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                ประวัติและการวิจัย
              </div>
              <p className="whitespace-pre-line text-xs sm:text-sm">
                {locale === "en" && selectedStaff.bioEn
                  ? selectedStaff.bioEn
                  : selectedStaff.bioTh || selectedStaff.bioEn || "—"}
              </p>
            </div>

            {selectedStaff.expertise.length > 0 && (
              <div className="space-y-2 border-t border-border/40 pt-3">
                <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  สาขาวิจัยที่เชี่ยวชาญ
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStaff.expertise.map((exp, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
