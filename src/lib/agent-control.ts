import { NextResponse } from "next/server";
import { and, asc, count, eq, ilike, inArray, ne, or } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import {
  activities,
  agentAuditLogs,
  leads,
  pipelines,
  stageHistory,
  stages,
} from "@/db/schema";
import { convertLeadToDeal } from "@/app/actions";

type LeadRecord = typeof leads.$inferSelect & {
  pipeline?: { id: string; name: string; type: string; stages?: Array<{ id: string; name: string; order: number }> } | null;
  stage?: { id: string; name: string; pipelineId: string } | null;
  owner?: { id: string; name: string | null; email: string } | null;
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export class AgentError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function requireAgentUser() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    throw new AgentError("You must be logged in to use Agent Control.", 401);
  }

  return {
    id: userId,
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
  };
}

export function agentJson<T extends JsonValue | Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

export function agentErrorResponse(error: unknown) {
  if (error instanceof AgentError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("Agent Control API error:", error);
  return NextResponse.json({ error: "Agent Control command failed." }, { status: 500 });
}

export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "name" in item) return String((item as any).name);
        return "";
      })
      .filter(Boolean);
  } catch {
    return raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}

export function serializeLead(lead: LeadRecord) {
  return {
    id: lead.id,
    name: lead.contactName,
    contactName: lead.contactName,
    title: lead.title,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    productInterest: lead.productInterest,
    score: lead.score,
    value: lead.value,
    tags: parseTags(lead.tags),
    section: lead.pipeline ? { id: lead.pipeline.id, name: lead.pipeline.name } : null,
    stage: lead.stage ? { id: lead.stage.id, name: lead.stage.name } : null,
    owner: lead.owner ? { id: lead.owner.id, name: lead.owner.name, email: lead.owner.email } : null,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

export async function getLeadOrThrow(id: string) {
  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, id),
    with: {
      pipeline: { with: { stages: { orderBy: (s, { asc }) => asc(s.order) } } },
      stage: true,
      owner: { columns: { id: true, name: true, email: true } },
    },
  });

  if (!lead) throw new AgentError("Lead not found.", 404);
  return lead as LeadRecord;
}

export async function searchLeads(q: string, limit = 25) {
  const trimmed = q.trim();
  const where = trimmed
    ? or(
        ilike(leads.contactName, `%${trimmed}%`),
        ilike(leads.company, `%${trimmed}%`),
        ilike(leads.email, `%${trimmed}%`),
        ilike(leads.phone, `%${trimmed}%`)
      )
    : undefined;

  const rows = await db.query.leads.findMany({
    where,
    with: {
      pipeline: true,
      stage: true,
      owner: { columns: { id: true, name: true, email: true } },
    },
    orderBy: (l, { desc }) => desc(l.updatedAt),
    limit,
  });

  return rows.map((lead) => serializeLead(lead as LeadRecord));
}

export async function getAgentOptions() {
  const [leadPipelines, dealPipelines] = await Promise.all([
    db.query.pipelines.findMany({
      where: eq(pipelines.type, "LEAD"),
      with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
      orderBy: [asc(pipelines.createdAt)],
    }),
    db.query.pipelines.findMany({
      where: eq(pipelines.type, "DEAL"),
      with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
      orderBy: [asc(pipelines.createdAt)],
    }),
  ]);

  return { leadPipelines, dealPipelines };
}

export async function writeAgentAudit(input: {
  userId: string;
  leadId?: string | null;
  actionType: string;
  previousValue: unknown;
  newValue: unknown;
}) {
  await db.insert(agentAuditLogs).values({
    userId: input.userId,
    leadId: input.leadId ?? null,
    actionType: input.actionType,
    previousValue: JSON.stringify(input.previousValue ?? null),
    newValue: JSON.stringify(input.newValue ?? null),
    source: "agent_control",
  });
}

export async function listLeadSections() {
  const leadSections = await db.query.pipelines.findMany({
    where: eq(pipelines.type, "LEAD"),
    with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
    orderBy: [asc(pipelines.createdAt)],
  });

  const leadCounts = await db
    .select({ pipelineId: leads.pipelineId, total: count(leads.id) })
    .from(leads)
    .groupBy(leads.pipelineId);

  const countByPipeline = new Map(leadCounts.map((row) => [row.pipelineId, row.total]));

  return leadSections.map((section) => ({
    id: section.id,
    name: section.name,
    type: section.type,
    isDefault: section.isDefault,
    leadCount: countByPipeline.get(section.id) ?? 0,
    stages: section.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      order: stage.order,
      color: stage.color,
    })),
  }));
}

