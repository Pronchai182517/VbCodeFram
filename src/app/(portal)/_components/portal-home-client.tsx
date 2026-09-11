"use client";

import React from "react";
import Link from "next/link";
import {
  Newspaper,
  Users,
  GraduationCap,
  CalendarDays,
  FileText,
  ArrowRight,
  Sparkles,
  Building2,
  Clock,
  Eye,
  ChevronRight,
} from "lucide-react";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { Button } from "@/components/ui/button";
import type { ArticleDto } from "@/features/news/server";
import type { ProgramDto } from "@/features/curriculum/server";
import type { DepartmentDto } from "@/features/personnel/server";

interface Props {
  articles: ArticleDto[];
  programs: ProgramDto[];
  departments: DepartmentDto[];
  staffCount: number;
  resourceCount: number;
}

export function PortalHomeClient({
  articles,
  programs,
  departments,
  staffCount,
  resourceCount,
}: Props) {
  const t = useT();
  const locale = useLocale();

  const services = [
    {
      title: t("news.title"),
      description: "ติดตามข่าวสาร ประชาสัมพันธ์วิชาการ ทุนการศึกษา กิจกรรม และดาวน์โหลดเอกสารแนบ",
      icon: Newspaper,
      href: "/news",
      color: "blue",
      tag: "ประชาสัมพันธ์",
    },
    {
      title: t("personnel.portal.title"),
      description: "ค้นหาข้อมูลคณาจารย์ อาจารย์ที่ปรึกษา ความเชี่ยวชาญทางวิชาการ และช่องทางการติดต่อ",
      icon: Users,
      href: "/personnel",
      color: "emerald",
      tag: "บุคลากร",
    },
    {
      title: t("curriculum.portal.title"),
      description: "โครงสร้างหลักสูตรระดับปริญญาตรี โท และเอก รายละเอียดรายวิชา และเอกสารหลักสูตร",
      icon: GraduationCap,
      href: "/curriculum",
      color: "purple",
      tag: "การศึกษา",
    },
    {
      title: t("documents.title"),
      description: "ยื่นคำร้องขออนุมัติอิเล็กทรอนิกส์ และติดตามสถานะคำร้องแบบเรียลไทม์ด้วย Tracking No.",
      icon: FileText,
      href: "/documents",
      color: "amber",
      tag: "บริการคำร้อง",
    },
    {
      title: t("booking.title"),
      description: "ตรวจสอบปฏิทินความพร้อม จองห้องประชุม สัมมนา และยานพาหนะส่วนกลางคณะแบบป้องกันเวลาซ้อนทับ",
      icon: CalendarDays,
      href: "/calendar",
      color: "rose",
      tag: "ระบบจองคิว",
    },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 sm:p-14 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-semibold tracking-wide uppercase border border-primary/30">
            <Sparkles className="h-4 w-4" />
            <span>Faculty Information & Digital Services</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            ความเป็นเลิศทางวิชาการ วิจัย <br className="hidden sm:inline" />
            และ<span className="text-primary">นวัตกรรมดิจิทัล</span>เพื่ออนาคต
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            ศูนย์กลางบริการดิจิทัลครบวงจรสำหรับคณาจารย์ บุคลากร นิสิตนักศึกษา และบุคคลภายนอก
            รวบรวมข่าวสาร ทำเนียบบุคลากร หลักสูตร คำร้องอิเล็กทรอนิกส์ และระบบจองทรัพยากร
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="gap-2 font-medium shadow-sm">
              <Link href="/curriculum">
                <GraduationCap className="h-5 w-5" />
                <span>สำรวจหลักสูตร</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 font-medium">
              <Link href="/news">
                <Newspaper className="h-5 w-5" />
                <span>ข่าวประชาสัมพันธ์</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="gap-2 font-medium text-foreground/80">
              <Link href="/documents">
                <FileText className="h-5 w-5" />
                <span>ติดตามคำร้อง</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. STATS OVERVIEW */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-primary">
            {programs.length || "3"}
          </div>
          <div className="text-xs sm:text-sm font-medium text-foreground">
            หลักสูตรการศึกษา
          </div>
          <div className="text-[11px] text-muted-foreground">ปริญญาตรี - โท - เอก</div>
        </div>

        <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {staffCount || "25"}+
          </div>
          <div className="text-xs sm:text-sm font-medium text-foreground">
            คณาจารย์และบุคลากร
          </div>
          <div className="text-[11px] text-muted-foreground">ผู้เชี่ยวชาญเฉพาะทาง</div>
        </div>

        <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-purple-600 dark:text-purple-400">
            {departments.length || "2"}
          </div>
          <div className="text-xs sm:text-sm font-medium text-foreground">
            ภาควิชาและหน่วยงาน
          </div>
          <div className="text-[11px] text-muted-foreground">รองรับการเรียนการสอน</div>
        </div>

        <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400">
            {resourceCount || "4"}
          </div>
          <div className="text-xs sm:text-sm font-medium text-foreground">
            ห้องประชุมและรถส่วนกลาง
          </div>
          <div className="text-[11px] text-muted-foreground">ระบบจองแบบ Zero-overlap</div>
        </div>
      </section>

      {/* 3. CORE E-SERVICES SHORTCUTS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              บริการอิเล็กทรอนิกส์สำหรับนิสิตและบุคลากร
            </h2>
            <p className="text-sm text-muted-foreground">
              เข้าถึง 5 โมดูลระบบงานหลักของคณะได้อย่างสะดวกรวดเร็ว
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc, idx) => {
            const Icon = svc.icon;
            return (
              <Link
                key={idx}
                href={svc.href}
                className="group p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold transition-transform group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      {svc.tag}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      <span>{svc.title}</span>
                      <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {svc.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border/40 text-xs font-semibold text-primary flex items-center gap-1">
                  <span>เข้าสู่ระบบบริการ</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. LATEST NEWS & ANNOUNCEMENTS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-primary" />
              {t("portal.nav.news")}
            </h2>
            <p className="text-sm text-muted-foreground">
              ข่าวสาร กิจกรรม และประกาศสำคัญล่าสุดจากคณะ
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href="/news">
              <span>{t("news.viewAll") || "ดูข่าวทั้งหมด"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {articles.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed text-center text-muted-foreground text-sm">
            ยังไม่มีข่าวสารในขณะนี้
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-md hover:border-primary/40 transition-all"
              >
                <div className="relative aspect-video w-full bg-muted overflow-hidden">
                  {item.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.coverImageUrl}
                      alt={item.titleTh}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/5 text-primary/40">
                      <Newspaper className="h-10 w-10" />
                    </div>
                  )}
                  {item.isPinned && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold shadow">
                      ปักหมุด
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary inline-block">
                      {t(`news.cat.${item.category}`)}
                    </span>
                    <h3 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {locale === "th" ? item.titleTh : item.titleEn || item.titleTh}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(item.createdAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{item.viewCount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 5. FEATURED DEGREE PROGRAMS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              หลักสูตรการศึกษาที่เปิดสอน
            </h2>
            <p className="text-sm text-muted-foreground">
              หลักสูตรมาตรฐานสากล มุ่งเน้นการปฏิบัติจริงและตอบโจทย์ตลาดแรงงานดิจิทัล
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href="/curriculum">
              <span>ดูหลักสูตรทั้งหมด</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {programs.slice(0, 3).map((prog) => (
            <div
              key={prog.id}
              className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted border border-border/60">
                    {prog.code}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
                    {t(`curriculum.degree.${prog.degreeLevel}`)}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {locale === "th" ? prog.nameTh : prog.nameEn || prog.nameTh}
                  </h3>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {prog.shortNameTh} ({prog.shortNameEn})
                  </div>
                </div>

                <div className="text-xs text-muted-foreground line-clamp-2">
                  {locale === "th"
                    ? prog.descriptionTh || "หลักสูตรมุ่งเน้นการบูรณาการองค์ความรู้สมัยใหม่และทักษะการปฏิบัติงานจริง"
                    : prog.descriptionEn || prog.descriptionTh}
                </div>

                {prog.careerProspects.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {prog.careerProspects.slice(0, 3).map((career, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2 py-0.5 rounded-md bg-muted text-[11px] text-muted-foreground font-medium"
                      >
                        {career}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                <div className="text-xs font-semibold text-foreground">
                  จำนวนหน่วยกิต: {prog.totalCredits} นก.
                </div>
                <Button asChild size="sm" variant="ghost" className="gap-1 text-xs text-primary">
                  <Link href="/curriculum">
                    <span>ดูโครงสร้าง</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CALL TO ACTION FOR STAFF & STUDENTS */}
      <section className="rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            สำหรับคณาจารย์และเจ้าหน้าที่คณะ
          </h2>
          <p className="text-sm sm:text-base text-primary-foreground/80 max-w-xl">
            เข้าสู่ระบบบริหารจัดการเพื่อจัดการข่าวสาร ข้อมูลบุคลากร หลักสูตร พิจารณาอนุมัติคำร้องเอกสาร
            และอนุมัติการจองห้องประชุมยานพาหนะส่วนกลาง
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <Button asChild variant="secondary" size="lg" className="font-semibold shadow-sm gap-2">
            <Link href="/dashboard">
              <span>เข้าสู่ระบบเจ้าหน้าที่</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
