import { agentErrorResponse, agentJson, deleteLeadSection, requireAgentUser } from "@/lib/agent-control";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAgentUser();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const result = await deleteLeadSection({
      userId: user.id,
      pipelineId: id,
      dryRun: Boolean(body.dryRun),
      allowMoveLeadsToDefault: Boolean(body.allowMoveLeadsToDefault),
    });
    return agentJson(result);
  } catch (error) {
    return agentErrorResponse(error);
  }
}
