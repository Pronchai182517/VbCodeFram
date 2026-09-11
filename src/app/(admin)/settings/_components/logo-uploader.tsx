"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUp, Trash2, Building2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LiyonCard, LiyonDialog, LiyonDialogHeader, LiyonDialogBody, LiyonDialogFooter, LiyonDialogCloseButton,
} from "@/shared/components/liyon";
import { useT } from "@/shared/lib/i18n/client";
import { updateLogoAction, removeLogoAction } from "@/features/identity/actions";
import { LogoSource } from "./logo-source";
import { LogoEditor } from "./logo-editor";
import { BrandTextDialog } from "./brand-text-dialog";
import type { BrandText } from "@/features/identity";

export interface LogoUploaderProps {
  /** URL ปัจจุบันพร้อม version — null เมื่อยังไม่เคยตั้งโลโก้ */
  logoUrl: string | null;
  /** ข้อความแบรนด์ปัจจุบัน ใช้เป็นค่าตั้งต้นของกล่องแก้ไขข้อความ */
  brand: BrandText;
}

/**
 * การ์ด "โลโก้องค์กร" ในหน้าตั้งค่า (หลังบ้าน) — ปุ่มเปลี่ยนโลโก้เปิด popup 2 ขั้น:
 * เลือกแหล่งภาพ → ครอบตัด/ปรับแต่ง → บันทึก · ทั้งหน้าถูกกันด้วยสิทธิ์ settings:manage อยู่แล้ว
 */
export function LogoUploader({ logoUrl, brand }: LogoUploaderProps) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function close() {
    setOpen(false);
    setSrc(null);
  }

  function save(dataUrl: string) {
    start(async () => {
      const r = await updateLogoAction({ dataUrl });
      if (!r.ok) {
        const code = r.error.fieldErrors?.logo?.[0];
        toast.error(code ? t(`logo.error.${code}`) : t(`error.${r.error.code}`));
        return;
      }
      toast.success(t("logo.saveOk"));
      close();
      router.refresh();
    });
  }

  function remove() {
    start(async () => {
      const r = await removeLogoAction();
      if (!r.ok) {
        toast.error(t(`error.${r.error.code}`));
        return;
      }
      toast.success(t("logo.removeOk"));
      router.refresh();
    });
  }

  return (
    <LiyonCard>
      <h2>{t("logo.title")}</h2>
      <p>{t("logo.desc")}</p>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
          {logoUrl ? (
            // ภาพมาจาก route handler ของระบบเอง ไม่ได้ผ่าน image optimizer จึงใช้ <img> ตรง ๆ
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={t("logo.title")} className="h-full w-full object-contain" />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" className="gap-2" onClick={() => setOpen(true)}>
              <ImageUp className="h-4 w-4" aria-hidden="true" />
              {t("logo.change")}
            </Button>
            {logoUrl && (
              <Button type="button" variant="outline" className="gap-2" onClick={remove} disabled={pending}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t("logo.remove")}
              </Button>
            )}
            {!logoUrl && <span className="text-xs text-muted-foreground">{t("logo.none")}</span>}
          </div>
          {/* ปุ่มแก้ข้อความอยู่ใต้ปุ่มอัปโหลดภาพ — จัดการ "แบรนด์" ทั้งภาพและข้อความไว้ที่เดียวกัน */}
          <div>
            <Button type="button" variant="outline" className="gap-2" onClick={() => setTextOpen(true)}>
              <Type className="h-4 w-4" aria-hidden="true" />
              {t("brand.edit")}
            </Button>
          </div>
        </div>
      </div>

      <BrandTextDialog open={textOpen} onOpenChange={setTextOpen} initial={brand} logoUrl={logoUrl} />

      <LiyonDialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())} wide>
        <LiyonDialogHeader title={src ? t("logo.crop") : t("logo.change")} description={src ? t("logo.dragHint") : t("logo.dropzoneHint")} />
        <LiyonDialogBody>
          {src ? (
            <LogoEditor src={src} busy={pending} onError={(key) => toast.error(t(key))} onApply={save} />
          ) : (
            <LogoSource onPicked={setSrc} onError={(key) => toast.error(t(key))} />
          )}
        </LiyonDialogBody>
        <LiyonDialogFooter>
          {src && <Button type="button" variant="outline" onClick={() => setSrc(null)}>{t("logo.reset")}</Button>}
          <LiyonDialogCloseButton label={t("common.cancel")} />
        </LiyonDialogFooter>
      </LiyonDialog>
    </LiyonCard>
  );
}
