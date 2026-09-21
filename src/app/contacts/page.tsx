import { db } from "@/db/client";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { ContactsClient } from "./contacts-client";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const user = await getSessionUser();
  const [contacts, accounts, deals, tasks, members] = await Promise.all([
    db.query.contacts.findMany({
      with: {
        account: {
          with: {
            deals: {
              with: { stage: true },
            },
          },
        },
        activities: {
          orderBy: (a, { desc }) => desc(a.occurredAt),
        },
      },
      orderBy: (c, { desc }) => desc(c.createdAt),
    }),
    db.query.accounts.findMany({
      columns: { id: true, name: true, region: true, industry: true },
      orderBy: (a, { asc }) => asc(a.name),
    }),
    db.query.deals.findMany({
      columns: { id: true, title: true, value: true, currency: true, status: true, accountId: true },
    }),
    db.query.tasks.findMany({
      with: { deal: true, owner: true },
      orderBy: (t, { asc }) => asc(t.dueDate),
    }),
    db.query.users.findMany({
      columns: { id: true, name: true },
      orderBy: (u, { asc }) => asc(u.name),
    }),
  ]);

  return (
    <AppShell title="Stakeholders & Contacts" user={user}>
      <ContactsClient
        contacts={contacts}
        accounts={accounts}
        deals={deals}
        tasks={tasks}
        members={members}
      />
    </AppShell>
  );
}
