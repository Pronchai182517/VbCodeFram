import { requirePermission } from "@/features/identity/server";
import { hasPermission } from "@/features/identity";
import {
  PERSONNEL_P,
  listStaffProfiles,
  listDepartments,
} from "@/features/personnel/server";
import { PersonnelClient } from "./_components/personnel-client";

export default async function PersonnelAdminPage() {
  const ctx = await requirePermission(PERSONNEL_P.personnelRead);
  const canManage = hasPermission(ctx, PERSONNEL_P.personnelManage);

  const [staffResult, departments] = await Promise.all([
    listStaffProfiles(ctx.tenantId, { limit: 100 }),
    listDepartments(ctx.tenantId),
  ]);

  return (
    <PersonnelClient
      initialStaff={staffResult.items}
      initialDepartments={departments}
      canManage={canManage}
    />
  );
}
