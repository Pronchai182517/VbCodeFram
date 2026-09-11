import "server-only";

export {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listStaffProfiles,
  listPublicStaffProfiles,
  getStaffProfileById,
  createStaffProfile,
  updateStaffProfile,
  deleteStaffProfile,
  type DepartmentDto,
  type StaffProfileDto,
} from "./_internal/services";
export { PERSONNEL_P, PERSONNEL_PERMISSIONS } from "./permissions";
