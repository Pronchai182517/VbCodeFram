import { NextResponse } from "next/server";
import { getTenantLogo, resolveBrandingTenantId } from "@/features/identity/server";

/**
 * เสิร์ฟโลโก้ขององค์กร — สาธารณะโดยตั้งใจ (หน้า portal และหน้า login ที่ยังไม่มีเซสชันก็ต้องเห็น)
 *
 * ไฟล์อยู่ในฐานข้อมูล ไม่ใช่บนดิสก์ จึงต้องผ่าน route นี้ · กัน cache ค้างด้วย query `?v=<เวลาที่แก้>`
 * ที่ layout ใส่มาให้ คู่กับ ETag ของเวลาเดียวกัน — เปลี่ยนโลโก้แล้วเบราว์เซอร์เห็นทันที
 */
export async function GET(request: Request): Promise<Response> {
  const tenantId = await resolveBrandingTenantId();
  const logo = tenantId ? await getTenantLogo(tenantId) : null;
  if (!logo) return new NextResponse(null, { status: 404 });

  const etag = `"logo-${logo.updatedAt.getTime()}"`;
  if (request.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: { ETag: etag } });

  return new NextResponse(new Uint8Array(logo.bytes), {
    headers: {
      "Content-Type": logo.mime,
      "Content-Length": String(logo.bytes.length),
      ETag: etag,
      // ไม่ cache ยาวเพราะ URL ไม่มี hash ของเนื้อไฟล์ — ให้ revalidate ด้วย ETag แทน
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
