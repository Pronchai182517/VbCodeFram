import Link from "next/link";
import { ArrowUp, Building2, CalendarDays, FileText, GraduationCap, LogIn, Newspaper, Users } from "lucide-react";
import type { TFunction } from "@/shared/lib/i18n/translate";

export interface PortalFooterProps {
  brandName: string;
  brandTagline: string;
  /** URL โลโก้ที่องค์กรอัปโหลด — null = ใช้สัญลักษณ์ตั้งต้น */
  logoUrl: string | null;
  /** id ของจุดบนสุดของหน้า ใช้กับลิงก์ "กลับขึ้นด้านบน" (ทำงานได้โดยไม่ต้องใช้ JS) */
  topId: string;
  t: TFunction;
}

/**
 * ท้ายหน้าเว็บสาธารณะ — ใช้ "ink band" ซึ่งเป็นรูปแบบท้ายหน้ามาตรฐานของระบบดีไซน์ Liyon
 * (`footer{background:var(--ink-band)}` ใน liyon-shell.css) สีจึงเปลี่ยนตามโทนสีทั้ง 5
 * และโหมดมืดเองโดยไม่ต้องฮาร์ดโค้ดสีใด ๆ · ข้อความทั้งหมดมาจากพจนานุกรมสองภาษา
 *
 * โครงสร้างตามผังของ Liyon: `.foot-in` (แบรนด์ | ลิงก์ | ลิงก์) + `.foot-bottom` (แถบลิขสิทธิ์)
 */
export function PortalFooter({ brandName, brandTagline, logoUrl, topId, t }: PortalFooterProps) {
  const explore = [
    { href: "/news", label: t("portal.nav.news"), icon: Newspaper },
    { href: "/personnel", label: t("portal.nav.personnel"), icon: Users },
    { href: "/curriculum", label: t("portal.nav.curriculum"), icon: GraduationCap },
    { href: "/documents", label: t("documents.nav"), icon: FileText },
    { href: "/calendar", label: t("portal.nav.calendar"), icon: CalendarDays },
  ];
  const staff = [
    { href: "/login", label: t("portal.nav.admin"), icon: LogIn },
    { href: "/admin/news", label: t("news.title"), icon: Newspaper },
  ];

  return (
    <footer>
      {/* เส้นเน้นสีแบรนด์ไล่จาง — รอยต่อระหว่างเนื้อหาสว่างกับแถบท้ายพื้นเข้ม */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-brand to-transparent" aria-hidden="true" />

      <div className="foot-in">
        <div>
          <div className="brand">
            <i className="overflow-hidden">
              {logoUrl ? (
                // โลโก้มาจาก route handler ของระบบเอง จึงไม่ผ่าน next/image
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" aria-hidden="true" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-4 w-4" aria-hidden="true" />
              )}
            </i>
            <span className="truncate">{brandName}</span>
          </div>
          {/* ลำดับสายตา: คำโปรยขององค์กรเด่นกว่า แล้วค่อยเป็นคำอธิบายระบบที่จางลง */}
          <p className="foot-tag font-medium text-[var(--ink-band-text)]/85">{brandTagline}</p>
          <p className="foot-tag !mt-2">{t("portal.footer.tagline")}</p>
        </div>

        <FooterNav heading={t("portal.footer.explore")} items={explore} />
        <FooterNav heading={t("portal.footer.forStaff")} items={staff} />
      </div>

      <div className="foot-bottom">
        <div className="foot-bottom-in">
          <p>© {new Date().getFullYear()} {brandName} · {t("portal.footer.rights")}</p>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">
              {t("portal.footer.poweredBy")} <span className="font-semibold text-[var(--ink-band-text)]">VibeCore</span>
            </span>
            <a
              href={`#${topId}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 transition-colors hover:border-white/35 hover:bg-white/10 hover:text-[var(--ink-band-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-light)]"
            >
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              {t("portal.footer.backToTop")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterNavItem { href: string; label: string; icon: React.ComponentType<{ className?: string }> }

function FooterNav({ heading, items }: { heading: string; items: FooterNavItem[] }) {
  return (
    <nav aria-label={heading}>
      <h4>{heading}</h4>
      <ul className="space-y-1">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group inline-flex items-center gap-2.5 rounded-md transition-colors hover:text-[var(--ink-band-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-light)]"
            >
              <Icon className="h-4 w-4 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
