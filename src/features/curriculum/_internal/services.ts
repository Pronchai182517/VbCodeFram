import { prisma } from "@/shared/lib/infra/prisma";
import { errors } from "@/shared/lib/errors";
import type {
  CreateProgramInput,
  UpdateProgramInput,
  CreateCourseInput,
  UpdateCourseInput,
  ListProgramsQuery,
  ListCoursesQuery,
  DegreeLevelEnum,
} from "./validations";

export interface ProgramDto {
  id: string;
  tenantId: string;
  code: string;
  degreeLevel: DegreeLevelEnum;
  nameTh: string;
  nameEn: string;
  shortNameTh: string;
  shortNameEn: string;
  totalCredits: number;
  yearIssued: number;
  tuitionFeeTerm: number | null;
  descriptionTh: string | null;
  descriptionEn: string | null;
  careerProspects: string[];
  leafletPdfUrl: string | null;
  isActive: boolean;
  coursesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDto {
  id: string;
  tenantId: string;
  programId: string;
  programNameTh?: string;
  programCode?: string;
  programDegreeLevel?: DegreeLevelEnum;
  code: string;
  nameTh: string;
  nameEn: string;
  credits: string;
  categoryGroup: string;
  descriptionTh: string | null;
  descriptionEn: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramDetailDto extends ProgramDto {
  courses: CourseDto[];
}

// ---------------------------------------------------------------------------
// Program Queries & Mutations
// ---------------------------------------------------------------------------

export async function listPrograms(
  tenantId: string,
  query?: Partial<ListProgramsQuery>
): Promise<ProgramDto[]> {
  const where: Record<string, unknown> = { tenantId };

  if (query?.degreeLevel) {
    where.degreeLevel = query.degreeLevel;
  }

  if (typeof query?.isActive === "boolean") {
    where.isActive = query.isActive;
  }

  if (query?.search?.trim()) {
    const s = query.search.trim();
    where.OR = [
      { nameTh: { contains: s, mode: "insensitive" } },
      { nameEn: { contains: s, mode: "insensitive" } },
      { code: { contains: s, mode: "insensitive" } },
      { shortNameTh: { contains: s, mode: "insensitive" } },
      { shortNameEn: { contains: s, mode: "insensitive" } },
    ];
  }

  const items = await prisma.program.findMany({
    where,
    orderBy: [{ degreeLevel: "asc" }, { yearIssued: "desc" }, { code: "asc" }],
    include: {
      _count: {
        select: { courses: true },
      },
    },
  });

  return items.map((p) => {
    let careers: string[] = [];
    if (Array.isArray(p.careerProspects)) {
      careers = p.careerProspects as string[];
    }

    return {
      id: p.id,
      tenantId: p.tenantId,
      code: p.code,
      degreeLevel: p.degreeLevel as DegreeLevelEnum,
      nameTh: p.nameTh,
      nameEn: p.nameEn,
      shortNameTh: p.shortNameTh,
      shortNameEn: p.shortNameEn,
      totalCredits: p.totalCredits,
      yearIssued: p.yearIssued,
      tuitionFeeTerm: p.tuitionFeeTerm ? Number(p.tuitionFeeTerm) : null,
      descriptionTh: p.descriptionTh,
      descriptionEn: p.descriptionEn,
      careerProspects: careers,
      leafletPdfUrl: p.leafletPdfUrl,
      isActive: p.isActive,
      coursesCount: p._count.courses,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  });
}

export async function getProgramById(
  tenantId: string,
  id: string
): Promise<ProgramDetailDto | null> {
  const p = await prisma.program.findFirst({
    where: { id, tenantId },
    include: {
      courses: {
        orderBy: [{ categoryGroup: "asc" }, { code: "asc" }],
      },
      _count: {
        select: { courses: true },
      },
    },
  });

  if (!p) return null;

  let careers: string[] = [];
  if (Array.isArray(p.careerProspects)) {
    careers = p.careerProspects as string[];
  }

  return {
    id: p.id,
    tenantId: p.tenantId,
    code: p.code,
    degreeLevel: p.degreeLevel as DegreeLevelEnum,
    nameTh: p.nameTh,
    nameEn: p.nameEn,
    shortNameTh: p.shortNameTh,
    shortNameEn: p.shortNameEn,
    totalCredits: p.totalCredits,
    yearIssued: p.yearIssued,
    tuitionFeeTerm: p.tuitionFeeTerm ? Number(p.tuitionFeeTerm) : null,
    descriptionTh: p.descriptionTh,
    descriptionEn: p.descriptionEn,
    careerProspects: careers,
    leafletPdfUrl: p.leafletPdfUrl,
    isActive: p.isActive,
    coursesCount: p._count.courses,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    courses: p.courses.map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      programId: c.programId,
      code: c.code,
      nameTh: c.nameTh,
      nameEn: c.nameEn,
      credits: c.credits,
      categoryGroup: c.categoryGroup,
      descriptionTh: c.descriptionTh,
      descriptionEn: c.descriptionEn,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  };
}

export async function createProgram(
  tenantId: string,
  input: CreateProgramInput
): Promise<ProgramDto> {
  const existing = await prisma.program.findUnique({
    where: {
      tenantId_code: {
        tenantId,
        code: input.code,
      },
    },
  });

  if (existing) {
    throw errors.conflict("curriculum.error.duplicateProgramCode");
  }

  const created = await prisma.program.create({
    data: {
      tenantId,
      code: input.code,
      degreeLevel: input.degreeLevel,
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      shortNameTh: input.shortNameTh,
      shortNameEn: input.shortNameEn,
      totalCredits: input.totalCredits,
      yearIssued: input.yearIssued,
      tuitionFeeTerm: input.tuitionFeeTerm !== undefined && input.tuitionFeeTerm !== null
        ? input.tuitionFeeTerm
        : null,
      descriptionTh: input.descriptionTh ?? null,
      descriptionEn: input.descriptionEn ?? null,
      careerProspects: input.careerProspects,
      leafletPdfUrl: input.leafletPdfUrl ?? null,
      isActive: input.isActive,
    },
    include: {
      _count: {
        select: { courses: true },
      },
    },
  });

  return {
    id: created.id,
    tenantId: created.tenantId,
    code: created.code,
    degreeLevel: created.degreeLevel as DegreeLevelEnum,
    nameTh: created.nameTh,
    nameEn: created.nameEn,
    shortNameTh: created.shortNameTh,
    shortNameEn: created.shortNameEn,
    totalCredits: created.totalCredits,
    yearIssued: created.yearIssued,
    tuitionFeeTerm: created.tuitionFeeTerm ? Number(created.tuitionFeeTerm) : null,
    descriptionTh: created.descriptionTh,
    descriptionEn: created.descriptionEn,
    careerProspects: Array.isArray(created.careerProspects)
      ? (created.careerProspects as string[])
      : [],
    leafletPdfUrl: created.leafletPdfUrl,
    isActive: created.isActive,
    coursesCount: created._count.courses,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateProgram(
  tenantId: string,
  input: UpdateProgramInput
): Promise<ProgramDto> {
  const existing = await prisma.program.findFirst({
    where: { id: input.id, tenantId },
  });

  if (!existing) {
    throw errors.not_found("curriculum.error.programNotFound");
  }

  if (existing.code !== input.code) {
    const duplicate = await prisma.program.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: input.code,
        },
      },
    });
    if (duplicate) {
      throw errors.conflict("curriculum.error.duplicateProgramCode");
    }
  }

  const updated = await prisma.program.update({
    where: { id: input.id },
    data: {
      code: input.code,
      degreeLevel: input.degreeLevel,
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      shortNameTh: input.shortNameTh,
      shortNameEn: input.shortNameEn,
      totalCredits: input.totalCredits,
      yearIssued: input.yearIssued,
      tuitionFeeTerm: input.tuitionFeeTerm !== undefined && input.tuitionFeeTerm !== null
        ? input.tuitionFeeTerm
        : null,
      descriptionTh: input.descriptionTh ?? null,
      descriptionEn: input.descriptionEn ?? null,
      careerProspects: input.careerProspects,
      leafletPdfUrl: input.leafletPdfUrl ?? null,
      isActive: input.isActive,
    },
    include: {
      _count: {
        select: { courses: true },
      },
    },
  });

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    code: updated.code,
    degreeLevel: updated.degreeLevel as DegreeLevelEnum,
    nameTh: updated.nameTh,
    nameEn: updated.nameEn,
    shortNameTh: updated.shortNameTh,
    shortNameEn: updated.shortNameEn,
    totalCredits: updated.totalCredits,
    yearIssued: updated.yearIssued,
    tuitionFeeTerm: updated.tuitionFeeTerm ? Number(updated.tuitionFeeTerm) : null,
    descriptionTh: updated.descriptionTh,
    descriptionEn: updated.descriptionEn,
    careerProspects: Array.isArray(updated.careerProspects)
      ? (updated.careerProspects as string[])
      : [],
    leafletPdfUrl: updated.leafletPdfUrl,
    isActive: updated.isActive,
    coursesCount: updated._count.courses,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteProgram(tenantId: string, id: string): Promise<void> {
  const existing = await prisma.program.findFirst({
    where: { id, tenantId },
    include: {
      _count: {
        select: { courses: true },
      },
    },
  });

  if (!existing) {
    throw errors.not_found("curriculum.error.programNotFound");
  }

  if (existing._count.courses > 0) {
    throw errors.validation("curriculum.error.hasCourses");
  }

  await prisma.program.delete({
    where: { id },
  });
}

// ---------------------------------------------------------------------------
// Course Queries & Mutations
// ---------------------------------------------------------------------------

export async function listCourses(
  tenantId: string,
  query?: Partial<ListCoursesQuery>
): Promise<CourseDto[]> {
  const where: Record<string, unknown> = { tenantId };

  if (query?.programId) {
    where.programId = query.programId;
  }

  if (query?.categoryGroup) {
    where.categoryGroup = query.categoryGroup;
  }

  if (query?.search?.trim()) {
    const s = query.search.trim();
    where.OR = [
      { nameTh: { contains: s, mode: "insensitive" } },
      { nameEn: { contains: s, mode: "insensitive" } },
      { code: { contains: s, mode: "insensitive" } },
    ];
  }

  const items = await prisma.course.findMany({
    where,
    orderBy: [{ code: "asc" }],
    include: {
      program: {
        select: {
          nameTh: true,
          code: true,
          degreeLevel: true,
        },
      },
    },
  });

  return items.map((c) => ({
    id: c.id,
    tenantId: c.tenantId,
    programId: c.programId,
    programNameTh: c.program.nameTh,
    programCode: c.program.code,
    programDegreeLevel: c.program.degreeLevel as DegreeLevelEnum,
    code: c.code,
    nameTh: c.nameTh,
    nameEn: c.nameEn,
    credits: c.credits,
    categoryGroup: c.categoryGroup,
    descriptionTh: c.descriptionTh,
    descriptionEn: c.descriptionEn,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export async function getCourseById(
  tenantId: string,
  id: string
): Promise<CourseDto | null> {
  const c = await prisma.course.findFirst({
    where: { id, tenantId },
    include: {
      program: {
        select: {
          nameTh: true,
          code: true,
          degreeLevel: true,
        },
      },
    },
  });

  if (!c) return null;

  return {
    id: c.id,
    tenantId: c.tenantId,
    programId: c.programId,
    programNameTh: c.program.nameTh,
    programCode: c.program.code,
    programDegreeLevel: c.program.degreeLevel as DegreeLevelEnum,
    code: c.code,
    nameTh: c.nameTh,
    nameEn: c.nameEn,
    credits: c.credits,
    categoryGroup: c.categoryGroup,
    descriptionTh: c.descriptionTh,
    descriptionEn: c.descriptionEn,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function createCourse(
  tenantId: string,
  input: CreateCourseInput
): Promise<CourseDto> {
  // Validate program
  const program = await prisma.program.findFirst({
    where: { id: input.programId, tenantId },
  });

  if (!program) {
    throw errors.not_found("curriculum.error.programNotFound");
  }

  // Check duplicate course code
  const existing = await prisma.course.findUnique({
    where: {
      tenantId_code: {
        tenantId,
        code: input.code,
      },
    },
  });

  if (existing) {
    throw errors.conflict("curriculum.error.duplicateCourseCode");
  }

  const created = await prisma.course.create({
    data: {
      tenantId,
      programId: input.programId,
      code: input.code,
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      credits: input.credits,
      categoryGroup: input.categoryGroup,
      descriptionTh: input.descriptionTh ?? null,
      descriptionEn: input.descriptionEn ?? null,
    },
    include: {
      program: {
        select: {
          nameTh: true,
          code: true,
          degreeLevel: true,
        },
      },
    },
  });

  return {
    id: created.id,
    tenantId: created.tenantId,
    programId: created.programId,
    programNameTh: created.program.nameTh,
    programCode: created.program.code,
    programDegreeLevel: created.program.degreeLevel as DegreeLevelEnum,
    code: created.code,
    nameTh: created.nameTh,
    nameEn: created.nameEn,
    credits: created.credits,
    categoryGroup: created.categoryGroup,
    descriptionTh: created.descriptionTh,
    descriptionEn: created.descriptionEn,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateCourse(
  tenantId: string,
  input: UpdateCourseInput
): Promise<CourseDto> {
  const existing = await prisma.course.findFirst({
    where: { id: input.id, tenantId },
  });

  if (!existing) {
    throw errors.not_found("curriculum.error.courseNotFound");
  }

  // If changing program, verify program
  if (existing.programId !== input.programId) {
    const program = await prisma.program.findFirst({
      where: { id: input.programId, tenantId },
    });
    if (!program) {
      throw errors.not_found("curriculum.error.programNotFound");
    }
  }

  // Check code uniqueness
  if (existing.code !== input.code) {
    const duplicate = await prisma.course.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: input.code,
        },
      },
    });
    if (duplicate) {
      throw errors.conflict("curriculum.error.duplicateCourseCode");
    }
  }

  const updated = await prisma.course.update({
    where: { id: input.id },
    data: {
      programId: input.programId,
      code: input.code,
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      credits: input.credits,
      categoryGroup: input.categoryGroup,
      descriptionTh: input.descriptionTh ?? null,
      descriptionEn: input.descriptionEn ?? null,
    },
    include: {
      program: {
        select: {
          nameTh: true,
          code: true,
          degreeLevel: true,
        },
      },
    },
  });

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    programId: updated.programId,
    programNameTh: updated.program.nameTh,
    programCode: updated.program.code,
    programDegreeLevel: updated.program.degreeLevel as DegreeLevelEnum,
    code: updated.code,
    nameTh: updated.nameTh,
    nameEn: updated.nameEn,
    credits: updated.credits,
    categoryGroup: updated.categoryGroup,
    descriptionTh: updated.descriptionTh,
    descriptionEn: updated.descriptionEn,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteCourse(tenantId: string, id: string): Promise<void> {
  const existing = await prisma.course.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    throw errors.not_found("curriculum.error.courseNotFound");
  }

  await prisma.course.delete({
    where: { id },
  });
}
