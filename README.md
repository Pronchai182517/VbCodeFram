# VibeCore Framework — Enterprise Full-stack Starter Kit สำหรับ Vibe Coding

โปรเจกต์เว็บแอปพลิเคชันระดับองค์กรสร้างด้วย **Next.js 16 + Prisma/PostgreSQL + Tailwind 4** รองรับสองภาษา (ไทย/อังกฤษ) บนดีไซน์ระบบ **Liyon**

พร้อมใช้งานระบบพื้นฐาน (Identity & Access Management, Authentication, RBAC, i18n, Theme System) และมีโมดูลตัวอย่าง (`features/sample`) พร้อมให้นักเรียนนำไปใช้เป็น **Framework / Starter Kit** ในการเขียนโค้ดร่วมกับ AI (Vibe Coding) เพื่อสร้างฟีเจอร์ใหม่ ๆ ได้อย่างรวดเร็วและได้มาตรฐานสากล

---

## ⚡️ เริ่มต้นใช้งานแบบขั้นตอนเดียว (Quick Start)

1. **เลือก Node 22 และติดตั้ง dependencies:**
   ```bash
   nvm use
   npm install
   ```

2. **สั่งตั้งค่าอัตโนมัติ (สร้าง .env + migrate + seed):**
   ```bash
   npm run setup
   ```

3. **เริ่ม Dev Server:**
   ```bash
   npm run dev
   ```
   เปิดเบราว์เซอร์ไปที่: **http://localhost:3010**
   - บัญชี Admin ตั้งต้น: `admin@app.local`
   - รหัสผ่าน: `Passw0rd!vibe`

