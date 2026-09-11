import { prisma } from "@/shared/lib/infra/prisma";
import { errors } from "@/shared/lib/errors";
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateStaffProfileInput,
  UpdateStaffProfileInput,
  ListStaffQuery,
} from "./validations";

export interface DepartmentDto {
  id: string;
  tenantId: string;
  nameTh: string;
  nameEn: string;
  code: string;
  orderIndex: number;
  staffCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StaffProfileDto {
  id: string;
  tenantId: string;
  userId: string | null;
  departmentId: string;
  departmentNameTh?: string;
  departmentNameEn?: string;
  departmentCode?: string;
  prefixTh: string;
  prefixEn: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  academicPosition: string | null;
  adminPositionTh: string | null;
  adminPositionEn: string | null;
  email: string;
  phone: string | null;
  roomNumber: string | null;
  avatarUrl: string | null;
  bioTh: string | null;
  bioEn: string | null;
  expertise: string[];
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Department Services
// ==========================================

export async function listDepartments(tenantId: string): Promise<DepartmentDto[]> {
  const items = await prisma.department.findMany({
    where: { tenantId },
    orderBy: [{ orderIndex: "asc" }, { nameTh: "asc" }],
    include: {
      _count: { select: { staffs: true } },
    },
  });

  return items.map((d) => ({
    id: d.id,
    tenantId: d.tenantId,
    nameTh: d.nameTh,
    nameEn: d.nameEn,
    code: d.code,
    orderIndex: d.orderIndex,
    staffCount: d._count.staffs,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));
}

export async function createDepartment(
  tenantId: string,
  input: CreateDepartmentInput
): Promise<DepartmentDto> {
  const existing = await prisma.department.findUnique({
    where: { tenantId_code: { tenantId, code: input.code } },
  });

  if (existing) {
    throw errors.conflict("รหัสภาควิชานี้มีอยู่ในระบบแล้ว (Duplicate Code)");
  }

  const created = await prisma.department.create({
    data: {
      tenantId,
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      code: input.code,
      orderIndex: input.orderIndex,
    },
    include: {
      _count: { select: { staffs: true } },
    },
  });

  return {
    id: created.id,
    tenantId: created.tenantId,
    nameTh: created.nameTh,
    nameEn: created.nameEn,
    code: created.code,
    orderIndex: created.orderIndex,
    staffCount: created._count.staffs,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateDepartment(
  tenantId: string,
  input: UpdateDepartmentInput
): Promise<DepartmentDto> {
  const existingWithCode = await prisma.department.findFirst({
    where: {
      tenantId,
      code: input.code,
      id: { not: input.id },
    },
  });

  if (existingWithCode) {
    throw errors.conflict("รหัสภาควิชานี้มีอยู่ในระบบแล้ว (Duplicate Code)");
  }

  const updated = await prisma.department.update({
    where: { id: input.id, tenantId },
    data: {
      nameTh: input.nameTh,
      nameEn: input.nameEn,
      code: input.code,
      orderIndex: input.orderIndex,
    },
    include: {
      _count: { select: { staffs: true } },
    },
  });

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    nameTh: updated.nameTh,
    nameEn: updated.nameEn,
    code: updated.code,
    orderIndex: updated.orderIndex,
    staffCount: updated._count.staffs,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteDepartment(tenantId: string, id: string): Promise<void> {
  const staffCount = await prisma.staffProfile.count({
    where: { tenantId, departmentId: id },
  });

  if (staffCount > 0) {
    throw errors.validation("ไม่สามารถลบภาควิชาที่มีบุคลากรสังกัดอยู่ได้ กรุณาย้ายหรือลบข้อมูลบุคลากรก่อน");
  }

  await prisma.department.deleteMany({
    where: { tenantId, id },
  });
}

// ==========================================
// Staff Profile Services
// ==========================================

function mapStaffToDto(s: {
  id: string;
  tenantId: string;
  userId: string | null;
  departmentId: string;
  prefixTh: string;
  prefixEn: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  academicPosition: string | null;
  adminPositionTh: string | null;
  adminPositionEn: string | null;
  email: string;
  phone: string | null;
  roomNumber: string | null;
  avatarUrl: string | null;
  bioTh: string | null;
  bioEn: string | null;
  expertise: unknown;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  department?: {
    nameTh: string;
    nameEn: string;
    code: string;
  } | null;
}): StaffProfileDto {
  const expertiseArray = Array.isArray(s.expertise) ? (s.expertise as string[]) : [];

  return {
    id: s.id,
    tenantId: s.tenantId,
    userId: s.userId,
    departmentId: s.departmentId,
    departmentNameTh: s.department?.nameTh,
    departmentNameEn: s.department?.nameEn,
    departmentCode: s.department?.code,
    prefixTh: s.prefixTh,
    prefixEn: s.prefixEn,
    firstNameTh: s.firstNameTh,
    lastNameTh: s.lastNameTh,
    firstNameEn: s.firstNameEn,
    lastNameEn: s.lastNameEn,
    academicPosition: s.academicPosition,
    adminPositionTh: s.adminPositionTh,
    adminPositionEn: s.adminPositionEn,
    email: s.email,
    phone: s.phone,
    roomNumber: s.roomNumber,
    avatarUrl: s.avatarUrl,
    bioTh: s.bioTh,
    bioEn: s.bioEn,
    expertise: expertiseArray,
    orderIndex: s.orderIndex,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export async function listStaffProfiles(
  tenantId: string,
  query?: Partial<ListStaffQuery>
): Promise<{ items: StaffProfileDto[]; total: number }> {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { tenantId };

  if (query?.departmentId) {
    where.departmentId = query.departmentId;
  }
  if (query?.isActive !== undefined) {
    where.isActive = query.isActive;
  }
  if (query?.search) {
    where.OR = [
      { firstNameTh: { contains: query.search, mode: "insensitive" } },
      { lastNameTh: { contains: query.search, mode: "insensitive" } },
      { firstNameEn: { contains: query.search, mode: "insensitive" } },
      { lastNameEn: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { academicPosition: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.staffProfile.findMany({
      where,
      orderBy: [{ orderIndex: "asc" }, { firstNameTh: "asc" }],
      skip,
      take: limit,
      include: {
        department: { select: { nameTh: true, nameEn: true, code: true } },
      },
    }),
    prisma.staffProfile.count({ where }),
  ]);

  return {
    items: items.map(mapStaffToDto),
    total,
  };
}

export async function listPublicStaffProfiles(
  tenantId: string,
  options?: { departmentId?: string; search?: string }
): Promise<StaffProfileDto[]> {
  const where: Record<string, unknown> = {
    tenantId,
    isActive: true,
  };

  if (options?.departmentId) {
    where.departmentId = options.departmentId;
  }
  if (options?.search) {
    where.OR = [
      { firstNameTh: { contains: options.search, mode: "insensitive" } },
      { lastNameTh: { contains: options.search, mode: "insensitive" } },
      { firstNameEn: { contains: options.search, mode: "insensitive" } },
      { lastNameEn: { contains: options.search, mode: "insensitive" } },
      { email: { contains: options.search, mode: "insensitive" } },
      { academicPosition: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const items = await prisma.staffProfile.findMany({
    where,
    orderBy: [
      { department: { orderIndex: "asc" } },
      { orderIndex: "asc" },
      { firstNameTh: "asc" },
    ],
    include: {
      department: { select: { nameTh: true, nameEn: true, code: true } },
    },
  });

  return items.map(mapStaffToDto);
}

export async function getStaffProfileById(
  tenantId: string,
  id: string
): Promise<StaffProfileDto | null> {
  const staff = await prisma.staffProfile.findFirst({
    where: { tenantId, id },
    include: {
      department: { select: { nameTh: true, nameEn: true, code: true } },
    },
  });

  if (!staff) return null;
  return mapStaffToDto(staff);
}

export async function createStaffProfile(
  tenantId: string,
  input: CreateStaffProfileInput
): Promise<StaffProfileDto> {
  const created = await prisma.staffProfile.create({
    data: {
      tenantId,
      departmentId: input.departmentId,
      userId: input.userId ?? null,
      prefixTh: input.prefixTh,
      prefixEn: input.prefixEn,
      firstNameTh: input.firstNameTh,
      lastNameTh: input.lastNameTh,
      firstNameEn: input.firstNameEn,
      lastNameEn: input.lastNameEn,
      academicPosition: input.academicPosition ?? null,
      adminPositionTh: input.adminPositionTh ?? null,
      adminPositionEn: input.adminPositionEn ?? null,
      email: input.email,
      phone: input.phone ?? null,
      roomNumber: input.roomNumber ?? null,
      avatarUrl: input.avatarUrl ?? null,
      bioTh: input.bioTh ?? null,
      bioEn: input.bioEn ?? null,
      expertise: input.expertise,
      orderIndex: input.orderIndex,
      isActive: input.isActive,
    },
    include: {
      department: { select: { nameTh: true, nameEn: true, code: true } },
    },
  });

  return mapStaffToDto(created);
}

export async function updateStaffProfile(
  tenantId: string,
  input: UpdateStaffProfileInput
): Promise<StaffProfileDto> {
  const updated = await prisma.staffProfile.update({
    where: { id: input.id, tenantId },
    data: {
      departmentId: input.departmentId,
      userId: input.userId ?? null,
      prefixTh: input.prefixTh,
      prefixEn: input.prefixEn,
      firstNameTh: input.firstNameTh,
      lastNameTh: input.lastNameTh,
      firstNameEn: input.firstNameEn,
      lastNameEn: input.lastNameEn,
      academicPosition: input.academicPosition ?? null,
      adminPositionTh: input.adminPositionTh ?? null,
      adminPositionEn: input.adminPositionEn ?? null,
      email: input.email,
      phone: input.phone ?? null,
      roomNumber: input.roomNumber ?? null,
      avatarUrl: input.avatarUrl ?? null,
      bioTh: input.bioTh ?? null,
      bioEn: input.bioEn ?? null,
      expertise: input.expertise,
      orderIndex: input.orderIndex,
      isActive: input.isActive,
    },
    include: {
      department: { select: { nameTh: true, nameEn: true, code: true } },
    },
  });

  return mapStaffToDto(updated);
}

export async function deleteStaffProfile(tenantId: string, id: string): Promise<void> {
  await prisma.staffProfile.deleteMany({
    where: { tenantId, id },
  });
}
