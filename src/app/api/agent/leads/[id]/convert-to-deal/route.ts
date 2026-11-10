import { agentErrorResponse, agentJson, convertLeadViaAgent, requireAgentUser } from "@/lib/agent-control";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAgentUser();
    const { id } = await params;
    const body = await req.json();
    const result = await convertLeadViaAgent({
      userId: user.id,
      leadId: id,
      pipelineId: body.pipelineId ? String(body.pipelineId) : undefined,
      stageId: body.stageId ? String(body.stageId) : undefined,
      value: body.value === undefined || body.value === "" ? undefined : Number(body.value),
      currency: body.currency ? String(body.currency) : undefined,
      dryRun: body.dryRun === true,
    });
    return agentJson(result);
  } catch (error) {
    return agentErrorResponse(error);
  }
}
