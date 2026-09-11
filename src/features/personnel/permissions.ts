import type { PermissionDef } from "@/shared/lib/permission-def";

export const PERSONNEL_P = {
  personnelRead: "personnel:read",
  personnelManage: "personnel:manage",
  personnelUpdateSelf: "personnel:update-self",
} as const;

export const PERSONNEL_PERMISSIONS: readonly PermissionDef[] = [
  {
    code: PERSONNEL_P.personnelRead,
    module: "personnel",
    action: "read",
    description: "ดูข้อมูลบุคลากรและภาควิชา",
  },
  {
    code: PERSONNEL_P.personnelManage,
    module: "personnel",
    action: "manage",
    description: "จัดการข้อมูลอาจารย์ เจ้าหน้าที่ และภาควิชา",
  },
  {
    code: PERSONNEL_P.personnelUpdateSelf,
    module: "personnel",
    action: "update-self",
    description: "แก้ไขประวัติและผลงานตนเอง",
  },
];
