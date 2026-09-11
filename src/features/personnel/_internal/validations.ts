import { z } from "zod";

export const createDepartmentSchema = z.object({
  nameTh: z.string().trim().min(1, "กรุณากรอกชื่อภาควิชา (ไทย)").max(150),
  nameEn: z.string().trim().min(1, "กรุณากรอกชื่อภาควิชา (อังกฤษ)").max(150),
  code: z
    .string()
    .trim()
    .min(1, "กรุณากรอกรหัสภาควิชา")
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "รหัสภาควิชาต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข"),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

export const updateDepartmentSchema = createDepartmentSchema.extend({
  id: z.string().uuid("รหัสภาควิชาไม่ถูกต้อง"),
});

export const createStaffProfileSchema = z.object({
  departmentId: z.string().uuid("กรุณาเลือกภาควิชา"),
  userId: z.string().uuid().nullable().optional(),
  prefixTh: z.string().trim().min(1, "กรุณาระบุคำนำหน้า (ไทย)").max(50),
  prefixEn: z.string().trim().min(1, "กรุณาระบุคำนำหน้า (อังกฤษ)").max(50),
  firstNameTh: z.string().trim().min(1, "กรุณากรอกชื่อ (ไทย)").max(100),
  lastNameTh: z.string().trim().min(1, "กรุณากรอกนามสกุล (ไทย)").max(100),
  firstNameEn: z.string().trim().min(1, "กรุณากรอกชื่อ (อังกฤษ)").max(100),
  lastNameEn: z.string().trim().min(1, "กรุณากรอกนามสกุล (อังกฤษ)").max(100),
  academicPosition: z.string().trim().max(100).nullable().optional(),
  adminPositionTh: z.string().trim().max(150).nullable().optional(),
  adminPositionEn: z.string().trim().max(150).nullable().optional(),
  email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง").max(255),
  phone: z.string().trim().max(50).nullable().optional(),
  roomNumber: z.string().trim().max(50).nullable().optional(),
  avatarUrl: z.string().trim().max(500).nullable().optional(),
  bioTh: z.string().trim().nullable().optional(),
  bioEn: z.string().trim().nullable().optional(),
  expertise: z.array(z.string().trim().min(1)).default([]),
  orderIndex: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateStaffProfileSchema = createStaffProfileSchema.extend({
  id: z.string().uuid("รหัสบุคลากรไม่ถูกต้อง"),
});

export const listStaffQuerySchema = z.object({
  departmentId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateStaffProfileInput = z.infer<typeof createStaffProfileSchema>;
export type UpdateStaffProfileInput = z.infer<typeof updateStaffProfileSchema>;
export type ListStaffQuery = z.infer<typeof listStaffQuerySchema>;
