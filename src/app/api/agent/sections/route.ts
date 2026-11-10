import {
  agentErrorResponse,
  agentJson,
  createLeadSection,
  listLeadSections,
  requireAgentUser,
} from "@/lib/agent-control";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAgentUser();
    const sections = await listLeadSections();
    return agentJson({ sections });
  } catch (error) {
    return agentErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAgentUser();
    const body = await req.json();
    const result = await createLeadSection({
      userId: user.id,
      name: String(body.name ?? ""),
      dryRun: Boolean(body.dryRun),
    });
    return agentJson(result);
  } catch (error) {
    return agentErrorResponse(error);
  }
}
