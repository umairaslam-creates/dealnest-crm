import { db } from "@/db/client";
import { getSessionUser } from "@/lib/current-user";
import { getTargetsWithProgressAction } from "@/app/actions/targets";
import { AppShell } from "@/components/app-shell";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const [deals, leads, tasks, meetings, pipelines, members, products, targetsRes] = await Promise.all([
    db.query.deals.findMany({
      with: { account: true, stage: true, owner: true, pipeline: true, product: true },
      orderBy: (d, { desc }) => desc(d.createdAt),
    }),
    db.query.leads.findMany({
      with: { owner: true, pipeline: true, stage: true },
      orderBy: (l, { desc }) => desc(l.createdAt),
    }),
    db.query.tasks.findMany({
      with: { deal: true, owner: true },
      orderBy: (t, { asc }) => asc(t.dueDate),
    }),
    db.query.meetings.findMany({
      with: {
        contact: { with: { account: true } },
        deal: true,
        user: true,
      },
      orderBy: (m, { asc }) => asc(m.startTime),
    }),
    db.query.pipelines.findMany({
      with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
      orderBy: (p, { asc }) => asc(p.name),
    }),
    db.query.users.findMany({
      columns: { id: true, name: true, email: true },
      orderBy: (u, { asc }) => asc(u.name),
    }),
    db.query.products.findMany({
      columns: { id: true, name: true, sku: true },
      orderBy: (p, { asc }) => asc(p.name),
    }),
    getTargetsWithProgressAction(),
  ]);

  return (
    <AppShell user={user}>
      <DashboardClient
        deals={deals}
        leads={leads}
        tasks={tasks}
        meetings={meetings}
        pipelines={pipelines}
        members={members}
        products={products}
        targets={targetsRes.targets}
      />
    </AppShell>
  );
}
