import { addLeadSectionStage, agentErrorResponse, agentJson, requireAgentUser } from "@/lib/agent-control";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAgentUser();
    const { id } = await params;
    const body = await req.json();
    const result = await addLeadSectionStage({
      userId: user.id,
      pipelineId: id,
      name: String(body.name ?? ""),
      dryRun: Boolean(body.dryRun),
    });
    return agentJson(result);
  } catch (error) {
    return agentErrorResponse(error);
  }
}
