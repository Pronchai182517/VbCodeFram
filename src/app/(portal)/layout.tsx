import Link from "next/link";
import { getT } from "@/i18n/server";
import { auth, resolveBrandingLogo } from "@/features/identity/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Newspaper, Users, GraduationCap, CalendarDays, FileText, LogIn, LayoutDashboard, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  const session = await auth().catch(() => null);
  const logo = await resolveBrandingLogo();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Public Portal Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl transition-transform group-hover:scale-105 border border-primary/20">
              {logo.hasLogo ? (
                // โลโก้มาจาก route handler ของระบบเอง จึงไม่ผ่าน next/image
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo.url} alt={t("app.name")} className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="font-bold tracking-tight text-base sm:text-lg leading-tight group-hover:text-primary transition-colors">
                {t("app.name")}
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                {t("app.tagline")}
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/news"
              className="px-3 py-1.5 rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Newspaper className="h-4 w-4" />
              {t("portal.nav.news")}
            </Link>
            <Link
              href="/personnel"
              className="px-3 py-1.5 rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {t("portal.nav.personnel")}
            </Link>
            <Link
              href="/curriculum"
              className="px-3 py-1.5 rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              {t("portal.nav.curriculum")}
            </Link>
            <Link
              href="/documents"
              className="px-3 py-1.5 rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {t("documents.nav")}
            </Link>
            <Link
              href="/calendar"
              className="px-3 py-1.5 rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              {t("portal.nav.calendar")}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher className="h-9 w-9 rounded-lg border border-border/60 hover:bg-muted" />

            {session?.user ? (
              <Button asChild variant="outline" size="sm" className="gap-2 font-medium">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("portal.nav.dashboard")}</span>
                </Link>
              </Button>
            ) : (
              <Button asChild variant="default" size="sm" className="gap-2 font-medium">
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("portal.nav.admin")}</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Public Portal Footer */}
      <footer className="border-t border-border/40 bg-muted/30 py-12 mt-16 text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2 space-y-3">
              <div className="font-bold text-foreground text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {t("app.name")}
              </div>
              <p className="max-w-md text-xs sm:text-sm leading-relaxed">
                {t("app.tagline")} — ระบบบริหารจัดการและบริการดิจิทัลคณะ ครอบคลุมงานวิชาการ การวิจัย และการสื่อสารประชาสัมพันธ์
              </p>
            </div>
            <div>
              <div className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">
                เมนูด่วน
              </div>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link href="/news" className="hover:text-foreground transition-colors">
                    {t("portal.nav.news")}
                  </Link>
                </li>
                <li>
                  <Link href="/personnel" className="hover:text-foreground transition-colors">
                    {t("portal.nav.personnel")}
                  </Link>
                </li>
                <li>
                  <Link href="/curriculum" className="hover:text-foreground transition-colors">
                    {t("portal.nav.curriculum")}
                  </Link>
                </li>
                <li>
                  <Link href="/documents" className="hover:text-foreground transition-colors">
                    {t("documents.nav")}
                  </Link>
                </li>
                <li>
                  <Link href="/calendar" className="hover:text-foreground transition-colors">
                    {t("portal.nav.calendar")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">
                สำหรับเจ้าหน้าที่
              </div>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                    <LogIn className="h-3.5 w-3.5" />
                    {t("portal.nav.admin")}
                  </Link>
                </li>
                <li>
                  <Link href="/admin/news" className="hover:text-foreground transition-colors">
                    {t("news.title")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div>
              © {new Date().getFullYear()} {t("app.name")}. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Faculty Information System</span>
              <span>•</span>
              <span>vibe-framework</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
