import { z } from "zod";
import { PALETTE_IDS, THEME_IDS, FONT_FAMILY_IDS, FONT_SIZE_IDS } from "@/shared/lib/palette";

export const updateSettingsSchema = z.object({
  nameTh: z.string().trim().min(1).max(255),
  nameEn: z.string().trim().min(1).max(255),
  logoUrl: z.string().trim().url().max(500).or(z.literal("")).default(""),
  palette: z.enum(PALETTE_IDS),
  theme: z.enum(THEME_IDS),
  fontFamily: z.enum(FONT_FAMILY_IDS),
  fontSize: z.enum(FONT_SIZE_IDS),
});
export const updateProfileSchema = z.object({ name: z.string().trim().min(1).max(255), locale: z.enum(["th", "en"]) });
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