export async function createLeadSection(input: {
  userId: string;
  name: string;
  dryRun?: boolean;
}) {
  const name = input.name.trim();
  if (!name) throw new AgentError("Section name is required.", 400);

  const existing = await db.query.pipelines.findFirst({
    where: and(eq(pipelines.type, "LEAD"), eq(pipelines.name, name)),
  });
  if (existing) throw new AgentError(`Lead section "${name}" already exists.`, 409);

  const next = {
    name,
    type: "LEAD" as const,
    stages: ["New Contact", "Contacted", "Meeting Scheduled", "Qualified"],
  };
  if (input.dryRun) return { dryRun: true, action: "section.create", previous: null, next };

  const [section] = await db.insert(pipelines).values({ name, type: "LEAD" }).returning();
  await db.insert(stages).values([
    { pipelineId: section.id, name: "New Contact", order: 0, color: "#3b82f6" },
    { pipelineId: section.id, name: "Contacted", order: 1, color: "#f59e0b" },
    { pipelineId: section.id, name: "Meeting Scheduled", order: 2, color: "#8b5cf6" },
    { pipelineId: section.id, name: "Qualified", order: 3, color: "#10b981" },
  ]);
  await writeAgentAudit({
    userId: input.userId,
    leadId: null,
    actionType: "lead.section.create",
    previousValue: null,
    newValue: { sectionId: section.id, ...next },
  });

  return { success: true, sectionId: section.id, next: { sectionId: section.id, ...next } };
}

export async function renameLeadSection(input: {
  userId: string;
  pipelineId: string;
  name: string;
  dryRun?: boolean;
}) {
  const name = input.name.trim();
  if (!name) throw new AgentError("Section name is required.", 400);

  const section = await db.query.pipelines.findFirst({
    where: and(eq(pipelines.id, input.pipelineId), eq(pipelines.type, "LEAD")),
  });
  if (!section) throw new AgentError("Lead section not found.", 404);

  const duplicate = await db.query.pipelines.findFirst({
    where: and(eq(pipelines.type, "LEAD"), eq(pipelines.name, name), ne(pipelines.id, section.id)),
  });
  if (duplicate) throw new AgentError(`Lead section "${name}" already exists.`, 409);

  const previous = { sectionId: section.id, name: section.name };
  const next = { sectionId: section.id, name };
  if (input.dryRun) return { dryRun: true, action: "section.rename", previous, next };

  await db.update(pipelines).set({ name }).where(eq(pipelines.id, section.id));
  await writeAgentAudit({
    userId: input.userId,
    leadId: null,
    actionType: "lead.section.rename",
    previousValue: previous,
    newValue: next,
  });

  return { success: true, previous, next };
}

export async function addLeadSectionStage(input: {
  userId: string;
  pipelineId: string;
  name: string;
  dryRun?: boolean;
}) {
  const name = input.name.trim();
  if (!name) throw new AgentError("Stage name is required.", 400);

  const section = await db.query.pipelines.findFirst({
    where: and(eq(pipelines.id, input.pipelineId), eq(pipelines.type, "LEAD")),
    with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
  });
  if (!section) throw new AgentError("Lead section not found.", 404);

  const duplicateStage = section.stages.find((stage) => stage.name.toLowerCase() === name.toLowerCase());
  if (duplicateStage) {
    return {
      success: true,
      alreadyExists: true,
      stageId: duplicateStage.id,
      sectionId: section.id,
      stageName: duplicateStage.name,
    };
  }

  const previous = { sectionId: section.id, sectionName: section.name, stages: section.stages.map((stage) => stage.name) };
  const next = { sectionId: section.id, sectionName: section.name, stageName: name };
  if (input.dryRun) return { dryRun: true, action: "section.stage.add", previous, next };

  const maxOrder = section.stages.reduce((max, stage) => Math.max(max, stage.order), -1);
  const [stage] = await db
    .insert(stages)
    .values({ pipelineId: section.id, name, order: maxOrder + 1, color: "#64748b" })
    .returning();
  await writeAgentAudit({
    userId: input.userId,
    leadId: null,
    actionType: "lead.section.stage.add",
    previousValue: previous,
    newValue: { ...next, stageId: stage.id },
  });

  return { success: true, sectionId: section.id, stageId: stage.id, stageName: stage.name };
}

