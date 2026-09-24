import { NextResponse } from "next/server";
import { getPublicSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getPublicSchema());
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "SCHEMA_ERROR" },
      { status: 503 }
    );
  }
}
