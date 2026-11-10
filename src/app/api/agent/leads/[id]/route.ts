import {
  agentErrorResponse,
  agentJson,
  getAgentOptions,
  getLeadOrThrow,
  requireAgentUser,
  serializeLead,
} from "@/lib/agent-control";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAgentUser();
    const { id } = await params;
    const [lead, options] = await Promise.all([getLeadOrThrow(id), getAgentOptions()]);
    return agentJson({ lead: serializeLead(lead), options });
  } catch (error) {
    return agentErrorResponse(error);
  }
}
