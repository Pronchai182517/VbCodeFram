import { requirePermission, P, getTenantSettings, resolveBrandingLogo, getBrandText } from "@/features/identity/server";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const ctx = await requirePermission(P.settingsManage);
  const [settings, logo, brand] = await Promise.all([
    getTenantSettings(ctx.tenantId),
    resolveBrandingLogo(),
    getBrandText(ctx.tenantId),
  ]);
  // key บังคับให้ฟอร์ม mount ใหม่เมื่อข้อมูลฝั่งเซิร์ฟเวอร์เปลี่ยน (เช่น หลังบันทึกจากกล่องแก้ข้อความ)
  // ไม่งั้น state ที่ค้างอยู่ในฟอร์มจะยังโชว์ชื่อเดิมจนกว่าจะรีโหลดหน้า
  const key = `${brand.nameTh}|${brand.nameEn}|${brand.taglineTh}|${brand.taglineEn}|${logo.url}`;
  return <SettingsForm key={key} initial={settings} logoUrl={logo.hasLogo ? logo.url : null} brand={brand} />;
}
