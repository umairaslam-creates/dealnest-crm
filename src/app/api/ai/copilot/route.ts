import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { processCopilotCommand } from "@/lib/ai/copilot-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        {
          reply: "Please sign in before asking Copilot to change CRM data.",
          actionExecuted: "general_response",
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "A valid prompt is required." },
        { status: 400 }
      );
    }

    const response = await processCopilotCommand(prompt, userId);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Copilot API Error:", error);
    return NextResponse.json(
      {
        reply: `⚠️ An error occurred while executing that action: ${error?.message || "Unknown error"}`,
        actionExecuted: "general_response",
      },
      { status: 500 }
    );
  }
}

