"use server";

import { db } from "@/db/client";
import { users, leads, deals, tasks, activities, targets } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/current-user";
import { formatCurrency } from "@/lib/currency";
import bcrypt from "bcryptjs";

/**
 * Ensures the currently logged-in user is a Team Lead or Admin
 */
async function requireTeamLeadOrAdmin() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error("Authentication required.");
  }
  const isLead =
    (sessionUser as any).orgRole === "TEAM_LEAD" ||
    (sessionUser as any).role === "ADMIN" ||
    (sessionUser as any).role === "MANAGER";

  if (!isLead) {
    throw new Error("Only verified Team Leads or Admins can perform this action.");
  }
  return sessionUser;
}

/**
 * 1-Click Approve Member Signup Request
 */
export async function approveMemberAction(memberId: string) {
  await requireTeamLeadOrAdmin();

  await db
    .update(users)
    .set({
      status: "ACTIVE",
      permissions: JSON.stringify({
        canExportLeads: true,
        canDeleteLeads: false,
        canViewReports: true,
        canReassignLeads: false,
        canManagePipelines: false,
      }),
    })
    .where(eq(users.id, memberId));

  revalidatePath("/team");
  revalidatePath("/pending-approval");
  return { success: true };
}

/**
 * 1-Click Decline / Reject Member Signup Request
 */
export async function declineMemberAction(memberId: string) {
  await requireTeamLeadOrAdmin();

  await db
    .update(users)
    .set({
      status: "DECLINED",
    })
    .where(eq(users.id, memberId));

  revalidatePath("/team");
  revalidatePath("/pending-approval");
  return { success: true };
}

/**
 * Update a member's portal permissions
 */
export async function updatePermissionsAction(
  memberId: string,
  permissions: {
    canExportLeads: boolean;
    canDeleteLeads: boolean;
    canViewReports: boolean;
    canReassignLeads: boolean;
    canManagePipelines: boolean;
  }
) {
  await requireTeamLeadOrAdmin();

  await db
    .update(users)
    .set({
      permissions: JSON.stringify(permissions),
    })
    .where(eq(users.id, memberId));

  revalidatePath("/team");
  return { success: true };
}

/**
 * Assign one or more leads directly to a team member
 */
export async function assignLeadsToMemberAction(memberId: string, leadIds: string[]) {
  const leadUser = await requireTeamLeadOrAdmin();

  if (!leadIds || leadIds.length === 0) {
    return { error: "No leads selected." };
  }

  for (const leadId of leadIds) {
    await db.update(leads).set({ ownerId: memberId }).where(eq(leads.id, leadId));

    // Log assignment activity
    await db.insert(activities).values({
      leadId,
      userId: leadUser.id,
      type: "NOTE",
      notes: `Lead assigned to team member by Team Lead.`,
    });
  }

  revalidatePath("/team");
  revalidatePath("/leads");
  revalidatePath("/");
  return { success: true, count: leadIds.length };
}

/**
 * Assign a task directly to a team member
 */
export async function assignTaskToMemberAction(
  memberId: string,
  data: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    leadId?: string;
    dealId?: string;
  }
) {
  const sessionUser = await requireTeamLeadOrAdmin();

  if (!data.title?.trim()) {
    return { error: "Task title is required." };
  }

  const [newTask] = await db
    .insert(tasks)
    .values({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      ownerId: memberId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority || "MEDIUM",
      leadId: data.leadId || null,
      dealId: data.dealId || null,
    })
    .returning();

  revalidatePath("/team");
  revalidatePath("/tasks");
  return { success: true, task: newTask };
}

/**
 * Add a new team member directly
 */
