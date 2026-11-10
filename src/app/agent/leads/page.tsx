import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { AgentConsoleClient } from "../agent-console-client";

export const dynamic = "force-dynamic";

export default async function AgentLeadSearchPage() {
  const user = await getSessionUser();

  return (
    <AppShell title="Agent Lead Search" user={user}>
      <div className="space-y-4">
        <div className="card border border-border p-5">
          <h2 className="text-base font-bold text-text">Agent Lead Search</h2>
          <p className="mt-1 text-xs text-text-muted">
            Compact lead lookup with IDs, sections, stages, and contact fields.
          </p>
        </div>
        <AgentConsoleClient compact />
      </div>
    </AppShell>
  );
}
