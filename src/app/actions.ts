"use server";

import { revalidatePath } from "next/cache";
import { eq, and, sql, or, ilike, ne, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { auth } from "@/auth";
import { sendGmail, createCalendarEvent, disconnectGoogle } from "@/lib/google";
import {
  deals,
  leads,
  stages,
  pipelines,
  aiSuggestions,
  activities,
  tasks,
  users,
  contacts,
  accounts,
  stageHistory,
  feedback,
} from "@/db/schema";

// ---------- Moving cards between stages (drag and drop) ----------

export async function moveDealStage(dealId: string, stageId: string) {
  const [current] = await db.select().from(deals).where(eq(deals.id, dealId));
  await db
    .update(deals)
    .set({ stageId, stageEnteredAt: new Date(), updatedAt: new Date() })
    .where(eq(deals.id, dealId));
  if (current) {
    await db.insert(stageHistory).values({
      dealId,
      fromStageId: current.stageId,
      toStageId: stageId,
      value: current.value,
    });
  }
  revalidatePath("/pipeline");
  revalidatePath("/");
}

export async function moveLeadStage(leadId: string, stageId: string) {
  const [current] = await db.select().from(leads).where(eq(leads.id, leadId));
  await db
    .update(leads)
    .set({ stageId, stageEnteredAt: new Date(), updatedAt: new Date() })
    .where(eq(leads.id, leadId));
  if (current) {
    await db.insert(stageHistory).values({
      leadId,
      fromStageId: current.stageId,
      toStageId: stageId,
    });
  }
  revalidatePath("/leads");
  revalidatePath("/");
}

// ---------- Customizing pipelines / stages ----------

export async function renameStage(stageId: string, name: string) {
  await db.update(stages).set({ name }).where(eq(stages.id, stageId));
  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath("/settings/pipelines");
}

export async function addStage(pipelineId: string, name: string) {
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${stages.order}), -1)` })
    .from(stages)
    .where(eq(stages.pipelineId, pipelineId));
  await db.insert(stages).values({ pipelineId, name, order: max + 1 });
  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath("/settings/pipelines");
}

export async function deleteStage(stageId: string) {
  await db.delete(stages).where(eq(stages.id, stageId));
  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath("/settings/pipelines");
}

export async function createPipeline(name: string, type: "LEAD" | "DEAL") {
  const [pipeline] = await db.insert(pipelines).values({ name, type }).returning();
  await db.insert(stages).values([{ pipelineId: pipeline.id, name: "New", order: 0 }]);
  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath("/settings/pipelines");
  return pipeline;
}

export async function renamePipeline(pipelineId: string, newName: string) {
  const trimmed = newName.trim();
  if (!trimmed) {
    throw new Error("Pipeline name cannot be empty.");
  }
  await db
    .update(pipelines)
    .set({ name: trimmed })
    .where(eq(pipelines.id, pipelineId));
  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath("/settings/pipelines");
  return { success: true };
}

export async function deletePipeline(pipelineId: string) {
  const targetPipeline = await db.query.pipelines.findFirst({
    where: eq(pipelines.id, pipelineId),
  });

  if (!targetPipeline) {
    throw new Error("Pipeline not found.");
  }

  if (targetPipeline.isDefault) {
    throw new Error("The default/main pipeline cannot be deleted.");
  }

  // Find fallback default pipeline of same type
  const fallbackPipeline =
    (await db.query.pipelines.findFirst({
      where: and(eq(pipelines.type, targetPipeline.type), eq(pipelines.isDefault, true)),
      with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
    })) ||
    (await db.query.pipelines.findFirst({
      where: and(eq(pipelines.type, targetPipeline.type), ne(pipelines.id, pipelineId)),
      with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
    }));

  if (!fallbackPipeline || fallbackPipeline.stages.length === 0) {
    throw new Error("Cannot delete pipeline without a valid fallback pipeline and stage.");
  }

  const fallbackStageId = fallbackPipeline.stages[0].id;

  // Reassign deals or leads to fallback pipeline
  if (targetPipeline.type === "DEAL") {
    await db
      .update(deals)
      .set({ pipelineId: fallbackPipeline.id, stageId: fallbackStageId })
      .where(eq(deals.pipelineId, pipelineId));
  } else if (targetPipeline.type === "LEAD") {
    await db
      .update(leads)
      .set({ pipelineId: fallbackPipeline.id, stageId: fallbackStageId })
      .where(eq(leads.pipelineId, pipelineId));
  }

  // Delete stages of target pipeline
  await db.delete(stages).where(eq(stages.pipelineId, pipelineId));

  // Delete pipeline
  await db.delete(pipelines).where(eq(pipelines.id, pipelineId));

  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath("/settings/pipelines");
  revalidatePath("/");
  return { success: true, fallbackId: fallbackPipeline.id };
}

// ---------- Creating records ----------

export async function createLead(input: {
  contactName: string;
  title?: string;
  company?: string;
  website?: string;
  email?: string;
  phone?: string;
  source?: string;
  productInterest?: string;
  region?: string;
  city?: string;
  value?: number;
  score?: string;
  pipelineId: string;
  stageId: string;
  ownerId?: string;
  accountId?: string;
  contactId?: string;
  tags?: string;
}) {
  const [lead] = await db.insert(leads).values(input).returning();
  revalidatePath("/leads");
  revalidatePath("/");
  return lead;
}

export async function updateLead(
  leadId: string,
  input: {
    contactName?: string;
    title?: string | null;
    company?: string | null;
    website?: string | null;
    email?: string | null;
    phone?: string | null;
    source?: string | null;
    productInterest?: string | null;
    region?: string | null;
    city?: string | null;
    value?: number | null;
    score?: string | null;
    pipelineId?: string;
    stageId?: string;
    ownerId?: string | null;
    accountId?: string | null;
    tags?: string | null;
  }
) {
  const [updated] = await db
    .update(leads)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(leads.id, leadId))
    .returning();
  revalidatePath("/leads");
  revalidatePath("/");
  return updated;
}

export async function deleteLead(leadId: string) {
  await db.delete(leads).where(eq(leads.id, leadId));
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function updateLeadOwner(leadId: string, ownerId: string | null) {
  const [updated] = await db
    .update(leads)
    .set({ ownerId, updatedAt: new Date() })
    .where(eq(leads.id, leadId))
    .returning();
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
  return updated;
}

export async function bulkUpdateLeadOwners(leadIds: string[], ownerId: string | null) {
  if (!leadIds.length) return [];
  const updated = await db
    .update(leads)
    .set({ ownerId, updatedAt: new Date() })
    .where(inArray(leads.id, leadIds))
    .returning();
  revalidatePath("/leads");
  revalidatePath("/");
  return updated;
}

export async function updateDealOwner(dealId: string, ownerId: string | null) {
  const [updated] = await db
    .update(deals)
    .set({ ownerId, updatedAt: new Date() })
    .where(eq(deals.id, dealId))
    .returning();
  revalidatePath("/pipeline");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/");
  return updated;
}

export async function bulkUpdateDealOwners(dealIds: string[], ownerId: string | null) {
  if (!dealIds.length) return [];
  const updated = await db
    .update(deals)
    .set({ ownerId, updatedAt: new Date() })
    .where(inArray(deals.id, dealIds))
    .returning();
  revalidatePath("/pipeline");
  revalidatePath("/");
  return updated;
}

// ---------- Lead Tags & Section Reassignment ----------

export async function updateLeadTags(leadId: string, tags: string[]) {
  const [updated] = await db
    .update(leads)
    .set({ tags: JSON.stringify(tags), updatedAt: new Date() })
    .where(eq(leads.id, leadId))
    .returning();
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return updated;
}

export async function bulkUpdateLeadTags(leadIds: string[], tagsToAdd: string[]) {
  if (!leadIds.length || !tagsToAdd.length) return [];
  const existingLeads = await db.query.leads.findMany({
    where: inArray(leads.id, leadIds),
  });

  const updates = existingLeads.map(async (lead) => {
    let currentTags: string[] = [];
    try {
      if (lead.tags) currentTags = JSON.parse(lead.tags);
    } catch {}
    const combined = Array.from(new Set([...currentTags, ...tagsToAdd]));
    return db
      .update(leads)
      .set({ tags: JSON.stringify(combined), updatedAt: new Date() })
      .where(eq(leads.id, lead.id))
      .returning();
  });

  const results = await Promise.all(updates);
  revalidatePath("/leads");
  return results.flat();
}

export async function updateLeadPipeline(leadId: string, pipelineId: string, stageId?: string) {
  let targetStageId = stageId;
  if (!targetStageId) {
    const pipeline = await db.query.pipelines.findFirst({
      where: eq(pipelines.id, pipelineId),
      with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
    });
    if (pipeline && pipeline.stages.length > 0) {
      targetStageId = pipeline.stages[0].id;
    }
  }

  const [updated] = await db
    .update(leads)
    .set({
      pipelineId,
      stageId: targetStageId,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, leadId))
    .returning();

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
  return updated;
}

export async function bulkUpdateLeadPipeline(leadIds: string[], pipelineId: string, stageId?: string) {
  if (!leadIds.length) return [];
  let targetStageId = stageId;
  if (!targetStageId) {
    const pipeline = await db.query.pipelines.findFirst({
      where: eq(pipelines.id, pipelineId),
      with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
    });
    if (pipeline && pipeline.stages.length > 0) {
      targetStageId = pipeline.stages[0].id;
    }
  }

  const updated = await db
    .update(leads)
    .set({
      pipelineId,
      stageId: targetStageId,
      updatedAt: new Date(),
    })
    .where(inArray(leads.id, leadIds))
    .returning();

  revalidatePath("/leads");
  revalidatePath("/");
  return updated;
}


export async function logLeadActivity(input: {
  leadId: string;
  type: "CALL" | "MEETING" | "NOTE" | "EMAIL";
  notes: string;
  userId?: string;
}) {
  await db.insert(activities).values({
    leadId: input.leadId,
    type: input.type,
    notes: input.notes,
    userId: input.userId,
  });
  revalidatePath("/leads");
}

// Bulk import, used by the "Import from file" button on the Leads page.
// Accepts already-parsed rows (client parses the CSV/XLSX with the xlsx
// library, since that's free-tier and needs no server-side file storage).
// Column names are matched case-insensitively and loosely, so a HubSpot
// "Export contacts" CSV or a plain spreadsheet both work without the user
// needing to rename headers first.
const IMPORT_COLUMN_ALIASES: Record<string, string[]> = {
  contactName: ["name", "contact name", "contact", "full name", "lead name", "person", "lead", "contact person"],
  title: ["title", "job title", "designation", "role", "position", "job", "headline", "job designation", "occupation"],
  company: ["company", "company name", "account", "account name", "organization", "org", "business", "firm", "employer"],
  website: ["website", "company website", "url", "web", "domain", "site", "company url", "homepage", "web url"],
  email: ["email", "email address", "e-mail", "mail", "contact email", "primary email"],
  phone: ["phone", "phone number", "mobile", "tel", "telephone", "contact number", "cell", "whatsapp"],
  value: ["value", "lead value", "deal value", "amount", "budget", "estimated value", "revenue", "potential value", "expected value", "worth"],
  source: ["source", "lead source", "channel", "origin", "campaign", "event"],
  productInterest: ["product interest", "product", "interest", "service", "item", "solution"],
  region: ["region", "country", "location", "state", "market"],
  city: ["city", "town", "metro", "address"],
  score: ["score", "temperature", "rating", "lead score", "status", "priority"],
  notes: ["notes", "note", "comment", "comments", "description", "details", "remark", "remarks", "feedback", "summary", "memo"],
};

function matchColumn(row: Record<string, unknown>, field: string): string | undefined {
  const aliases = IMPORT_COLUMN_ALIASES[field] ?? [field];
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const key = keys.find((k) => k.trim().toLowerCase() === alias);
    if (key && row[key] != null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  return undefined;
}

export type BulkImportOptions = {
  pipelineId: string;
  stageId: string;
  rows: Record<string, unknown>[];
  fieldMappings?: Record<string, string>; // fileColumn -> targetField
  selectedColumns?: string[];             // checked file columns
  defaultSource?: string;
  defaultOwnerId?: string;
  defaultTags?: string[];
};

export async function bulkImportLeads(
  param1: string | BulkImportOptions,
  param2?: string,
  param3?: Record<string, unknown>[]
) {
  let pipelineId: string;
  let stageId: string;
  let rows: Record<string, unknown>[];
  let fieldMappings: Record<string, string> | undefined;
  let selectedColumns: string[] | undefined;
  let defaultSource: string | undefined;
  let defaultOwnerId: string | undefined;
  let defaultTags: string[] | undefined;

  if (typeof param1 === "object" && param1 !== null && "rows" in param1) {
    pipelineId = param1.pipelineId;
    stageId = param1.stageId;
    rows = param1.rows;
    fieldMappings = param1.fieldMappings;
    selectedColumns = param1.selectedColumns;
    defaultSource = param1.defaultSource;
    defaultOwnerId = param1.defaultOwnerId;
    defaultTags = param1.defaultTags;
  } else {
    pipelineId = param1 as string;
    stageId = param2 as string;
    rows = param3 || [];
  }

  let importedCount = 0;
  let skippedCount = 0;
  let notesAdded = 0;

  for (const row of rows) {
    let contactName: string | undefined;
    let title: string | undefined;
    let company: string | undefined;
    let website: string | undefined;
    let email: string | undefined;
    let phone: string | undefined;
    let source: string | undefined = defaultSource || "Import";
    let productInterest: string | undefined;
    let region: string | undefined;
    let city: string | undefined;
    let value: number | undefined;
    let score: string | undefined;
    let tags: string[] = [...(defaultTags || [])];
    let noteText: string | undefined;

    if (fieldMappings && selectedColumns) {
      for (const col of selectedColumns) {
        const targetField = fieldMappings[col];
        if (!targetField || targetField === "skip") continue;
        const val = row[col] != null ? String(row[col]).trim() : "";
        if (!val) continue;

        if (targetField === "contactName") contactName = val;
        else if (targetField === "title") title = val;
        else if (targetField === "company") company = val;
        else if (targetField === "website") website = val;
        else if (targetField === "email") email = val;
        else if (targetField === "phone") phone = val;
        else if (targetField === "source") source = val;
        else if (targetField === "productInterest") productInterest = val;
        else if (targetField === "region") region = val;
        else if (targetField === "city") city = val;
        else if (targetField === "value") {
          const parsedNum = parseFloat(val.replace(/[^0-9.-]+/g, ""));
          if (!isNaN(parsedNum)) value = parsedNum;
        } else if (targetField === "score") {
          const lower = val.toLowerCase();
          if (lower.includes("hot")) score = "hot";
          else if (lower.includes("warm")) score = "warm";
          else if (lower.includes("cold")) score = "cold";
          else score = val;
        } else if (targetField === "tags") {
          tags.push(val);
        } else if (targetField === "notes") {
          noteText = noteText ? `${noteText}\n${val}` : val;
        }
      }
    } else {
      contactName = matchColumn(row, "contactName");
      title = matchColumn(row, "title");
      company = matchColumn(row, "company");
      website = matchColumn(row, "website");
      email = matchColumn(row, "email");
      phone = matchColumn(row, "phone");
      source = matchColumn(row, "source") ?? defaultSource ?? "Import";
      productInterest = matchColumn(row, "productInterest");
      region = matchColumn(row, "region");
      city = matchColumn(row, "city");
      const rawVal = matchColumn(row, "value");
      if (rawVal) {
        const parsedNum = parseFloat(rawVal.replace(/[^0-9.-]+/g, ""));
        if (!isNaN(parsedNum)) value = parsedNum;
      }
      noteText = matchColumn(row, "notes");
    }

    // Fallback names if missing contactName
    if (!contactName && company) contactName = `${company} Contact`;
    else if (!contactName && email) contactName = email.split("@")[0];

    if (!contactName) {
      skippedCount++;
      continue;
    }

    const [newLead] = await db
      .insert(leads)
      .values({
        contactName,
        title: title || null,
        company: company || null,
        website: website || null,
        email: email || null,
        phone: phone || null,
        source: source || "Import",
        productInterest: productInterest || null,
        region: region || null,
        city: city || null,
        value: value != null ? value : null,
        score: score || null,
        ownerId: defaultOwnerId || null,
        pipelineId,
        stageId,
        tags: tags.length > 0 ? JSON.stringify(tags) : null,
      })
      .returning();

    importedCount++;

    // If note text was mapped, attach as activity note against this lead!
    if (noteText && newLead) {
      await db.insert(activities).values({
        leadId: newLead.id,
        type: "NOTE",
        notes: noteText,
        userId: defaultOwnerId || undefined,
      });
      notesAdded++;
    }
  }

  try {
    revalidatePath("/leads");
    revalidatePath("/reports");
    revalidatePath("/pipeline");
    revalidatePath("/");
  } catch {}

  return { imported: importedCount, skipped: skippedCount, notesAdded };
}

// ---------- Creating / converting deals ----------

export async function createDeal(input: {
  title: string;
  pipelineId: string;
  stageId: string;
  value?: number;
  currency?: string;
  probability?: number;
  expectedClose?: Date;
  accountId?: string;
  newAccountName?: string;
  ownerId?: string;
}) {
  let accountId = input.accountId;
  if (!accountId && input.newAccountName?.trim()) {
    const [acc] = await db
      .insert(accounts)
      .values({ name: input.newAccountName.trim() })
      .returning();
    accountId = acc.id;
  }

  const [deal] = await db
    .insert(deals)
    .values({
      title: input.title,
      pipelineId: input.pipelineId,
      stageId: input.stageId,
      value: input.value,
      currency: input.currency ?? "SAR",
      probability: input.probability ?? 0,
      expectedClose: input.expectedClose,
      accountId,
      ownerId: input.ownerId,
    })
    .returning();

  await db.insert(stageHistory).values({
    dealId: deal.id,
    toStageId: input.stageId,
    value: deal.value,
  });

  revalidatePath("/pipeline");
  revalidatePath("/deals");
  revalidatePath("/");
  return deal;
}

export async function updateDeal(
  dealId: string,
  input: {
    title?: string;
    value?: number | null;
    currency?: string;
    probability?: number | null;
    status?: "OPEN" | "WON" | "LOST";
    lossReason?: string | null;
    expectedClose?: Date | null;
    pipelineId?: string;
    stageId?: string;
    accountId?: string | null;
    ownerId?: string | null;
  }
) {
  const [updated] = await db
    .update(deals)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(deals.id, dealId))
    .returning();
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return updated;
}

export async function deleteDeal(dealId: string) {
  await db.delete(deals).where(eq(deals.id, dealId));
  revalidatePath("/deals");
  revalidatePath("/pipeline");
  revalidatePath("/");
}

export async function updateDealPipeline(dealId: string, pipelineId: string, stageId?: string) {
  let targetStageId = stageId;
  if (!targetStageId) {
    const pipeline = await db.query.pipelines.findFirst({
      where: eq(pipelines.id, pipelineId),
      with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
    });
    if (pipeline && pipeline.stages.length > 0) {
      targetStageId = pipeline.stages[0].id;
    }
  }

  const [updated] = await db
    .update(deals)
    .set({
      pipelineId,
      stageId: targetStageId,
      updatedAt: new Date(),
    })
    .where(eq(deals.id, dealId))
    .returning();
  revalidatePath("/pipeline");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/");
  return updated;
}

export async function setDealStatus(
  dealId: string,
  status: "OPEN" | "WON" | "LOST",
  lossReason?: string
) {
  const [updated] = await db
    .update(deals)
    .set({
      status,
      lossReason: status === "LOST" ? (lossReason ?? "Marked as lost") : null,
      updatedAt: new Date(),
    })
    .where(eq(deals.id, dealId))
    .returning();

  await db.insert(activities).values({
    type: "NOTE",
    notes:
      status === "WON"
        ? "Deal marked as WON 🎉"
        : status === "LOST"
          ? `Deal marked as LOST (${lossReason || "No reason specified"})`
          : "Deal reopened as OPEN",
    dealId,
  });

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return updated;
}

// Turns a lead into a deal in one step: creates the deal (in the given deal
// pipeline/stage), logs an activity on the new deal noting where it came
// from, and moves the source lead into a terminal "converted" stage if the
// lead pipeline has one with that name, otherwise leaves the lead as-is.
export async function convertLeadToDeal(input: {
  leadId: string;
  pipelineId: string;
  stageId: string;
  value?: number;
  currency?: string;
  ownerId?: string;
}) {
  const [lead] = await db.select().from(leads).where(eq(leads.id, input.leadId));
  if (!lead) throw new Error("Lead not found");

  const deal = await createDeal({
    title: lead.company ? `${lead.company} — ${lead.contactName}` : lead.contactName,
    pipelineId: input.pipelineId,
    stageId: input.stageId,
    value: input.value,
    currency: input.currency,
    accountId: lead.accountId ?? undefined,
    newAccountName: !lead.accountId && lead.company ? lead.company : undefined,
    ownerId: input.ownerId ?? lead.ownerId ?? undefined,
  });

  await db.insert(activities).values({
    type: "NOTE",
    notes: `Converted from lead "${lead.contactName}"${lead.source ? ` (source: ${lead.source})` : ""}.`,
    dealId: deal.id,
    userId: input.ownerId ?? lead.ownerId ?? undefined,
  });

  const convertedStage = await db.query.stages.findFirst({
    where: (s, { eq, and: andOp }) =>
      andOp(eq(s.pipelineId, lead.pipelineId ?? ""), eq(s.name, "Converted")),
  });
  if (convertedStage) {
    await moveLeadStage(lead.id, convertedStage.id);
  }

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return deal;
}

// ---------- Contacts ----------

export async function createContact(input: {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  accountId?: string;
  newAccountName?: string;
}) {
  let accountId = input.accountId;
  if (!accountId && input.newAccountName?.trim()) {
    const [acc] = await db
      .insert(accounts)
      .values({ name: input.newAccountName.trim() })
      .returning();
    accountId = acc.id;
  }

  await db.insert(contacts).values({
    name: input.name,
    title: input.title,
    email: input.email,
    phone: input.phone,
    accountId,
  });
  revalidatePath("/contacts");
}

export async function updateContact(
  contactId: string,
  input: {
    name?: string;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    accountId?: string | null;
  }
) {
  const [updated] = await db
    .update(contacts)
    .set(input)
    .where(eq(contacts.id, contactId))
    .returning();
  revalidatePath("/contacts");
  return updated;
}

export async function deleteContact(contactId: string) {
  await db.delete(contacts).where(eq(contacts.id, contactId));
  revalidatePath("/contacts");
}

// ---------- Deal detail: activities, tasks, notes ----------

export async function logActivity(input: {
  dealId?: string;
  contactId?: string;
  leadId?: string;
  type: "CALL" | "MEETING" | "NOTE" | "EMAIL";
  notes: string;
  userId?: string;
}) {
  await db.insert(activities).values({
    dealId: input.dealId,
    contactId: input.contactId,
    leadId: input.leadId,
    type: input.type,
    notes: input.notes,
    userId: input.userId,
  });
  if (input.dealId) revalidatePath(`/deals/${input.dealId}`);
  if (input.contactId) {
    revalidatePath("/contacts");
    revalidatePath(`/contacts/${input.contactId}`);
  }
  if (input.leadId) revalidatePath("/pipeline");
}

export async function addTask(input: {
  dealId: string;
  title: string;
  dueDate?: Date;
  description?: string;
  priority?: string;
}) {
  const [task] = await db
    .insert(tasks)
    .values({
      dealId: input.dealId,
      title: input.title,
      description: input.description,
      priority: input.priority ?? "MEDIUM",
      dueDate: input.dueDate,
    })
    .returning();
  revalidatePath(`/deals/${input.dealId}`);
  revalidatePath("/tasks");
  revalidatePath("/");
  return task;
}

export async function createTask(input: {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  ownerId?: string;
  dealId?: string;
  leadId?: string;
}) {
  const [task] = await db
    .insert(tasks)
    .values({
      title: input.title,
      description: input.description,
      priority: input.priority ?? "MEDIUM",
      dueDate: input.dueDate,
      ownerId: input.ownerId,
      dealId: input.dealId,
      leadId: input.leadId,
    })
    .returning();
  revalidatePath("/tasks");
  if (input.dealId) revalidatePath(`/deals/${input.dealId}`);
  if (input.leadId) revalidatePath("/leads");
  revalidatePath("/");
  return task;
}

export async function updateTask(
  taskId: string,
  input: {
    title?: string;
    description?: string | null;
    priority?: string;
    dueDate?: Date | null;
    done?: boolean;
    ownerId?: string | null;
    dealId?: string | null;
    leadId?: string | null;
  }
) {
  const [task] = await db
    .update(tasks)
    .set(input)
    .where(eq(tasks.id, taskId))
    .returning();
  revalidatePath("/tasks");
  if (task.dealId) revalidatePath(`/deals/${task.dealId}`);
  if (task.leadId) revalidatePath("/leads");
  revalidatePath("/");
  return task;
}

export async function deleteTask(taskId: string) {
  const [task] = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();
  revalidatePath("/tasks");
  if (task?.dealId) revalidatePath(`/deals/${task.dealId}`);
  if (task?.leadId) revalidatePath("/leads");
  revalidatePath("/");
}

export async function toggleTask(taskId: string, done: boolean) {
  const [task] = await db.update(tasks).set({ done }).where(eq(tasks.id, taskId)).returning();
  revalidatePath("/tasks");
  if (task?.dealId) revalidatePath(`/deals/${task.dealId}`);
  if (task?.leadId) revalidatePath("/leads");
  revalidatePath("/deals");
  revalidatePath("/");
  return task;
}

// ---------- Feedback ----------

export async function submitFeedback(input: {
  type: string;
  message: string;
  rating?: number;
}) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const [res] = await db
    .insert(feedback)
    .values({
      type: input.type,
      message: input.message,
      rating: input.rating,
      userId,
    })
    .returning();
  revalidatePath("/feedback");
  return res;
}

// ---------- Global Search (for Cmd+K Command Palette) ----------

export async function searchGlobal(query: string) {
  const term = query.trim();
  if (!term) return { deals: [], leads: [], contacts: [], tasks: [] };

  const pattern = `%${term}%`;

  const [matchedDeals, matchedLeads, matchedContacts, matchedTasks] = await Promise.all([
    db.query.deals.findMany({
      where: ilike(deals.title, pattern),
      limit: 6,
      with: { account: true, stage: true },
    }),
    db.query.leads.findMany({
      where: or(ilike(leads.contactName, pattern), ilike(leads.company, pattern)),
      limit: 6,
      with: { stage: true },
    }),
    db.query.contacts.findMany({
      where: or(ilike(contacts.name, pattern), ilike(contacts.email, pattern)),
      limit: 6,
      with: { account: true },
    }),
    db.query.tasks.findMany({
      where: ilike(tasks.title, pattern),
      limit: 6,
      with: { deal: true, lead: true },
    }),
  ]);

  return {
    deals: matchedDeals,
    leads: matchedLeads,
    contacts: matchedContacts,
    tasks: matchedTasks,
  };
}

// ---------- Team management ----------

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "REP";
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const [user] = await db
    .insert(users)
    .values({ name: input.name, email: input.email, passwordHash, role: input.role })
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role });
  revalidatePath("/settings/team");
  return user;
}

export async function removeUser(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/settings/team");
}

export async function markTaskDone(taskId: string) {
  await db.update(tasks).set({ done: true }).where(eq(tasks.id, taskId));
  revalidatePath("/");
}

// ---------- On-demand AI: "Analyze & Suggest" button ----------
// Runs exactly once per click. Nothing here is scheduled or repeats on its own.

export async function analyzeDeal(dealId: string) {
  const deal = await db.query.deals.findFirst({
    where: eq(deals.id, dealId),
    with: { account: true, stage: true },
  });
  if (!deal) throw new Error("Deal not found");

  const daysInStage = Math.floor(
    (Date.now() - new Date(deal.stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const signals = {
    title: deal.title,
    stage: deal.stage?.name,
    daysInStage,
    value: deal.value,
    currency: deal.currency,
    account: deal.account?.name,
  };

  let suggestionText: string;
  if (!process.env.OPENAI_API_KEY) {
    suggestionText =
      daysInStage > 7
        ? `This deal has been in ${signals.stage} for ${daysInStage} days with no logged movement. Call ${signals.account} directly rather than emailing again.`
        : `Deal is on track in ${signals.stage}. Confirm next steps with ${signals.account} before it goes quiet.`;
  } else {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `You are a sales assistant. Given this deal's signals, suggest ONE concrete next action in one sentence. Signals: ${JSON.stringify(signals)}`,
          },
        ],
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    suggestionText = data?.choices?.[0]?.message?.content ?? "No suggestion returned.";
  }

  const [saved] = await db
    .insert(aiSuggestions)
    .values({ dealId, suggestion: suggestionText })
    .returning();

  revalidatePath("/deals");
  revalidatePath("/");
  return saved;
}

