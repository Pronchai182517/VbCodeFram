# Step-by-Step Implementation Plan
## แผนปฏิบัติการพัฒนา Faculty Web Platform (5 โมดูล)

แผนการดำเนินงานทีละขั้น (Task-by-Task) ตามลำดับวิศวกรรมซอฟต์แวร์ที่ถูกต้อง เพื่อความราบรื่นและไม่เกิดข้อผิดพลาดในการตรวจสอบ

---

## 阶段 1: Database Migration & Multi-tenancy Setup
- [x] **Task 1.1:** อัปเดตไฟล์ `prisma/schema.prisma` โดยนำ Models ของทั้ง 5 โมดูล (Article, StaffProfile, Program, DocumentRequest, Resource, Reservation) ไปวางต่อท้าย
- [x] **Task 1.2:** สร้างและรันคำสั่ง Migration:
  ```bash
  npm run db:migrate:dev -- --name add_faculty_platform_core
  ```
- [x] **Task 1.3:** ตรวจสอบว่า Prisma Client ถูก Generate ออกมาที่ `src/generated/prisma/` เรียบร้อยแล้ว (`npm run db:generate`)

---

## 阶段 2: Permissions Registry & Central Setup
- [x] **Task 2.1:** อัปเดต [`src/permissions.ts`](src/permissions.ts) โดยเพิ่มชุดสิทธิ์ Permission Constants ของทั้ง 5 โมดูล:
  - `news:read`, `news:manage`, `news:publish`
  - `personnel:read`, `personnel:manage`, `personnel:update-self`
  - `curriculum:read`, `curriculum:manage`
  - `documents:create`, `documents:approve`, `documents:manage-all`
  - `booking:view`, `booking:create`, `booking:manage`
- [x] **Task 2.2:** อัปเดต `prisma/seed.ts` ให้รวมสิทธิ์ใหม่เข้าสู่บทบาท Super Admin อัตโนมัติ

---

## 阶段 3: Core Feature Implementation (ตามลำดับโมดูล)

### โมดูลที่ 1: `src/features/news/`
- [x] **Task 3.1.1:** สร้าง `_internal/validations.ts` (Zod Schemas สำหรับข่าวสาร)
- [x] **Task 3.1.2:** สร้าง `_internal/services.ts` (Prisma queries สำหรับ Article & Attachments)
- [x] **Task 3.1.3:** สร้าง `_internal/validations.test.ts` (Unit Test ทดสอบ slug generator และ validations)
- [x] **Task 3.1.4:** สร้าง `messages.ts` (พจนานุกรม TH/EN)
- [x] **Task 3.1.5:** สร้าง `permissions.ts`, `actions.ts`, `server.ts`, และ `index.ts`
- [x] **Task 3.1.6:** ลงทะเบียน messages ใน `src/i18n/index.ts`

### โมดูลที่ 2: `src/features/personnel/`
- [x] **Task 3.2.1:** สร้าง `_internal/validations.ts` และ `_internal/services.ts` (CRUD Department & StaffProfile)
- [x] **Task 3.2.2:** สร้าง `messages.ts`, `permissions.ts`, `actions.ts`, `server.ts`, และ `index.ts`
- [x] **Task 3.2.3:** ลงทะเบียน messages ใน `src/i18n/index.ts`

### โมดูลที่ 3: `src/features/curriculum/`
- [x] **Task 3.3.1:** สร้าง `_internal/validations.ts` และ `_internal/services.ts` (CRUD Program & Course)
- [x] **Task 3.3.2:** สร้าง `messages.ts`, `permissions.ts`, `actions.ts`, `server.ts`, และ `index.ts`
- [x] **Task 3.3.3:** ลงทะเบียน messages ใน `src/i18n/index.ts`

### โมดูลที่ 4: `src/features/document-flow/`
- [x] **Task 3.4.1:** สร้าง `_internal/validations.ts` (Validate DocumentRequest & Steps)
- [x] **Task 3.4.2:** สร้าง `_internal/services.ts` (State Machine, Sequential Routing, Atomic TrackingNo, Audit Log)
- [x] **Task 3.4.3:** สร้าง `_internal/validations.test.ts` (Unit Test ทดสอบ Schema & Validations)
- [x] **Task 3.4.4:** สร้าง `messages.ts`, `permissions.ts`, `actions.ts`, `server.ts`, และ `index.ts`
- [x] **Task 3.4.5:** ลงทะเบียน messages ใน `src/i18n/index.ts`

