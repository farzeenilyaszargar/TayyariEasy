"use client";

import { useEffect, useState } from "react";
import { fetchTestsCatalog, type TestBlueprintRow } from "@/lib/supabase-db";

export default function AdminBlueprintsPage() {
  const [items, setItems] = useState<TestBlueprintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await fetchTestsCatalog();
        if (alive) {
          setItems(rows);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load blueprints.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="page">
      <div className="page-head">
        <p className="eyebrow">Admin</p>
        <h1>Blueprint Coverage</h1>
      </div>
      <article className="card">
        <h3>Active Blueprints</h3>
        {error ? <p className="muted">{error}</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Scope</th>
                <th>Questions</th>
                <th>Pool</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.scope}</td>
                  <td>{item.question_count}</td>
                  <td>{item.availableQuestions}</td>
                  <td>{item.duration_minutes} min</td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No active blueprints found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
