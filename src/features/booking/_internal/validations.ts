import { z } from "zod";

export const RESOURCE_TYPES = ["ROOM", "VEHICLE"] as const;
export type ResourceTypeEnum = (typeof RESOURCE_TYPES)[number];

export const RESERVATION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
] as const;
export type ReservationStatusEnum = (typeof RESERVATION_STATUSES)[number];

export const createResourceSchema = z.object({
  type: z.enum(RESOURCE_TYPES, {
    message: "กรุณาระบุประเภททรัพยากรที่ถูกต้อง",
  }),
  nameTh: z
    .string()
    .trim()
    .min(2, "กรุณากรอกชื่อทรัพยากรภาษาไทยอย่างน้อย 2 ตัวอักษร")
    .max(150),
  nameEn: z
    .string()
    .trim()
    .min(2, "กรุณากรอกชื่อทรัพยากรภาษาอังกฤษอย่างน้อย 2 ตัวอักษร")
    .max(150),
  code: z
    .string()
    .trim()
    .min(2, "กรุณากรอกรหัสทรัพยากร")
    .max(50)
    .transform((v) => v.toUpperCase()),
  capacity: z.coerce.number().int().min(1, "ความจุต้องมีอย่างน้อย 1 ที่นั่ง/คน"),
  locationTh: z
    .string()
    .trim()
    .min(2, "กรุณาระบุสถานที่ตั้งภาษาไทย")
    .max(200),
  locationEn: z
    .string()
    .trim()
    .min(2, "กรุณาระบุสถานที่ตั้งภาษาอังกฤษ")
    .max(200),
  imageUrl: z
    .string()
    .trim()
    .url("URL รูปภาพไม่ถูกต้อง")
    .or(z.literal(""))
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
  facilities: z
    .array(z.string().trim())
    .default([]),
  driverName: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
  isActive: z.boolean().default(true),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;

export const updateResourceSchema = createResourceSchema.partial().extend({
  id: z.string().uuid("Invalid Resource ID"),
});

export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

export const createReservationSchema = z
  .object({
    resourceId: z.string().uuid("Invalid Resource ID"),
    purpose: z
      .string()
      .trim()
      .min(2, "กรุณากรอกวัตถุประสงค์การใช้งานอย่างน้อย 2 ตัวอักษร")
      .max(255),
    attendeeCount: z.coerce
      .number()
      .int()
      .min(1, "จำนวนผู้เข้าร่วมต้องอย่างน้อย 1 คน"),
    startTime: z.coerce.date({
      message: "กรุณาระบุเวลาเริ่มต้นที่ถูกต้อง",
    }),
    endTime: z.coerce.date({
      message: "กรุณาระบุเวลาสิ้นสุดที่ถูกต้อง",
    }),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุด",
    path: ["endTime"],
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export const approveReservationSchema = z.object({
  id: z.string().uuid("Invalid Reservation ID"),
});

export type ApproveReservationInput = z.infer<typeof approveReservationSchema>;

export const rejectReservationSchema = z.object({
  id: z.string().uuid("Invalid Reservation ID"),
  reason: z
    .string()
    .trim()
    .min(1, "กรุณาระบุเหตุผลหรือข้อเสนอแนะในการปฏิเสธ"),
});

export type RejectReservationInput = z.infer<typeof rejectReservationSchema>;

export const listReservationsQuerySchema = z.object({
  resourceId: z.string().uuid().optional(),
  type: z.enum(RESOURCE_TYPES).optional(),
  status: z.enum(RESERVATION_STATUSES).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().trim().optional(),
  userId: z.string().uuid().optional(),
  myOnly: z.coerce.boolean().optional(),
});

export type ListReservationsQuery = z.infer<typeof listReservationsQuerySchema>;

export const listResourcesQuerySchema = z.object({
  type: z.enum(RESOURCE_TYPES).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
});

export type ListResourcesQuery = z.infer<typeof listResourcesQuerySchema>;
