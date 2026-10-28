"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { MARKS_CORRECT } from "@/lib/config";
import type { TestPaper } from "@/lib/types";
import { useApp } from "./AppProvider";
import { kindLabel } from "./ui";

const isNew = (d: string) => Date.now() - new Date(d).getTime() < 7 * 864e5;

export function TestList({ tests }: { tests: TestPaper[] }) {
  const { attempts, ready } = useApp();
  if (!ready) return <div className="card muted small">Loading tests…</div>;
  if (!tests.length) return <div className="card empty"><h3>No tests here yet</h3></div>;

  return (
    <div className="card card-tight divider-y">
      {tests.map((t) => {
        const done = attempts.filter((a) => a.testId === t.id && a.submittedAt);
        const best = done.length ? Math.max(...done.map((a) => a.score ?? 0)) : null;
        const pending = attempts.some((a) => a.testId === t.id && !a.submittedAt);
        return (
          <Link key={t.id} href={`/tests/${t.id}`} className="test-row">
            <span className={`subject-dot ${t.subject ? `dot-${t.subject}` : ""}`} />
            <div className="main">
              <div className="title">{t.title}</div>
              <div className="meta num">
                {kindLabel[t.kind]}{t.subject ? ` · ${t.subject}` : " · PCM"} · {t.questionIds.length} questions · {t.durationMin} min
              </div>
            </div>
            {pending ? <span className="tag tag-amber">In progress</span>
              : best !== null ? <span className="tag num">Best {best}/{t.questionIds.length * MARKS_CORRECT}</span>
              : isNew(t.releasedAt) ? <span className="tag tag-accent">New</span> : null}
            <ChevronRight size={16} className="muted" />
          </Link>
        );
      })}
    </div>
  );
}
