"use client" ;

import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Result = {
  sql: string;
  intent: string;
  assumptions: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  latencyMs: number;
  analysis: { answer: string; insights: string[]; warnings: string[] };
};

export default function Workspace() {
  const [question, setQuestion] = useState("Which customers generated the most revenue this quarter?");
  const [role, setRole] = useState("Executive");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"insight" | "data" | "sql">("insight");
  const [health, setHealth] = useState("Checking...");
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const key = "datapilot-session";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
    return id;
  }, []);

  async function refreshHealth() {
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      const j = await r.json();
      setHealth(j.ok ? `Neon connected · ${j.model}` : "Backend unavailable");
    } catch {
      setHealth("Backend unavailable");
    }
  }

  async function refreshHistory() {
    try {
      const r = await fetch(`/api/audit?sessionId=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
      const j = await r.json();
      if (j.ok) setHistory(j.rows ?? []);
    } catch {}
  }

  useEffect(() => {
    refreshHealth();
    if (sessionId) refreshHistory();
  }, [sessionId]);

  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, role, sessionId })
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Analysis failed");
      setResult(j);
      setTab("insight");
      refreshHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const chartData = result?.rows?.slice(0, 12).map((row, i) => {
    const entries = Object.entries(row);
    const label = String(row[entries.find(([k, v]) => typeof v === "string")?.[0] ?? entries[0]?.[0]] ?? i + 1);
    const numeric = entries.find(([, v]) => typeof v === "number");
    return { label: label.slice(0, 18), value: numeric ? Number(numeric[1]) : 0 };
  }) ?? [];

  return (
    <main className="workspace">
      <header className="workspaceNav">
        <div className="brand">DataPilot <span>/ Analyst workspace</span></div>
        <div className="status">{health}</div>
      </header>

      <div className="workspaceBody">
        <aside className="sidebar">
          <div className="eyebrow">Workspace</div>
          <div className="sideitem active">Ask Data</div>
          <div className="sideitem">Schema</div>
          <div className="sideitem">Audit history</div>
          <div style={{marginTop:18}} className="eyebrow">Recent questions</div>
          {history.slice(0, 8).map((h, i) => (
            <div className="sideitem" key={i} style={{fontSize:12}}>
              {String(h.question ?? "").slice(0, 52)}
            </div>
          ))}
        </aside>

        <section className="maincard">
          <div className="eyebrow">Live connected analysis</div>
          <h1 style={{marginTop:0,letterSpacing:"-.04em"}}>What do you want to know?</h1>
          <textarea className="query" value={question} onChange={e => setQuestion(e.target.value)} />
          <div className="actions">
            <select className="select" value={role} onChange={e => setRole(e.target.value)}>
              <option>Executive</option>
              <option>Analyst</option>
              <option>Finance</option>
              <option>Sales</option>
            </select>
            <button className="primary" onClick={analyze} disabled={loading}>
              {loading ? "Analyzing live data…" : "Analyze"}
            </button>
            {result && <span className="status">{result.rowCount} rows · {result.latencyMs}ms</span>}
          </div>

          {error && <div className="error">{error}</div>}

          {!result && !error && (
            <div className="empty">
              Your question will be translated using the live database schema and executed against Neon PostgreSQL.
            </div>
          )}

          {result && (
            <div className="result">
              <div className="tabs">
                <button className={`tab ${tab==="insight"?"active":""}`} onClick={() => setTab("insight")}>Insight</button>
                <button className={`tab ${tab==="data"?"active":""}`} onClick={() => setTab("data")}>Result data</button>
                <button className={`tab ${tab==="sql"?"active":""}`} onClick={() => setTab("sql")}>SQL evidence</button>
              </div>

              {tab === "insight" && (
                <>
                  <div className="answer">{result.analysis.answer}</div>
                  <div className="chips">
                    {result.analysis.insights.map((x,i)=><span className="chip" key={i}>{x}</span>)}
                    {result.assumptions.map((x,i)=><span className="chip" key={"a"+i}>Assumption: {x}</span>)}
                  </div>
                  {chartData.some(x => x.value) && (
                    <div style={{height:320,marginTop:28}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#252c37" />
                          <XAxis dataKey="label" stroke="#7d8797" />
                          <YAxis stroke="#7d8797" />
                          <Tooltip />
                          <Bar dataKey="value" fill="#cfd6df" radius={[5,5,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {result.analysis.warnings.length > 0 && <div className="error">{result.analysis.warnings.join(" ")}</div>}
                </>
              )}

              {tab === "data" && (
                <div className="tablewrap" style={{marginTop:18}}>
                  <table>
                    <thead><tr>{Object.keys(result.rows[0] ?? {}).map(k=><th key={k}>{k}</th>)}</tr></thead>
                    <tbody>{result.rows.map((row,i)=><tr key={i}>{Object.keys(result.rows[0] ?? {}).map(k=><td key={k}>{String(row[k] ?? "")}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}

              {tab === "sql" && <pre className="code" style={{marginTop:18}}>{result.sql}</pre>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
