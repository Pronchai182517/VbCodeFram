"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/lib/i18n/client";
import { LOGO_MAX_BYTES } from "@/features/identity";
import {
  DEFAULT_TRANSFORM, drawLogo, exportLogo, loadImage,
  type LogoShape, type LogoTransform,
} from "@/shared/lib/image/logo-canvas";

const PREVIEW = 288;
const OUTPUT_SIZES = [128, 192, 256, 384, 512] as const;
const SHAPES: { id: LogoShape; label: string }[] = [
  { id: "rounded", label: "logo.shapeRounded" },
  { id: "square", label: "logo.shapeSquare" },
  { id: "circle", label: "logo.shapeCircle" },
];

export interface LogoEditorProps {
  /** ภาพต้นทางเป็น data URL — มาจาก LogoSource */
  src: string;
  busy: boolean;
  onError: (key: string) => void;
  onApply: (dataUrl: string) => void;
}

/** เครื่องมือครอบตัด ย่อ/ขยาย ปรับความเอียง จัดกึ่งกลาง และเลือกขนาดผลลัพธ์ */
export function LogoEditor({ src, busy, onError, onApply }: LogoEditorProps) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  // เก็บภาพไว้ใน state ไม่ใช่ ref เพื่อให้การวาดใหม่เกิดเองเมื่อโหลดเสร็จ · ผู้เรียกเปลี่ยน src
  // ด้วยการ mount ใหม่ทุกครั้งที่เลือกภาพใหม่ จึงไม่ต้องล้างค่าเดิมเองในเอฟเฟกต์
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [tf, setTf] = useState<LogoTransform>(DEFAULT_TRANSFORM);
  const [shape, setShape] = useState<LogoShape>("rounded");
  const [size, setSize] = useState<number>(256);
  const [transparent, setTransparent] = useState(true);
  const [estimate, setEstimate] = useState<number | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = PREVIEW * dpr;
    canvas.height = PREVIEW * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLogo(ctx, img, tf, { size: PREVIEW, shape, background: transparent ? null : "#ffffff" });
  }, [img, tf, shape, transparent]);

  useEffect(() => {
    let alive = true;
    loadImage(src)
      .then((loaded) => { if (alive) setImg(loaded); })
      .catch(() => onError("logo.error.load"));
    return () => { alive = false; };
  }, [src, onError]);

  useEffect(() => { redraw(); }, [redraw]);

  // ประเมินขนาดไฟล์จริงหลังผู้ใช้หยุดปรับ เพื่อให้เห็นทันทีว่าจะเกิน 200 KB หรือไม่
  useEffect(() => {
    if (!img) return;
    const id = setTimeout(async () => {
      const out = await exportLogo({ img, transform: tf, size, shape, transparent, maxBytes: LOGO_MAX_BYTES });
      setEstimate(out ? out.bytes : null);
    }, 250);
    return () => clearTimeout(id);
  }, [img, tf, size, shape, transparent]);

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const from = dragRef.current;
    if (!from) return;
    // แปลงระยะลากเป็นสัดส่วนของกรอบ เพื่อให้ผลลัพธ์ตรงกับภาพตัวอย่างทุกขนาด
    setTf((v) => ({ ...v, offsetX: v.offsetX + (e.clientX - from.x) / PREVIEW, offsetY: v.offsetY + (e.clientY - from.y) / PREVIEW }));
    dragRef.current = { x: e.clientX, y: e.clientY };
  }
  function endDrag() { dragRef.current = null; }

  async function apply() {
    if (!img) {
      onError("logo.pick");
      return;
    }
    const out = await exportLogo({ img, transform: tf, size, shape, transparent, maxBytes: LOGO_MAX_BYTES });
    if (!out) {
      onError("logo.error.tooLargeAfter");
      return;
    }
    onApply(out.dataUrl);
  }

  const overBudget = estimate === null;

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      <div className="space-y-2">
        <canvas
          ref={canvasRef}
          width={PREVIEW}
          height={PREVIEW}
          style={{ width: PREVIEW, height: PREVIEW }}
          className="touch-none cursor-grab rounded-xl border border-border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#f9fafb_0%_50%)] bg-[length:16px_16px] active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={(e) => setTf((v) => ({ ...v, scale: clamp(v.scale * (e.deltaY < 0 ? 1.08 : 0.93), 0.2, 5) }))}
        />
        <p className="text-center text-xs text-muted-foreground">{t("logo.dragHint")}</p>
      </div>

      <div className="space-y-5">
        <Slider
          label={t("logo.zoom")} value={tf.scale} min={0.2} max={5} step={0.01}
          onChange={(scale) => setTf((v) => ({ ...v, scale }))}
          display={`${Math.round(tf.scale * 100)}%`}
          left={<ZoomOut className="h-4 w-4" aria-hidden="true" />}
          right={<ZoomIn className="h-4 w-4" aria-hidden="true" />}
        />
        <Slider
          label={t("logo.rotate")} value={tf.rotation} min={-180} max={180} step={1}
          onChange={(rotation) => setTf((v) => ({ ...v, rotation }))}
          display={`${Math.round(tf.rotation)}°`}
          left={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
          right={<RotateCw className="h-4 w-4" aria-hidden="true" />}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setTf((v) => ({ ...v, offsetX: 0, offsetY: 0 }))}>
            <Crosshair className="h-4 w-4" aria-hidden="true" />
            {t("logo.center")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setTf(DEFAULT_TRANSFORM)}>{t("logo.reset")}</Button>
        </div>

        <Choice label={t("logo.shape")} value={shape} options={SHAPES.map((s) => ({ value: s.id, label: t(s.label) }))} onChange={(v) => setShape(v as LogoShape)} />
        <Choice label={t("logo.size")} value={String(size)} options={OUTPUT_SIZES.map((s) => ({ value: String(s), label: `${s}px` }))} onChange={(v) => setSize(Number(v))} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} className="h-4 w-4 rounded border-border" />
          {t("logo.transparent")}
        </label>

        <p className={`text-sm ${overBudget ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite">
          {t("logo.estimate")}: {estimate === null ? `> ${Math.round(LOGO_MAX_BYTES / 1024)} KB` : `${(estimate / 1024).toFixed(1)} KB`}
          {" / "}{Math.round(LOGO_MAX_BYTES / 1024)} KB
        </p>

        <Button type="button" onClick={() => void apply()} disabled={!img || busy || overBudget}>{t("logo.upload")}</Button>
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function Slider({ label, value, min, max, step, display, onChange, left, right }: {
  label: string; value: number; min: number; max: number; step: number; display: string;
  onChange: (v: number) => void; left: React.ReactNode; right: React.ReactNode;
}) {
  const id = `logo-${label}`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm font-medium">
        <label htmlFor={id}>{label}</label>
        <span className="tabular-nums text-muted-foreground">{display}</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        {left}
        <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[var(--primary,#2563eb)]" />
        {right}
      </div>
    </div>
  );
}

function Choice({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((o) => (
          <Button key={o.value} type="button" size="sm" variant={o.value === value ? "default" : "outline"} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
