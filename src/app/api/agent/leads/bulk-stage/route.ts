import { agentErrorResponse, agentJson, bulkChangeStage, requireAgentUser } from "@/lib/agent-control";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireAgentUser();
    const body = await req.json();
    const result = await bulkChangeStage({
      userId: user.id,
      leadIds: body.leadIds,
      stageId: String(body.stageId ?? ""),
      dryRun: body.dryRun === true,
    });
    return agentJson(result);
  } catch (error) {
    return agentErrorResponse(error);
  }
}
