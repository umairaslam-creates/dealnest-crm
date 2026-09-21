import { db } from "@/db/client";
import { eq, or, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { contacts, accounts, deals, tasks, activities, products, users } from "@/db/schema";
import { ContactDetailClient } from "./contact-detail-client";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();

  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.id, id),
    with: {
      account: true,
      activities: {
        orderBy: (a, { desc }) => desc(a.occurredAt),
        with: { user: true },
      },
    },
  });

  if (!contact) {
    notFound();
  }

  // Fetch deals associated with this contact's account
  const accountDeals = contact.accountId
    ? await db.query.deals.findMany({
        where: eq(deals.accountId, contact.accountId),
        with: {
          stage: true,
          owner: true,
        },
      })
    : [];

  const dealIds = accountDeals.map((d) => d.id);

  // Fetch tasks associated with deals of this account
  const relatedTasks =
    dealIds.length > 0
      ? await db.query.tasks.findMany({
          where: inArray(tasks.dealId, dealIds),
          orderBy: (t, { asc }) => asc(t.dueDate),
        })
      : [];

  // Fetch products and team members
  const [allProducts, allUsers] = await Promise.all([
    db.select().from(products),
    db.query.users.findMany({
      columns: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <AppShell title={`Contacts / ${contact.name}`} user={user}>
      <ContactDetailClient
        contact={contact}
        account={contact.account}
        deals={accountDeals}
        tasks={relatedTasks}
        activities={contact.activities || []}
        products={allProducts}
        members={allUsers}
        currentUser={user}
      />
    </AppShell>
  );
}