export async function deleteLeadSection(input: {
  userId: string;
  pipelineId: string;
  dryRun?: boolean;
  allowMoveLeadsToDefault?: boolean;
}) {
  const section = await db.query.pipelines.findFirst({
    where: and(eq(pipelines.id, input.pipelineId), eq(pipelines.type, "LEAD")),
    with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
  });
  if (!section) throw new AgentError("Lead section not found.", 404);
  if (section.isDefault) throw new AgentError("The default lead section cannot be deleted.", 400);

  const [leadCountRow] = await db
    .select({ total: count(leads.id) })
    .from(leads)
    .where(eq(leads.pipelineId, section.id));
  const leadCount = leadCountRow?.total ?? 0;

  const fallbackSection = await db.query.pipelines.findFirst({
    where: and(eq(pipelines.type, "LEAD"), eq(pipelines.isDefault, true)),
    with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
  });
  const fallbackStage = fallbackSection?.stages[0];

  if (leadCount > 0 && !input.allowMoveLeadsToDefault) {
    throw new AgentError(
      `Section has ${leadCount} lead(s). Send allowMoveLeadsToDefault=true to move them to the default section before deleting.`,
      409
    );
  }
  if (leadCount > 0 && (!fallbackSection || !fallbackStage)) {
    throw new AgentError("Cannot delete section because no default fallback section/stage exists.", 400);
  }

  const stageIds = section.stages.map((stage) => stage.id);
  const previous = {
    sectionId: section.id,
    sectionName: section.name,
    leadCount,
    stageCount: section.stages.length,
    fallbackSectionId: fallbackSection?.id ?? null,
    fallbackStageId: fallbackStage?.id ?? null,
  };
  const next = { deleted: true };
  if (input.dryRun) return { dryRun: true, action: "section.delete", previous, next };

  if (leadCount > 0 && fallbackSection && fallbackStage) {
    await db
      .update(leads)
      .set({
        pipelineId: fallbackSection.id,
        stageId: fallbackStage.id,
        stageEnteredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.pipelineId, section.id));
  }
  if (stageIds.length > 0) {
    await db
      .delete(stageHistory)
      .where(or(inArray(stageHistory.fromStageId, stageIds), inArray(stageHistory.toStageId, stageIds)));
  }
  await db.delete(stages).where(eq(stages.pipelineId, section.id));
  await db.delete(pipelines).where(eq(pipelines.id, section.id));
  await writeAgentAudit({
    userId: input.userId,
    leadId: null,
    actionType: "lead.section.delete",
    previousValue: previous,
    newValue: next,
  });

  return { success: true, previous, next };
}

export async function changeLeadStage(input: {
  userId: string;
  leadId: string;
  stageId: string;
  dryRun?: boolean;
}) {
  const lead = await getLeadOrThrow(input.leadId);
  const targetStage = await db.query.stages.findFirst({ where: eq(stages.id, input.stageId) });
  if (!targetStage) throw new AgentError("Stage not found.", 404);
  if (lead.pipelineId && targetStage.pipelineId !== lead.pipelineId) {
    throw new AgentError("Stage does not belong to the lead's current section.", 400);
  }

  const previous = { stageId: lead.stageId, stageName: lead.stage?.name ?? null };
  const next = { stageId: targetStage.id, stageName: targetStage.name };

  if (input.dryRun) return { dryRun: true, leadId: lead.id, action: "stage", previous, next };

  await db
    .update(leads)
    .set({ stageId: targetStage.id, stageEnteredAt: new Date(), updatedAt: new Date() })
    .where(eq(leads.id, lead.id));
  await db.insert(stageHistory).values({
    leadId: lead.id,
    fromStageId: lead.stageId,
    toStageId: targetStage.id,
  });
  await writeAgentAudit({
    userId: input.userId,
    leadId: lead.id,
    actionType: "lead.stage.update",
    previousValue: previous,
    newValue: next,
  });

  return { success: true, leadId: lead.id, previous, next };
}

