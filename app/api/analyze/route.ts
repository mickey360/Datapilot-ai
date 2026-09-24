import { NextRequest, NextResponse } from "next/server";
import { runQuery, Role } from "@/lib/query";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const started = Date.now();
  let question = "";
  let role: Role = "Executive";
  let sessionId: string | undefined;

  try {
    const body = await req.json();
    question = String(body.question ?? "").trim();
    role = body.role as Role;
    sessionId = typeof body.sessionId === "string" ? body.sessionId : undefined;

    if (!["Executive", "Analyst", "Finance", "Sales"].includes(role)) {
      return NextResponse.json({ ok: false, error: "INVALID_ROLE" }, { status: 400 });
    }

    const result = await runQuery({ question, role, sessionId });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    await writeAudit({
      sessionId,
      role,
      question,
      status: "error",
      error: message,
      latencyMs: Date.now() - started
    });

    const status =
      message.startsWith("PERMISSION_DENIED") ? 403 :
      message === "EMPTY_QUESTION" ? 400 :
      message.startsWith("AI_") ? 503 :
      message.startsWith("DATABASE") ? 503 : 422;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
