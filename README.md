# DataPilot — Final Real Enterprise AI Data Analyst

DataPilot is a real Next.js application that connects to **your Neon PostgreSQL database** and uses **Hugging Face Inference Providers** to translate natural-language business questions into governed SQL.

It does not ship a fake answer dataset and it does not require a separate Python backend.

## What happens on every question

1. User asks a business question.
2. DataPilot reads the live public PostgreSQL schema from Neon.
3. Hugging Face receives the schema + question, not database credentials.
4. The model returns a structured SQL plan.
5. Server-side SQL policy rejects non-read-only operations.
6. Server checks referenced tables against the selected application role.
7. Query is executed against Neon.
8. Returned rows become the only evidence available to the explanation model.
9. DataPilot returns answer + insights + assumptions + SQL + rows.
10. Execution is written to `datapilot_audit`.

## Important security boundary

The Hugging Face model never receives `DATABASE_URL`.

The model only proposes SQL. The Next.js server is the enforcement point.

For production, use a dedicated Neon database role for DataPilot with SELECT permission on the tables it needs. Do not use an owner/migration credential as the runtime `DATABASE_URL`.

The included role selector is a product demonstration of authorization policy. For a real multi-user company deployment, replace browser-selected roles with authenticated identity/SSO claims.

## Neon setup

### 1. Create your Neon project

Create a PostgreSQL project in Neon and copy the pooled connection string.

### 2. Create your company schema

DataPilot intentionally does not seed fictional business data.

Instead, connect your real/representative PostgreSQL schema.

The application automatically discovers public tables, columns, and foreign-key relationships.

For first testing, you can create your own small business schema in the Neon SQL Editor. Do not use credentials with write permissions for the deployed application.

### 3. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set:

```env
DATABASE_URL="your_neon_connection_string"
HF_TOKEN="hf_your_token"
HF_MODEL="openai/gpt-oss-120b:fastest"
MAX_QUERY_ROWS="200"
QUERY_TIMEOUT_MS="8000"
MAX_SCHEMA_CHARS="24000"
APP_NAME="DataPilot"
```

Hugging Face requires a token with **Make calls to Inference Providers** permission.

The OpenAI-compatible Hugging Face router is used at:

`https://router.huggingface.co/v1`

The model can be changed through `HF_MODEL` without changing application code.

## Hugging Face

DataPilot uses the OpenAI-compatible chat-completions interface exposed by Hugging Face Inference Providers.

A current documented model example is:

```env
HF_MODEL="openai/gpt-oss-120b:fastest"
```

Hugging Face supports provider routing policies such as `:fastest`, `:cheapest`, and provider-specific suffixes. See the official Hugging Face Inference Providers documentation before changing the model/provider.

## Local setup

```bash
npm install
npm run dev
```

Open:

`http://localhost:3000`

Then:

`http://localhost:3000/workspace`

Health check:

`http://localhost:3000/api/health`

## Vercel deployment

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Framework: Next.js.
4. Add the environment variables from `.env.local` to Vercel.
5. Deploy.

Do NOT commit `.env.local`.

After deployment, open:

`https://YOUR-DOMAIN/api/health`

You want:

```json
{
  "ok": true,
  "database": "connected",
  "ai": "configured"
}
```

## Recommended production database permissions

Create a runtime role in PostgreSQL that has only the required SELECT permissions.

Example pattern:

```sql
REVOKE ALL ON SCHEMA public FROM datapilot_runtime;
GRANT USAGE ON SCHEMA public TO datapilot_runtime;

GRANT SELECT ON TABLE
  customers,
  products,
  orders,
  order_items,
  expenses
TO datapilot_runtime;
```

Adjust the table list to your actual company schema.

Then use that role's connection string as `DATABASE_URL`.

Do not give the runtime role `CREATE`, `ALTER`, `DROP`, or ownership permissions.

## What is real vs configurable

Real:
- Neon connection
- live schema introspection
- Hugging Face inference
- AI-generated SQL
- SQL policy enforcement
- role/table policy
- real PostgreSQL execution
- real result rows
- result explanation grounded in returned rows
- audit persistence
- health checks
- charts from returned data

Configurable for each company:
- database schema
- model/provider
- maximum result rows
- role policy
- authentication/SSO
- business metric definitions
- row-level security

## Current limitations to address before a high-stakes enterprise rollout

This repository is designed as a real working portfolio/product foundation, but enterprise rollout should additionally add:
- real authentication/SSO
- server-side user-to-role mapping
- row-level security for sensitive organizations
- query cancellation/statement timeout at the PostgreSQL role/database level
- SQL AST parsing in addition to lexical policy checks
- metric definitions/semantic layer for company-specific meanings
- evaluation suite with known-answer questions
- rate limiting
- encrypted secrets management
- stronger audit retention/access controls

These are deliberately called out rather than pretending a browser role selector is enterprise identity.
