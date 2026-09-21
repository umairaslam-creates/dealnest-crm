"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { targets, users, deals, meetings, leads, pipelines } from "@/db/schema";
import { eq, and, gte, lte, sql, or, ilike } from "drizzle-orm";
import { auth } from "@/auth";
import { convertCurrency } from "@/lib/currency";

export type TargetType =
  | "REVENUE_QUOTA"
  | "DEMO_SCHEDULED"
  | "MEETING_SCHEDULED"
  | "DEALS_WON"
  | "LEADS_GENERATED";

export type TargetPeriod = "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";

export type TargetWithProgress = {
  id: string;
  title: string;
  type: TargetType;
  targetValue: number;
  currency: string;
  period: TargetPeriod;
  startDate: Date;
  endDate: Date;
  userId: string | null;
  assignedByUserId: string | null;
  pipelineId: string | null;
  createdAt: Date;
  user?: { id: string; name: string | null; email: string; role: string; designation?: string | null; image?: string | null } | null;
  assignedBy?: { id: string; name: string | null; email: string; role: string } | null;
  pipeline?: { id: string; name: string } | null;
  currentValue: number;
  percentage: number;
  remaining: number;
  daysLeft: number;
  paceStatus: "ACHIEVED" | "AHEAD" | "ON_TRACK" | "BEHIND";
};

/**
 * Fetch all targets and compute real-time actual progress from CRM data.
 */
export async function getTargetsWithProgressAction(): Promise<{
  success: boolean;
  targets: TargetWithProgress[];
  userRole: "ADMIN" | "MANAGER" | "REP";
  currentUserId: string;
  error?: string;
}> {
  try {
    const session = await auth();
    let currentUserId = (session?.user as any)?.id;
    let userRole: "ADMIN" | "MANAGER" | "REP" = "REP";

    if (currentUserId) {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, currentUserId),
      });
      if (dbUser) {
        userRole = dbUser.role as "ADMIN" | "MANAGER" | "REP";
      }
    } else {
      const fallbackUser = await db.query.users.findFirst();
      if (fallbackUser) {
        currentUserId = fallbackUser.id;
        userRole = fallbackUser.role as "ADMIN" | "MANAGER" | "REP";
      }
    }

    // Auto-seed defaults if table has zero rows
    const existingCount = await db.query.targets.findMany({ limit: 1 });
    if (existingCount.length === 0 && currentUserId) {
      await seedDefaultTargetsInternal(currentUserId);
    }

    const allTargets = await db.query.targets.findMany({
      with: {
        user: {
          columns: { id: true, name: true, email: true, role: true, designation: true, image: true },
        },
        assignedBy: {
          columns: { id: true, name: true, email: true, role: true },
        },
        pipeline: {
          columns: { id: true, name: true },
        },
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
    });

    const now = new Date();

    // Query all relevant historical/current items once for high performance calculation
    const [allWonDeals, allMeetings, allLeads] = await Promise.all([
      db.query.deals.findMany({
        where: eq(deals.status, "WON"),
        columns: {
          id: true,
          value: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
          ownerId: true,
          pipelineId: true,
        },
      }),
      db.query.meetings.findMany({
        columns: {
          id: true,
          title: true,
          meetingType: true,
          startTime: true,
          userId: true,
          dealId: true,
        },
      }),
      db.query.leads.findMany({
        columns: {
          id: true,
          ownerId: true,
          createdAt: true,
        },
      }),
    ]);

    const targetsWithProgress: TargetWithProgress[] = allTargets.map((target) => {
      const start = new Date(target.startDate);
      const end = new Date(target.endDate);
      const targetCurrency = target.currency || "SAR";

      let current = 0;

      if (target.type === "REVENUE_QUOTA") {
        const matchingDeals = allWonDeals.filter((d) => {
          const dealDate = new Date(d.updatedAt || d.createdAt);
          if (dealDate < start || dealDate > end) return false;
          if (target.userId && d.ownerId !== target.userId) return false;
          if (target.pipelineId && d.pipelineId !== target.pipelineId) return false;
          return true;
        });

        current = matchingDeals.reduce((sum, d) => {
          const dealVal = d.value ?? 0;
          const dealCurr = d.currency || "SAR";
          const converted = convertCurrency(dealVal, dealCurr, targetCurrency);
          return sum + converted;
        }, 0);
      } else if (target.type === "DEMO_SCHEDULED") {
        const matchingDemos = allMeetings.filter((m) => {
          const mDate = new Date(m.startTime);
          if (mDate < start || mDate > end) return false;
          if (target.userId && m.userId !== target.userId) return false;
          const isDemoType = m.meetingType === "DEMO";
          const hasDemoWord = m.title.toLowerCase().includes("demo");
          return isDemoType || hasDemoWord;
        });
        current = matchingDemos.length;
      } else if (target.type === "MEETING_SCHEDULED") {
        const matchingMeetings = allMeetings.filter((m) => {
          const mDate = new Date(m.startTime);
          if (mDate < start || mDate > end) return false;
          if (target.userId && m.userId !== target.userId) return false;
          return true;
        });
        current = matchingMeetings.length;
      } else if (target.type === "DEALS_WON") {
        const matchingDeals = allWonDeals.filter((d) => {
          const dealDate = new Date(d.updatedAt || d.createdAt);
          if (dealDate < start || dealDate > end) return false;
          if (target.userId && d.ownerId !== target.userId) return false;
          if (target.pipelineId && d.pipelineId !== target.pipelineId) return false;
          return true;
        });
        current = matchingDeals.length;
      } else if (target.type === "LEADS_GENERATED") {
        const matchingLeads = allLeads.filter((l) => {
          const leadDate = new Date(l.createdAt);
          if (leadDate < start || leadDate > end) return false;
          if (target.userId && l.ownerId !== target.userId) return false;
          return true;
        });
        current = matchingLeads.length;
      }

      const percentage =
        target.targetValue > 0
          ? Math.round((current / target.targetValue) * 100)
          : 0;

      const remaining = Math.max(0, target.targetValue - current);

      // Days left calculation
      const msLeft = end.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

      // Pace evaluation
      const totalDuration = Math.max(1, end.getTime() - start.getTime());
      const elapsedDuration = Math.max(0, now.getTime() - start.getTime());
      const expectedPercentage = Math.min(100, Math.round((elapsedDuration / totalDuration) * 100));

      let paceStatus: "ACHIEVED" | "AHEAD" | "ON_TRACK" | "BEHIND" = "ON_TRACK";
      if (percentage >= 100) {
        paceStatus = "ACHIEVED";
      } else if (percentage >= expectedPercentage + 10) {
        paceStatus = "AHEAD";
      } else if (percentage >= expectedPercentage * 0.75) {
        paceStatus = "ON_TRACK";
      } else {
        paceStatus = "BEHIND";
      }

      return {
        id: target.id,
        title: target.title,
        type: target.type as TargetType,
        targetValue: target.targetValue,
        currency: targetCurrency,
        period: target.period as TargetPeriod,
        startDate: start,
        endDate: end,
        userId: target.userId,
        assignedByUserId: target.assignedByUserId,
        pipelineId: target.pipelineId,
        createdAt: target.createdAt,
        user: target.user as any,
        assignedBy: target.assignedBy as any,
        pipeline: target.pipeline as any,
        currentValue: current,
        percentage,
        remaining,
        daysLeft,
        paceStatus,
      };
    });

    return {
      success: true,
      targets: targetsWithProgress,
      userRole,
      currentUserId: currentUserId || "",
    };
  } catch (error: any) {
    console.error("getTargetsWithProgressAction error:", error);
    return {
      success: false,
      targets: [],
      userRole: "REP",
      currentUserId: "",
      error: error.message || "Failed to load targets",
    };
  }
}