export async function changeLeadSection(input: {
  userId: string;
  leadId: string;
  pipelineId: string;
  stageId?: string;
  dryRun?: boolean;
}) {
  const lead = await getLeadOrThrow(input.leadId);
  const targetPipeline = await db.query.pipelines.findFirst({
    where: and(eq(pipelines.id, input.pipelineId), eq(pipelines.type, "LEAD")),
    with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
  });
  if (!targetPipeline) throw new AgentError("Lead section not found.", 404);

  const targetStage = input.stageId
    ? targetPipeline.stages.find((stage) => stage.id === input.stageId)
    : targetPipeline.stages[0];
  if (!targetStage) throw new AgentError("Target section needs at least one stage.", 400);

  const previous = {
    sectionId: lead.pipelineId,
    sectionName: lead.pipeline?.name ?? null,
    stageId: lead.stageId,
    stageName: lead.stage?.name ?? null,
  };
  const next = {
    sectionId: targetPipeline.id,
    sectionName: targetPipeline.name,
    stageId: targetStage.id,
    stageName: targetStage.name,
  };

  if (input.dryRun) return { dryRun: true, leadId: lead.id, action: "section", previous, next };

  await db
    .update(leads)
    .set({
      pipelineId: targetPipeline.id,
      stageId: targetStage.id,
      stageEnteredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, lead.id));
  await db.insert(stageHistory).values({
    leadId: lead.id,
    fromStageId: lead.stageId,
    toStageId: targetStage.id,
  });
  await writeAgentAudit({
    userId: input.userId,
    leadId: lead.id,
    actionType: "lead.section.update",
    previousValue: previous,
    newValue: next,
  });

  return { success: true, leadId: lead.id, previous, next };
}

export async function addLeadNote(input: {
  userId: string;
  leadId: string;
  notes: string;
  type?: "CALL" | "MEETING" | "NOTE" | "EMAIL";
  dryRun?: boolean;
}) {
  const lead = await getLeadOrThrow(input.leadId);
  const notes = input.notes.trim();
  if (!notes) throw new AgentError("Note text is required.", 400);

  const next = { type: input.type ?? "NOTE", notes };
  if (input.dryRun) return { dryRun: true, leadId: lead.id, action: "note", previous: null, next };

  const [activity] = await db
    .insert(activities)
    .values({ leadId: lead.id, type: next.type, notes, userId: input.userId })
    .returning();
  await writeAgentAudit({
    userId: input.userId,
    leadId: lead.id,
    actionType: "lead.note.add",
    previousValue: null,
    newValue: { activityId: activity.id, ...next },
  });

  return { success: true, leadId: lead.id, activityId: activity.id };
}

export async function addLeadLabel(input: {
  userId: string;
  leadId: string;
  label: string;
  dryRun?: boolean;
}) {
  const lead = await getLeadOrThrow(input.leadId);
  const label = input.label.trim();
  if (!label) throw new AgentError("Label is required.", 400);

  const previous = parseTags(lead.tags);
  const next = Array.from(new Set([...previous, label]));
  if (input.dryRun) return { dryRun: true, leadId: lead.id, action: "label", previous, next };

  await db
    .update(leads)
    .set({ tags: JSON.stringify(next), updatedAt: new Date() })
    .where(eq(leads.id, lead.id));
  await writeAgentAudit({
    userId: input.userId,
    leadId: lead.id,
    actionType: "lead.label.add",
    previousValue: previous,
    newValue: next,
  });

  return { success: true, leadId: lead.id, previous, next };
}

export async function convertLeadViaAgent(input: {
  userId: string;
  leadId: string;
  pipelineId?: string;
  stageId?: string;
  value?: number;
  currency?: string;
  dryRun?: boolean;
}) {
  const lead = await getLeadOrThrow(input.leadId);
  const dealPipeline = input.pipelineId
    ? await db.query.pipelines.findFirst({
        where: and(eq(pipelines.id, input.pipelineId), eq(pipelines.type, "DEAL")),
        with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
      })
    : await db.query.pipelines.findFirst({
        where: eq(pipelines.type, "DEAL"),
        with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
        orderBy: [asc(pipelines.createdAt)],
      });

  if (!dealPipeline) throw new AgentError("No deal pipeline exists.", 400);
  const dealStage = input.stageId
    ? dealPipeline.stages.find((stage) => stage.id === input.stageId)
    : dealPipeline.stages[0];
  if (!dealStage) throw new AgentError("No deal stage exists for conversion.", 400);

  const previous = { converted: false, leadStageId: lead.stageId, leadStageName: lead.stage?.name ?? null };
  const next = {
    dealTitle: `${lead.company || lead.contactName} Opportunity`,
    pipelineId: dealPipeline.id,
    pipelineName: dealPipeline.name,
    stageId: dealStage.id,
    stageName: dealStage.name,
    value: input.value ?? lead.value ?? null,
    currency: input.currency ?? "SAR",
  };

  if (input.dryRun) return { dryRun: true, leadId: lead.id, action: "convert-to-deal", previous, next };

  const deal = await convertLeadToDeal({
    leadId: lead.id,
    pipelineId: dealPipeline.id,
    stageId: dealStage.id,
    value: input.value ?? lead.value ?? undefined,
    currency: input.currency ?? "SAR",
    ownerId: input.userId,
  });
  await writeAgentAudit({
    userId: input.userId,
    leadId: lead.id,
    actionType: "lead.convert_to_deal",
    previousValue: previous,
    newValue: { ...next, dealId: deal.id },
  });

  return { success: true, leadId: lead.id, dealId: deal.id, previous, next: { ...next, dealId: deal.id } };
}

