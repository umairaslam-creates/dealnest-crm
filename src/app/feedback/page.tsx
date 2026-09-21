import { db } from "@/db/client";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { FeedbackClient } from "./feedback-client";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const user = await getSessionUser();

  const feedbackItems = await db.query.feedback.findMany({
    orderBy: (f, { desc }) => desc(f.createdAt),
    with: { user: true },
    limit: 20,
  });

  return (
    <AppShell title="Feedback & Support" user={user}>
      <FeedbackClient initialFeedback={feedbackItems} />
    </AppShell>
  );
}