export async function createTeamMemberAction(data: {
  name: string;
  email: string;
  password: string;
  department?: string;
  orgRole?: string;
}) {
  const sessionUser = await requireTeamLeadOrAdmin();

  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  if (!name || !email || !data.password || data.password.length < 6) {
    return { error: "Name, email, and password of at least 6 characters are required." };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    return { error: "A user with this email address already exists." };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const domain = (sessionUser as any).companyDomain || email.split("@")[1] || null;
  const dept = data.department || (sessionUser as any).department || "Sales";
  const orgRole = data.orgRole || "REPRESENTATIVE";

  // Prevent duplicate team leads in department
  if (orgRole === "TEAM_LEAD") {
    const existingLead = await db.query.users.findFirst({
      where: and(
        eq(users.companyDomain, domain),
        eq(users.department, dept),
        eq(users.orgRole, "TEAM_LEAD")
      ),
    });
    if (existingLead) {
      return {
        error: `${existingLead.name} is already the verified Team Lead for ${dept}.`,
      };
    }
  }

  const permissions = JSON.stringify({
    canExportLeads: true,
    canDeleteLeads: orgRole === "TEAM_LEAD",
    canViewReports: true,
    canReassignLeads: orgRole === "TEAM_LEAD",
    canManagePipelines: orgRole === "TEAM_LEAD",
  });

  await db.insert(users).values({
    name,
    email,
    passwordHash,
    role: orgRole === "TEAM_LEAD" ? "MANAGER" : "REP",
    accountType: "ORGANIZATION",
    department: dept,
    orgRole,
    status: "ACTIVE",
    companyDomain: domain,
    permissions,
  });

  revalidatePath("/team");
  return { success: true };
}

/**
 * Remove or deactivate a team member
 */
export async function removeTeamMemberAction(memberId: string) {
  await requireTeamLeadOrAdmin();

  // Reassign member's leads to unassigned so they are not orphaned
  await db
    .update(leads)
    .set({ ownerId: null })
    .where(eq(leads.ownerId, memberId));

  // Reassign member's deals to unassigned
  await db
    .update(deals)
    .set({ ownerId: null })
    .where(eq(deals.ownerId, memberId));

  // Remove the user
  await db.delete(users).where(eq(users.id, memberId));

  revalidatePath("/team");
  revalidatePath("/leads");
  revalidatePath("/deals");
  return { success: true };
}

/**
 * Read-Only Rep Stats Inspector:
 * Gathers member's metrics, open leads, deals won vs open, deal value, tasks, and recent touchpoints.
 * Team Lead can only inspect, strictly read-only for member dashboard metrics.
 */
export async function getMemberAuditStatsAction(memberId: string) {
  const member = await db.query.users.findFirst({
    where: eq(users.id, memberId),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      department: true,
      orgRole: true,
      status: true,
      occupation: true,
      permissions: true,
      createdAt: true,
    },
  });

  if (!member) {
    return { error: "Member not found." };
  }

  // Member's leads
  const memberLeads = await db.query.leads.findMany({
    where: eq(leads.ownerId, memberId),
    columns: {
      id: true,
      contactName: true,
      company: true,
      score: true,
      createdAt: true,
    },
    limit: 20,
    orderBy: (l, { desc }) => desc(l.createdAt),
  });

  // Member's deals
  const memberDeals = await db.query.deals.findMany({
    where: eq(deals.ownerId, memberId),
    columns: {
      id: true,
      title: true,
      value: true,
      status: true,
      createdAt: true,
    },
    limit: 20,
    orderBy: (d, { desc }) => desc(d.createdAt),
  });

  const wonDeals = memberDeals.filter((d) => d.status === "WON");
  const openDeals = memberDeals.filter((d) => d.status === "OPEN");
  const lostDeals = memberDeals.filter((d) => d.status === "LOST");

  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const openPipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  // Member's tasks
  const memberTasks = await db.query.tasks.findMany({
    where: eq(tasks.ownerId, memberId),
    columns: {
      id: true,
      title: true,
      done: true,
      dueDate: true,
      priority: true,
    },
    limit: 15,
    orderBy: (t, { desc }) => desc(t.createdAt),
  });

  const completedTasksCount = memberTasks.filter((t) => t.done).length;

  return {
    member,
    stats: {
      totalLeads: memberLeads.length,
      totalDeals: memberDeals.length,
      wonDealsCount: wonDeals.length,
      openDealsCount: openDeals.length,
      lostDealsCount: lostDeals.length,
      wonValue,
      openPipelineValue,
      totalTasks: memberTasks.length,
      completedTasksCount,
    },
    leads: memberLeads,
    deals: memberDeals,
    tasks: memberTasks,
  };
}

/**
 * Assign Quota or Target to an individual team member and notify them.
 */
export async function assignQuotaToMemberAction(data: {
  memberId: string;
  title: string;
  type: "REVENUE_QUOTA" | "DEMO_SCHEDULED" | "MEETING_SCHEDULED" | "DEALS_WON" | "LEADS_GENERATED";
  targetValue: number;
  currency?: string;
  period?: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";
  startDate: string | Date;
  endDate: string | Date;
}) {
  const leadUser = await requireTeamLeadOrAdmin();

  const targetMember = await db.query.users.findFirst({
    where: eq(users.id, data.memberId),
  });

  if (!targetMember) {
    return { success: false, error: "Team member not found." };
  }

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { success: false, error: "Invalid start or end dates provided." };
  }

  if (endDate <= startDate) {
    return { success: false, error: "End date must be after start date." };
  }

  const targetCurrency = data.currency || "SAR";
  const formattedVal =
    data.type === "REVENUE_QUOTA"
      ? formatCurrency(data.targetValue, targetCurrency)
      : `${data.targetValue} ${data.type.replace(/_/g, " ").toLowerCase()}`;

  // 1. Insert target into database
  await db.insert(targets).values({
    title: data.title.trim(),
    type: data.type,
    targetValue: Number(data.targetValue),
    currency: targetCurrency,
    period: data.period || "MONTHLY",
    startDate,
    endDate,
    userId: targetMember.id,
    assignedByUserId: leadUser.id,
  });

  // 2. Dispatch a high-priority notification task to the team member
  const leadName = leadUser.name || "Ahmad Aziz";
  await db.insert(tasks).values({
    title: `🎯 New Quota Assigned: ${data.title}`,
    description: `${leadName} has assigned a new quota of ${formattedVal} to you for ${data.period || "this period"}. Your CRM dashboard and targets have been updated.`,
    priority: "HIGH",
    ownerId: targetMember.id,
    dueDate: endDate,
    done: false,
  });

  revalidatePath("/team");
  revalidatePath("/targets");
  revalidatePath("/reports");
  revalidatePath("/");

  return {
    success: true,
    message: `${leadName} has assigned a new quota of ${formattedVal} to ${targetMember.name}! Notification sent.`,
  };
}
