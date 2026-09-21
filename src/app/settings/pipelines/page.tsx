import { db } from "@/db/client";
import { AppShell } from "@/components/app-shell";
import { SettingsTabs } from "@/components/settings-tabs";
import { getSessionUser } from "@/lib/current-user";
import { PipelineSettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function PipelineSettingsPage() {
  const user = await getSessionUser();
  const pipelines = await db.query.pipelines.findMany({
    with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
    orderBy: (p, { asc }) => asc(p.type),
  });

  return (
    <AppShell title="Pipelines & Stages" user={user}>
      <SettingsTabs />
      <p className="mb-3 max-w-xl px-1 text-[13px] text-text-muted">
        Every stage below can be renamed, added, or removed here, or straight from a column
        header on the Leads or Pipeline board. Changes apply immediately and are saved to
        the database.
      </p>
      <PipelineSettingsClient pipelines={pipelines} />
    </AppShell>
  );
}
