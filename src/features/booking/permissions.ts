import type { PermissionDef } from "@/shared/lib/permission-def";

export const BOOKING_P = {
  bookingRead: "booking:read",
  bookingCreate: "booking:create",
  bookingApprove: "booking:approve",
  bookingManage: "booking:manage",
} as const;

export const BOOKING_PERMISSIONS: readonly PermissionDef[] = [
  {
    code: BOOKING_P.bookingRead,
    module: "booking",
    action: "read",
    description: "ดูรายการจองและปฏิทินการใช้ห้องประชุมและยานพาหนะ",
  },
  {
    code: BOOKING_P.bookingCreate,
    module: "booking",
    action: "create",
    description: "ทำการจองห้องประชุมหรือยานพาหนะ",
  },
  {
    code: BOOKING_P.bookingApprove,
    module: "booking",
    action: "approve",
    description: "พิจารณาอนุมัติหรือปฏิเสธคำขอจอง",
  },
  {
    code: BOOKING_P.bookingManage,
    module: "booking",
    action: "manage",
    description: "จัดการทรัพยากรห้องประชุมและยานพาหนะทั้งหมด",
  },
];
