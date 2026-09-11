"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/shared/lib/result";
import { requirePermission } from "@/features/identity/server";
import { PERSONNEL_P } from "../permissions";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  createStaffProfileSchema,
  updateStaffProfileSchema,
  listStaffQuerySchema,
} from "./validations";
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listStaffProfiles,
  createStaffProfile,
  updateStaffProfile,
  deleteStaffProfile,
} from "./services";

export async function getDepartmentsAction() {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelRead);
    return listDepartments(ctx.tenantId);
  });
}

export async function createDepartmentAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelManage);
    const parsed = createDepartmentSchema.parse(input);
    const result = await createDepartment(ctx.tenantId, parsed);
    revalidatePath("/admin/personnel");
    revalidatePath("/personnel");
    return result;
  });
}

export async function updateDepartmentAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelManage);
    const parsed = updateDepartmentSchema.parse(input);
    const result = await updateDepartment(ctx.tenantId, parsed);
    revalidatePath("/admin/personnel");
    revalidatePath("/personnel");
    return result;
  });
}

export async function deleteDepartmentAction(id: string) {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelManage);
    await deleteDepartment(ctx.tenantId, id);
    revalidatePath("/admin/personnel");
    revalidatePath("/personnel");
  });
}

export async function getStaffProfilesAction(query?: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelRead);
    const parsed = query ? listStaffQuerySchema.parse(query) : undefined;
    return listStaffProfiles(ctx.tenantId, parsed);
  });
}

export async function createStaffProfileAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelManage);
    const parsed = createStaffProfileSchema.parse(input);
    const result = await createStaffProfile(ctx.tenantId, parsed);
    revalidatePath("/admin/personnel");
    revalidatePath("/personnel");
    return result;
  });
}

export async function updateStaffProfileAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelManage);
    const parsed = updateStaffProfileSchema.parse(input);
    const result = await updateStaffProfile(ctx.tenantId, parsed);
    revalidatePath("/admin/personnel");
    revalidatePath("/personnel");
    return result;
  });
}

export async function deleteStaffProfileAction(id: string) {
  return runAction(async () => {
    const ctx = await requirePermission(PERSONNEL_P.personnelManage);
    await deleteStaffProfile(ctx.tenantId, id);
    revalidatePath("/admin/personnel");
    revalidatePath("/personnel");
  });
}
