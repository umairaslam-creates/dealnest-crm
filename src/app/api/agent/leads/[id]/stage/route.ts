import { agentErrorResponse, agentJson, changeLeadStage, requireAgentUser } from "@/lib/agent-control";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAgentUser();
    const { id } = await params;
    const body = await req.json();
    const result = await changeLeadStage({
      userId: user.id,
      leadId: id,
      stageId: String(body.stageId ?? ""),
      dryRun: body.dryRun === true,
    });
    return agentJson(result);
  } catch (error) {
    return agentErrorResponse(error);
  }
}
