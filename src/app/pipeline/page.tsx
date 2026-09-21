import { db } from "@/db/client";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { PipelineClient } from "./pipeline-client";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const user = await getSessionUser();
  const pipelines = await db.query.pipelines.findMany({
    where: (p, { eq }) => eq(p.type, "DEAL"),
    with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
  });

  const deals = await db.query.deals.findMany({
    with: {
      account: {
        with: { contacts: true },
      },
      product: true,
      owner: true,
      stageHistory: {
        with: { toStage: true },
        orderBy: (sh, { asc }) => asc(sh.changedAt),
      },
    },
  });

  const accounts = await db.query.accounts.findMany({
    columns: { id: true, name: true },
    orderBy: (a, { asc }) => asc(a.name),
  });
  const members = await db.query.users.findMany({
    columns: { id: true, name: true },
    orderBy: (u, { asc }) => asc(u.name),
  });

  return (
    <AppShell title="Pipeline" user={user}>
      <PipelineClient pipelines={pipelines} deals={deals} accounts={accounts} members={members} />
    </AppShell>
  );
}
