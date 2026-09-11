-- โลโก้ที่อัปโหลดเอง: เก็บไบต์ + ชนิดไฟล์ + เวลาที่แก้ล่าสุด (ใช้ทำ ETag/cache busting)
ALTER TABLE "tenants" ADD COLUMN "logo_data" BYTEA,
                      ADD COLUMN "logo_mime" VARCHAR(30),
                      ADD COLUMN "logo_updated_at" TIMESTAMPTZ;
