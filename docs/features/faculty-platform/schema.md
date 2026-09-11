# Data Model, Validations & Localization
## พิมพ์เขียวฐานข้อมูล, Zod Schemas และพจนานุกรมสองภาษา (Faculty Web Platform)

เอกสารนี้รวบรวมโค้ด Prisma Schema, Zod Validation Schemas, และพจนานุกรมแปลภาษา เพื่อพร้อมนำไปวางในโค้ดจริง

---

## 1. Prisma Models (พร้อมนำไปต่อท้ายใน `prisma/schema.prisma`)

```prisma
// ==========================================
// 1. โมดูลข่าวสาร (News)
// ==========================================
enum ArticleCategory {
  GENERAL
  ACTIVITY
  ACADEMIC
  ANNOUNCEMENT
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Article {
  id            String          @id @default(uuid()) @db.Uuid
  tenantId      String          @map("tenant_id") @db.Uuid
  category      ArticleCategory @default(GENERAL)
  status        ArticleStatus   @default(DRAFT)
  titleTh       String          @map("title_th") @db.VarChar(255)
  titleEn       String          @map("title_en") @db.VarChar(255)
  slug          String          @db.VarChar(255)
  contentTh     String          @map("content_th") @db.Text
  contentEn     String          @map("content_en") @db.Text
  coverImageUrl String?         @map("cover_image_url") @db.VarChar(500)
  isPinned      Boolean         @default(false) @map("is_pinned")
  viewCount     Int             @default(0) @map("view_count")
  publishedAt   DateTime?       @map("published_at") @db.Timestamptz()
  authorId      String?         @map("author_id") @db.Uuid
  createdAt     DateTime        @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime        @updatedAt @map("updated_at") @db.Timestamptz()

  tenant        Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  author        User?               @relation(fields: [authorId], references: [id], onDelete: SetNull)
  attachments   ArticleAttachment[]

  @@unique([tenantId, slug])
  @@index([tenantId, status, publishedAt])
  @@map("articles")
}

model ArticleAttachment {
  id        String   @id @default(uuid()) @db.Uuid
  articleId String   @map("article_id") @db.Uuid
  fileName  String   @map("file_name") @db.VarChar(255)
  fileUrl   String   @map("file_url") @db.VarChar(500)
  fileSize  Int      @map("file_size")
  mimeType  String   @map("mime_type") @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()

  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@map("article_attachments")
}

// ==========================================
// 2. โมดูลบุคลากร (Personnel)
// ==========================================
model Department {
  id         String         @id @default(uuid()) @db.Uuid
  tenantId   String         @map("tenant_id") @db.Uuid
  nameTh     String         @map("name_th") @db.VarChar(150)
  nameEn     String         @map("name_en") @db.VarChar(150)
  code       String         @db.VarChar(50)
  orderIndex Int            @default(0) @map("order_index")
  createdAt  DateTime       @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt  DateTime       @updatedAt @map("updated_at") @db.Timestamptz()

  tenant     Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  staffs     StaffProfile[]

  @@unique([tenantId, code])
  @@map("departments")
}

model StaffProfile {
  id               String      @id @default(uuid()) @db.Uuid
  tenantId         String      @map("tenant_id") @db.Uuid
  userId           String?     @unique @map("user_id") @db.Uuid
  departmentId     String      @map("department_id") @db.Uuid
  prefixTh         String      @map("prefix_th") @db.VarChar(50)
  prefixEn         String      @map("prefix_en") @db.VarChar(50)
  firstNameTh      String      @map("first_name_th") @db.VarChar(100)
  lastNameTh       String      @map("last_name_th") @db.VarChar(100)
  firstNameEn      String      @map("first_name_en") @db.VarChar(100)
  lastNameEn       String      @map("last_name_en") @db.VarChar(100)
  academicPosition String?     @map("academic_position") @db.VarChar(100)
  adminPositionTh  String?     @map("admin_position_th") @db.VarChar(150)
  adminPositionEn  String?     @map("admin_position_en") @db.VarChar(150)
  email            String      @db.VarChar(255)
  phone            String?     @db.VarChar(50)
  roomNumber       String?     @map("room_number") @db.VarChar(50)
  avatarUrl        String?     @map("avatar_url") @db.VarChar(500)
  bioTh            String?     @map("bio_th") @db.Text
  bioEn            String?     @map("bio_en") @db.Text
  expertise        Json        @default("[]") @db.JsonB
  orderIndex       Int         @default(0) @map("order_index")
  isActive         Boolean     @default(true) @map("is_active")
  createdAt        DateTime    @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt        DateTime    @updatedAt @map("updated_at") @db.Timestamptz()

  tenant           Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user             User?       @relation(fields: [userId], references: [id], onDelete: SetNull)
  department       Department  @relation(fields: [departmentId], references: [id], onDelete: Restrict)

  @@index([tenantId, departmentId, orderIndex])
  @@map("staff_profiles")
}

// ==========================================
// 3. โมดูลหลักสูตร (Curriculum)
// ==========================================
enum DegreeLevel {
  BACHELOR
  MASTER
  DOCTORAL
}

model Program {
  id                String       @id @default(uuid()) @db.Uuid
  tenantId          String       @map("tenant_id") @db.Uuid
  code              String       @db.VarChar(50)
  degreeLevel       DegreeLevel  @map("degree_level")
  nameTh            String       @map("name_th") @db.VarChar(255)
  nameEn            String       @map("name_en") @db.VarChar(255)
  shortNameTh       String       @map("short_name_th") @db.VarChar(50)
  shortNameEn       String       @map("short_name_en") @db.VarChar(50)
  totalCredits      Int          @map("total_credits")
  yearIssued        Int          @map("year_issued")
  tuitionFeeTerm    Decimal?     @map("tuition_fee_term") @db.Decimal(10, 2)
  descriptionTh     String?      @map("description_th") @db.Text
  descriptionEn     String?      @map("description_en") @db.Text
  careerProspects   Json         @default("[]") @db.JsonB
  leafletPdfUrl     String?      @map("leaflet_pdf_url") @db.VarChar(500)
  isActive          Boolean      @default(true) @map("is_active")
  createdAt         DateTime     @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt         DateTime     @updatedAt @map("updated_at") @db.Timestamptz()

  tenant            Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  courses           Course[]

  @@unique([tenantId, code])
  @@map("programs")
}

model Course {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  programId     String   @map("program_id") @db.Uuid
  code          String   @db.VarChar(20)
  nameTh        String   @map("name_th") @db.VarChar(200)
  nameEn        String   @map("name_en") @db.VarChar(200)
  credits       String   @db.VarChar(20)
  categoryGroup String   @map("category_group") @db.VarChar(100)
  descriptionTh String?  @map("description_th") @db.Text
  descriptionEn String?  @map("description_en") @db.Text
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  program       Program  @relation(fields: [programId], references: [id], onDelete: Cascade)

  @@unique([tenantId, code])
  @@index([programId])
  @@map("courses")
}

// ==========================================
// 4. โมดูลอนุมัติเอกสาร (Document Flow)
// ==========================================
enum DocumentType {
  LEAVE
  EXPENSE_REIMBURSE
  OFFICIAL_LETTER
  PROJECT_PROPOSAL
}

enum DocumentStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum StepStatus {
  PENDING
  APPROVED
  REJECTED
}

model DocumentRequest {
  id                String          @id @default(uuid()) @db.Uuid
  tenantId          String          @map("tenant_id") @db.Uuid
  trackingNo        String          @map("tracking_no") @db.VarChar(64)
  docType           DocumentType    @map("doc_type")
  title             String          @db.VarChar(255)
  description       String?         @db.Text
  status            DocumentStatus  @default(DRAFT)
  currentStepIndex  Int             @default(1) @map("current_step_index")
  totalSteps        Int             @default(1) @map("total_steps")
  requesterId       String          @map("requester_id") @db.Uuid
  fileAttachmentUrl String?         @map("file_attachment_url") @db.VarChar(500)
  createdAt         DateTime        @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt         DateTime        @updatedAt @map("updated_at") @db.Timestamptz()

  tenant            Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  requester         User            @relation("RequesterUsers", fields: [requesterId], references: [id], onDelete: Restrict)
  routes            ApprovalRoute[]

  @@unique([tenantId, trackingNo])
  @@index([tenantId, status])
  @@index([tenantId, requesterId])
  @@map("document_requests")
}

model ApprovalRoute {
  id                String          @id @default(uuid()) @db.Uuid
  documentRequestId String          @map("document_request_id") @db.Uuid
  stepIndex         Int             @map("step_index")
  title             String          @db.VarChar(100)
  approverId        String          @map("approver_id") @db.Uuid
  status            StepStatus      @default(PENDING)
  comment           String?         @db.Text
  actionAt          DateTime?       @map("action_at") @db.Timestamptz()
  createdAt         DateTime        @default(now()) @map("created_at") @db.Timestamptz()

  request           DocumentRequest @relation(fields: [documentRequestId], references: [id], onDelete: Cascade)
  approver          User            @relation(fields: [approverId], references: [id], onDelete: Restrict)

  @@unique([documentRequestId, stepIndex])
  @@map("approval_routes")
}

// ==========================================
// 5. โมดูลจองทรัพยากร (Booking)
// ==========================================
enum ResourceType {
  ROOM
  VEHICLE
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  REJECTED
  CANCELLED
}

model Resource {
  id           String       @id @default(uuid()) @db.Uuid
  tenantId     String       @map("tenant_id") @db.Uuid
  type         ResourceType
  nameTh       String       @map("name_th") @db.VarChar(150)
  nameEn       String       @map("name_en") @db.VarChar(150)
  code         String       @db.VarChar(50)
  capacity     Int
  locationTh   String       @map("location_th") @db.VarChar(200)
  locationEn   String       @map("location_en") @db.VarChar(200)
  imageUrl     String?      @map("image_url") @db.VarChar(500)
  facilities   Json         @default("[]") @db.JsonB
  driverName   String?      @map("driver_name") @db.VarChar(100)
  isActive     Boolean      @default(true) @map("is_active")
  createdAt    DateTime     @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt    DateTime     @updatedAt @map("updated_at") @db.Timestamptz()

  tenant       Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  reservations Reservation[]

  @@unique([tenantId, code])
  @@index([tenantId, type, isActive])
  @@map("resources")
}

model Reservation {
  id            String            @id @default(uuid()) @db.Uuid
  tenantId      String            @map("tenant_id") @db.Uuid
  resourceId    String            @map("resource_id") @db.Uuid
  userId        String            @map("user_id") @db.Uuid
  purpose       String            @db.VarChar(255)
  attendeeCount Int               @map("attendee_count")
  startTime     DateTime          @map("start_time") @db.Timestamptz()
  endTime       DateTime          @map("end_time") @db.Timestamptz()
  status        ReservationStatus @default(PENDING)
  approverId    String?           @map("approver_id") @db.Uuid
  rejectReason  String?           @map("reject_reason") @db.VarChar(500)
  createdAt     DateTime          @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime          @updatedAt @map("updated_at") @db.Timestamptz()

  tenant        Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  resource      Resource          @relation(fields: [resourceId], references: [id], onDelete: Restrict)
  user          User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  approver      User?             @relation("ReservationApprover", fields: [approverId], references: [id], onDelete: SetNull)

  @@index([tenantId, resourceId, startTime, endTime])
  @@index([tenantId, userId])
  @@map("reservations")
}
```

