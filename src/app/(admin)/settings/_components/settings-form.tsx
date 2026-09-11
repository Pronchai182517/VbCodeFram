"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sun, Moon, Monitor, Type, ALargeSmall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiyonCard, LiyonField, PalettePicker } from "@/shared/components/liyon";
import { useT } from "@/shared/lib/i18n/client";
import {
  type PaletteId,
  type ThemeId, THEME_IDS,
  type FontFamilyId, FONT_FAMILY_IDS, FONT_FAMILIES,
  type FontSizeId, FONT_SIZE_IDS, FONT_SIZES,
} from "@/shared/lib/palette";
import type { TenantSettings, BrandText } from "@/features/identity";
import { updateSettingsAction } from "@/features/identity/actions";
import { LogoUploader } from "./logo-uploader";

const THEME_ICONS: Record<ThemeId, React.ReactNode> = {
  light: <Sun className="h-5 w-5" />,
  dark: <Moon className="h-5 w-5" />,
  auto: <Monitor className="h-5 w-5" />,
};

export function SettingsForm({ initial, logoUrl, brand }: { initial: TenantSettings; logoUrl: string | null; brand: BrandText }) {
  const t = useT();
  const router = useRouter();
  const [form, setForm] = useState({
    nameTh: initial.nameTh,
    nameEn: initial.nameEn,
    logoUrl: initial.logoUrl ?? "",
    palette: initial.palette as PaletteId,
    theme: initial.theme as ThemeId,
    fontFamily: initial.fontFamily as FontFamilyId,
    fontSize: initial.fontSize as FontSizeId,
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const r = await updateSettingsAction(form);
      if (!r.ok) { setErrors(r.error.fieldErrors ?? {}); if (!r.error.fieldErrors) toast.error(t(`error.${r.error.code}`)); return; }
      setErrors({});
      toast.success(t("settings.saveOk"));
      router.refresh();
    });
  }

  return (
    <>
      <header className="ph"><h1>{t("settings.title")}</h1></header>
      <div className="set-cards">
        {/* ── ข้อมูลองค์กร ── */}
        <LiyonCard>
          <h2>{t("settings.orgTitle")}</h2>
          <div className="fields">
            <LiyonField label={t("settings.nameTh")} htmlFor="s-name-th" error={errors.nameTh?.[0]}><input id="s-name-th" value={form.nameTh} onChange={(e) => setForm({ ...form, nameTh: e.target.value })} /></LiyonField>
            <LiyonField label={t("settings.nameEn")} htmlFor="s-name-en" error={errors.nameEn?.[0]}><input id="s-name-en" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></LiyonField>
            <LiyonField label={t("settings.logoUrl")} htmlFor="s-logo" hint={t("common.optional")} error={errors.logoUrl?.[0]}><input id="s-logo" type="url" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></LiyonField>
          </div>
        </LiyonCard>

        {/* ── โลโก้ ── */}
        <LogoUploader logoUrl={logoUrl} brand={brand} />

        {/* ── โทนสี ── */}
        <LiyonCard>
          <h2>{t("settings.brandTitle")}</h2>
          <p>{t("settings.brandDesc")}</p>
          <PalettePicker value={form.palette} onChange={(p) => setForm({ ...form, palette: p })} label={t("settings.paletteLabel")} />
          {form.palette === "coral" && <p className="warn" role="note">{t("settings.coralWarn")}</p>}
        </LiyonCard>

        {/* ── ธีม ── */}
        <LiyonCard>
          <h2>{t("settings.themeTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("settings.themeDesc")}</p>
          <div className="mt-4 flex gap-3">
            {THEME_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setForm({ ...form, theme: id })}
                className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  form.theme === id
                    ? "border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand-deep)] shadow-sm"
                    : "border-border hover:border-border/80 hover:bg-muted/50"
                }`}
              >
                {THEME_ICONS[id]}
                <span className="text-sm font-medium">{t(`settings.theme${id[0].toUpperCase()}${id.slice(1)}`)}</span>
              </button>
            ))}
          </div>
        </LiyonCard>

        {/* ── แบบอักษร ── */}
        <LiyonCard>
          <div className="flex items-center gap-2 mb-1">
            <Type className="h-5 w-5 text-muted-foreground" />
            <h2>{t("settings.fontTitle")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{t("settings.fontDesc")}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {FONT_FAMILY_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setForm({ ...form, fontFamily: id })}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  form.fontFamily === id
                    ? "border-[var(--brand)] bg-[var(--brand-light)] shadow-sm"
                    : "border-border hover:border-border/80 hover:bg-muted/50"
                }`}
              >
                <span className="text-sm font-semibold">{FONT_FAMILIES[id].label}</span>
                <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: FONT_FAMILIES[id].css }}>
                  สวัสดี Hello — ตัวอย่างแบบอักษร
                </p>
              </button>
            ))}
          </div>
        </LiyonCard>

        {/* ── ขนาดอักษร ── */}
        <LiyonCard>
          <div className="flex items-center gap-2 mb-1">
            <ALargeSmall className="h-5 w-5 text-muted-foreground" />
            <h2>{t("settings.fontSizeTitle")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{t("settings.fontSizeDesc")}</p>
          <div className="mt-4 flex gap-3">
            {FONT_SIZE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setForm({ ...form, fontSize: id })}
                className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  form.fontSize === id
                    ? "border-[var(--brand)] bg-[var(--brand-light)] shadow-sm"
                    : "border-border hover:border-border/80 hover:bg-muted/50"
                }`}
              >
                <span style={{ fontSize: `${FONT_SIZES[id].basePx}px` }} className="font-semibold">อ</span>
                <span className="text-xs font-medium">{t(FONT_SIZES[id].labelKey)}</span>
              </button>
            ))}
          </div>
        </LiyonCard>

        {/* ── บันทึก ── */}
        <div className="savebar"><Button type="button" onClick={save} disabled={pending}>{t("common.save")}</Button></div>
      </div>
    </>
  );
}
