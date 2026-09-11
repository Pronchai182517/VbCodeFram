# syntax=docker/dockerfile:1
# VibeCore Framework — multi-stage image
#   base     : Node 22 + openssl (Prisma query engine ต้องใช้)
#   deps     : ติดตั้ง node_modules + prisma generate
#   builder  : next build (output: standalone)
#   runner   : image สำหรับ production — เล็ก ไม่มี source/devDependencies
#   migrator : image สำหรับรัน prisma migrate deploy + seed (ใช้ครั้งเดียวตอนสตาร์ต)
#   dev      : image สำหรับ dev server (hot reload คู่กับ bind mount)

########################  base  ########################
FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

########################  deps  ########################
FROM base AS deps
COPY package.json package-lock.json .npmrc ./
COPY prisma.config.ts ./
COPY prisma ./prisma
# prisma.config.ts บังคับให้มี DATABASE_URL ตั้งแต่ตอนโหลด config — ใส่ค่าหลอกให้ `prisma generate`
# (ขั้นนี้ generate โค้ดอย่างเดียว ไม่ต่อฐานข้อมูล) ค่าจริงถูกส่งเข้าตอนรันคอนเทนเนอร์
# postinstall จะรัน `prisma generate` ออกมาที่ src/generated/prisma
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build npm ci

########################  builder  ########################
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/generated ./src/generated
COPY . .
# ค่าหลอกสำหรับตอน build เท่านั้น — Next ต้อง prerender บางหน้าที่เรียก env() ตอน build
# ไม่มีการต่อฐานข้อมูลจริงในขั้นนี้ และค่าเหล่านี้ไม่ถูกฝังลง image ปลายทาง (stage runner)
ENV NODE_ENV=production \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    AUTH_SECRET=build-time-placeholder-not-used-at-runtime \
    APP_URL=http://localhost:3010
RUN npm run build

########################  runner (production)  ########################
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3010 \
    HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma client + query engine ที่ generate ไว้ (กัน file-tracing ของ Next พลาดไฟล์ engine)
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
USER nextjs
EXPOSE 3010
CMD ["node", "server.js"]

########################  migrator  ########################
FROM base AS migrator
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/generated ./src/generated
COPY . .
COPY docker/migrate.sh /usr/local/bin/migrate.sh
RUN chmod +x /usr/local/bin/migrate.sh
CMD ["/usr/local/bin/migrate.sh"]

########################  dev  ########################
FROM base AS dev
ENV NODE_ENV=development \
    PORT=3010
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/generated ./src/generated
COPY . .
EXPOSE 3010
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
