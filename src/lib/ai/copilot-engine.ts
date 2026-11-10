import { db } from "@/db/client";
import {
  leads,
  deals,
  contacts,
  accounts,
  tasks,
  activities,
  pipelines,
  stages,
  users,
} from "@/db/schema";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type CopilotActionType =
  | "create_lead"
  | "update_lead"
  | "list_leads"
  | "create_deal"
  | "move_deal"
  | "list_deals"
  | "create_contact"
  | "create_task"
  | "mark_tasks_done"
  | "get_pipeline_summary"
  | "change_theme"
  | "navigate_to"
  | "general_response";

export interface CopilotResponse {
  reply: string;
  actionExecuted?: CopilotActionType;
  data?: any;
  navigationPath?: string;
  themeId?: string;
  badges?: Array<{
    label: string;
    type: "success" | "info" | "warning" | "metric";
  }>;
}

// -------------------------------------------------------------------------
// 1. TOOL IMPLEMENTATIONS (Live Database Mutations & Queries)
// -------------------------------------------------------------------------

export async function createLeadTool(input: {
  contactName: string;
  company?: string;
  email?: string;
  phone?: string;
  title?: string;
  website?: string;
  productInterest?: string;
  value?: number;
  score?: "hot" | "warm" | "cold";
  notes?: string;
  ownerId?: string;
  sectionName?: string;
}): Promise<CopilotResponse> {
  const leadPipeline = await getLeadPipelineForCopilot(input.sectionName);

  const firstStage = leadPipeline?.stages?.[0];

  const [newLead] = await db
    .insert(leads)
    .values({
      contactName: input.contactName,
      company: input.company || "Independent",
      email: input.email,
      phone: input.phone,
      title: input.title,
      website: input.website,
      productInterest: input.productInterest,
      value: input.value || 0,
      score: input.score || "warm",
      pipelineId: leadPipeline?.id,
      stageId: firstStage?.id,
      ownerId: input.ownerId,
    })
    .returning();

  if (input.notes) {
    await db.insert(activities).values({
      type: "NOTE",
      notes: input.notes,
      leadId: newLead.id,
      userId: input.ownerId,
    });
  }

  revalidatePath("/leads");
  revalidatePath("/");

  return {
    reply: `✅ Successfully created new lead **${newLead.contactName}**${
      newLead.company ? ` at **${newLead.company}**` : ""
    }${
      newLead.value ? ` with estimated value **$${newLead.value.toLocaleString()}**` : ""
    }. Score set to **${newLead.score?.toUpperCase()}** in **${leadPipeline?.name || "Leads"}**.`,
    actionExecuted: "create_lead",
    data: newLead,
    navigationPath: leadPipeline?.id ? `/leads?section=${leadPipeline.id}` : `/leads`,
    badges: [
      { label: `Lead: ${newLead.contactName}`, type: "success" },
      { label: `Score: ${newLead.score?.toUpperCase()}`, type: "info" },
      ...(newLead.value ? [{ label: `$${newLead.value.toLocaleString()}`, type: "metric" as const }] : []),
    ],
  };
}

async function getLeadPipelineForCopilot(sectionName?: string) {
  if (sectionName) {
    const allLeadPipelines = await db.query.pipelines.findMany({
      where: eq(pipelines.type, "LEAD"),
      with: { stages: { orderBy: [stages.order] } },
      orderBy: [pipelines.createdAt],
    });
    const normalized = sectionName.trim().toLowerCase();
    const existing = allLeadPipelines.find(
      (pipeline) =>
        pipeline.name.toLowerCase() === normalized ||
        pipeline.name.toLowerCase().includes(normalized) ||
        normalized.includes(pipeline.name.toLowerCase())
    );
    if (existing) return existing;

    const [created] = await db.insert(pipelines).values({ name: sectionName.trim(), type: "LEAD" }).returning();
    await db.insert(stages).values([
      { pipelineId: created.id, name: "New Contact", order: 0, color: "#3b82f6" },
      { pipelineId: created.id, name: "Contacted", order: 1, color: "#f59e0b" },
      { pipelineId: created.id, name: "Meeting Scheduled", order: 2, color: "#8b5cf6" },
      { pipelineId: created.id, name: "Qualified", order: 3, color: "#10b981" },
    ]);
    const createdStages = await db.query.stages.findMany({
      where: eq(stages.pipelineId, created.id),
      orderBy: [stages.order],
    });
    return { ...created, stages: createdStages };
  }

  return db.query.pipelines.findFirst({
    where: eq(pipelines.type, "LEAD"),
    with: { stages: { orderBy: [stages.order] } },
  });
}

