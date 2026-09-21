import { db } from "@/db/client";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { TasksClient } from "./tasks-client";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await getSessionUser();

  const [allTasks, allDeals, allLeads, allMembers] = await Promise.all([
    db.query.tasks.findMany({
      orderBy: (t, { asc }) => asc(t.dueDate),
      with: {
        deal: { with: { account: true } },
        lead: true,
        owner: true,
      },
    }),
    db.query.deals.findMany({
      columns: { id: true, title: true },
      orderBy: (d, { asc }) => asc(d.title),
    }),
    db.query.leads.findMany({
      columns: { id: true, contactName: true, company: true },
      orderBy: (l, { asc }) => asc(l.contactName),
    }),
    db.query.users.findMany({
      columns: { id: true, name: true },
      orderBy: (u, { asc }) => asc(u.name),
    }),
  ]);

  return (
    <AppShell title="Tasks & Follow-ups" user={user}>
      <TasksClient
        initialTasks={allTasks}
        deals={allDeals}
        leads={allLeads}
        members={allMembers}
      />
    </AppShell>
  );
}

