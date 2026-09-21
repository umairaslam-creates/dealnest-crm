import { db } from "@/db/client";
import { users, leads, deals, targets } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { TeamClient, TeamMember, AvailableLead } from "./team-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage Team & Department • DEALNEST",
  description: "Enterprise department team management, approvals, and permissions.",
};

export default async function TeamPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const dept = (user as any).department || "Sales";
  const domain = (user as any).companyDomain || "mytm.co";

  // Query all members in the department / workspace
  let allDeptUsers;
  if ((user as any).accountType === "ORGANIZATION" && (user as any).companyDomain) {
    allDeptUsers = await db.query.users.findMany({
      where: and(
        eq(users.companyDomain, (user as any).companyDomain),
        eq(users.department, dept)
      ),
      orderBy: (u, { asc }) => asc(u.createdAt),
    });
  } else {
    // Individual or all users
    allDeptUsers = await db.query.users.findMany({
      orderBy: (u, { asc }) => asc(u.createdAt),
    });
  }

  // Count leads and won deals per user
  const leadsPerUser = await db
    .select({
      ownerId: leads.ownerId,
      count: sql<number>`count(*)::int`,
    })
    .from(leads)
    .groupBy(leads.ownerId);

  const wonDealsPerUser = await db
    .select({
      ownerId: deals.ownerId,
      count: sql<number>`count(*)::int`,
    })
    .from(deals)
    .where(eq(deals.status, "WON"))
    .groupBy(deals.ownerId);

  const allTargets = await db.query.targets.findMany({
    orderBy: (t, { desc }) => desc(t.createdAt),
  });

  const targetsPerUserMap = new Map();
  for (const t of allTargets) {
    if (t.userId && !targetsPerUserMap.has(t.userId)) {
      targetsPerUserMap.set(t.userId, {
        id: t.id,
        title: t.title,
        type: t.type,
        targetValue: t.targetValue,
        currency: t.currency || "SAR",
        period: t.period,
        startDate: t.startDate,
        endDate: t.endDate,
      });
    }
  }

  const leadsCountMap = new Map(leadsPerUser.map((r) => [r.ownerId, r.count]));
  const wonDealsCountMap = new Map(wonDealsPerUser.map((r) => [r.ownerId, r.count]));

  const activeMembers: TeamMember[] = allDeptUsers
    .filter((u) => u.status === "ACTIVE")
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      accountType: u.accountType,
      department: u.department,
      orgRole: u.orgRole,
      status: u.status,
      companyDomain: u.companyDomain,
      phone: u.phone,
      occupation: u.occupation,
      permissions: u.permissions,
      createdAt: u.createdAt,
      leadsCount: leadsCountMap.get(u.id) || 0,
      dealsWonCount: wonDealsCountMap.get(u.id) || 0,
      assignedQuota: targetsPerUserMap.get(u.id) || null,
    }));

  const pendingMembers: TeamMember[] = allDeptUsers
    .filter((u) => u.status === "PENDING_APPROVAL")
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      accountType: u.accountType,
      department: u.department,
      orgRole: u.orgRole,
      status: u.status,
      companyDomain: u.companyDomain,
      phone: u.phone,
      occupation: u.occupation,
      permissions: u.permissions,
      createdAt: u.createdAt,
    }));

  // Query available leads for assignment
  const deptLeads = await db.query.leads.findMany({
    columns: {
      id: true,
      contactName: true,
      company: true,
      score: true,
      ownerId: true,
    },
    limit: 50,
    orderBy: (l, { desc }) => desc(l.createdAt),
  });

  return (
    <AppShell title="Manage Team" user={user}>
      <TeamClient
        currentUser={user}
        members={activeMembers}
        pendingMembers={pendingMembers}
        availableLeads={deptLeads}
        departmentName={dept}
        companyDomain={domain}
      />
    </AppShell>
  );
}

