"use client";
import { useRef, useState, useEffect } from "react";
import { Upload, Link2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/lib/i18n/client";
import { readAsDataUrl } from "@/shared/lib/image/logo-canvas";
import { LOGO_ACCEPT, LOGO_MIME_TYPES } from "@/features/identity";

/** รับภาพจาก 3 ทาง: ลากวาง · เลือกไฟล์จากเครื่อง · ลิงก์ภาพจากแหล่งอื่น (รวมถึงวางจากคลิปบอร์ด) */
export function LogoSource({ onPicked, onError }: { onPicked: (dataUrl: string) => void; onError: (key: string) => void }) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function acceptBlob(blob: Blob | null | undefined) {
    if (!blob) return;
    if (!LOGO_MIME_TYPES.includes(blob.type as (typeof LOGO_MIME_TYPES)[number])) {
      onError("logo.error.logo_format");
      return;
    }
    try {
      onPicked(await readAsDataUrl(blob));
    } catch {
      onError("logo.error.load");
    }
  }

  // วางภาพจากคลิปบอร์ดได้ทั้งกล่อง (Ctrl+V) — ทางลัดที่คนคุ้นชินเวลาก็อปภาพมาจากโปรแกรมอื่น
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      if (item) void acceptBlob(item.getAsFile());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  /**
   * ดึงภาพจากลิงก์ "ที่ฝั่งเบราว์เซอร์" โดยตั้งใจ — ไม่ให้เซิร์ฟเวอร์เป็นคนไปโหลด URL ที่ผู้ใช้พิมพ์
   * เพราะนั่นคือช่อง SSRF (ยิงเข้า network ภายใน เช่น 169.254.169.254 หรือฐานข้อมูลในวงเดียวกัน)
   * ต้นทางที่ไม่เปิด CORS จะโหลดไม่ได้ ซึ่งยอมรับได้ — บอกผู้ใช้ให้ดาวน์โหลดแล้วลากวางแทน
   */
  async function fetchFromUrl() {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(url.trim(), { mode: "cors" });
      if (!res.ok) throw new Error("fetch");
      await acceptBlob(await res.blob());
    } catch {
      onError("logo.error.fetch");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void acceptBlob(e.dataTransfer.files[0]); }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/40"
        }`}
      >
        <ImagePlus className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <div className="font-medium">{t("logo.dropzone")}</div>
        <p className="text-xs text-muted-foreground">{t("logo.dropzoneHint")}</p>
        <Button type="button" variant="outline" size="sm" className="gap-2 pointer-events-none">
          <Upload className="h-4 w-4" aria-hidden="true" />
          {t("logo.browse")}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={LOGO_ACCEPT}
        className="sr-only"
        onChange={(e) => { void acceptBlob(e.target.files?.[0]); e.target.value = ""; }}
      />

      <div className="space-y-2">
        <label htmlFor="logo-url" className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4" aria-hidden="true" />
          {t("logo.fromUrl")}
        </label>
        <div className="flex gap-2">
          <input
            id="logo-url"
            type="url"
            value={url}
            placeholder="https://…"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void fetchFromUrl(); } }}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <Button type="button" variant="outline" onClick={() => void fetchFromUrl()} disabled={loading || !url.trim()}>
            {t("logo.fromUrlLoad")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("logo.fromUrlHint")}</p>
      </div>
    </div>
  );
}
