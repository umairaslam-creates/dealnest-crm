import { db } from "@/db/client";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { meetings, contacts, deals, users } from "@/db/schema";
import { desc, asc } from "drizzle-orm";
import { getGoogleStatus } from "@/lib/google";
import { MeetingsClient } from "./meetings-client";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const user = await getSessionUser();
  const userId = (user as any)?.id;

  const [allMeetings, allContacts, allDeals, googleStatus] = await Promise.all([
    db.query.meetings.findMany({
      orderBy: (m, { asc }) => asc(m.startTime),
      with: {
        contact: { with: { account: true } },
        deal: true,
        user: true,
      },
    }),
    db.query.contacts.findMany({
      orderBy: (c, { asc }) => asc(c.name),
      with: { account: true },
    }),
    db.query.deals.findMany({
      columns: { id: true, title: true, value: true },
    }),
    userId ? await getGoogleStatus(userId) : { connected: false as const },
  ]);

  return (
    <AppShell title="Appointments & Meetings" user={user}>
      <MeetingsClient
        initialMeetings={allMeetings}
        contacts={allContacts}
        deals={allDeals}
        googleConnected={googleStatus.connected}
        googleEmail={(googleStatus as any).email}
      />
    </AppShell>
  );
}

