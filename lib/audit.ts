import { db } from "./db";

let ensured = false;

export async function ensureAuditTable() {
  if (ensured) return;
  await db`
    create table if not exists datapilot_audit (
      id bigserial primary key,
      created_at timestamptz not null default now(),
      session_id text,
      role text not null,
      question text not null,
      sql_text text,
      status text not null,
      error text,
      latency_ms integer
    )
  `;
  ensured = true;
}

export async function writeAudit(input: {
  sessionId?: string;
  role: string;
  question: string;
  sql?: string;
  status: string;
  error?: string;
  latencyMs?: number;
}) {
  try {
    await ensureAuditTable();
    await db`
      insert into datapilot_audit
        (session_id, role, question, sql_text, status, error, latency_ms)
      values
        (${input.sessionId ?? null}, ${input.role}, ${input.question},
         ${input.sql ?? null}, ${input.status}, ${input.error ?? null},
         ${input.latencyMs ?? null})
    `;
  } catch {
    // Analytics should remain available even if audit storage is temporarily unavailable.
  }
}

export async function recentAudit(sessionId?: string) {
  await ensureAuditTable();
  if (sessionId) {
    return db`
      select id, created_at, role, question, sql_text, status, error, latency_ms
      from datapilot_audit
      where session_id = ${sessionId}
      order by created_at desc
      limit 30
    `;
  }
  return db`
    select id, created_at, role, question, sql_text, status, error, latency_ms
    from datapilot_audit
    order by created_at desc
    limit 30
  `;
}
