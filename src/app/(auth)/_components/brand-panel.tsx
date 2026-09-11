"use client";
import { useT } from "@/shared/lib/i18n/client";
import { useBrandLabels } from "@/components/providers/branding-provider";
import { BrandMark } from "./brand-mark";

export function BrandPanel() {
  const t = useT();
  const brand = useBrandLabels();
  return (
    <aside className="brandside">
      <div className="mark"><i><BrandMark /></i>{brand.name}</div>
      <div className="lead">
        <div className="eyebrow"><span>{t("auth.brand.eyebrow")}</span></div>
        <h1>{t("auth.brand.title")}</h1>
        <p>{t("auth.brand.subtitle")}</p>
      </div>
      <p className="foot">{brand.tagline}</p>
    </aside>
  );
}
