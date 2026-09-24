import OpenAI from "openai";
import { env } from "./env";

const client = new OpenAI({
  apiKey: env.HF_TOKEN,
  baseURL: "https://router.huggingface.co/v1"
});

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    sql: { type: "string" },
    intent: { type: "string" },
    assumptions: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["sql", "intent", "assumptions"]
};

export async function planQuery(question: string, schema: string) {
  const system = `You are DataPilot, a governed enterprise analytics SQL planner.

Your job is to translate a business question into ONE safe PostgreSQL SELECT/WITH query.

Hard rules:
1. Use ONLY tables and columns in the supplied schema.
2. Never invent fields.
3. Never modify data or schema.
4. Never use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, COPY, GRANT, REVOKE, EXEC, CALL, DO, SET, SHOW, or other administrative statements.
5. Never use SELECT *.
6. Use explicit JOIN conditions.
7. Add a LIMIT no greater than ${env.MAX_QUERY_ROWS}.
8. Resolve dates and periods conservatively. If the question is ambiguous, express the ambiguity in assumptions.
9. Revenue should normally be derived from quantity * unit_price when an order_items table exists; do not assume a precomputed revenue column unless the schema contains one.
10. Return JSON matching the requested structure.

SCHEMA:
${schema}`;

  const completion = await client.chat.completions.create({
    model: env.HF_MODEL,
    temperature: 0.05,
    max_tokens: 1000,
    messages: [
      { role: "system", content: system },
      { role: "user", content: question }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "datapilot_query_plan",
        strict: true,
        schema: responseSchema
      }
    }
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("AI_EMPTY_RESPONSE");

  const parsed = JSON.parse(content);
  if (typeof parsed.sql !== "string" || typeof parsed.intent !== "string") {
    throw new Error("AI_INVALID_PLAN");
  }

  return parsed as {
    sql: string;
    intent: string;
    assumptions: string[];
  };
}

export async function explainResult(
  question: string,
  sql: string,
  rows: unknown[],
  intent: string,
  assumptions: string[]
) {
  const prompt = `You are the analytics explanation layer of DataPilot.
Answer the user's business question from the SQL result. Do not invent numbers.
Return JSON with:
{"answer":"short executive answer","insights":["..."],"warnings":["..."]}
Question: ${question}
Intent: ${intent}
Assumptions: ${JSON.stringify(assumptions)}
SQL: ${sql}
Rows: ${JSON.stringify(rows).slice(0, 30000)}`;

  const completion = await client.chat.completions.create({
    model: env.HF_MODEL,
    temperature: 0.1,
    max_tokens: 900,
    messages: [
      { role: "system", content: "You are a precise enterprise data analyst. Use only supplied evidence." },
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "datapilot_analysis",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            answer: { type: "string" },
            insights: { type: "array", items: { type: "string" } },
            warnings: { type: "array", items: { type: "string" } }
          },
          required: ["answer", "insights", "warnings"]
        }
      }
    }
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("AI_EMPTY_ANALYSIS");
  return JSON.parse(content) as {
    answer: string;
    insights: string[];
    warnings: string[];
  };
}
