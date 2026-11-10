import { addLeadNote, agentErrorResponse, agentJson, requireAgentUser } from "@/lib/agent-control";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAgentUser();
    const { id } = await params;
    const body = await req.json();
    const result = await addLeadNote({
      userId: user.id,
      leadId: id,
      notes: String(body.notes ?? ""),
      type: body.type,
      dryRun: body.dryRun === true,
    });
    return agentJson(result);
  } catch (error) {
    return agentErrorResponse(error);
  }
}
