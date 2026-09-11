"use server";
import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { P } from "../../permissions";
import { requirePermission } from "../rbac";
import { updateLogoSchema } from "../validations/logo";
import { updateTenantLogo, removeTenantLogo } from "../services/logo.service";

/** อัปโหลด/เปลี่ยนโลโก้องค์กร — ต้องมีสิทธิ์ settings:manage (หน้าหลังบ้านเท่านั้น) */
export async function updateLogoAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.settingsManage);
    const { dataUrl } = updateLogoSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    await updateTenantLogo({ tenantId: ctx.tenantId, actorId: ctx.userId, dataUrl });
    revalidatePath("/", "layout"); // โลโก้อยู่บน layout ทั้งฝั่งหลังบ้านและหน้าเว็บสาธารณะ
  });
}

export async function removeLogoAction(): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.settingsManage);
    await removeTenantLogo({ tenantId: ctx.tenantId, actorId: ctx.userId });
    revalidatePath("/", "layout");
  });
}
