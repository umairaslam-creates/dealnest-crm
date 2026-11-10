import { db } from "@/db/client";
import { eq, asc, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { leads, pipelines, stages, tasks, activities, products, users, accounts } from "@/db/schema";
import { LeadDetailClient } from "./lead-detail-client";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromSection?: string }>;
}) {
  const { id } = await params;
  const { fromSection } = await searchParams;
  const user = await getSessionUser();

  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, id),
    with: {
      stage: true,
      owner: true,
      account: true,
      contact: true,
      pipeline: {
        with: {
          stages: {
            orderBy: (s, { asc }) => asc(s.order),
          },
        },
      },
      activities: {
        orderBy: (a, { desc }) => desc(a.occurredAt),
        with: { user: true },
      },
      tasks: {
        orderBy: (t, { asc }) => asc(t.dueDate),
      },
    },
  });

  if (!lead) {
    redirect(fromSection ? `/leads?section=${encodeURIComponent(fromSection)}` : "/leads");
  }

  // Fetch deal pipelines for conversion
  const dealPipelines = await db.query.pipelines.findMany({
    where: eq(pipelines.type, "DEAL"),
    with: {
      stages: {
        orderBy: (s, { asc }) => asc(s.order),
      },
    },
  });

  // Fetch products, team members, and accounts
  const [allProducts, allUsers, allAccounts] = await Promise.all([
    db.select().from(products),
    db.query.users.findMany({
      columns: { id: true, name: true, email: true },
      orderBy: (u, { asc }) => asc(u.name),
    }),
    db.query.accounts.findMany({
      columns: { id: true, name: true },
      orderBy: (a, { asc }) => asc(a.name),
    }),
  ]);

  return (
    <AppShell title={`Leads / ${lead.contactName}`} user={user}>
      <LeadDetailClient
        lead={lead}
        dealPipelines={dealPipelines}
        products={allProducts}
        members={allUsers}
        accounts={allAccounts}
        currentUser={user}
      />
    </AppShell>
  );
}