// ---------- On-demand AI: assistant command box ----------
// One request in, one action taken, one reply out. Never polls or repeats.

export async function runAssistantCommand(command: string, ownerId?: string) {
  let plan: { action: string } = { action: "unknown" };

  if (process.env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              'Map the command to one action: markAllTasksDone, unknown. Reply with strict JSON {"action": string}.',
          },
          { role: "user", content: command },
        ],
        temperature: 0,
      }),
    });
    const data = await res.json();
    try {
      plan = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
    } catch {
      plan = { action: "unknown" };
    }
  } else if (/mark.*(done|complete)/i.test(command) || /complete.*task/i.test(command)) {
    plan = { action: "markAllTasksDone" };
  }

  if (plan.action === "markAllTasksDone") {
    const where = ownerId ? and(eq(tasks.done, false), eq(tasks.ownerId, ownerId)) : eq(tasks.done, false);
    const updated = await db.update(tasks).set({ done: true }).where(where).returning();
    revalidatePath("/");
    return { status: "done", message: `Marked ${updated.length} task(s) done.` };
  }

  return { status: "done", message: "No matching action found for that command." };
}

// ---------- Gmail / Calendar (on demand only, one click = one send) ----------

export async function sendDealEmail(input: {
  dealId: string;
  to: string;
  subject: string;
  body: string;
}) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return { ok: false as const, reason: "not_signed_in" as const };

  const result = await sendGmail(userId, input);
  if (result.ok) {
    await db.insert(activities).values({
      type: "EMAIL",
      notes: `Emailed ${input.to}: "${input.subject}"`,
      dealId: input.dealId,
      userId,
    });
    revalidatePath(`/deals/${input.dealId}`);
  }
  return result;
}

export async function scheduleDealMeeting(input: {
  dealId: string;
  attendeeEmail?: string;
  summary: string;
  startISO: string;
  endISO: string;
}) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return { ok: false as const, reason: "not_signed_in" as const };

  const result = await createCalendarEvent(userId, input);
  if (result.ok) {
    await db.insert(activities).values({
      type: "MEETING",
      notes: `Scheduled "${input.summary}" for ${new Date(input.startISO).toLocaleString()}${
        result.htmlLink ? ` (${result.htmlLink})` : ""
      }`,
      dealId: input.dealId,
      userId,
    });
    revalidatePath(`/deals/${input.dealId}`);
  }
  return result;
}

export async function disconnectGoogleAccount() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return;
  await disconnectGoogle(userId);
  revalidatePath("/settings/integrations");
}
