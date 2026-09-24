import { db } from "./db";
import { env } from "./env";

export type Column = {
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
};

export type Table = {
  table_schema: string;
  table_name: string;
};

export async function getPublicSchema() {
  const tables = await db<Table[]>`
    select table_schema, table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name not like 'datapilot_%'
    order by table_name
  `;

  const columns = await db<Column[]>`
    select table_schema, table_name, column_name, data_type, is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name not like 'datapilot_%'
    order by table_name, ordinal_position
  `;

  const relations = await db<{
    table_name: string;
    column_name: string;
    foreign_table_name: string;
    foreign_column_name: string;
  }[]>`
    select
      tc.table_name,
      kcu.column_name,
      ccu.table_name as foreign_table_name,
      ccu.column_name as foreign_column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name
      and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = 'public'
    order by tc.table_name, kcu.column_name
  `;

  return { tables, columns, relations };
}

export function schemaPrompt(schema: Awaited<ReturnType<typeof getPublicSchema>>) {
  const chunks = schema.tables.map(t => {
    const cols = schema.columns
      .filter(c => c.table_name === t.table_name)
      .map(c => `${c.column_name}:${c.data_type}`)
      .join(", ");
    return `${t.table_name}(${cols})`;
  });

  const relationText = schema.relations.length
    ? "\nRELATIONSHIPS:\n" + schema.relations
        .map(r => `${r.table_name}.${r.column_name} -> ${r.foreign_table_name}.${r.foreign_column_name}`)
        .join("\n")
    : "";

  return (`TABLES:\n${chunks.join("\n")}${relationText}`).slice(0, env.MAX_SCHEMA_CHARS);
}
