"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { kindLabel } from "@/components/ui";
import { TESTS } from "@/data/tests";
import { nextWeekReset, quotaFor } from "@/lib/quota";
import type { TestKind } from "@/lib/types";

const FILTERS: { key: "all" | TestKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "full", label: "Full Mocks" },
  { key: "subject", label: "Subject-wise" },
  { key: "chapter", label: "Chapter-wise" },
];

const isNew = (d: string) => Date.now() - new Date(d).getTime() < 7 * 864e5;

export default function TestsPage() {
  const { user, attempts } = useApp();
  const [filter, setFilter] = useState<"all" | TestKind>("all");
  const quota = quotaFor(user, attempts);
  const tests = TESTS.filter((t) => filter === "all" || t.kind === filter)
    .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));

  return (
    <div className="container page stack">
      <div className="spread">
        <div>
          <h1>Mock Tests</h1>
          <p className="muted">Full-length, subject-wise and chapter-wise tests in JEE Main pattern.</p>
        </div>
        {user && (
          quota.unlimited
            ? <span className="chip">Pro · unlimited tests</span>
            : <span className={`chip ${quota.remaining ? "chip-green" : "chip-red"}`}>
                {quota.remaining}/{quota.limit} free tests left this week · resets {nextWeekReset().toLocaleDateString()}
              </span>
        )}
      </div>
      <div className="tabs">
        {FILTERS.map((f) => (
          <button key={f.key} className={`tab ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>
      <div className="grid">
        {tests.map((t) => {
          const done = attempts.filter((a) => a.testId === t.id && a.submittedAt);
          const best = done.length ? Math.max(...done.map((a) => a.score ?? 0)) : null;
          return (
            <Link key={t.id} href={`/tests/${t.id}`} className="card test-card">
              <div className={`stripe ${t.kind === "full" ? "subj-full" : `subj-${t.subject}`}`} />
              <div className="row">
                <span className="chip chip-gray">{kindLabel[t.kind]}</span>
                {t.subject && <span className="chip chip-gray">{t.subject}</span>}
                {isNew(t.releasedAt) && <span className="chip chip-amber">New this week</span>}
              </div>
              <h3>{t.title}</h3>
              <p className="muted small" style={{ margin: 0 }}>{t.description}</p>
              <div className="meta spread">
                <span>{t.questionIds.length} Qs · {t.durationMin} min · {t.questionIds.length * 4} marks</span>
                {best !== null && <span className="chip chip-green">Best {best}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
