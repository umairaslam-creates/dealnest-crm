import { AppShell } from "@/components/app-shell";
import { SettingsTabs } from "@/components/settings-tabs";
import { getSessionUser } from "@/lib/current-user";
import { ThemeSettingsClient } from "./theme-client";

export const dynamic = "force-dynamic";

export default async function ThemeSettingsPage() {
  const user = await getSessionUser();

  return (
    <AppShell title="Theme & Branding" user={user}>
      <SettingsTabs />
      <ThemeSettingsClient />
    </AppShell>
  );
}

