import { agentErrorResponse, agentJson, requireAgentUser, searchLeads } from "@/lib/agent-control";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAgentUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const results = await searchLeads(q);
    return agentJson({ results });
  } catch (error) {
    return agentErrorResponse(error);
  }
}
