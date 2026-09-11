"use server";
import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { P } from "../../permissions";
import { requirePermission } from "../rbac";
import { updateBrandTextSchema } from "../validations/brand-text";
import { updateBrandText } from "../services/tenant.service";

/** แก้ข้อความแบรนด์ขององค์กร — ต้องมีสิทธิ์ settings:manage (หน้าหลังบ้านเท่านั้น) */
export async function updateBrandTextAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.settingsManage);
    const parsed = updateBrandTextSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    await updateBrandText({ tenantId: ctx.tenantId, actorId: ctx.userId, ...parsed });
    revalidatePath("/", "layout"); // ข้อความอยู่บน layout ทั้งหลังบ้านและหน้าสาธารณะ
  });
}
