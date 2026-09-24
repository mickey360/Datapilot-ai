import { neon } from "@neondatabase/serverless";
import { env } from "./env";

export const db = neon(env.DATABASE_URL);

export async function pingDatabase() {
  await db`select 1 as ok`;
  return true;
}

export async function executeReadOnly(sql: string) {
  const started = Date.now();
  const rows = await db.query(sql);
  return {
    rows,
    rowCount: rows.length,
    latencyMs: Date.now() - started
  };
}
