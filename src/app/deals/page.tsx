import { db } from "@/db/client";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { DealsTable } from "./deals-table";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const user = await getSessionUser();

  const [deals, pipelines, accounts, members] = await Promise.all([
    db.query.deals.findMany({
      with: { account: true, owner: true, stage: true },
      orderBy: (d, { desc }) => desc(d.value),
    }),
    db.query.pipelines.findMany({
      where: (p, { eq }) => eq(p.type, "DEAL"),
      with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
    }),
    db.query.accounts.findMany({
      columns: { id: true, name: true },
      orderBy: (a, { asc }) => asc(a.name),
    }),
    db.query.users.findMany({
      columns: { id: true, name: true },
      orderBy: (u, { asc }) => asc(u.name),
    }),
  ]);

  return (
    <AppShell title="Deals Registry" user={user}>
      <DealsTable
        deals={deals}
        pipelines={pipelines}
        accounts={accounts}
        members={members}
      />
    </AppShell>
  );
}
