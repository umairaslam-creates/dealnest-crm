import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { AgentSectionsClient } from "./sections-client";

export const dynamic = "force-dynamic";

export default async function AgentSectionsPage() {
  const user = await getSessionUser();

  return (
    <AppShell title="Agent Sections" user={user}>
      <AgentSectionsClient />
    </AppShell>
  );
}
