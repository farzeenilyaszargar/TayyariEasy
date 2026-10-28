"use client";

import { Atom, Calculator, Clock, FileText, FlaskConical, Layers, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { TestPaper } from "@/lib/types";
import { useApp } from "./AppProvider";
import { kindLabel } from "./ui";

const SUBJECT_ICON: Record<string, LucideIcon> = { Physics: Atom, Chemistry: FlaskConical, Mathematics: Calculator };

export function paperColorClass(t: TestPaper) {
  return t.kind === "full" ? "c-full" : t.kind === "demo" ? "c-demo" : `c-${t.subject}`;
}

export function PaperIcon({ test, size = 52 }: { test: TestPaper; size?: number }) {
  const Icon = test.kind === "full" ? Layers : test.kind === "demo" ? FileText : SUBJECT_ICON[test.subject ?? ""] ?? FileText;
  return <span className={`paper-icon ${paperColorClass(test)}`} style={{ width: size, height: size }}><Icon size={size * 0.5} /></span>;
}

const isNew = (d: string) => Date.now() - new Date(d).getTime() < 7 * 864e5;

export function PaperCard({ test }: { test: TestPaper }) {
  const { attempts } = useApp();
  const done = attempts.filter((a) => a.testId === test.id && a.submittedAt);
  const best = done.length ? Math.max(...done.map((a) => a.score ?? 0)) : null;
  const pending = attempts.some((a) => a.testId === test.id && !a.submittedAt);

  return (
    <Link href={`/papers/${test.id}`} className="card card-press paper">
      <div className="spread" style={{ alignItems: "flex-start" }}>
        <PaperIcon test={test} />
        {pending ? <span className="tag tag-yellow">In progress</span>
          : best !== null ? <span className="tag tag-green">Best {best}</span>
          : isNew(test.releasedAt) ? <span className="tag tag-blue">New</span> : null}
      </div>
      <div>
        <h3>{test.title}</h3>
        <p className="muted small" style={{ marginTop: 4 }}>{test.description}</p>
      </div>
      <div className="meta row" style={{ gap: 14 }}>
        <span>{kindLabel[test.kind]}</span>
        <span>{test.questionIds.length} Qs</span>
        <span className="row" style={{ gap: 4 }}><Clock size={14} />{test.durationMin} min</span>
      </div>
    </Link>
  );
}
