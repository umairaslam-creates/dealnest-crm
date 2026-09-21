import { db } from "@/db/client";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { getTargetsWithProgressAction } from "@/app/actions/targets";
import { ReportsClient } from "./reports-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getSessionUser();

  const [deals, leads, activities, meetingsList, products, members, pipelines, targetsRes] =
    await Promise.all([
      db.query.deals.findMany({
        with: {
          stage: true,
          owner: true,
          product: true,
          account: {
            with: { contacts: true },
          },
          pipeline: true,
        },
        orderBy: (d, { desc }) => desc(d.createdAt),
      }),
      db.query.leads.findMany({
        with: {
          stage: true,
          owner: true,
        },
        orderBy: (l, { desc }) => desc(l.createdAt),
      }),
      db.query.activities.findMany({
        with: {
          user: true,
          contact: {
            with: { account: true },
          },
          lead: true,
          deal: {
            with: { product: true, account: true },
          },
        },
        orderBy: (a, { desc }) => desc(a.occurredAt),
      }),
      db.query.meetings.findMany({
        with: {
          contact: {
            with: { account: true },
          },
          deal: {
            with: { product: true, account: true },
          },
          user: true,
        },
        orderBy: (m, { desc }) => desc(m.startTime),
      }),
      db.query.products.findMany({
        orderBy: (p, { asc }) => asc(p.name),
      }),
      db.query.users.findMany({
        columns: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: (u, { asc }) => asc(u.name),
      }),
      db.query.pipelines.findMany({
        with: {
          stages: {
            orderBy: (s, { asc }) => asc(s.order),
          },
        },
      }),
      getTargetsWithProgressAction(),
    ]);

  return (
    <AppShell title="Reports & Analytics" user={user}>
      <ReportsClient
        deals={deals}
        leads={leads}
        activities={activities}
        meetings={meetingsList}
        products={products}
        members={members}
        pipelines={pipelines}
        targets={targetsRes.targets}
      />
    </AppShell>
  );
}
