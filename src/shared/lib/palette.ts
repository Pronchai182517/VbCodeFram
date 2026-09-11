// ── Palette ──────────────────────────────────────────────────────────
export const PALETTE_IDS = ["blue", "coral", "pink", "green", "purple"] as const;
export type PaletteId = (typeof PALETTE_IDS)[number];
export const DEFAULT_PALETTE: PaletteId = "blue";

export const PALETTES: Record<PaletteId, { swatch: string; labelKey: string }> = {
  blue: { swatch: "#0556CA", labelKey: "palette.blue" },
  coral: { swatch: "#F06A4F", labelKey: "palette.coral" },
  pink: { swatch: "#C2185B", labelKey: "palette.pink" },
  green: { swatch: "#0F7A5A", labelKey: "palette.green" },
  purple: { swatch: "#6D28D9", labelKey: "palette.purple" },
};

export function isPalette(v: unknown): v is PaletteId {
  return typeof v === "string" && (PALETTE_IDS as readonly string[]).includes(v);
}

// ── Theme ────────────────────────────────────────────────────────────
export const THEME_IDS = ["light", "dark", "auto"] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export const DEFAULT_THEME: ThemeId = "auto";

export function isTheme(v: unknown): v is ThemeId {
  return typeof v === "string" && (THEME_IDS as readonly string[]).includes(v);
}

// ── Font Family ──────────────────────────────────────────────────────
export const FONT_FAMILY_IDS = ["sarabun", "ibm-plex", "noto-sans", "prompt"] as const;
export type FontFamilyId = (typeof FONT_FAMILY_IDS)[number];
export const DEFAULT_FONT_FAMILY: FontFamilyId = "sarabun";

export const FONT_FAMILIES: Record<FontFamilyId, { label: string; css: string; labelKey: string }> = {
  sarabun:    { label: "Sarabun",            css: "'Sarabun', sans-serif",            labelKey: "font.sarabun" },
  "ibm-plex": { label: "IBM Plex Sans Thai", css: "'IBM Plex Sans Thai', sans-serif", labelKey: "font.ibmPlex" },
  "noto-sans": { label: "Noto Sans Thai",    css: "'Noto Sans Thai', sans-serif",     labelKey: "font.notoSans" },
  prompt:     { label: "Prompt",             css: "'Prompt', sans-serif",             labelKey: "font.prompt" },
};

export function isFontFamily(v: unknown): v is FontFamilyId {
  return typeof v === "string" && (FONT_FAMILY_IDS as readonly string[]).includes(v);
}

// ── Font Size ────────────────────────────────────────────────────────
export const FONT_SIZE_IDS = ["small", "medium", "large"] as const;
export type FontSizeId = (typeof FONT_SIZE_IDS)[number];
export const DEFAULT_FONT_SIZE: FontSizeId = "medium";

export const FONT_SIZES: Record<FontSizeId, { basePx: number; labelKey: string }> = {
  small:  { basePx: 14, labelKey: "fontSize.small" },
  medium: { basePx: 16, labelKey: "fontSize.medium" },
  large:  { basePx: 18, labelKey: "fontSize.large" },
};

export function isFontSize(v: unknown): v is FontSizeId {
  return typeof v === "string" && (FONT_SIZE_IDS as readonly string[]).includes(v);
}
