export { BOOKING_P, BOOKING_PERMISSIONS } from "./permissions";
export {
  RESOURCE_TYPES,
  RESERVATION_STATUSES,
  type ResourceTypeEnum,
  type ReservationStatusEnum,
  type CreateResourceInput,
  type UpdateResourceInput,
  type CreateReservationInput,
  type ApproveReservationInput,
  type RejectReservationInput,
  type ListReservationsQuery,
  type ListResourcesQuery,
} from "./_internal/validations";
export type {
  ResourceDto,
  ReservationDto,
  CalendarEventDto,
} from "./_internal/services";
