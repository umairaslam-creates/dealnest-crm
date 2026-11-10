import { agentErrorResponse, agentJson, changeLeadSection, requireAgentUser } from "@/lib/agent-control";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAgentUser();
    const { id } = await params;
    const body = await req.json();
    const result = await changeLeadSection({
      userId: user.id,
      leadId: id,
      pipelineId: String(body.pipelineId ?? ""),
      stageId: body.stageId ? String(body.stageId) : undefined,
      dryRun: body.dryRun === true,
    });
    return agentJson(result);
  } catch (error) {
    return agentErrorResponse(error);
  }
}
