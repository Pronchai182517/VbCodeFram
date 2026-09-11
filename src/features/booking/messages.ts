import type { Dictionary } from "@/shared/lib/i18n/translate";

export const MESSAGES: Dictionary = {
  // Navigation & General
  "booking.nav": { th: "จองห้องประชุมและยานพาหนะ", en: "Room & Vehicle Booking" },
  "portal.nav.calendar": { th: "ปฏิทินการใช้ห้องและรถ", en: "Resource Calendar" },
  "booking.title": { th: "ระบบจองห้องประชุมและยานพาหนะ", en: "Resource Reservation System" },
  "booking.subtitle": { th: "ตรวจสอบปฏิทิน จองห้องประชุม สัมมนา และยานพาหนะส่วนกลางของคณะ พร้อมระบบป้องกันเวลาซ้อนทับ", en: "Check availability calendar, reserve conference rooms and vehicles with zero-overlap collision detection" },

  // Tabs
  "booking.tab.reservations": { th: "รายการคำขอจอง", en: "Reservations" },
  "booking.tab.resources": { th: "จัดการห้องและยานพาหนะ", en: "Manage Resources" },
  "booking.tab.calendar": { th: "ปฏิทินการใช้ทรัพยากร", en: "Schedule Calendar" },
  "booking.tab.my": { th: "การจองของฉัน", en: "My Bookings" },

  // Resource Types
  "booking.type.ROOM": { th: "ห้องประชุม / ห้องสัมมนา", en: "Meeting Room" },
  "booking.type.VEHICLE": { th: "ยานพาหนะส่วนกลาง", en: "Vehicle" },
  "booking.type.all": { th: "ทุกประเภททรัพยากร", en: "All Resource Types" },

  // Reservation Status
  "booking.status.PENDING": { th: "รออนุมัติ", en: "Pending Review" },
  "booking.status.CONFIRMED": { th: "อนุมัติแล้ว", en: "Confirmed" },
  "booking.status.REJECTED": { th: "ปฏิเสธ / ไม่อนุมัติ", en: "Rejected" },
  "booking.status.CANCELLED": { th: "ยกเลิกการจอง", en: "Cancelled" },
  "booking.status.all": { th: "ทุกสถานะ", en: "All Statuses" },

  // Fields: Resource
  "booking.resource.nameTh": { th: "ชื่อห้อง/ยานพาหนะ (ภาษาไทย)", en: "Resource Name (TH)" },
  "booking.resource.nameEn": { th: "ชื่อห้อง/ยานพาหนะ (ภาษาอังกฤษ)", en: "Resource Name (EN)" },
  "booking.resource.code": { th: "รหัสทรัพยากร (เช่น ROOM-301, VAN-01)", en: "Resource Code" },
  "booking.resource.type": { th: "ประเภททรัพยากร", en: "Type" },
  "booking.resource.capacity": { th: "ความจุ / จำนวนที่นั่ง (คน)", en: "Capacity (Seats)" },
  "booking.resource.locationTh": { th: "สถานที่ตั้ง / อาคาร (ภาษาไทย)", en: "Location (TH)" },
  "booking.resource.locationEn": { th: "สถานที่ตั้ง / อาคาร (ภาษาอังกฤษ)", en: "Location (EN)" },
  "booking.resource.facilities": { th: "สิ่งอำนวยความสะดวก (คั่นด้วยจุลภาค)", en: "Facilities / Equipment" },
  "booking.resource.driverName": { th: "พนักงานขับรถประจำ (ถ้ามี)", en: "Designated Driver" },
  "booking.resource.imageUrl": { th: "URL รูปภาพสถานที่/ยานพาหนะ", en: "Image URL" },
  "booking.resource.status": { th: "สถานะความพร้อมใช้งาน", en: "Availability Status" },
  "booking.resource.active": { th: "เปิดให้จอง", en: "Available" },
  "booking.resource.inactive": { th: "ปิดปรับปรุง / ซ่อมบำรุง", en: "Under Maintenance" },

  // Fields: Reservation
  "booking.reservation.resource": { th: "ห้องประชุม / ยานพาหนะ", en: "Selected Resource" },
  "booking.reservation.purpose": { th: "วัตถุประสงค์การใช้งาน / หัวข้อการประชุม", en: "Purpose / Meeting Title" },
  "booking.reservation.attendeeCount": { th: "จำนวนผู้เข้าร่วม (คน)", en: "Attendee Count" },
  "booking.reservation.startTime": { th: "เวลาเริ่มต้น", en: "Start Time" },
  "booking.reservation.endTime": { th: "เวลาสิ้นสุด", en: "End Time" },
  "booking.reservation.user": { th: "ผู้ขอรับบริการ / ผู้จอง", en: "Booked By" },
  "booking.reservation.createdAt": { th: "วันที่ทำรายการ", en: "Requested Date" },
  "booking.reservation.rejectReason": { th: "เหตุผลที่ไม่อนุมัติ / ยกเลิก", en: "Rejection Reason" },

  // Actions & Buttons
  "booking.newBooking": { th: "จองห้อง / ยานพาหนะใหม่", en: "New Booking" },
  "booking.newResource": { th: "เพิ่มห้อง / ยานพาหนะ", en: "Add Resource" },
  "booking.editResource": { th: "แก้ไขข้อมูลทรัพยากร", en: "Edit Resource" },
  "booking.deleteResource": { th: "ลบทรัพยากรนี้", en: "Delete Resource" },
  "booking.deleteResourceConfirm": { th: "คุณแน่ใจหรือไม่ว่าต้องการลบทรัพยากรนี้?", en: "Are you sure you want to delete this resource?" },
  "booking.approve": { th: "อนุมัติการจอง", en: "Confirm Booking" },
  "booking.reject": { th: "ปฏิเสธคำขอ", en: "Reject Booking" },
  "booking.cancel": { th: "ยกเลิกการจอง", en: "Cancel Booking" },
  "booking.cancelConfirm": { th: "คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?", en: "Are you sure you want to cancel this reservation?" },
  "booking.save": { th: "บันทึกการจอง", en: "Submit Booking" },
  "booking.empty.reservations": { th: "ไม่พบรายการจอง", en: "No reservations found" },
  "booking.empty.resources": { th: "ไม่พบข้อมูลห้องหรือยานพาหนะ", en: "No resources found" },

  // Public Portal & Calendar
  "booking.portal.title": { th: "ปฏิทินการใช้ห้องประชุมและยานพาหนะ", en: "Resource Schedule Calendar" },
  "booking.portal.subtitle": { th: "ตรวจสอบตารางการใช้งานห้องประชุมและยานพาหนะส่วนกลางคณะแบบเรียลไทม์", en: "Real-time calendar and availability for faculty conference rooms and vehicles" },
  "booking.portal.filterDate": { th: "เลือกวันที่", en: "Select Date" },
  "booking.portal.today": { th: "วันนี้", en: "Today" },
  "booking.portal.availableNotice": { th: "ช่วงเวลาที่ว่างสามารถยื่นคำขอจองผ่านระบบบุคลากรได้ทันที", en: "Available time slots can be reserved via staff portal" },

  // Permissions & Roles
  "roles.module.booking": { th: "ระบบจองห้องประชุมและยานพาหนะ", en: "Room & Vehicle Booking" },
  "perm.booking:read": { th: "ดูรายการจองและปฏิทินการใช้ห้องประชุมและยานพาหนะ", en: "View booking list and schedule calendar" },
  "perm.booking:create": { th: "ทำการจองห้องประชุมหรือยานพาหนะ", en: "Create room or vehicle reservation" },
  "perm.booking:approve": { th: "พิจารณาอนุมัติหรือปฏิเสธคำขอจอง", en: "Approve or reject booking requests" },
  "perm.booking:manage": { th: "จัดการทรัพยากรห้องประชุมและยานพาหนะทั้งหมด", en: "Manage resources and bookings" },

  // Validation & Conflict Errors
  "booking.error.overlap": { th: "ช่วงเวลาดังกล่าวมีผู้ใช้งานหรือจองคิวไว้แล้ว กรุณาเลือกช่วงเวลาอื่น (Time Conflict Overlap)", en: "Selected time slot is already booked. Please choose another time." },
  "booking.error.invalidTimeRange": { th: "เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุด", en: "Start time must be before end time" },
  "booking.error.inPast": { th: "ไม่สามารถจองช่วงเวลาย้อนหลังในอดีตได้", en: "Cannot book a time slot in the past" },
  "booking.error.capacityExceeded": { th: "จำนวนผู้เข้าร่วมเกินความจุสูงสุดของทรัพยากรนี้", en: "Attendee count exceeds resource capacity" },
  "booking.error.resourceNotFound": { th: "ไม่พบทรัพยากรที่ระบุ", en: "Resource not found" },
  "booking.error.reservationNotFound": { th: "ไม่พบรายการจองที่ระบุ", en: "Reservation not found" },
  "booking.error.cannotCancel": { th: "สามารถยกเลิกได้เฉพาะการจองที่ยังไม่เสร็จสิ้นเท่านั้น", en: "Can only cancel active reservations" },
  "booking.error.resourceInUse": { th: "ไม่สามารถลบทรัพยากรนี้ได้เนื่องจากมีประวัติการจองอยู่ในระบบ", en: "Cannot delete resource that has associated reservations" },
};
