import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(20),
  HF_TOKEN: z.string().min(1),
  HF_MODEL: z.string().min(1).default("openai/gpt-oss-120b:fastest"),
  MAX_QUERY_ROWS: z.coerce.number().int().min(10).max(1000).default(200),
  QUERY_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(8000),
  MAX_SCHEMA_CHARS: z.coerce.number().int().min(4000).max(100000).default(24000),
  APP_NAME: z.string().default("DataPilot")
});

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  HF_TOKEN: process.env.HF_TOKEN,
  HF_MODEL: process.env.HF_MODEL,
  MAX_QUERY_ROWS: process.env.MAX_QUERY_ROWS,
  QUERY_TIMEOUT_MS: process.env.QUERY_TIMEOUT_MS,
  MAX_SCHEMA_CHARS: process.env.MAX_SCHEMA_CHARS,
  APP_NAME: process.env.APP_NAME
});
