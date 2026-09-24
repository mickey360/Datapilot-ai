import Link from "next/link";

export default function Home() {
  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand">DataPilot <span>/ Enterprise AI Data Analyst</span></div>
        <div className="navlinks">
          <a href="#how">How it works</a>
          <a href="#security">Security</a>
          <Link href="/workspace">Open workspace →</Link>
        </div>
      </nav>

      <section className="hero">
        <div>
          <div className="eyebrow">Governed analytics for real company data</div>
          <h1>Ask your data what happened.</h1>
          <p>
            DataPilot connects to your PostgreSQL database, understands its live schema,
            turns business questions into SQL, validates the query, executes it read-only,
            and explains the evidence. No PDF chatbot. No hard-coded answers.
          </p>
          <Link className="cta" href="/workspace">Launch DataPilot →</Link>
        </div>

        <div className="panel preview">
          <div className="previewbar"><span className="dot"/><span className="dot"/><span className="dot"/></div>
          <div className="previewbody">
            <div className="muted">Executive question</div>
            <h3>Which customers generated the most revenue this quarter?</h3>
            <div className="grid">
              <div className="card"><div className="muted">Data source</div><strong>PostgreSQL</strong></div>
              <div className="card"><div className="muted">Policy</div><strong>Read only</strong></div>
              <div className="card"><div className="muted">Evidence</div><strong>SQL + rows</strong></div>
            </div>
            <div style={{marginTop:22}} className="card">
              <div className="muted">Pipeline</div>
              <div style={{marginTop:10}}>Schema → AI plan → policy → database → verification → answer</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="eyebrow">Why it is useful</div>
        <h2>Built around the work analysts actually do.</h2>
        <div className="grid">
          <div className="card"><h3>Live schema</h3><p className="muted">The model receives the structure of your connected database instead of a fictional schema.</p></div>
          <div className="card"><h3>Evidence first</h3><p className="muted">Every answer exposes the generated SQL and returned rows so people can inspect the basis for the conclusion.</p></div>
          <div className="card"><h3>Governed execution</h3><p className="muted">The AI never gets database credentials or direct execution authority. The server validates and executes only read queries.</p></div>
        </div>
      </section>

      <section className="section" id="security">
        <div className="eyebrow">Security boundary</div>
        <h2>The model proposes. The server decides.</h2>
        <p className="heroText muted">
          DataPilot keeps Hugging Face credentials and Neon credentials server-side.
          SQL is checked before execution, row limits are enforced, and analytical activity
          is written to an audit table in the same database.
        </p>
      </section>
    </main>
  );
}
