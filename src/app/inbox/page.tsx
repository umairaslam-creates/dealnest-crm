import { db } from "@/db/client";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { contacts, deals, users } from "@/db/schema";
import { desc, asc } from "drizzle-orm";
import { getGoogleStatus } from "@/lib/google";
import { InboxClient } from "./inbox-client";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const user = await getSessionUser();
  const userId = (user as any)?.id;

  const [allContacts, allDeals, googleStatus] = await Promise.all([
    db.query.contacts.findMany({
      orderBy: (c, { asc }) => asc(c.name),
      with: { account: true },
    }),
    db.query.deals.findMany({
      columns: { id: true, title: true, value: true, stageId: true },
      with: { account: true, stage: true },
    }),
    userId ? await getGoogleStatus(userId) : { connected: false as const },
  ]);

  return (
    <AppShell title="Gmail Inbox" user={user}>
      <InboxClient
        contacts={allContacts}
        deals={allDeals}
        googleConnected={googleStatus.connected}
        googleEmail={(googleStatus as any).email || user?.email || "ahmad.aziz@mytm.co"}
        currentUser={user}
      />
    </AppShell>
  );
}

