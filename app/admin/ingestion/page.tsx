export default function AdminIngestionPage() {
  return (
    <section className="page">
      <div className="page-head">
        <p className="eyebrow">Admin</p>
        <h1>Ingestion Operations</h1>
      </div>
      <article className="card">
        <h3>Worker Integration</h3>
        <p className="muted">
          Use internal endpoints with <code>x-internal-token</code> from your external worker to ingest sources and bulk questions.
        </p>
        <ul className="list-clean">
          <li><code>POST /internal/ingest/source-document</code></li>
          <li><code>POST /internal/ingest/questions/bulk</code></li>
          <li><code>POST /internal/generate/questions</code></li>
          <li><code>POST /internal/review/decision</code></li>
        </ul>
      </article>
    </section>
  );
}