### โมดูลที่ 5: `src/features/booking/`
- [x] **Task 3.5.1:** สร้าง `_internal/validations.ts` (Validate Reservation & Resource)
- [x] **Task 3.5.2:** สร้าง `_internal/services.ts` (Zero-overlap Booking Logic)
- [x] **Task 3.5.3:** สร้าง `_internal/validations.test.ts` (Unit Test ทดสอบการชนกันของเวลา)
- [x] **Task 3.5.4:** สร้าง `messages.ts`, `permissions.ts`, `actions.ts`, `server.ts`, และ `index.ts`
- [x] **Task 3.5.5:** ลงทะเบียน messages ใน `src/i18n/index.ts`

---

## 阶段 4: UI Presentation Layer (Admin & Public Portal)

### ส่วนหลังบ้าน (Admin Console)
- [x] **Task 4.1:** อัปเดตเมนูใน [`src/components/layout/sidebar-nav.ts`](src/components/layout/sidebar-nav.ts) ให้ครอบคลุมทั้ง 5 โมดูล และอัปเดต test ใน `sidebar-nav.test.ts` ให้ผ่าน
- [x] **Task 4.2:** สร้างหน้า `src/app/(admin)/admin/news/page.tsx` และ `news-client.tsx` (Liyon Design System)
- [x] **Task 4.3:** สร้างหน้า `src/app/(admin)/admin/personnel/page.tsx` และ `personnel-client.tsx` (Liyon Design System)
- [x] **Task 4.4:** สร้างหน้า `src/app/(admin)/admin/curriculum/page.tsx` และ `curriculum-client.tsx` (Liyon Design System)
- [x] **Task 4.5:** สร้างหน้า `src/app/(admin)/admin/documents/page.tsx` และ `src/app/(portal)/documents/page.tsx` (พร้อม Approval Stepper View และ Public Tracking)
- [x] **Task 4.6:** สร้างหน้า `src/app/(admin)/admin/bookings/page.tsx` และ `bookings-client.tsx` (พร้อม Dual Tabs, Live Conflict Warning, Approve/Reject/Cancel Dialogs)

### ส่วนหน้าบ้าน (Public Portal)
- [x] **Task 4.7:** สร้างหน้าแรกของคณะ `src/app/(portal)/page.tsx` และ `portal-home-client.tsx` (Hero Banner + สถิติรวม + ทางลัด 5 บริการหลัก + ข่าวล่าสุด + หลักสูตรแนะนำ)
- [x] **Task 4.8:** สร้างหน้าข่าวสารสาธารณะ `src/app/(portal)/news/page.tsx` และ `[slug]/page.tsx` (พร้อม Layout, Header, Filter, Attachments)
- [x] **Task 4.9:** สร้างหน้าทำเนียบบุคลากร `src/app/(portal)/personnel/page.tsx` (พร้อม Filter ภาควิชา, ค้นหา, Expertise Tags และ Bio Dialog)
- [x] **Task 4.10:** สร้างหน้ารายละเอียดหลักสูตร `src/app/(portal)/curriculum/page.tsx` (พร้อม Filter ระดับการศึกษา, ค้นหา, โครงสร้างรายวิชา และแผ่นพับ)
- [x] **Task 4.11:** สร้างหน้าปฏิทินการใช้ห้อง/รถ `src/app/(portal)/calendar/page.tsx` และ `booking-calendar-client.tsx` (พร้อม Timeline Schedule, Filter ตามประเภททรัพยากร และสเปกห้อง/รถ)

---

## 阶段 5: Quality Gate & Verification
- [x] **Task 5.1:** ตรวจสอบ Type Safety ทั่วทั้งระบบ (`npm run type-check && npm run type-check:tests`) 0 errors 100% ผ่าน
- [x] **Task 5.2:** ตรวจสอบ Dependency Rules ไม่ให้มีการละเมิด Modular Monolith (`npm run deps:check`) 0 violations 100% ผ่าน
- [x] **Task 5.3:** ตรวจสอบ Linter (`npm run lint`) 0 errors 100% ผ่าน
- [x] **Task 5.4:** รัน Unit Tests (32 test files, 154/154 passed) และ Integration Tests (9 test files, 57/57 passed) 100% ผ่านฉลุย
- [x] **Task 5.5:** Seed ข้อมูลตัวอย่างสำหรับทดสอบ (`npm run db:seed`) ครบถ้วนทั้ง 5 โมดูล
- [x] **Task 5.6:** รันการตรวจสอบแบบ Full Suite และทดสอบ Live Production Endpoints ครบทุก Route (Public HTTP 200, Protected HTTP 307)

