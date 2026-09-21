import { db } from "@/db/client";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { LeadsClient } from "./leads-client";
import { pipelines, stages, leads, users, accounts } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const user = await getSessionUser();

  const [leadPipelines, allLeads, dealPipelines, allUsers, allAccounts] = await Promise.all([
    db.query.pipelines.findMany({
      where: eq(pipelines.type, "LEAD"),
      with: {
        stages: {
          orderBy: (s, { asc }) => asc(s.order),
        },
      },
      orderBy: (p, { asc }) => asc(p.name),
    }),
    db.query.leads.findMany({
      orderBy: (l, { desc }) => desc(l.createdAt),
      with: {
        pipeline: true,
        stage: true,
        owner: true,
        account: true,
        contact: true,
        stageHistory: {
          with: { toStage: true },
          orderBy: (sh, { asc }) => asc(sh.changedAt),
        },
        activities: {
          orderBy: (a, { desc }) => desc(a.occurredAt),
          with: { user: true },
        },
        tasks: {
          orderBy: (t, { asc }) => asc(t.dueDate),
        },
      },
    }),
    db.query.pipelines.findMany({
      where: eq(pipelines.type, "DEAL"),
      with: {
        stages: {
          orderBy: (s, { asc }) => asc(s.order),
        },
      },
    }),
    db.query.users.findMany({
      columns: { id: true, name: true },
      orderBy: (u, { asc }) => asc(u.name),
    }),
    db.query.accounts.findMany({
      columns: { id: true, name: true },
      orderBy: (a, { asc }) => asc(a.name),
    }),
  ]);

  let pipelinesList = leadPipelines;
  if (pipelinesList.length === 0) {
    const [created] = await db.insert(pipelines).values({
      name: "Main Inbound",
      type: "LEAD",
      isDefault: true,
    }).returning();
    await db.insert(stages).values([
      { pipelineId: created.id, name: "New", order: 0, color: "#3b82f6" },
      { pipelineId: created.id, name: "Contacted", order: 1, color: "#f59e0b" },
      { pipelineId: created.id, name: "Qualified", order: 2, color: "#10b981" },
    ]);
    pipelinesList = await db.query.pipelines.findMany({
      where: eq(pipelines.type, "LEAD"),
      with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
      orderBy: (p, { asc }) => asc(p.name),
    });
  }

  return (
    <AppShell title="Lead Management" user={user}>
      <LeadsClient
        pipelines={pipelinesList}
        leads={allLeads}
        dealPipelines={dealPipelines}
        members={allUsers}
        accounts={allAccounts}
      />
    </AppShell>
  );
}
