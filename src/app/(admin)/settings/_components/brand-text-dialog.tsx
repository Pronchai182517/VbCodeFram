"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LiyonDialog, LiyonDialogHeader, LiyonDialogBody, LiyonDialogFooter, LiyonDialogCloseButton, LiyonField,
} from "@/shared/components/liyon";
import { useT } from "@/shared/lib/i18n/client";
import { updateBrandTextAction } from "@/features/identity/actions";
import { BRAND_NAME_MAX, BRAND_TAGLINE_MAX, type BrandText } from "@/features/identity";

export interface BrandTextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: BrandText;
  /** URL โลโก้ปัจจุบัน ใช้ในตัวอย่าง — null = ยังไม่ได้ตั้ง */
  logoUrl: string | null;
}

/** แก้ชื่อและคำโปรยขององค์กรทั้งสองภาษา พร้อมตัวอย่างสดว่าจะขึ้นบนแถบบนอย่างไร */
export function BrandTextDialog({ open, onOpenChange, initial, logoUrl }: BrandTextDialogProps) {
  const t = useT();
  const router = useRouter();
  const [form, setForm] = useState<BrandText>(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();

  const dirty = (Object.keys(form) as (keyof BrandText)[]).some((k) => form[k] !== initial[k]);

  function set<K extends keyof BrandText>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function close(next: boolean) {
    if (!next) {
      setForm(initial);
      setErrors({});
    }
    onOpenChange(next);
  }

  function save() {
    start(async () => {
      const r = await updateBrandTextAction(form);
      if (!r.ok) {
        setErrors(r.error.fieldErrors ?? {});
        if (!r.error.fieldErrors) toast.error(t(`error.${r.error.code}`));
        return;
      }
      setErrors({});
      toast.success(t("brand.saveOk"));
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <LiyonDialog open={open} onOpenChange={close} wide>
      <LiyonDialogHeader title={t("brand.title")} description={t("brand.desc")} />
      <LiyonDialogBody>
        <div className="grid gap-6 md:grid-cols-2">
          <Column
            heading={t("brand.thai")}
            name={form.nameTh} tagline={form.taglineTh}
            nameId="brand-name-th" taglineId="brand-tagline-th"
            nameError={errors.nameTh?.[0]} taglineError={errors.taglineTh?.[0]}
            onName={(v) => set("nameTh", v)} onTagline={(v) => set("taglineTh", v)}
            t={t}
          />
          <Column
            heading={t("brand.english")}
            name={form.nameEn} tagline={form.taglineEn}
            nameId="brand-name-en" taglineId="brand-tagline-en"
            nameError={errors.nameEn?.[0]} taglineError={errors.taglineEn?.[0]}
            onName={(v) => set("nameEn", v)} onTagline={(v) => set("taglineEn", v)}
            t={t}
          />
        </div>

        <div className="mt-6 space-y-2">
          <div className="text-sm font-medium">{t("brand.preview")}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Preview label={t("brand.thai")} name={form.nameTh} tagline={form.taglineTh} logoUrl={logoUrl} />
            <Preview label={t("brand.english")} name={form.nameEn} tagline={form.taglineEn} logoUrl={logoUrl} />
          </div>
          <p className="text-xs text-muted-foreground">{t("brand.previewHint")}</p>
        </div>
      </LiyonDialogBody>
      <LiyonDialogFooter>
        <LiyonDialogCloseButton label={t("common.cancel")} />
        <Button type="button" onClick={save} disabled={pending || !dirty}>{t("common.save")}</Button>
      </LiyonDialogFooter>
    </LiyonDialog>
  );
}

function Column({ heading, name, tagline, nameId, taglineId, nameError, taglineError, onName, onTagline, t }: {
  heading: string; name: string; tagline: string; nameId: string; taglineId: string;
  nameError?: string; taglineError?: string; onName: (v: string) => void; onTagline: (v: string) => void;
  t: (key: string) => string;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground">{heading}</h3>
      <LiyonField label={t("brand.name")} htmlFor={nameId} error={nameError} hint={`${name.length}/${BRAND_NAME_MAX}`}>
        <input id={nameId} value={name} maxLength={BRAND_NAME_MAX} onChange={(e) => onName(e.target.value)} />
      </LiyonField>
      <LiyonField label={t("brand.tagline")} htmlFor={taglineId} error={taglineError} hint={`${tagline.length}/${BRAND_TAGLINE_MAX} · ${t("common.optional")}`}>
        <input id={taglineId} value={tagline} maxLength={BRAND_TAGLINE_MAX} onChange={(e) => onTagline(e.target.value)} />
      </LiyonField>
    </section>
  );
}

/** จำลองบล็อกแบรนด์บนแถบบนให้เห็นของจริงก่อนบันทึก */
function Preview({ label, name, tagline, logoUrl }: { label: string; name: string; tagline: string; logoUrl: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" aria-hidden="true" className="h-full w-full object-contain" />
          ) : (
            <Building2 className="h-4 w-4" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold leading-tight">{name || "—"}</div>
          <div className="truncate text-xs text-muted-foreground">{tagline}</div>
        </div>
      </div>
    </div>
  );
}
