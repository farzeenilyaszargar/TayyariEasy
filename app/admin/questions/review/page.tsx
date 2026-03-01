"use client";

import { useEffect, useState } from "react";
import { fetchReviewQueue, submitReviewDecision, type ReviewQueueRow } from "@/lib/supabase-db";

export default function AdminQuestionReviewPage() {
  const [adminToken, setAdminToken] = useState("");
  const [status, setStatus] = useState<"open" | "approved" | "rejected">("open");
  const [items, setItems] = useState<ReviewQueueRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!adminToken) {
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const rows = await fetchReviewQueue(adminToken, status);
      setItems(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onDecision = async (queueId: string, action: "approved" | "rejected") => {
    setError("");
    setMessage("");
    try {
      await submitReviewDecision({
        adminToken,
        queueId,
        action,
        publish: action === "approved"
      });
      setMessage("Review decision saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review decision.");
    }
  };

  return (
    <section className="page">
      <div className="page-head">
        <p className="eyebrow">Admin</p>
        <h1>Question Review Queue</h1>
      </div>

      <article className="card" style={{ marginBottom: 16 }}>
        <h3>Access</h3>
        <p className="muted">Enter admin review token to load and decide queue items.</p>
        <div className="search-row" style={{ marginTop: 12 }}>
          <input
            value={adminToken}
            onChange={(event) => setAdminToken(event.target.value)}
            placeholder="Admin token"
            type="password"
          />
          <div className="tag-filter">
            <button className={`subject-tag ${status === "open" ? "active" : ""}`} onClick={() => setStatus("open")}>
              Open
            </button>
            <button
              className={`subject-tag ${status === "approved" ? "active" : ""}`}
              onClick={() => setStatus("approved")}
            >
              Approved
            </button>
            <button
              className={`subject-tag ${status === "rejected" ? "active" : ""}`}
              onClick={() => setStatus("rejected")}
            >
              Rejected
            </button>
            <button className="btn btn-solid" onClick={() => void load()}>
              Load Queue
            </button>
          </div>
        </div>
        {error ? <p className="muted">{error}</p> : null}
        {message ? <p className="muted">{message}</p> : null}
      </article>

      <div className="grid-2">
        {loading ? <article className="card">Loading queue...</article> : null}
        {!loading && items.length === 0 ? <article className="card">No queue items found.</article> : null}
        {items.map((item) => (
          <article key={item.id} className="card">
            <p className="eyebrow">
              {item.question_bank?.subject} • {item.question_bank?.topic}
            </p>
            <h3>{item.question_bank?.stem_markdown?.slice(0, 120) || "Question"}</h3>
            <p className="muted">
              Difficulty: {item.question_bank?.difficulty} | Quality: {item.question_bank?.quality_score} | Priority: {item.priority}
            </p>
            <p className="muted">Reasons: {(item.reason_codes || []).join(", ") || "none"}</p>
            <div className="cta-row">
              <button className="btn btn-solid" onClick={() => void onDecision(item.id, "approved")}>
                Approve
              </button>
              <button className="btn btn-outline" onClick={() => void onDecision(item.id, "rejected")}>
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
