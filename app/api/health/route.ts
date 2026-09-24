import { NextResponse } from "next/server";
import { pingDatabase } from "@/lib/db";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    await pingDatabase();
    return NextResponse.json({
      ok: true,
      database: "connected",
      ai: "configured",
      model: env.HF_MODEL
    });
  } catch {
    return NextResponse.json(
      { ok: false, database: "unavailable", ai: "configured", model: env.HF_MODEL },
      { status: 503 }
    );
  }
}
