import { getPublicSchema, schemaPrompt } from "./schema";
import { planQuery, explainResult } from "./ai";
import { executeReadOnly } from "./db";
import { env } from "./env";
import { referencedTables, validateReadOnlySQL } from "./sql-security";
import { writeAudit } from "./audit";

export type Role = "Executive" | "Analyst" | "Finance" | "Sales";

export type QueryRequest = {
  question: string;
  role: Role;
  sessionId?: string;
};

export async function runQuery(input: QueryRequest) {
  const started = Date.now();
  if (!input.question.trim()) throw new Error("EMPTY_QUESTION");

  const schema = await getPublicSchema();
  const plan = await planQuery(input.question, schemaPrompt(schema));

  const tables = referencedTables(plan.sql);
  const policy = validateReadOnlySQL(plan.sql, env.MAX_QUERY_ROWS);
  if (!policy.allowed) throw new Error(`SQL_POLICY:${policy.reason}`);

  // Role filtering is intentionally explicit and conservative.
  // Without authentication, this is a UI policy only; production SSO should map real users to roles.
  const roleDenied: Record<Role, string[]> = {
    Executive: [],
    Analyst: [],
    Finance: [],
    Sales: ["expenses"]
  };
  const denied = tables.filter(t => roleDenied[input.role]?.includes(t));
  if (denied.length) throw new Error(`PERMISSION_DENIED:${denied.join(", ")}`);

  const result = await executeReadOnly(policy.sql);
  if (!result.rowCount) throw new Error("EMPTY_RESULT");

  const analysis = await explainResult(
    input.question,
    policy.sql,
    result.rows,
    plan.intent,
    plan.assumptions
  );

  await writeAudit({
    sessionId: input.sessionId,
    role: input.role,
    question: input.question,
    sql: policy.sql,
    status: "success",
    latencyMs: Date.now() - started
  });

  return {
    ok: true,
    sql: policy.sql,
    intent: plan.intent,
    assumptions: plan.assumptions,
    rows: result.rows,
    rowCount: result.rowCount,
    latencyMs: Date.now() - started,
    analysis
  };
}
