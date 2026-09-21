import { AppShell } from "@/components/app-shell";
import { SettingsTabs } from "@/components/settings-tabs";
import { getSessionUser } from "@/lib/current-user";
import { googleConfigured, getGoogleStatus } from "@/lib/google";
import {
  getGoogleIntegrationSettingsAction,
  getOpenAiSettingsAction,
  getHubSpotStatusAction,
} from "@/app/actions/integrations";
import { IntegrationsClient } from "./integrations-client";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const user = await getSessionUser();
  const userId = (user as any)?.id;

  const [googleStatus, googleSettingsRes, openAiSettingsRes, hubspotStatusRes] =
    await Promise.all([
      userId ? getGoogleStatus(userId) : Promise.resolve({ connected: false as const }),
      getGoogleIntegrationSettingsAction(),
      getOpenAiSettingsAction(),
      getHubSpotStatusAction(),
    ]);

  const google = {
    configured: googleConfigured() || googleStatus.connected,
    connected: googleStatus.connected,
    email: (googleStatus as any).email || (user?.email ?? "ahmad.aziz@mytm.co"),
    settings: googleSettingsRes.settings,
  };

  const openai = {
    configured: openAiSettingsRes.settings.hasKey,
    settings: openAiSettingsRes.settings,
  };

  const hubspot = {
    configured: hubspotStatusRes.connected,
    maskedToken: hubspotStatusRes.maskedToken,
  };

  return (
    <AppShell title="Integrations" user={user}>
      <SettingsTabs />
      <div className="mb-4 max-w-3xl px-1">
        <h2 className="text-lg font-bold text-text tracking-tight flex items-center gap-2">
          <span>Enterprise Integrations &amp; Intelligence Control</span>
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Connect your Google Workspace (Gmail &amp; Calendar), configure OpenAI models and temperature, and sync multi-cloud CRM streams.
        </p>
      </div>
      <IntegrationsClient google={google} openai={openai} hubspot={hubspot} userEmail={user?.email} />
    </AppShell>
  );
}