/**
 * Create a new Target or Goal with permission and role enforcement:
 * - Team Leads (ADMIN / MANAGER) can assign any target (including revenue quotas) to the team, reps, or themselves.
 * - Sales Reps (REP) can set personal goals (demos, meetings, leads, tasks) for themselves, but NOT revenue quotas.
 */
export async function createTargetAction(input: {
  title: string;
  type: TargetType;
  targetValue: number;
  currency?: string;
  period?: TargetPeriod;
  startDate: string | Date;
  endDate: string | Date;
  userId?: string | null;
  pipelineId?: string | null;
}) {
  const session = await auth();
  let currentUserId = (session?.user as any)?.id;
  let userRole = "REP";

  if (currentUserId) {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, currentUserId),
    });
    if (dbUser) userRole = dbUser.role;
  } else {
    const fallbackUser = await db.query.users.findFirst();
    currentUserId = fallbackUser?.id;
    userRole = fallbackUser?.role || "REP";
  }

  if (!currentUserId) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const isTeamLeadOrAdmin = userRole === "ADMIN" || userRole === "MANAGER";

  // Permission check: Reps cannot set revenue quotas or assign to others
  if (!isTeamLeadOrAdmin) {
    if (input.type === "REVENUE_QUOTA") {
      return {
        success: false,
        error: "Quota amounts can only be assigned by Team Leads or Managers. Sales Representatives can set Demo, Meeting, and Task goals.",
      };
    }
    // Enforce that reps can only set goals for themselves
    input.userId = currentUserId;
  }

  if (!input.title || !input.title.trim()) {
    return { success: false, error: "Target title is required." };
  }

  if (!input.targetValue || input.targetValue <= 0) {
    return { success: false, error: "Target value must be greater than 0." };
  }

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { success: false, error: "Invalid start or end dates provided." };
  }

  if (endDate <= startDate) {
    return { success: false, error: "End date must be after start date." };
  }

  try {
    await db.insert(targets).values({
      title: input.title.trim(),
      type: input.type,
      targetValue: Number(input.targetValue),
      currency: input.currency || "SAR",
      period: input.period || "MONTHLY",
      startDate,
      endDate,
      userId: input.userId || null,
      assignedByUserId: currentUserId,
      pipelineId: input.pipelineId || null,
    });

    revalidatePath("/targets");
    revalidatePath("/reports");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("createTargetAction error:", error);
    return { success: false, error: error.message || "Failed to create target." };
  }
}

