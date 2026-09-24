import { NextRequest, NextResponse } from "next/server";
import { recentAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId") ?? undefined;
    return NextResponse.json({ ok: true, rows: await recentAudit(sessionId) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "AUDIT_ERROR" },
      { status: 503 }
    );
  }
}
