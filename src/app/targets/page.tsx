import { db } from "@/db/client";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { getTargetsWithProgressAction } from "@/app/actions/targets";
import { TargetsClient } from "./targets-client";

export const dynamic = "force-dynamic";

export default async function TargetsPage() {
  const user = await getSessionUser();

  const [targetsRes, members, pipelines] = await Promise.all([
    getTargetsWithProgressAction(),
    db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        image: true,
      },
      orderBy: (u, { asc }) => asc(u.name),
    }),
    db.query.pipelines.findMany({
      columns: {
        id: true,
        name: true,
      },
      orderBy: (p, { asc }) => asc(p.name),
    }),
  ]);

  return (
    <AppShell title="Targets & Goals" user={user}>
      <TargetsClient
        initialTargets={targetsRes.targets}
        userRole={targetsRes.userRole}
        currentUserId={targetsRes.currentUserId}
        members={members}
        pipelines={pipelines}
      />
    </AppShell>
  );
}

