const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|MERGE|UPSERT|GRANT|REVOKE|EXEC|EXECUTE|COPY|VACUUM|ANALYZE|CALL|DO|SET|RESET|SHOW|COMMENT|LOCK|REFRESH|REINDEX|CLUSTER)\b/i;

export function normalizeSQL(raw: string) {
  return raw
    .replace(/^```(?:sql)?/i, "")
    .replace(/```$/i, "")
    .trim()
    .replace(/;+$/, "");
}

export function validateReadOnlySQL(raw: string, maxRows: number) {
  const sql = normalizeSQL(raw);

  if (!sql) return { allowed: false as const, reason: "The model returned empty SQL." };
  if (!/^(select|with)\b/i.test(sql)) {
    return { allowed: false as const, reason: "Only SELECT/WITH queries are permitted." };
  }
  if (forbidden.test(sql)) {
    return { allowed: false as const, reason: "The query contains a blocked SQL operation." };
  }
  if (sql.includes(";")) {
    return { allowed: false as const, reason: "Multiple SQL statements are not permitted." };
  }
  if (/\bINTO\b/i.test(sql)) {
    return { allowed: false as const, reason: "SELECT INTO is not permitted." };
  }

  const limit = sql.match(/\bLIMIT\s+(\d+)\b/i);
  if (limit && Number(limit[1]) > maxRows) {
    return { allowed: false as const, reason: `LIMIT cannot exceed ${maxRows}.` };
  }

  const finalSQL = limit ? sql : `${sql}\nLIMIT ${maxRows}`;
  return { allowed: true as const, sql: finalSQL };
}

export function referencedTables(sql: string) {
  const found = new Set<string>();
  for (const match of sql.matchAll(/\b(?:from|join)\s+(?:"?([a-zA-Z_][\w]*)"?)\b/gi)) {
    found.add(match[1].toLowerCase());
  }
  return [...found];
}
