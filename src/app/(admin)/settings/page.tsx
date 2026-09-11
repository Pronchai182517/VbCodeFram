import { requirePermission, P, getTenantSettings, resolveBrandingLogo } from "@/features/identity/server";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const ctx = await requirePermission(P.settingsManage);
  const [settings, logo] = await Promise.all([getTenantSettings(ctx.tenantId), resolveBrandingLogo()]);
  return <SettingsForm initial={settings} logoUrl={logo.hasLogo ? logo.url : null} />;
}
