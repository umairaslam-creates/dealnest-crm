import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { getGoogleStatus } from "@/lib/google";
import { deals } from "@/db/schema";
import { DealDetailClient } from "./deal-detail-client";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();

  const [deal, suggestions, pipelines, accounts, members] = await Promise.all([
    db.query.deals.findFirst({
      where: eq(deals.id, id),
      with: {
        account: {
          with: { contacts: true },
        },
        owner: true,
        stage: { with: { pipeline: { with: { stages: true } } } },
        activities: { orderBy: (a, { desc }) => desc(a.occurredAt), with: { user: true } },
        tasks: { orderBy: (t, { asc }) => asc(t.dueDate) },
      },
    }),
    db.query.aiSuggestions.findMany({
      where: (s, { eq }) => eq(s.dealId, id),
      orderBy: (s, { desc }) => desc(s.createdAt),
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

  if (!deal) notFound();

  const userId = (user as any)?.id;
  const googleStatus = userId ? await getGoogleStatus(userId) : { connected: false as const };

  return (
    <AppShell title={deal.title} user={user}>
      <DealDetailClient
        deal={deal}
        suggestions={suggestions}
        googleConnected={googleStatus.connected}
        pipelines={pipelines}
        accounts={accounts}
        members={members}
      />
    </AppShell>
  );
}