/**
 * Update an existing target.
 */
export async function updateTargetAction(
  id: string,
  input: {
    title?: string;
    type?: TargetType;
    targetValue?: number;
    currency?: string;
    period?: TargetPeriod;
    startDate?: string | Date;
    endDate?: string | Date;
    userId?: string | null;
    pipelineId?: string | null;
  }
) {
  const session = await auth();
  let currentUserId = (session?.user as any)?.id;
  let userRole = "REP";

  if (currentUserId) {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, currentUserId),
    });
    if (dbUser) userRole = dbUser.role;
  } else {
    const fallback = await db.query.users.findFirst();
    currentUserId = fallback?.id;
    userRole = fallback?.role || "REP";
  }

  const isTeamLeadOrAdmin = userRole === "ADMIN" || userRole === "MANAGER";

  const target = await db.query.targets.findFirst({
    where: eq(targets.id, id),
  });

  if (!target) {
    return { success: false, error: "Target not found." };
  }

  if (!isTeamLeadOrAdmin) {
    if (target.assignedByUserId !== currentUserId && target.userId !== currentUserId) {
      return { success: false, error: "Permission denied: You can only edit your own goals." };
    }
    if (input.type === "REVENUE_QUOTA") {
      return { success: false, error: "Only Team Leads can configure Quota amounts." };
    }
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (input.title) updateData.title = input.title.trim();
  if (input.type) updateData.type = input.type;
  if (input.targetValue !== undefined) updateData.targetValue = Number(input.targetValue);
  if (input.currency) updateData.currency = input.currency;
  if (input.period) updateData.period = input.period;
  if (input.startDate) updateData.startDate = new Date(input.startDate);
  if (input.endDate) updateData.endDate = new Date(input.endDate);
  if (input.userId !== undefined) updateData.userId = input.userId || null;
  if (input.pipelineId !== undefined) updateData.pipelineId = input.pipelineId || null;

  try {
    await db.update(targets).set(updateData).where(eq(targets.id, id));

    revalidatePath("/targets");
    revalidatePath("/reports");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("updateTargetAction error:", error);
    return { success: false, error: error.message || "Failed to update target." };
  }
}

/**
 * Delete a target.
 */
export async function deleteTargetAction(id: string) {
  const session = await auth();
  let currentUserId = (session?.user as any)?.id;
  let userRole = "REP";

  if (currentUserId) {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, currentUserId),
    });
    if (dbUser) userRole = dbUser.role;
  } else {
    const fallback = await db.query.users.findFirst();
    currentUserId = fallback?.id;
    userRole = fallback?.role || "REP";
  }

  const isTeamLeadOrAdmin = userRole === "ADMIN" || userRole === "MANAGER";

  const target = await db.query.targets.findFirst({
    where: eq(targets.id, id),
  });

  if (!target) {
    return { success: false, error: "Target not found." };
  }

  if (!isTeamLeadOrAdmin && target.assignedByUserId !== currentUserId) {
    return { success: false, error: "Permission denied: Only Team Leads or goal creators can remove targets." };
  }

  try {
    await db.delete(targets).where(eq(targets.id, id));

    revalidatePath("/targets");
    revalidatePath("/reports");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("deleteTargetAction error:", error);
    return { success: false, error: error.message || "Failed to delete target." };
  }
}

/**
 * Helper to seed initial targets if none exist.
 */
async function seedDefaultTargetsInternal(adminId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const endOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0, 23, 59, 59);

  await db.insert(targets).values([
    {
      title: "Q1 Team Revenue Quota (SAR)",
      type: "REVENUE_QUOTA",
      targetValue: 1_500_000,
      currency: "SAR",
      period: "QUARTERLY",
      startDate: startOfQuarter,
      endDate: endOfQuarter,
      userId: null, // Team-wide
      assignedByUserId: adminId,
    },
    {
      title: "Monthly Enterprise Product Demos",
      type: "DEMO_SCHEDULED",
      targetValue: 20,
      currency: "SAR",
      period: "MONTHLY",
      startDate: startOfMonth,
      endDate: endOfMonth,
      userId: null, // Team-wide
      assignedByUserId: adminId,
    },
    {
      title: "Client Discovery Meetings",
      type: "MEETING_SCHEDULED",
      targetValue: 35,
      currency: "SAR",
      period: "MONTHLY",
      startDate: startOfMonth,
      endDate: endOfMonth,
      userId: null, // Team-wide
      assignedByUserId: adminId,
    },
  ]);
}