function requestedLeadSection(prompt: string) {
  const match =
    prompt.match(/(?:move|put|add|import|save|send)?\s*(?:it|this|them|lead|leads|contact|data)?\s*(?:to|into|in|under)\s+["']?([a-z0-9 &/.-]{2,60})["']?\s+section/i) ||
    prompt.match(/section\s+["']?([a-z0-9 &/.-]{2,60})["']?/i);
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

function labeledValue(prompt: string, labels: string[]) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = prompt.match(new RegExp(`(?:^|\\n|\\r)\\s*${escaped}\\s*[:\\-]\\s*([^\\n\\r]+)`, "i"));
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return undefined;
}

function parseRawLeadPrompt(prompt: string) {
  const email = prompt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
  const phone = prompt.match(/(\+?[0-9][0-9\s().-]{7,20}[0-9])/)
    ?.[0]
    ?.replace(/\s+/g, " ")
    .trim();
  const website = prompt.match(/https?:\/\/[^\s]+|(?:www\.)[^\s]+/i)?.[0];
  const sectionName = requestedLeadSection(prompt);
  const score = prompt.toLowerCase().includes("hot")
    ? "hot"
    : prompt.toLowerCase().includes("cold")
      ? "cold"
      : "warm";

  let contactName =
    labeledValue(prompt, ["contact name", "lead name", "full name", "name", "person", "contact"]) ||
    undefined;
  const title = labeledValue(prompt, ["title", "designation", "job title", "position", "role"]);
  const company = labeledValue(prompt, ["company", "company name", "account", "organization", "business"]);
  const productInterest = labeledValue(prompt, ["product", "product interest", "solution", "interest", "service"]);
  const notes = labeledValue(prompt, ["notes", "note", "details", "comment", "summary"]);

  if (!contactName) {
    const candidate = prompt
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => {
        const lowerLine = line.toLowerCase();
        return (
          /^[a-z][a-z .'-]{2,60}$/i.test(line) &&
          !lowerLine.includes("lead") &&
          !lowerLine.includes("section") &&
          !lowerLine.includes("add ") &&
          !lowerLine.includes("move ") &&
          !lowerLine.includes("email") &&
          !lowerLine.includes("phone") &&
          !lowerLine.includes("company")
        );
      });
    contactName = candidate;
  }

  if (!contactName && email) contactName = email.split("@")[0];
  if (!contactName && company) contactName = `${company} Contact`;

  return {
    contactName,
    company,
    email,
    phone,
    title,
    website,
    productInterest,
    score: score as "hot" | "warm" | "cold",
    notes,
    sectionName,
  };
}

export async function createDealTool(input: {
  title: string;
  value: number;
  stageName?: string;
  companyName?: string;
  probability?: number;
  ownerId?: string;
}): Promise<CopilotResponse> {
  const dealPipeline = await db.query.pipelines.findFirst({
    where: eq(pipelines.type, "DEAL"),
    with: { stages: { orderBy: [stages.order] } },
  });

  if (!dealPipeline || !dealPipeline.stages.length) {
    throw new Error("No active deal pipeline found.");
  }

  let targetStage = dealPipeline.stages[0];
  if (input.stageName) {
    const found = dealPipeline.stages.find((s) =>
      s.name.toLowerCase().includes(input.stageName!.toLowerCase())
    );
    if (found) targetStage = found;
  }

  // Find or create account if company specified
  let accountId: string | undefined;
  if (input.companyName) {
    const existingAcc = await db.query.accounts.findFirst({
      where: ilike(accounts.name, `%${input.companyName}%`),
    });
    if (existingAcc) {
      accountId = existingAcc.id;
    } else {
      const [newAcc] = await db
        .insert(accounts)
        .values({ name: input.companyName })
        .returning();
      accountId = newAcc.id;
    }
  }

  const [newDeal] = await db
    .insert(deals)
    .values({
      title: input.title,
      value: input.value,
      pipelineId: dealPipeline.id,
      stageId: targetStage.id,
      accountId,
      probability: input.probability || 60,
      ownerId: input.ownerId,
      status: targetStage.name.toLowerCase().includes("won") ? "WON" : "OPEN",
    })
    .returning();

  revalidatePath("/deals");
  revalidatePath("/reports");
  revalidatePath("/");

  return {
    reply: `🎉 Deal **"${newDeal.title}"** has been created in stage **${targetStage.name}** for **$${input.value.toLocaleString()}**!`,
    actionExecuted: "create_deal",
    data: newDeal,
    navigationPath: `/deals`,
    badges: [
      { label: `Deal: ${newDeal.title}`, type: "success" },
      { label: `$${input.value.toLocaleString()}`, type: "metric" },
      { label: `Stage: ${targetStage.name}`, type: "info" },
    ],
  };
}

export async function moveDealTool(input: {
  dealQuery: string;
  targetStage: string;
  ownerId?: string;
}): Promise<CopilotResponse> {
  // 1. Locate the deal
  const matchingDeals = await db.query.deals.findMany({
    where: ilike(deals.title, `%${input.dealQuery}%`),
    with: { stage: true },
    limit: 5,
  });

  if (!matchingDeals.length) {
    return {
      reply: `Could not find any deal matching "${input.dealQuery}". Try mentioning the exact company or deal title!`,
      actionExecuted: "general_response",
    };
  }

  const dealToMove = matchingDeals[0];

  // 2. Locate target stage
  const allStages = await db.query.stages.findMany();
  const lowerTarget = input.targetStage.toLowerCase();

  let targetStage = allStages.find((s) => s.name.toLowerCase() === lowerTarget);
  if (!targetStage) {
    targetStage = allStages.find((s) => s.name.toLowerCase().includes(lowerTarget));
  }

  if (!targetStage) {
    return {
      reply: `Found deal **"${dealToMove.title}"**, but could not find stage "${input.targetStage}". Available stages: ${allStages
        .map((s) => s.name)
        .join(", ")}.`,
      actionExecuted: "general_response",
    };
  }

  // Determine status
  let newStatus: "OPEN" | "WON" | "LOST" = "OPEN";
  if (lowerTarget.includes("won") || targetStage.name.toLowerCase().includes("won")) {
    newStatus = "WON";
  } else if (lowerTarget.includes("lost") || targetStage.name.toLowerCase().includes("lost")) {
    newStatus = "LOST";
  }

  const [updated] = await db
    .update(deals)
    .set({
      stageId: targetStage.id,
      status: newStatus,
      stageEnteredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(deals.id, dealToMove.id))
    .returning();

  // Log activity
  await db.insert(activities).values({
    type: "NOTE",
    notes: `AI Copilot moved deal from "${dealToMove.stage?.name || 'Previous'}" to "${targetStage.name}" (${newStatus})`,
    dealId: updated.id,
    userId: input.ownerId,
  });

  revalidatePath("/deals");
  revalidatePath("/reports");
  revalidatePath("/");

  return {
    reply: `⚡ Deal **"${updated.title}"** moved from **${dealToMove.stage?.name}** → **${targetStage.name}** (${newStatus})!`,
    actionExecuted: "move_deal",
    data: updated,
    navigationPath: `/deals`,
    badges: [
      { label: `Deal: ${updated.title}`, type: "success" },
      { label: `Stage: ${targetStage.name}`, type: "info" },
      { label: `Status: ${newStatus}`, type: newStatus === "WON" ? "success" : "info" },
    ],
  };
}

export async function listLeadsTool(filter?: {
  score?: string;
  query?: string;
}): Promise<CopilotResponse> {
  const conditions = [];
  if (filter?.score) {
    conditions.push(eq(leads.score, filter.score.toLowerCase()));
  }
  if (filter?.query) {
    conditions.push(
      or(
        ilike(leads.contactName, `%${filter.query}%`),
        ilike(leads.company, `%${filter.query}%`)
      )
    );
  }

  const results = await db.query.leads.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: [desc(leads.createdAt)],
    limit: 8,
    with: { stage: true },
  });

  if (!results.length) {
    return {
      reply: `No leads found matching your criteria${filter?.score ? ` (Score: ${filter.score})` : ""}.`,
      actionExecuted: "list_leads",
      data: [],
    };
  }

  const rows = results
    .map(
      (l, idx) =>
        `${idx + 1}. **${l.contactName}** (${l.company || "Independent"}) • Score: **${l.score?.toUpperCase()}** • Value: **$${(l.value || 0).toLocaleString()}** • Stage: *${l.stage?.name || "Intake"}*`
    )
    .join("\n");

  return {
    reply: `Here are the top leads found:\n\n${rows}\n\n👉 [Click here to view all leads in CRM](/leads)`,
    actionExecuted: "list_leads",
    data: results,
    navigationPath: `/leads`,
    badges: [
      { label: `${results.length} Leads Found`, type: "metric" },
      ...(filter?.score ? [{ label: `Score: ${filter.score.toUpperCase()}`, type: "info" as const }] : []),
    ],
  };
}

export async function listDealsTool(query?: string): Promise<CopilotResponse> {
  const where = query ? ilike(deals.title, `%${query}%`) : undefined;
  const results = await db.query.deals.findMany({
    where,
    orderBy: [desc(deals.value)],
    limit: 6,
    with: { stage: true, account: true },
  });

  if (!results.length) {
    return {
      reply: `No active deals found${query ? ` matching "${query}"` : ""}.`,
      actionExecuted: "list_deals",
      data: [],
    };
  }

  const rows = results
    .map(
      (d, idx) =>
        `${idx + 1}. **${d.title}** • **$${(d.value || 0).toLocaleString()}** • Stage: **${d.stage?.name || "Open"}** (${d.status}) • Account: *${d.account?.name || "Enterprise"}*`
    )
    .join("\n");

  return {
    reply: `Here are the top deals currently in the pipeline:\n\n${rows}\n\n👉 [Open Deals Pipeline](/deals)`,
    actionExecuted: "list_deals",
    data: results,
    navigationPath: `/deals`,
    badges: [{ label: `${results.length} Deals Listed`, type: "metric" }],
  };
}

export async function createTaskTool(input: {
  title: string;
  priority?: string;
  dueDate?: string;
  dealQuery?: string;
  ownerId?: string;
}): Promise<CopilotResponse> {
  let dealId: string | undefined;
  if (input.dealQuery) {
    const matchingDeal = await db.query.deals.findFirst({
      where: ilike(deals.title, `%${input.dealQuery}%`),
    });
    if (matchingDeal) dealId = matchingDeal.id;
  }

  const [newTask] = await db
    .insert(tasks)
    .values({
      title: input.title,
      priority: (input.priority || "MEDIUM").toUpperCase(),
      dueDate: input.dueDate ? new Date(input.dueDate) : new Date(Date.now() + 86400000 * 2), // 2 days from now
      dealId,
      ownerId: input.ownerId,
    })
    .returning();

  revalidatePath("/");

  return {
    reply: `📌 Task created: **"${newTask.title}"** (Priority: **${newTask.priority}**)${
      dealId ? ` linked to deal.` : ""
    }`,
    actionExecuted: "create_task",
    data: newTask,
    badges: [
      { label: `Task: ${newTask.title}`, type: "success" },
      { label: `Priority: ${newTask.priority}`, type: "info" },
    ],
  };
}

export async function markTasksDoneTool(ownerId?: string): Promise<CopilotResponse> {
  const where = ownerId
    ? and(eq(tasks.done, false), eq(tasks.ownerId, ownerId))
    : eq(tasks.done, false);

  const updated = await db.update(tasks).set({ done: true }).where(where).returning();
  revalidatePath("/");

  return {
    reply: `✅ Successfully marked **${updated.length}** pending task(s) as completed!`,
    actionExecuted: "mark_tasks_done",
    data: updated,
    badges: [{ label: `${updated.length} Tasks Completed`, type: "success" }],
  };
}

export async function getPipelineSummaryTool(): Promise<CopilotResponse> {
  const allDeals = await db.query.deals.findMany({
    with: { stage: true, account: true },
  });

  const totalDeals = allDeals.length;
  const totalValue = allDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const wonDeals = allDeals.filter((d) => d.status === "WON");
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const openDeals = allDeals.filter((d) => d.status === "OPEN");
  const openValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  const winRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

  // Stage distribution
  const stageMap: Record<string, { count: number; value: number }> = {};
  allDeals.forEach((d) => {
    const sName = d.stage?.name || "Unknown";
    if (!stageMap[sName]) stageMap[sName] = { count: 0, value: 0 };
    stageMap[sName].count += 1;
    stageMap[sName].value += d.value || 0;
  });

  const stageBreakdown = Object.entries(stageMap)
    .map(([name, stat]) => `• **${name}**: ${stat.count} deal(s) — **$${stat.value.toLocaleString()}**`)
    .join("\n");

  const report = `📊 **DEALNEST Executive Revenue & Pipeline Telemetry**\n\n` +
    `• **Active Open Pipeline**: **$${openValue.toLocaleString()}** (${openDeals.length} active deals)\n` +
    `• **Total Closed-Won**: **$${wonValue.toLocaleString()}** (${wonDeals.length} closed won deals)\n` +
    `• **AI Win Rate Conversion**: **${winRate}%**\n` +
    `• **Total Tracked Pipeline**: **$${totalValue.toLocaleString()}** (${totalDeals} total)\n\n` +
    `**Pipeline Distribution by Stage**:\n${stageBreakdown}\n\n` +
    `👉 [Open Full Executive Reports Dashboard](/reports)`;

  return {
    reply: report,
    actionExecuted: "get_pipeline_summary",
    data: { totalValue, openValue, wonValue, winRate, stageMap },
    navigationPath: `/reports`,
    badges: [
      { label: `Open Pipeline: $${openValue.toLocaleString()}`, type: "metric" },
      { label: `Win Rate: ${winRate}%`, type: "success" },
      { label: `Total Deals: ${totalDeals}`, type: "info" },
    ],
  };
}

export function changeThemeTool(themeQuery: string): CopilotResponse {
  const THEME_MAP: Record<string, string> = {
    navy: "glass-navy",
    blue: "glass-navy",
    obsidian: "glass-obsidian",
    dark: "glass-obsidian",
    cyber: "glass-obsidian",
    twilight: "glass-twilight",
    purple: "glass-twilight",
    violet: "glass-twilight",
    emerald: "glass-emerald",
    green: "glass-emerald",
    sunset: "glass-sunset",
    gold: "glass-sunset",
    amber: "glass-sunset",
  };

  const lower = themeQuery.toLowerCase();
  let matchedThemeId = "glass-obsidian";

  for (const [key, id] of Object.entries(THEME_MAP)) {
    if (lower.includes(key)) {
      matchedThemeId = id;
      break;
    }
  }

  return {
    reply: `🎨 Applied theme **${matchedThemeId}** to your DEALNEST workspace!`,
    actionExecuted: "change_theme",
    themeId: matchedThemeId,
    badges: [{ label: `Theme: ${matchedThemeId}`, type: "info" }],
  };
}

export function navigateToTool(pageQuery: string): CopilotResponse {
  const lower = pageQuery.toLowerCase();
  let target = "/";
  let label = "Dashboard";

  if (lower.includes("lead")) {
    target = "/leads";
    label = "Leads Intake";
  } else if (lower.includes("deal") || lower.includes("pipeline")) {
    target = "/deals";
    label = "Deals Pipeline";
  } else if (lower.includes("report") || lower.includes("analytics") || lower.includes("metric")) {
    target = "/reports";
    label = "Sales Reports";
  } else if (lower.includes("contact") || lower.includes("people")) {
    target = "/contacts";
    label = "Contacts";
  } else if (lower.includes("product")) {
    target = "/products";
    label = "Product Catalog";
  } else if (lower.includes("team") || lower.includes("department")) {
    target = "/team";
    label = "Team Management";
  } else if (lower.includes("theme") || lower.includes("setting")) {
    target = "/settings/theme";
    label = "Theme Customizer";
  }

  return {
    reply: `🚀 Navigating you directly to **${label}**...`,
    actionExecuted: "navigate_to",
    navigationPath: target,
    badges: [{ label: `Navigating to ${label}`, type: "info" }],
  };
}

// -------------------------------------------------------------------------
// 2. AUTONOMOUS INTENT PARSER & DISPATCHER
// -------------------------------------------------------------------------

export async function processCopilotCommand(
  prompt: string,
  userId?: string
): Promise<CopilotResponse> {
  const cleanPrompt = prompt.trim();
  const lower = cleanPrompt.toLowerCase();

  // A. Pipeline Summary / Analytics
  if (
    lower.includes("pipeline summary") ||
    lower.includes("pipeline total") ||
    lower.includes("pipeline health") ||
    lower.includes("revenue summary") ||
    lower.includes("how much is in") ||
    (lower.includes("pipeline") && (lower.includes("what is") || lower.includes("show") || lower.includes("metrics") || lower.includes("stats") || lower.includes("analytics")))
  ) {
    return await getPipelineSummaryTool();
  }

  // B. Move Deal / Change Deal Stage
  // e.g., "move deal Apex to won", "move Apex Cloud to Closed Won", "mark deal XYZ won"
  if (
    lower.startsWith("move ") ||
    lower.includes("move deal ") ||
    lower.includes("mark deal ") ||
    (lower.includes("deal") && (lower.includes("to won") || lower.includes("to lost") || lower.includes("to negotiation") || lower.includes("to proposal")))
  ) {
    let dealQuery = "";
    let targetStage = "Closed Won";

    if (lower.includes(" to ")) {
      const parts = cleanPrompt.split(/\s+to\s+/i);
      dealQuery = parts[0].replace(/^(move|mark)(\s+deal)?/i, "").trim();
      targetStage = parts[1].trim();
    } else if (lower.includes(" won")) {
      dealQuery = cleanPrompt.replace(/^(move|mark)(\s+deal)?/i, "").replace(/won/i, "").trim();
      targetStage = "Closed Won";
    } else if (lower.includes(" lost")) {
      dealQuery = cleanPrompt.replace(/^(move|mark)(\s+deal)?/i, "").replace(/lost/i, "").trim();
      targetStage = "Closed Lost";
    }

    if (dealQuery) {
      return await moveDealTool({ dealQuery, targetStage, ownerId: userId });
    }
  }

  // C. Create Deal
  // e.g. "create deal Apex Cloud worth $500,000 in Negotiation", "create a $250k deal for SpaceX"
  if (
    (lower.startsWith("create ") || lower.startsWith("add ") || lower.startsWith("new ")) &&
    lower.includes("deal")
  ) {
    // Extract monetary value
    const valMatch = cleanPrompt.match(/\$?([0-9,]+(?:\.[0-9]+)?)\s*(k|m|million|thousand)?/i);
    let value = 100000;
    if (valMatch) {
      let rawNum = parseFloat(valMatch[1].replace(/,/g, ""));
      const multiplier = (valMatch[2] || "").toLowerCase();
      if (multiplier === "k" || multiplier === "thousand") rawNum *= 1000;
      if (multiplier === "m" || multiplier === "million") rawNum *= 1000000;
      if (!isNaN(rawNum)) value = rawNum;
    }

    // Extract stage if specified (e.g. "in Negotiation", "in Proposal Submitted")
    let stageName: string | undefined;
    const stageMatch = cleanPrompt.match(/\s+in\s+(?:stage\s+)?([A-Za-z\s/]+)$/i) ||
      cleanPrompt.match(/\s+in\s+(?:stage\s+)?([A-Za-z\s/]+?)(?:\s+worth|\s+value|\s+for|\$)/i);
    if (stageMatch) {
      stageName = stageMatch[1].trim();
    }

    // Extract title
    let title = cleanPrompt
      .replace(/^(create|add|new)(\s+a)?\s+deal(\s+named|\s+called|\s+for)?/i, "")
      .replace(/\s+(worth|value|for|amount)\s+\$?([0-9,]+(?:\.[0-9]+)?\s*(k|m|million|thousand)?)/i, "")
      .replace(/\s+in\s+(?:stage\s+)?([A-Za-z\s/]+)$/i, "")
      .replace(/\s+in\s+(?:stage\s+)?([A-Za-z\s/]+?)(?:\s+worth|\s+value|\s+for|\$)/i, "")
      .trim();

    if (!title) title = `Enterprise Deal - $${value.toLocaleString()}`;

    return await createDealTool({
      title,
      value,
      stageName,
      companyName: title,
      ownerId: userId,
    });
  }

  // D. Create Lead
  // e.g. "create lead Elon Musk at Tesla email elon@tesla.com phone 555-0192 value 50000"
  if (
    (lower.startsWith("create ") || lower.startsWith("add ") || lower.startsWith("new ")) &&
    lower.includes("lead")
  ) {
    const rawLead = parseRawLeadPrompt(cleanPrompt);
    if (
      rawLead.contactName &&
      (cleanPrompt.includes("\n") ||
        rawLead.sectionName ||
        /(?:name|phone|company|email|title|designation)\s*[:\-]/i.test(cleanPrompt))
    ) {
      return await createLeadTool({
        contactName: rawLead.contactName,
        company: rawLead.company,
        email: rawLead.email,
        phone: rawLead.phone,
        title: rawLead.title,
        website: rawLead.website,
        productInterest: rawLead.productInterest,
        score: rawLead.score,
        notes: rawLead.notes || `Imported by AI Copilot from raw text.\n\n${cleanPrompt}`,
        ownerId: userId,
        sectionName: rawLead.sectionName,
      });
    }

    // Extract email
    const emailMatch = cleanPrompt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : undefined;

    // Extract phone
    const phoneMatch = cleanPrompt.match(/(\+?[0-9][0-9\s-]{7,15}[0-9])/);
    const phone = phoneMatch ? phoneMatch[0].trim() : undefined;

    // Extract score
    let score: "hot" | "warm" | "cold" = "warm";
    if (lower.includes("hot")) score = "hot";
    if (lower.includes("cold")) score = "cold";

    // Extract value
    const valMatch = cleanPrompt.match(/(?:value|worth|\$)\s*([0-9,]+(?:\.[0-9]+)?)\s*(k|m)?/i);
    let value = 25000;
    if (valMatch) {
      let rawNum = parseFloat(valMatch[1].replace(/,/g, ""));
      if ((valMatch[2] || "").toLowerCase() === "k") rawNum *= 1000;
      if (!isNaN(rawNum)) value = rawNum;
    }

    // Extract name & company
    let remainder = cleanPrompt
      .replace(/^(create|add|new)(\s+a)?(\s+hot|\s+warm|\s+cold)?\s+lead(\s+named|\s+called|\s+for)?/i, "")
      .replace(email || "", "")
      .replace(phone || "", "")
      .replace(/(?:value|worth|\$)\s*([0-9,]+(?:\.[0-9]+)?\s*(k|m)?)/i, "")
      .replace(/(?:move|put|add|save|send)?\s*(?:it|this|lead)?\s*(?:to|into|in|under)\s+["']?[a-z0-9 &/.-]{2,60}["']?\s+section/gi, "")
      .replace(/\s+(email|phone|value|score)\s*/gi, " ")
      .trim();

    let contactName = remainder;
    let company = "Direct Prospect";

    if (remainder.toLowerCase().includes(" at ")) {
      const parts = remainder.split(/\s+at\s+/i);
      contactName = parts[0].trim();
      company = parts[1].trim();
    }

    if (!contactName) contactName = "New Sales Lead";

    return await createLeadTool({
      contactName,
      company,
      email,
      phone,
      value,
      score,
      ownerId: userId,
      sectionName: requestedLeadSection(cleanPrompt),
    });
  }

  // E. List / Search Leads
  if (
    lower.includes("show lead") ||
    lower.includes("list lead") ||
    lower.includes("find lead") ||
    lower.includes("hot lead") ||
    lower.includes("warm lead")
  ) {
    let scoreFilter: string | undefined;
    if (lower.includes("hot")) scoreFilter = "hot";
    if (lower.includes("warm")) scoreFilter = "warm";
    if (lower.includes("cold")) scoreFilter = "cold";

    let query: string | undefined;
    const queryMatch = cleanPrompt.match(/(?:for|named|matching|with)\s+([a-zA-Z0-9\s]+)/i);
    if (queryMatch) query = queryMatch[1].trim();

    return await listLeadsTool({ score: scoreFilter, query });
  }

  // F. List / Search Deals
  if (
    lower.includes("show deal") ||
    lower.includes("list deal") ||
    lower.includes("find deal") ||
    lower.includes("active deal")
  ) {
    const queryMatch = cleanPrompt.match(/(?:for|named|matching|with)\s+([a-zA-Z0-9\s]+)/i);
    return await listDealsTool(queryMatch ? queryMatch[1].trim() : undefined);
  }

  // G. Tasks
  if (lower.includes("task")) {
    if (lower.includes("mark") || lower.includes("done") || lower.includes("complete")) {
      return await markTasksDoneTool(userId);
    }
    if (lower.startsWith("create") || lower.startsWith("add") || lower.startsWith("schedule")) {
      const title = cleanPrompt
        .replace(/^(create|add|schedule)(\s+a)?\s+task(\s+to|\s+for)?/i, "")
        .trim();
      return await createTaskTool({
        title: title || "Follow up on enterprise prospect",
        priority: lower.includes("urgent") || lower.includes("high") ? "HIGH" : "MEDIUM",
        ownerId: userId,
      });
    }
  }

  // H. Theme Control
  if (lower.includes("theme") || lower.includes("vibe") || lower.includes("color")) {
    return changeThemeTool(cleanPrompt);
  }

  // I. Navigation
  if (
    lower.startsWith("go to ") ||
    lower.startsWith("open ") ||
    lower.startsWith("take me to ") ||
    lower.startsWith("navigate to ")
  ) {
    return navigateToTool(cleanPrompt);
  }

  // J. General Intelligent Response
  return {
    reply: `I'm your **DEALNEST Autonomous AI Assistant**. I can perform any action across your CRM in real time!\n\n` +
      `Here are things you can tell me to do:\n` +
      `• **"Create a $500k deal for Apex Cloud in Negotiation"**\n` +
      `• **"Create a hot lead named Sarah at Stripe with email sarah@stripe.com"**\n` +
      `• **"Move deal Apex Cloud to Won"**\n` +
      `• **"Show our total pipeline summary"**\n` +
      `• **"Show all hot leads"**\n` +
      `• **"Mark all tasks as done"**\n` +
      `• **"Switch theme to Obsidian Onyx"**\n` +
      `• **"Take me to reports"**`,
    actionExecuted: "general_response",
    badges: [{ label: "DEALNEST AI Ready", type: "info" }],
  };
}