> [!TIP]
> ดูตัวอย่างประโยคคำสั่ง Prompt สำเร็จรูปสำหรับสั่ง AI เขียนฟีเจอร์ใหม่ได้ที่ [PROMPTS.md](file:///Users/jira/Documents/ViebCode/U-AI-MS/PROMPTS.md)

---

## 🐳 รันด้วย Docker (ไม่ต้องลง Node บนเครื่อง)

แอปรันเป็นคอนเทนเนอร์ และใช้ **ฐานข้อมูล PostgreSQL กลาง** ของโปรเจกต์
โปรเจกต์ `postgresal` (สแตก PostgreSQL 17 + pgAdmin) (คอนเทนเนอร์ `postgres-db`)
โดยมีฐานข้อมูล `vibe_framework` และบัญชีของตัวเองแยกจากโปรเจกต์อื่นบนเซิร์ฟเวอร์เดียวกัน

ครั้งแรก — ติดตั้งฐานข้อมูล (สร้าง role + database + migrate + seed + ชั้นความปลอดภัย) แล้วสตาร์ตแอป:

```bash
cd <โฟลเดอร์ของ postgresal> && docker compose up -d   # ให้ฐานข้อมูลกลางรันอยู่
cd -                                                                   # กลับมาที่โปรเจกต์นี้
cp .env.docker.example .env.docker      # (ถ้ายังไม่มี) รหัสผ่านฐานข้อมูลถูกสุ่มให้อัตโนมัติ
./db/setup.sh
docker compose --env-file .env.docker up -d --build
```

เปิดเบราว์เซอร์ที่ **http://localhost:3010** — บัญชีตั้งต้น `admin@app.local` / `Passw0rd!vibe`

| service | หน้าที่ |
| --- | --- |
| `migrate` | งานครั้งเดียวก่อนแอปขึ้น: รอฐานข้อมูล → `prisma migrate deploy` → (seed ถ้าเปิด) → ตรวจว่าบัญชีแอปต่อได้ |
| `app` | Next.js production server (standalone build) ที่พอร์ต `3010` |

คำสั่งที่ใช้บ่อย (ทุกคำสั่งต้องมี `--env-file .env.docker`):

```bash
docker compose --env-file .env.docker logs -f app        # ดู log ของแอป
docker compose --env-file .env.docker ps                 # สถานะ/health
docker compose --env-file .env.docker restart app        # รีสตาร์ตแอป
docker compose --env-file .env.docker down               # หยุดแอป (ฐานข้อมูลกลางยังรันอยู่)
./db/verify-security.sh                                  # ตรวจชั้นความปลอดภัยของฐานข้อมูล
./db/backup.sh                                           # สำรองฐานข้อมูลทันที
```

> [!TIP]
> รายละเอียดฐานข้อมูล บัญชีทั้ง 3 ระดับ ชุดข้อมูลตั้งต้น และระบบความปลอดภัย 7 ชั้น อ่านที่ [docs/DATABASE.md](docs/DATABASE.md)

### ฐานข้อมูลของตัวเอง (ไม่พึ่ง postgresal)

ถ้าย้ายโปรเจกต์ไปเครื่องที่ไม่มีสแตก postgresal ใช้ override นี้เพื่อสร้าง Postgres ของตัวเองในโปรเจกต์:

```bash
docker compose -f docker-compose.yml -f docker-compose.localdb.yml --env-file .env.docker up -d --build
```

### โหมดพัฒนา (hot reload) ใน Docker

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.docker up --build
```

โหมดนี้รัน `next dev` และ mount โค้ดจากเครื่องเข้าไป แก้ไฟล์แล้วเห็นผลทันทีโดยไม่ต้อง build image ใหม่
(ยังต่อฐานข้อมูลกลางตัวเดียวกับโหมด production — ระวังว่าข้อมูลที่แก้ตอน dev คือข้อมูลชุดเดียวกัน)

### ตั้งค่า env

ค่าทั้งหมดอยู่ในไฟล์ `.env.docker` (สิทธิ์ 600 · ไม่ commit) — ทุกคำสั่ง compose ต้องส่งไฟล์นี้เข้าไปด้วย
`--env-file .env.docker` เพราะรหัสผ่านฐานข้อมูลไม่มีค่าเริ่มต้นให้เดา

```bash
cp .env.docker.example .env.docker   # ถ้ายังไม่มี
./db/setup.sh                        # สุ่มรหัสผ่าน role ฐานข้อมูลเติมให้เอง แล้วติดตั้งฐานข้อมูล
docker compose --env-file .env.docker up -d --build
```

ค่าที่แก้บ่อย: `APP_PORT`, `APP_URL`, `SEED_ON_START` / `SEED_PROFILE`, SMTP และ OAuth

> [!IMPORTANT]
> ก่อนขึ้น production: เปลี่ยน `AUTH_SECRET` (`openssl rand -base64 32`), ตั้ง `APP_URL` เป็นโดเมนจริง,
> ให้ `SEED_ON_START=false` แล้วสร้างผู้ดูแลระบบด้วย `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` แทน
> และหมุนรหัสผ่านของ role ฐานข้อมูลด้วย `./db/setup.sh` (ลบค่าเดิมออกจาก `.env.docker` ก่อน)

### รันอัตโนมัติเมื่อเครื่องรีบูท (systemd)

เครื่องที่ติดตั้งไว้แล้วใช้ systemd user unit ชื่อ `vibe-framework.service` (ต้นฉบับเก็บไว้ที่ `docker/vibe-framework.service`)
ตอนบูตมันจะรอ Docker daemon พร้อม แล้วสั่ง `docker compose --env-file .env.docker up -d` ให้เอง

```bash
systemctl --user status vibe-framework     # ดูสถานะ
systemctl --user restart vibe-framework    # สตาร์ตใหม่ทั้งสแตก
systemctl --user stop vibe-framework       # หยุด (ไม่ลบข้อมูล)
systemctl --user disable vibe-framework    # เลิกรันอัตโนมัติตอนบูต
journalctl --user -u vibe-framework -n 50  # ดู log ของ unit
```

ติดตั้งบนเครื่องใหม่:

```bash
cp docker/vibe-framework.service ~/.config/systemd/user/    # แก้ WorkingDirectory ให้ตรงเครื่อง
loginctl enable-linger $USER      # ให้ user service ทำงานแม้ยังไม่ได้ล็อกอิน (ต้องทำครั้งเดียว)
systemctl --user daemon-reload && systemctl --user enable --now vibe-framework
```

> [!NOTE]
> คอนเทนเนอร์ตั้ง `restart: unless-stopped` ไว้ด้วย ดังนั้นถึงไม่ใช้ systemd unit Docker ก็สตาร์ตคอนเทนเนอร์คืนให้ตอนบูตอยู่แล้ว
> unit นี้เพิ่มความแน่นอนอีกชั้น (สั่ง `compose up` ให้ครบทุก service รวมถึงรัน migrate ใหม่ถ้ามี migration ค้าง)

นอกจากนี้ยังมี timer สำรองฐานข้อมูลอัตโนมัติทุกวันตอน 02:30:

```bash
systemctl --user list-timers vibe-framework-backup.timer    # รอบถัดไป
journalctl --user -u vibe-framework-backup -n 20            # ผลการสำรองล่าสุด
```

### พอร์ตที่ใช้บนเครื่องนี้

| พอร์ต | บริการ |
| --- | --- |
| `3010` | เว็บแอปของโปรเจกต์นี้ (`app`) |
| `5433` | PostgreSQL กลาง — เป็นของสแตก postgresal (แอปไม่ได้ใช้พอร์ตนี้ เพราะคุยผ่าน docker network) |
| `5050` | pgAdmin — ของสแตก postgresal |

ถ้าพอร์ตชนกับบริการอื่นบนเครื่อง ให้แก้ `APP_PORT` ในไฟล์ `.env.docker` แล้วสั่ง
`systemctl --user restart vibe-framework` (หรือ `docker compose --env-file .env.docker up -d`)

### ไฟล์ที่เกี่ยวข้อง

- `Dockerfile` — multi-stage: `deps` → `builder` → `runner` (production), `migrate` (migrate/seed), `dev` (hot reload)
- `docker-compose.yml` — สแตกหลัก (migrate + app) ที่ต่อกับฐานข้อมูลกลาง
- `docker-compose.dev.yml` — override สำหรับโหมดพัฒนา
- `docker-compose.localdb.yml` — override สำหรับใช้ฐานข้อมูลของตัวเอง
- `docker/migrate.sh` — สคริปต์รอฐานข้อมูล + migrate + seed ที่ service `migrate` เรียก
- `db/` — สคริปต์และ SQL ของฐานข้อมูลกับระบบความปลอดภัย (ดู [docs/DATABASE.md](docs/DATABASE.md))
- `.env.docker.example` — ตัวอย่างค่า env สำหรับ Docker (ของจริงคือ `.env.docker` ซึ่งไม่ commit)
- `docker/vibe-framework.service` — systemd user unit สำหรับรันอัตโนมัติตอนบูต
- `docker/vibe-framework-backup.{service,timer}` — สำรองฐานข้อมูลอัตโนมัติทุกวัน 02:30

---

## ฟีเจอร์ที่มีพร้อมใช้งานใน Framework

- 🔐 **ระบบ Authentication & Security:**
  - Login ด้วย Email/Password, Forgot Password, Reset Password ด้วย Single-use Token (SHA-256)
  - บังคับเปลี่ยนรหัสผ่านในครั้งแรก (`mustChangePassword`), ระบบยืนยันอีเมล
  - ป้องกัน Brute-force Login (`LoginThrottle`), ระบบเพิกถอนเซสชันอัตโนมัติเมื่อถูกระงับสิทธิ์
  - บันทึกประวัติการใช้งานลง `audit_logs`
- 👥 **ระบบจัดการผู้ใช้และบทบาท (Users & RBAC):**
  - หน้าจัดการผู้ใช้ (`/users`): สร้าง, แก้ไข, ระงับการใช้งาน, รีเซ็ตรหัสผ่าน
  - หน้าจัดการบทบาทและสิทธิ์ (`/users/roles`): สร้างบทบาท, กำหนดชุดสิทธิ์ (Permissions), รองรับขอบเขตสิทธิ์ (Scopes)
  - หน้าโปรไฟล์ผู้ใช้ (`/me`) และเปลี่ยนรหัสผ่าน (`/change-password`)
- 📦 **โมดูลตัวอย่าง (Sample CRUD Feature - `/sample`):**
  - หน้าจัดการข้อมูลตัวอย่าง มีตารางค้นหา, Dialog สร้าง/แก้ไข, การลบข้อมูล และการแสดงสถานะ Badge
  - เขียนตามสถาปัตยกรรม Modular Monolith ครบวงจร ให้นักเรียนดูเป็นต้นแบบ
- 🌐 **ระบบสองภาษา (i18n):**
  - สลับภาษา TH/EN ผ่าน Cookie ทันที ปุ่มสลับภาษาบน Navbar
  - จัดรูปแบบวันที่ พ.ศ./ค.ศ. อัตโนมัติ, ข้อความ UI และ Zod Validation แปลสองภาษาครบถ้วน
- 🎨 **Liyon Design System:**
  - Layout สไตล์ Admin Dashboard (Navbar, Sidebar, Breadcrumb) และ Auth Layout
  - เลือกลวดลายสีระบบ (Color Palette) ได้ 5 โทนในหน้า Settings

---

## คำสั่งสำคัญในโปรเจกต์

- `npm run dev` — รันแอปในโหมดพัฒนาที่พอร์ต 3010
- `npm run check` — ตรวจสอบ type-check (ทั้งแอปและเทสต์) + lint + ตรวจ dependency cruiser + unit/integration tests
  > [!NOTE]
  > การรัน integration test จะมีการ TRUNCATE ตารางเพื่อทดสอบ ดังนั้นหลังรันเสร็จ ให้สั่ง `npm run db:seed` ใหม่ก่อนใช้งานต่อ
- `npm run test` — รันเฉพาะ Unit tests ด้วย Vitest
- `npm run test:integration` — รัน Integration tests
- `npm run test:e2e` — รัน End-to-End tests ด้วย Playwright
- `npm run db:seed` — สร้างผู้ใช้ตัวอย่าง 5 บัญชีและบทบาทตั้งต้น
- `npm run db:seed:deep` — ชุดข้อมูลตั้งต้นแบบละเอียด (2 องค์กร · 22 ผู้ใช้ · 12 บทบาท · 43 ข้อมูลตัวอย่าง · 122 ร่องรอยการใช้งาน)
- `npm run sync:liyon` — ดึงไฟล์สไตล์ล่าสุดจาก Liyon Theme

---

## โครงสร้างสถาปัตยกรรม (Modular Monolith)

โปรเจกต์จัดโครงสร้างแบบแบ่งตามโดเมนธุรกิจ (Feature-driven):

```
src/
├── app/                      # Next.js App Router (เฉพาะ Routing & Layout)
│   ├── (admin)/              # หน้าหลังบ้านที่มี Sidebar/Navbar
│   ├── (auth)/               # หน้าล็อกอินและกู้คืนรหัสผ่าน
│   └── api/                  # API Route Handlers (เช่น NextAuth)
├── features/                 # โดเมนธุรกิจหลัก
│   ├── identity/             # ระบบผู้ใช้ บทบาท และสิทธิ์ (ตัวอย่าง Feature ที่สมบูรณ์)
│   │   ├── index.ts          # Public types & Client-safe helper
│   │   ├── server.ts         # Public server functions สำหรับ Feature อื่นเรียกใช้
│   │   ├── actions.ts        # Server Actions ที่ UI เรียกใช้
│   │   ├── messages.ts       # พจนานุกรมข้อความสองภาษา (TH/EN)
│   │   ├── permissions.ts    # ทะเบียนสิทธิ์ของ Feature นี้
│   │   └── _internal/        # โค้ดภายใน (ห้าม Feature อื่น import ตรง ๆ)
│   └── <your-feature>/       # โฟลเดอร์ฟีเจอร์ใหม่ที่นักเรียนสร้าง
├── shared/                   # โค้ด ส่วนประกอบ และ Utility ที่ใช้ร่วมกันทั้งหมด
│   ├── components/liyon/     # UI Components ของระบบดีไซน์ Liyon
│   └── lib/                  # ฟังก์ชันช่วยเหลือ เช่น i18n, formatting, date
├── i18n/                     # จุดรวมพจนานุกรมสองภาษาของทุก Feature
└── permissions.ts            # จุดรวม Permission Registry ทั้งหมดของระบบ
```

---

## คู่มือสำหรับนักเรียน: การสร้าง Feature ใหม่ด้วย Vibe Coding

เมื่อต้องการสร้างฟีเจอร์ใหม่ ให้แจ้ง AI Assistant (Claude Code, Cursor, Antigravity) โดยทำตามขั้นตอนสถาปัตยกรรมดังนี้:

### ขั้นตอนที่ 1: เพิ่ม Data Model ใน Prisma
1. เปิดไฟล์ `prisma/schema.prisma` และเพิ่ม Model ใหม่
2. **กติกา:** ทุกตารางธุรกิจต้องมีฟิลด์ `tenantId String @map("tenant_id") @db.Uuid`
3. รันคำสั่ง migration:
   ```bash
   npm run db:migrate:dev -- --name add_<feature_name>
   ```

### ขั้นตอนที่ 2: สร้าง Feature โฟลเดอร์ `src/features/<name>/`
สร้างไฟล์มาตรฐานของ Feature:
- `index.ts`: export เฉพาะ types และ helper ปลอดภัยสำหรับ Client
- `server.ts`: export ฟังก์ชันสำหรับ Server Components
- `actions.ts`: export Server Actions (รับ input ด้วย Zod และครอบด้วย `runAction`)
- `permissions.ts`: ประกาศสิทธิ์ที่เกี่ยวข้อง เช่น `<feature>:read`, `<feature>:create`
- `messages.ts`: ประกาศข้อความแปลสองภาษา `{ key: { th: "...", en: "..." } }`
- โฟลเดอร์ `_internal/`: วาง Business Logic และ Services

### ขั้นตอนที่ 3: เชื่อมต่อระบบกลาง
1. **ลงทะเบียนสิทธิ์:** นำสิทธิ์จาก `src/features/<name>/permissions.ts` ไปรวมใน `src/permissions.ts`
2. **ลงทะเบียนข้อความสองภาษา:** นำ `messages` ไปรวมใน `src/i18n/index.ts`
3. **ตรวจสอบความถูกต้อง:** รัน `npm test src/i18n/index.test.ts` เพื่อเช็กว่าคีย์ภาษาครบทั้ง TH/EN

### ขั้นตอนที่ 4: สร้างหน้า UI ใน `src/app/(admin)/<name>/`
1. วาง Page ใน `src/app/(admin)/<name>/page.tsx`
2. แสดงข้อความผ่าน `t("key")` เสมอ ห้าม hardcode ข้อความตรงๆ
3. ใช้งาน UI Components จาก `@/shared/components/liyon`
4. เรียกใช้ Server Actions ผ่าน hooks หรือ form action

### ขั้นตอนที่ 5: ตรวจสอบความถูกต้อง
รันคำสั่งตรวจสอบมาตรฐาน:
```bash
npm run check
```
หากผ่านทุกข้อ แสดงว่าฟีเจอร์ใหม่ปฏิบัติตามมาตรฐานสถาปัตยกรรมอย่างสมบูรณ์แบบ!
