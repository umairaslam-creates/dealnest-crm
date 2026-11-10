import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { AgentConsoleClient } from "./agent-console-client";

export const dynamic = "force-dynamic";

export default async function AgentConsolePage() {
  const user = await getSessionUser();

  return (
    <AppShell title="Agent Console" user={user}>
      <AgentConsoleClient />
    </AppShell>
  );
}