export async function bulkChangeStage(input: {
  userId: string;
  leadIds: string[];
  stageId: string;
  dryRun?: boolean;
}) {
  const leadIds = normalizeLeadIds(input.leadIds);
  const targetStage = await db.query.stages.findFirst({ where: eq(stages.id, input.stageId) });
  if (!targetStage) throw new AgentError("Stage not found.", 404);

  const found = await db.query.leads.findMany({
    where: inArray(leads.id, leadIds),
    with: { pipeline: true, stage: true },
  });
  if (found.length !== leadIds.length) throw new AgentError("One or more lead ids were not found.", 404);

  const changes = found.map((lead) => {
    if (lead.pipelineId && lead.pipelineId !== targetStage.pipelineId) {
      throw new AgentError(`Stage does not belong to ${lead.contactName}'s section.`, 400);
    }
    return {
      leadId: lead.id,
      previous: { stageId: lead.stageId, stageName: lead.stage?.name ?? null },
      next: { stageId: targetStage.id, stageName: targetStage.name },
    };
  });

  if (input.dryRun) return { dryRun: true, action: "bulk-stage", changes };

  for (const change of changes) {
    await db
      .update(leads)
      .set({ stageId: targetStage.id, stageEnteredAt: new Date(), updatedAt: new Date() })
      .where(eq(leads.id, change.leadId));
    await db.insert(stageHistory).values({
      leadId: change.leadId,
      fromStageId: change.previous.stageId,
      toStageId: targetStage.id,
    });
    await writeAgentAudit({
      userId: input.userId,
      leadId: change.leadId,
      actionType: "lead.bulk_stage.update",
      previousValue: change.previous,
      newValue: change.next,
    });
  }

  return { success: true, action: "bulk-stage", changes };
}

export async function bulkAddLabel(input: {
  userId: string;
  leadIds: string[];
  label: string;
  dryRun?: boolean;
}) {
  const leadIds = normalizeLeadIds(input.leadIds);
  const label = input.label.trim();
  if (!label) throw new AgentError("Label is required.", 400);

  const found = await db.query.leads.findMany({ where: inArray(leads.id, leadIds) });
  if (found.length !== leadIds.length) throw new AgentError("One or more lead ids were not found.", 404);

  const changes = found.map((lead) => {
    const previous = parseTags(lead.tags);
    return {
      leadId: lead.id,
      previous,
      next: Array.from(new Set([...previous, label])),
    };
  });

  if (input.dryRun) return { dryRun: true, action: "bulk-label", changes };

  for (const change of changes) {
    await db
      .update(leads)
      .set({ tags: JSON.stringify(change.next), updatedAt: new Date() })
      .where(eq(leads.id, change.leadId));
    await writeAgentAudit({
      userId: input.userId,
      leadId: change.leadId,
      actionType: "lead.bulk_label.add",
      previousValue: change.previous,
      newValue: change.next,
    });
  }

  return { success: true, action: "bulk-label", changes };
}

function normalizeLeadIds(leadIds: unknown) {
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    throw new AgentError("Send leadIds as a non-empty array.", 400);
  }
  if (leadIds.length > 100) {
    throw new AgentError("Bulk Agent Control commands are limited to 100 lead ids.", 400);
  }
  return Array.from(new Set(leadIds.map(String).map((id) => id.trim()).filter(Boolean)));
}