---

## 2. ตัวอย่าง Zod Validation Schemas (Input DTOs)

### ตัวอย่าง: การสร้างคำขออนุมัติเอกสาร (`document-flow/_internal/validations.ts`)
```typescript
import { z } from "zod";

export const createDocumentRequestSchema = z.object({
  docType: z.enum(["LEAVE", "EXPENSE_REIMBURSE", "OFFICIAL_LETTER", "PROJECT_PROPOSAL"]),
  title: z.string().min(3, "ระบุชื่อเรื่องอย่างน้อย 3 ตัวอักษร").max(255),
  description: z.string().optional(),
  fileAttachmentUrl: z.string().url().optional().or(z.literal("")),
  routeApproverIds: z.array(z.string().uuid()).min(1, "ต้องระบุผู้อนุมัติอย่างน้อย 1 ท่าน"),
});

export const reviewDocumentActionSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().max(500).optional(),
});
```

### ตัวอย่าง: การจองทรัพยากร (`booking/_internal/validations.ts`)
```typescript
import { z } from "zod";

export const createReservationSchema = z.object({
  resourceId: z.string().uuid("ระบุรหัสห้องหรือยานพาหนะ"),
  purpose: z.string().min(5, "ระบุวัตถุประสงค์อย่างน้อย 5 ตัวอักษร").max(255),
  attendeeCount: z.coerce.number().min(1, "จำนวนผู้เข้าร่วมอย่างน้อย 1 คน"),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
}).refine((data) => data.endTime > data.startTime, {
  message: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น",
  path: ["endTime"],
});
```

