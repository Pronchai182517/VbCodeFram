# ฐานข้อมูลและระบบความปลอดภัยของข้อมูล

VibeCore ใช้ฐานข้อมูล PostgreSQL 17 ที่รันอยู่ในโปรเจกต์กลาง
โปรเจกต์ `postgresal` (สแตก PostgreSQL 17 + pgAdmin) (คอนเทนเนอร์ `postgres-db`)
โดยแยก **ฐานข้อมูลของตัวเอง + บัญชีของตัวเอง** ออกจากฐาน `app_db` ของโปรเจกต์อื่นบนเซิร์ฟเวอร์เดียวกัน

---

## 1. ภาพรวมการเชื่อมต่อ

```
┌─ vibe-framework (docker compose) ─────────────┐   docker network
│  app      → role vibe_app    (DML + RLS)      │   postgresal_postgres_net
│  migrate  → role vibe_owner  (DDL + seed)     │──────────────┐
└───────────────────────────────────────────────┘              │
                                                               ▼
┌─ postgresal (docker compose) ─────────────────────────────────────────┐
│  postgres-db : PostgreSQL 17   ┌ app_db          (โปรเจกต์อื่น)        │
│                                └ vibe_framework  (โปรเจกต์นี้)         │
│  pgadmin-web : http://localhost:5050                                  │
└───────────────────────────────────────────────────────────────────────┘
```

- แอปคุยกับฐานข้อมูลผ่าน **docker network ภายใน** (`postgres-db:5432`) ไม่ผ่านพอร์ต 5433 ที่ publish ออก host
- ค่าเชื่อมต่อทั้งหมดอยู่ในไฟล์ `.env.docker` (สิทธิ์ 600 · อยู่ใน `.gitignore`)

| ตัวแปร | ค่า |
| --- | --- |
| `DB_HOST` / `DB_PORT` | `postgres-db` / `5432` |
| `DB_NAME` | `vibe_framework` |
| `DB_APP_USER` | `vibe_app` — บัญชีที่แอปใช้ตอนรัน |
| `DB_OWNER_USER` | `vibe_owner` — บัญชีที่ใช้ตอน migrate/seed เท่านั้น |
| รหัสผ่าน | สุ่มโดย `db/setup.sh` เก็บใน `.env.docker` |

