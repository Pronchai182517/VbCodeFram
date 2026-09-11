# AI Coding Instructions & Architectural Rules
## ข้อกำหนดและกฎเหล็กในการเขียนโค้ดสำหรับ Faculty Web Platform

ไฟล์นี้ทำหน้าที่เป็น **System Instruction เฉพาะทางสำหรับ AI Coding Assistants (Antigravity, Claude Code, Cursor)** เพื่อควบคุมคุณภาพโค้ดให้อยู่ในมาตรฐานระดับสูงสุดตามที่ระบุไว้ใน [`AGENTS.md`](AGENTS.md)

---

## 1. กฎเหล็กด้านสถาปัตยกรรม (Architecture Guardrails)

1. **Modular Monolith Boundaries:**
   - โค้ดของแต่ละฟีเจอร์ต้องอยู่ภายใต้ `src/features/<feature-name>/` เท่านั้น
   - **Public API:** สิ่งที่อนุญาตให้ภายนอกเรียกใช้ มีเพียง 3 ไฟล์:
     - `index.ts` (Client-safe types, constants, UI helpers)
     - `server.ts` (Data fetchers & Read-only queries สำหรับ Server Components)
     - `actions.ts` (Mutations ผ่าน Server Actions)
   - **Encapsulation:** โค้ดที่อยู่ภายใต้ `_internal/` (เช่น `services.ts`, `validations.ts`) **ห้ามโมดูลอื่นเรียกใช้ตรงๆ โดยเด็ดขาด** (มี `dependency-cruiser` คอยตรวจจับ)
   - ทิศทางการ Import ต้องเป็นไปในทิศทางเดียว:
     $$\text{App Router} \longrightarrow \text{Features} \longrightarrow \text{Shared}$$
     ห้าม import ย้อนกลับ หรือ import จาก `shared` ไปหา `features`

2. **Multi-Tenancy Isolation:**
   - ทุกคำสั่ง Query ใน `services.ts` ต้องส่ง `tenantId` เข้าไปด้วยเสมอ:
     ```ts
     await prisma.article.findMany({ where: { tenantId } });
     ```
   - ใน Server Actions ต้องดึง `tenantId` จาก Context ที่ได้จากการตรวจสอบสิทธิ์ (`ctx.tenantId`) **ห้ามรับ `tenantId` จากฝั่ง Client เด็ดขาด**

3. **Server Actions & Result Pattern:**
   - ทุก Server Action ต้องครอบด้วย `runAction(...)` จาก `@/shared/lib/result` เพื่อส่งกลับประเภทข้อมูลมาตรฐาน `ActionResult<T>`:
     ```ts
     export async function createArticleAction(input: unknown): Promise<ActionResult<ArticleDto>> {
       return runAction(async () => {
         const ctx = await requirePermission(NEWS_P.manage);
         const parsed = createArticleSchema.parse(input, { error: zodErrorMap(await getLocale()) });
         const result = await createArticle(ctx.tenantId, parsed, ctx.userId);
         revalidatePath("/admin/news");
         return result;
       });
     }
     ```
   - **ข้อควรระวังเรื่อง Zod v4:** ตัวเลือก Error Map ต้องส่งเป็น `{ error: zodErrorMap(locale) }` (ไม่ใช่ `errorMap`)

---

## 2. กฎเกณฑ์ด้านการแสดงผลและ UI (Liyon Design System)

1. **ใช้ Shared Components เท่านั้น:**
   - ใช้ UI Components จาก `@/shared/components/liyon` (เช่น `Button`, `Input`, `Dialog`, `DataTable`, `StatusPill`, `Card`, `AdminShell`)
   - ห้ามลง Component เพิ่มจากภายนอกหากมีใน Liyon อยู่แล้ว
   - ห้ามแก้ไขไฟล์ใน `src/shared/styles/liyon/` โดยตรงเนื่องจากเป็นธีมที่เชื่อมโยงกับระบบกลาง

2. **การจัดวาง Route (Routing Structure):**
   - ส่วนหลังบ้าน (Admin): ต้องวางใน `src/app/(admin)/<feature>/page.tsx` เพื่อให้ได้ Layout ของผู้ดูแลระบบ (Sidebar/Navbar/Breadcrumb) อัตโนมัติ
   - ส่วนหน้าบ้าน (Public Portal): ต้องวางใน `src/app/(portal)/<feature>/page.tsx` (หรือ Root Route สาธารณะ)

---

## 3. กฎเกณฑ์ด้านภาษาและการจัดรูปแบบ (i18n & Localization)

1. **ห้าม Hardcode ข้อความในหน้าจอ:**
   - ข้อความทุกข้อความ (Label, Button, Error, Placeholder) ต้องเรียกผ่าน `t("key")` เสมอ
   - ประกาศคีย์ข้อความคู่ 2 ภาษา (`th` และ `en`) ไว้ใน `src/features/<feature>/messages.ts`
   - นำ `messages` ไป Register ใน [`src/i18n/index.ts`](src/i18n/index.ts)
2. **การจัดรูปแบบวันที่ (Date Formatting):**
   - ใช้วันที่ผ่านฟังก์ชัน `formatDate(date, locale)` จาก `@/shared/lib/format` เพื่อให้แสดงผลเป็นปี พ.ศ. ในภาษาไทย และ ค.ศ. ในภาษาอังกฤษ

---

## 4. ประตูตรวจสอบคุณภาพก่อนส่งมอบงาน (Verification Gates)

เมื่อ AI เขียนหรือแก้ไขโค้ดเสร็จสิ้น **ต้องรันคำสั่งตรวจสอบเหล่านี้ใน Terminal เสมอ:**
1. ตรวจสอบชนิดข้อมูล: `npm run type-check`
2. ตรวจสอบการละเมิดเส้นแบ่งสถาปัตยกรรม: `npm run deps:check`
3. ตรวจสอบ Lint: `npm run lint`
4. รันชุดทดสอบ Unit Tests: `npm run test`
5. รันชุดตรวจสอบคุณภาพแบบสมบูรณ์: `npm run check`

> **หมายเหตุสำคัญ:** ห้ามปิดงานหากยังมี Error ในการรัน `npm run check`