---

## 3. พจนานุกรมข้อความสองภาษา (Localization Dictionary Sample)

ตัวอย่างรายการคีย์ที่จะต้องนำไปใส่ใน `messages.ts` ของแต่ละโมดูล:

```typescript
// src/features/document-flow/messages.ts
export const messages = {
  "docs.title": { th: "ระบบบริหารและอนุมัติเอกสาร", en: "Document Workflow System" },
  "docs.create": { th: "ยื่นคำร้องใหม่", en: "New Request" },
  "docs.trackingNo": { th: "เลขติดตามเอกสาร", en: "Tracking No." },
  "docs.status.draft": { th: "ร่าง", en: "Draft" },
  "docs.status.pending": { th: "รออนุมัติ", en: "Pending" },
  "docs.status.approved": { th: "อนุมัติแล้ว", en: "Approved" },
  "docs.status.rejected": { th: "ตีกลับ", en: "Rejected" },
  "docs.action.approve": { th: "อนุมัติคำขอ", en: "Approve" },
  "docs.action.reject": { th: "ตีกลับคำขอ", en: "Reject" },
} as const;

// src/features/booking/messages.ts
export const messages = {
  "booking.title": { th: "ระบบจองห้องประชุมและยานพาหนะ", en: "Resource Booking" },
  "booking.room": { th: "ห้องประชุม", en: "Meeting Room" },
  "booking.vehicle": { th: "ยานพาหนะ", en: "Vehicle" },
  "booking.attendees": { th: "จำนวนผู้เข้าร่วม", en: "Attendees" },
  "booking.startTime": { th: "เวลาเริ่มต้น", en: "Start Time" },
  "booking.endTime": { th: "เวลาสิ้นสุด", en: "End Time" },
  "booking.conflict": { th: "ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาใหม่", en: "Time slot already booked" },
} as const;
```