เชื่อมต่อจาก pgAdmin (http://localhost:5050) ได้โดยเลือก server `PostgreSQL (Local Docker)` แล้วเปิดฐาน `vibe_framework`
(ใช้บัญชี `postgres`) หรือสร้าง connection ใหม่ด้วย `vibe_readonly` ถ้าต้องการดูแบบปิดบังข้อมูลส่วนบุคคล

---

## 2. บัญชีฐานข้อมูล 3 ระดับ (least privilege)

| role | ใช้ทำอะไร | ทำอะไรได้ | ทำอะไรไม่ได้ |
| --- | --- | --- | --- |
| `vibe_owner` | migrate / seed / backup | สร้าง-แก้ตาราง, อ่านเขียนทุกตาราง, ข้าม RLS (ในฐานะเจ้าของตาราง) | ไม่ใช่ superuser · สร้าง role/ฐานข้อมูลใหม่ไม่ได้ |
| `vibe_app` | แอป Next.js ตอนรันจริง | SELECT/INSERT/UPDATE/DELETE เฉพาะตารางธุรกิจ **และเฉพาะแถวขององค์กรตัวเอง** | DDL ทุกชนิด, ลบ/แก้ `audit_logs`, แก้ `permissions`, อ่าน `_prisma_migrations`, อ่าน log ระดับฐานข้อมูล, ต่อฐาน `app_db` |
| `vibe_readonly` | รายงาน / ตรวจสอบ / BI | SELECT เฉพาะ view ใน schema `report` ที่ปิดบังข้อมูลแล้ว | อ่านตารางจริงใน `public` ไม่ได้เลย · เขียนอะไรไม่ได้ (read-only transaction) |

ทุก role ตั้ง `NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS` และมี
`statement_timeout` / `idle_in_transaction_session_timeout` / `CONNECTION LIMIT` ของตัวเอง

---

## 3. โครงสร้าง schema

| schema | เนื้อหา | ใครเข้าถึงได้ |
| --- | --- | --- |
| `public` | ตารางธุรกิจ 11 ตารางที่ Prisma migrate สร้าง | `vibe_owner`, `vibe_app` (ตามสิทธิ์รายตาราง) |
| `app` | `app.current_tenant_id()` — ฟังก์ชันอ่านองค์กรปัจจุบันของ session | ทุก role (execute) |
| `security` | `security.data_changes` + trigger + ฟังก์ชันนโยบายเก็บ log | เจ้าของเท่านั้น (แอปอ่านไม่ได้) |
| `report` | view ปิดบังข้อมูลสำหรับรายงาน | `vibe_readonly` |

`REVOKE ALL ON SCHEMA public FROM PUBLIC` แล้ว จึงไม่มีบัญชีไหน "เข้าถึงได้โดยปริยาย" อีก
และทุก role ถูกกำหนด `search_path` ตายตัวเพื่อกัน search_path hijacking

---

## 4. ข้อมูลตั้งต้น (`prisma/seed-deep.ts`)

ครอบคลุมทุกองค์ประกอบหลักของ framework — รันซ้ำได้ (upsert + id คงที่)

| ตาราง | จำนวน | รายละเอียด |
| --- | --- | --- |
| `tenants` | 2 | `DEMO` (องค์กรหลักของแอป) และ `ACME` (ไว้พิสูจน์ว่า RLS กันข้ามองค์กรได้จริง) |
| `permissions` | 7 | จากทะเบียนในโค้ด `src/permissions.ts` |
| `roles` | 12 | ตั้งต้น 4 (`SUPER_ADMIN` `ADMIN` `STAFF` `VIEWER`) + เพิ่มเติม 4 (`AUDITOR` `SAMPLE_EDITOR` `HELPDESK` `BRAND_MANAGER`) ต่อองค์กร |
| `role_permissions` | 22 | ชุดสิทธิ์ของแต่ละบทบาท |
| `users` | 22 | ครบทุกสถานะ (ดูตารางถัดไป) |
| `user_tenants` | 22 | สมาชิกภาพองค์กร มีทั้งที่ยังอยู่และที่ออกไปแล้ว |
| `user_roles` | 24 | ผูกบทบาทพร้อม **ขอบเขตสิทธิ์** ครบทั้ง 3 แบบ: `ALL`, `CAMPUS`, `ORG_UNIT` |
| `auth_tokens` | 5 | โทเคนยืนยันอีเมล/รีเซ็ตรหัสผ่าน — ยังใช้ได้ / ใช้ไปแล้ว / หมดอายุ (เก็บเฉพาะ SHA-256) |
| `login_throttles` | 4 | ตัวนับล็อกอินผิด ล็อกอยู่ 2 รายการ (ทั้งแบบ key อีเมลและ key IP) |
| `sample_items` | 43 | ข้อมูลโมดูลตัวอย่าง 40 ของ DEMO (มีทั้ง ACTIVE/INACTIVE) + 3 ของ ACME |
| `audit_logs` | 122 | ร่องรอยย้อนหลัง 60 วัน 14 ชนิดการกระทำ พร้อม before/after และ IP |

สถานะผู้ใช้ที่ seed ไว้ (รหัสผ่านทุกบัญชี: `Passw0rd!vibe`)

| บัญชี | สถานะที่ใช้ทดสอบ |
| --- | --- |
| `admin@app.local` | ผู้ดูแลสูงสุด (SUPER_ADMIN) |
| `somchai@app.local`, `kanya@app.local` | ผู้ดูแลระบบ · `kanya` ถือ 2 บทบาท |
| `prasit@` `malee@` | ขอบเขตสิทธิ์ระดับ `CAMPUS` |
| `nattapong@` `siriporn@` | ขอบเขตสิทธิ์ระดับ `ORG_UNIT` |
| `forced@app.local` | บังคับเปลี่ยนรหัสผ่านครั้งแรก |
| `lockme@app.local` | ถูกล็อกจากการเดารหัสผ่าน |
| `suspended@app.local` | บัญชีถูกระงับ (`is_active = false`) |
| `unverified@app.local` | ยังไม่ยืนยันอีเมล |
| `dormant@app.local` | ไม่ได้ใช้งาน 200 วัน |
| `google.user@` `ms.user@` | ล็อกอินผ่าน OAuth (ไม่มีรหัสผ่านในระบบ) |
| `leaver@app.local` | ออกจากองค์กรแล้ว (สมาชิกภาพปิด) |
| `admin@acme.local` `staff@acme.local` | อยู่คนละองค์กร — แอปต้องมองไม่เห็น |

---

## 5. ระบบความปลอดภัยของข้อมูล 7 ชั้น

### 5.1 แยกฐานข้อมูลและบัญชีออกจากโปรเจกต์อื่น
ฐาน `vibe_framework` ให้ `CONNECT` เฉพาะ 3 role ของโปรเจกต์นี้ และปิดสิทธิ์ `CONNECT` ที่ Postgres แจกให้
`PUBLIC` บนฐาน `app_db` / `postgres` ทิ้ง — บัญชีของโปรเจกต์หนึ่งจึงเปิดฐานของอีกโปรเจกต์ไม่ได้
(`db/sql/06-shared-server-hardening.sql` · ย้อนกลับด้วย `GRANT CONNECT ON DATABASE app_db TO PUBLIC`)

### 5.2 สิทธิ์เท่าที่จำเป็น (least privilege)
บัญชีที่แอปถืออยู่ทำ DDL ไม่ได้เลย ลบ/แก้ร่องรอยการใช้งานไม่ได้ และแก้ทะเบียนสิทธิ์ไม่ได้
ต่อให้ผู้โจมตีได้ `DATABASE_URL` ของแอปไป ก็ยัง `DROP TABLE` หรือลบ log ไม่ได้ (`db/sql/02-privileges.sql`)

### 5.3 Row Level Security — กั้นข้อมูลข้ามองค์กรที่ชั้นฐานข้อมูล
เปิด RLS บน 7 ตาราง: `tenants` `user_tenants` `roles` `user_roles` `role_permissions` `audit_logs` `sample_items`

```sql
CREATE POLICY tenant_isolation ON sample_items FOR ALL TO vibe_app
  USING      (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());
```

องค์กรปัจจุบันมาจากตัวแปร session `app.tenant_id` ซึ่งผูกไว้กับ role `vibe_app`
(`ALTER ROLE vibe_app IN DATABASE vibe_framework SET app.tenant_id = '<uuid ขององค์กร DEMO>'`)

- **ไม่มีค่า → เห็นศูนย์แถว** (fail closed) ไม่ใช่เห็นทั้งหมด
- อ่านข้ามองค์กรไม่ได้ และ `INSERT`/`UPDATE` ใส่ `tenant_id` ขององค์กรอื่นก็ถูกปฏิเสธด้วย `WITH CHECK`
- แอปกรอง `tenantId` จาก session ในโค้ดอยู่แล้ว — ชั้นนี้คือตาข่ายรับเวลาโค้ดพลาด

> **ถ้าจะให้แอปเดียวรองรับหลายองค์กรจริง ๆ** ต้องเลิกผูกค่าไว้กับ role แล้วให้แอปสั่ง
> `SET LOCAL app.tenant_id = '<uuid>'` ต้นทุก transaction แทน (ทำใน Prisma ผ่าน `$transaction` + `$executeRaw`)
> ตอนนี้ deployment นี้ตั้งใจให้บริการองค์กร `DEMO` องค์กรเดียว ผู้ใช้ขององค์กรอื่นจึงใช้งานแอปไม่ได้

### 5.4 ร่องรอยการใช้งานลบไม่ได้ (append-only audit)
`audit_logs` และ `security.data_changes` มี trigger ปฏิเสธ `UPDATE`/`DELETE` ทุกกรณี — **แม้แต่ superuser**
ลบได้ทางเดียวคือผ่าน `security.purge_logs(retain_days)` ซึ่งบังคับให้เก็บอย่างน้อย 30 วัน

```sql
SELECT security.purge_logs(365);   -- ลบเฉพาะที่เกิน 1 ปี
```

### 5.5 บันทึกการเปลี่ยนแปลงระดับฐานข้อมูล
trigger บนตาราง `users` `user_tenants` `user_roles` `roles` `role_permissions` `tenants` `permissions`
เขียนลง `security.data_changes` ทุกครั้งที่มีการเปลี่ยนแปลง — เห็นแม้แก้ผ่าน `psql` ตรง ๆ
(คนละชั้นกับ `audit_logs` ที่แอปเขียนเอง ซึ่งเชื่อได้เท่าที่โค้ดแอปถูกต้อง)

บันทึกเก็บ `db_user`, `client_addr`, คอลัมน์ที่เปลี่ยน และค่าก่อน/หลังที่ **ปิดบังแล้ว**:
`password_hash` และ `token_hash` ถูกแทนด้วย `[redacted]` ส่วนอีเมลถูกปิดบังเป็น `v***r@app.local`

### 5.6 ปิดบังข้อมูลส่วนบุคคลสำหรับงานรายงาน
`vibe_readonly` เห็นเฉพาะ view ใน schema `report`:

| view | ใช้ดูอะไร |
| --- | --- |
| `report.users_masked` | ผู้ใช้ + องค์กร + บทบาท (อีเมลปิดบัง ไม่มีคอลัมน์รหัสผ่าน) |
| `report.role_matrix` | บทบาท ↔ สิทธิ์ ↔ จำนวนสมาชิก |
| `report.audit_trail` | ร่องรอยการใช้งาน (ผู้กระทำปิดบัง, IP ตัด octet สุดท้าย) |
| `report.data_changes` | การเปลี่ยนแปลงระดับฐานข้อมูล (เฉพาะ metadata) |
| `report.tenant_overview` | ภาพรวมแต่ละองค์กร |
| `report.security_posture` | บัญชีถูกระงับ/ยังไม่ยืนยัน/ไม่ได้ใช้งาน/ถูกล็อก/โทเคนค้าง |

### 5.7 สำรองข้อมูลอัตโนมัติ
`db/backup.sh` ดัมป์แบบ custom format แล้ว **ตรวจสารบัญไฟล์ก่อนนับว่าสำเร็จ** (กันไฟล์เสียเงียบ ๆ)
เก็บที่ `~/backups/vibe-framework/` สิทธิ์ 600 ลบไฟล์เก่ากว่า 14 วันอัตโนมัติ
ตั้งเวลาไว้ทุกวัน 02:30 ด้วย systemd user timer `vibe-framework-backup.timer` (`Persistent=true` — ถ้าเครื่องปิดจะรันย้อนหลังให้)

```bash
systemctl --user list-timers vibe-framework-backup.timer   # ดูรอบถัดไป
./db/backup.sh                                             # สำรองทันที
# คืนค่า
docker exec -i postgres-db pg_restore -h 127.0.0.1 -U vibe_owner -d vibe_framework --clean --if-exists < ~/backups/vibe-framework/<ไฟล์>.dump
```

---

## 6. คำสั่งที่ใช้บ่อย

```bash
./db/setup.sh                    # ติดตั้งครบ: role → database → migrate → seed → ชั้นความปลอดภัย
./db/setup.sh --security-only    # ลงชั้นความปลอดภัยใหม่ (ใช้หลังเพิ่ม migration)
./db/setup.sh --no-seed          # ติดตั้งโดยไม่ seed ข้อมูลตัวอย่าง
./db/verify-security.sh          # ตรวจว่าชั้นความปลอดภัยยังทำงานครบ (23 การทดสอบ)
./db/backup.sh                   # สำรองข้อมูลทันที

# เปิด psql ในฐานะบัญชีต่าง ๆ
docker exec -it postgres-db psql -U postgres -d vibe_framework          # superuser
docker exec -it -e PGPASSWORD=... postgres-db psql -h 127.0.0.1 -U vibe_app -d vibe_framework
```

### เมื่อเพิ่ม feature/ตารางใหม่
1. แก้ `prisma/schema.prisma` แล้วสร้าง migration ตามปกติ
2. `docker compose --env-file .env.docker run --rm migrate` (migrate ด้วย role เจ้าของ)
3. `./db/setup.sh --security-only` — ตารางใหม่ได้สิทธิ์ DML อัตโนมัติจาก `ALTER DEFAULT PRIVILEGES` แล้ว
   แต่ถ้าตารางใหม่มีคอลัมน์ `tenant_id` ให้เพิ่มชื่อตารางลงในลิสต์ของ `db/sql/03-rls.sql` ก่อน เพื่อให้ถูก RLS คุมด้วย
4. `./db/verify-security.sh`

---

## 7. ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
| --- | --- |
| `db/setup.sh` | ติดตั้ง/อัปเดตฐานข้อมูลทั้งหมดในคำสั่งเดียว |
| `db/verify-security.sh` | ชุดทดสอบว่าชั้นความปลอดภัยทำงานจริง |
| `db/backup.sh` | สำรองข้อมูล + ตรวจไฟล์ + ลบไฟล์เก่า |
| `db/sql/00-roles-and-database.sql` | สร้าง role 3 ระดับ + ฐานข้อมูล + ขีดจำกัด session |
| `db/sql/01-schemas.sql` | schema `public` `app` `security` `report` + ปิดสิทธิ์ PUBLIC |
| `db/sql/02-privileges.sql` | สิทธิ์รายตารางของ `vibe_app` |
| `db/sql/03-rls.sql` | policy กั้นข้อมูลข้ามองค์กร |
| `db/sql/04-integrity.sql` | append-only log + trigger บันทึกการเปลี่ยนแปลง + นโยบายเก็บข้อมูล |
| `db/sql/05-report-views.sql` | view ปิดบังข้อมูลสำหรับ `vibe_readonly` |
| `db/sql/06-shared-server-hardening.sql` | ปิด CONNECT ข้ามฐานบนเซิร์ฟเวอร์ร่วม |
| `prisma/seed-deep.ts` | ชุดข้อมูลตั้งต้นแบบละเอียด |
