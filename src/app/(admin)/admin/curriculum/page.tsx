import { requirePermission } from "@/features/identity/server";
import { hasPermission } from "@/features/identity";
import { CURRICULUM_P } from "@/features/curriculum";
import { listPrograms, listCourses } from "@/features/curriculum/server";
import { CurriculumClient } from "./_components/curriculum-client";

export default async function CurriculumAdminPage() {
  const ctx = await requirePermission(CURRICULUM_P.curriculumRead);
  const canManage = hasPermission(ctx, CURRICULUM_P.curriculumManage);

  const [programs, courses] = await Promise.all([
    listPrograms(ctx.tenantId),
    listCourses(ctx.tenantId),
  ]);

  return (
    <CurriculumClient
      initialPrograms={programs}
      initialCourses={courses}
      canManage={canManage}
    />
  );
}
