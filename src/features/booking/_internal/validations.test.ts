import { describe, it, expect } from "vitest";
import {
  createResourceSchema,
  createReservationSchema,
  rejectReservationSchema,
  listReservationsQuerySchema,
} from "./validations";

describe("booking validations", () => {
  const dummyResourceId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  it("should validate and transform valid resource data", () => {
    const raw = {
      type: "ROOM",
      nameTh: "ห้องประชุมสารภี 1",
      nameEn: "Sarapee Conference Room 1",
      code: " room-301 ",
      capacity: "40",
      locationTh: "ชั้น 3 อาคารนวัตกรรม",
      locationEn: "3rd Floor, Innovation Building",
      facilities: ["Projector 4K", "Wireless Mic"],
    };

    const parsed = createResourceSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe("ROOM-301");
      expect(parsed.data.capacity).toBe(40);
      expect(parsed.data.facilities).toHaveLength(2);
      expect(parsed.data.isActive).toBe(true);
    }
  });

  it("should validate reservation when startTime is before endTime", () => {
    const raw = {
      resourceId: dummyResourceId,
      purpose: "ประชุมคณะกรรมการประจำคณะ วาระพิเศษ",
      attendeeCount: 15,
      startTime: "2026-09-15T09:00:00.000Z",
      endTime: "2026-09-15T12:00:00.000Z",
    };

    const parsed = createReservationSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.attendeeCount).toBe(15);
      expect(parsed.data.startTime.getTime()).toBeLessThan(
        parsed.data.endTime.getTime()
      );
    }
  });

  it("should reject reservation when startTime is equal to or after endTime", () => {
    const raw = {
      resourceId: dummyResourceId,
      purpose: "ประชุมทดสอบ",
      attendeeCount: 5,
      startTime: "2026-09-15T14:00:00.000Z",
      endTime: "2026-09-15T13:00:00.000Z",
    };

    const parsed = createReservationSchema.safeParse(raw);
    expect(parsed.success).toBe(false);
  });

  it("should require reason when rejecting a reservation", () => {
    const invalid = rejectReservationSchema.safeParse({
      id: dummyResourceId,
      reason: "   ",
    });
    expect(invalid.success).toBe(false);

    const valid = rejectReservationSchema.safeParse({
      id: dummyResourceId,
      reason: "ห้องปิดปรับปรุงระบบเครื่องเสียงชั่วคราว",
    });
    expect(valid.success).toBe(true);
  });

  it("should parse listReservationsQuerySchema with type and status", () => {
    const parsed = listReservationsQuerySchema.safeParse({
      type: "ROOM",
      status: "CONFIRMED",
      myOnly: "true",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.type).toBe("ROOM");
      expect(parsed.data.status).toBe("CONFIRMED");
      expect(parsed.data.myOnly).toBe(true);
    }
  });
});
