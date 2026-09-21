import { db } from "@/db/client";
import { AppShell } from "@/components/app-shell";
import { SettingsTabs } from "@/components/settings-tabs";
import { getSessionUser } from "@/lib/current-user";
import { TeamClient } from "./team-client";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getSessionUser();
  const team = await db.query.users.findMany({
    columns: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: (u, { asc }) => asc(u.createdAt),
  });

  return (
    <AppShell title="Team" user={user}>
      <SettingsTabs />
      <p className="mb-3 max-w-xl px-1 text-[13px] text-text-muted">
        Add anyone who needs access. They sign in with the email and password you set here,
        this is real authentication, backed by the database, not a mock.
      </p>
      <TeamClient team={team} />
    </AppShell>
  );
}
