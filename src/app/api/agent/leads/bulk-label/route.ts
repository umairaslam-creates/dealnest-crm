import { agentErrorResponse, agentJson, bulkAddLabel, requireAgentUser } from "@/lib/agent-control";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireAgentUser();
    const body = await req.json();
    const result = await bulkAddLabel({
      userId: user.id,
      leadIds: body.leadIds,
      label: String(body.label ?? ""),
      dryRun: body.dryRun === true,
    });
    return agentJson(result);
  } catch (error) {
    return agentErrorResponse(error);
  }
}
