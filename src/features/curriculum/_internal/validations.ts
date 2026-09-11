import { z } from "zod";

export const DEGREE_LEVELS = ["BACHELOR", "MASTER", "DOCTORAL"] as const;
export type DegreeLevelEnum = (typeof DEGREE_LEVELS)[number];

export const createProgramSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "รหัสหลักสูตรต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(50, "รหัสหลักสูตรต้องไม่เกิน 50 ตัวอักษร")
    .transform((v: string) => v.toUpperCase()),
  degreeLevel: z.enum(DEGREE_LEVELS, {
    message: "กรุณาระบุระดับการศึกษาที่ถูกต้อง",
  }),
  nameTh: z
    .string()
    .trim()
    .min(2, "กรุณากรอกชื่อหลักสูตร (ภาษาไทย)")
    .max(255),
  nameEn: z
    .string()
    .trim()
    .min(2, "กรุณากรอกชื่อหลักสูตร (ภาษาอังกฤษ)")
    .max(255),
  shortNameTh: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อย่อปริญญา (ภาษาไทย)")
    .max(50),
  shortNameEn: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อย่อปริญญา (ภาษาอังกฤษ)")
    .max(50),
  totalCredits: z.coerce
    .number()
    .int()
    .min(1, "จำนวนหน่วยกิตรวมต้องมากกว่า 0")
    .max(500),
  yearIssued: z.coerce
    .number()
    .int()
    .min(2500, "ปีที่ปรับปรุงหลักสูตรต้องเป็นปี พ.ศ. (เช่น 2565)")
    .max(2650),
  tuitionFeeTerm: z.coerce
    .number()
    .min(0)
    .nullable()
    .optional(),
  descriptionTh: z.string().trim().nullable().optional(),
  descriptionEn: z.string().trim().nullable().optional(),
  careerProspects: z.array(z.string().trim()).default([]),
  leafletPdfUrl: z
    .string()
    .trim()
    .url("URL แผ่นพับต้องเป็นลิงก์ที่ถูกต้อง")
    .or(z.literal(""))
    .nullable()
    .optional()
    .transform((v: string | null | undefined) => (v ? v : null)),
  isActive: z.boolean().default(true),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;

export const updateProgramSchema = createProgramSchema.extend({
  id: z.string().uuid("Invalid Program ID"),
});

export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;

export const createCourseSchema = z.object({
  programId: z.string().uuid("Invalid Program ID"),
  code: z
    .string()
    .trim()
    .min(2, "รหัสวิชาต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(20, "รหัสวิชาต้องไม่เกิน 20 ตัวอักษร")
    .transform((v: string) => v.toUpperCase()),
  nameTh: z
    .string()
    .trim()
    .min(2, "กรุณากรอกชื่อวิชา (ภาษาไทย)")
    .max(200),
  nameEn: z
    .string()
    .trim()
    .min(2, "กรุณากรอกชื่อวิชา (ภาษาอังกฤษ)")
    .max(200),
  credits: z
    .string()
    .trim()
    .min(1, "กรุณาระบุหน่วยกิต (เช่น 3(3-0-6))")
    .max(20),
  categoryGroup: z
    .string()
    .trim()
    .min(1, "กรุณาระบุหมวดหมู่วิชา")
    .max(100),
  descriptionTh: z.string().trim().nullable().optional(),
  descriptionEn: z.string().trim().nullable().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema.extend({
  id: z.string().uuid("Invalid Course ID"),
});

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const listProgramsQuerySchema = z.object({
  degreeLevel: z.enum(DEGREE_LEVELS).optional(),
  search: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export type ListProgramsQuery = z.infer<typeof listProgramsQuerySchema>;

export const listCoursesQuerySchema = z.object({
  programId: z.string().uuid().optional(),
  categoryGroup: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
