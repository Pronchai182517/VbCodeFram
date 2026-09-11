"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/shared/lib/result";
import { requirePermission } from "@/features/identity/server";
import { CURRICULUM_P } from "../permissions";
import {
  createProgramSchema,
  updateProgramSchema,
  createCourseSchema,
  updateCourseSchema,
  listProgramsQuerySchema,
  listCoursesQuerySchema,
} from "./validations";
import {
  listPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  listCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "./services";

// ---------------------------------------------------------------------------
// Program Actions
// ---------------------------------------------------------------------------

export async function getProgramsAction(query?: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
    const parsed = listProgramsQuerySchema.partial().parse(query ?? {});
    return listPrograms(ctx.tenantId, parsed);
  });
}

export async function getProgramByIdAction(id: string) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
    return getProgramById(ctx.tenantId, id);
  });
}

export async function createProgramAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumManage);
    const parsed = createProgramSchema.parse(input);
    const res = await createProgram(ctx.tenantId, parsed);
    revalidatePath("/curriculum");
    revalidatePath("/admin/curriculum");
    return res;
  });
}

export async function updateProgramAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumManage);
    const parsed = updateProgramSchema.parse(input);
    const res = await updateProgram(ctx.tenantId, parsed);
    revalidatePath("/curriculum");
    revalidatePath("/admin/curriculum");
    return res;
  });
}

export async function deleteProgramAction(id: string) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumManage);
    await deleteProgram(ctx.tenantId, id);
    revalidatePath("/curriculum");
    revalidatePath("/admin/curriculum");
    return { id };
  });
}

// ---------------------------------------------------------------------------
// Course Actions
// ---------------------------------------------------------------------------

export async function getCoursesAction(query?: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
    const parsed = listCoursesQuerySchema.partial().parse(query ?? {});
    return listCourses(ctx.tenantId, parsed);
  });
}

export async function getCourseByIdAction(id: string) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
    return getCourseById(ctx.tenantId, id);
  });
}

export async function createCourseAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumManage);
    const parsed = createCourseSchema.parse(input);
    const res = await createCourse(ctx.tenantId, parsed);
    revalidatePath("/curriculum");
    revalidatePath("/admin/curriculum");
    return res;
  });
}

export async function updateCourseAction(input: unknown) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumManage);
    const parsed = updateCourseSchema.parse(input);
    const res = await updateCourse(ctx.tenantId, parsed);
    revalidatePath("/curriculum");
    revalidatePath("/admin/curriculum");
    return res;
  });
}

export async function deleteCourseAction(id: string) {
  return runAction(async () => {
    const ctx = await requirePermission(CURRICULUM_P.curriculumManage);
    await deleteCourse(ctx.tenantId, id);
    revalidatePath("/curriculum");
    revalidatePath("/admin/curriculum");
    return { id };
  });
}
