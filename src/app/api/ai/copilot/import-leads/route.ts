import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { pipelines, stages } from "@/db/schema";
import { bulkImportLeads } from "@/app/actions";

export const dynamic = "force-dynamic";

function tagsFromPrompt(prompt: string) {
  const tags = new Set<string>();
  const lower = prompt.toLowerCase();

  if (lower.includes("leap")) tags.add("LEAP Leads");

  const labelMatches = prompt.matchAll(/(?:label|tag|mark)\s+(?:them\s+)?(?:as\s+)?["']?([^"',.]+)["']?/gi);
  for (const match of labelMatches) {
    const value = match[1]?.trim();
    if (value && value.length <= 40) tags.add(value);
  }

  return Array.from(tags);
}

function sourceFromPrompt(prompt: string, fileName: string) {
  if (/leap/i.test(prompt)) return "LEAP";
  const sourceMatch = prompt.match(/(?:source|from|event)\s+(?:is\s+|as\s+)?["']?([^"',.]+)["']?/i);
  return sourceMatch?.[1]?.trim() || `AI Import - ${fileName.replace(/\.[^/.]+$/, "")}`;
}

function requestedSectionName(prompt: string) {
  const match =
    prompt.match(/(?:move|put|add|import|save|send)?\s*(?:it|this|them|lead|leads|contacts|data)?\s*(?:to|into|in|under)\s+["']?([a-z0-9 &/.-]{2,60})["']?\s+section/i) ||
    prompt.match(/section\s+["']?([a-z0-9 &/.-]{2,60})["']?/i);
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

async function getTargetLeadPipeline(prompt: string) {
  const sectionName = requestedSectionName(prompt);
  if (sectionName) {
    const allLeadPipelines = await db.query.pipelines.findMany({
      where: eq(pipelines.type, "LEAD"),
      with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
      orderBy: [asc(pipelines.createdAt)],
    });

    const normalized = sectionName.toLowerCase();
    const matched = allLeadPipelines.find(
      (pipeline) =>
        pipeline.name.toLowerCase() === normalized ||
        pipeline.name.toLowerCase().includes(normalized) ||
        normalized.includes(pipeline.name.toLowerCase())
    );
    if (matched) return matched;

    const [created] = await db.insert(pipelines).values({ name: sectionName, type: "LEAD" }).returning();
    await db.insert(stages).values([
      { pipelineId: created.id, name: "New Contact", order: 0, color: "#3b82f6" },
      { pipelineId: created.id, name: "Contacted", order: 1, color: "#f59e0b" },
      { pipelineId: created.id, name: "Meeting Scheduled", order: 2, color: "#8b5cf6" },
      { pipelineId: created.id, name: "Qualified", order: 3, color: "#10b981" },
    ]);
    return {
      ...created,
      stages: await db.query.stages.findMany({
        where: eq(stages.pipelineId, created.id),
        orderBy: [asc(stages.order)],
      }),
    };
  }

  return (
    (await db.query.pipelines.findFirst({
      where: eq(pipelines.type, "LEAD"),
      with: { stages: { orderBy: (s, { asc }) => asc(s.order) } },
      orderBy: [asc(pipelines.createdAt)],
    })) || null
  );
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Please sign in before importing leads." }, { status: 401 });
    }

    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    const fileName = typeof body.fileName === "string" ? body.fileName : "uploaded-file";
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const fieldMappings =
      body.fieldMappings && typeof body.fieldMappings === "object" ? body.fieldMappings : undefined;
    const selectedColumns = Array.isArray(body.selectedColumns) ? body.selectedColumns : undefined;

    if (rows.length === 0) {
      return NextResponse.json({ error: "The uploaded file did not contain any rows." }, { status: 400 });
    }

    const pipeline = await getTargetLeadPipeline(prompt);

    if (!pipeline) {
      return NextResponse.json({ error: "No lead pipeline exists yet." }, { status: 400 });
    }

    const stage = pipeline.stages?.[0] || null;

    if (!stage) {
      return NextResponse.json({ error: "No lead stage exists in the default pipeline." }, { status: 400 });
    }

    const tags = tagsFromPrompt(prompt);
    const source = sourceFromPrompt(prompt, fileName);

    const result = await bulkImportLeads({
      pipelineId: pipeline.id,
      stageId: stage.id,
      rows,
      fieldMappings,
      selectedColumns,
      defaultSource: source,
      defaultOwnerId: userId,
      defaultTags: tags.length ? tags : undefined,
    });

    return NextResponse.json({
      ...result,
      tags,
      source,
      pipelineName: pipeline.name,
      stageName: stage.name,
      reply:
        `Imported ${result.imported} lead(s) into ${pipeline.name} / ${stage.name}.` +
        (tags.length ? ` Added label(s): ${tags.join(", ")}.` : "") +
        (result.skipped ? ` Skipped ${result.skipped} row(s) without a usable name/company/email.` : "") +
        (result.notesAdded ? ` Attached ${result.notesAdded} note(s).` : ""),
    });
  } catch (error: any) {
    console.error("AI lead import failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to import leads from the uploaded file." },
      { status: 500 }
    );
  }
}
