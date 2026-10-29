"use client";

import { Clock, FileText } from "lucide-react";
import Link from "next/link";
import type { TestPaper } from "@/lib/types";
import { useApp } from "./AppProvider";
import { IconTile, type IconName } from "./Icon";
import { kindLabel } from "./ui";

const SUBJECT_LOOK: Record<string, [IconName, string]> = {
  Physics: ["atom", "var(--tint-blue)"],
  Chemistry: ["flask", "var(--tint-green)"],
  Mathematics: ["abacus", "var(--tint-amber)"],
};

export function paperLook(t: TestPaper): [IconName, string] {
  if (t.kind === "full") return ["books", "var(--tint-violet)"];
  if (t.kind === "demo") return ["memo", "var(--tint-slate)"];
  return SUBJECT_LOOK[t.subject ?? ""] ?? ["paper", "var(--tint-slate)"];
}

export function PaperIcon({ test, size = 52 }: { test: TestPaper; size?: number }) {
  const [name, tint] = paperLook(test);
  return <IconTile name={name} tint={tint} size={size} />;
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
          : best !== null ? <span className="tag tag-green">Best {best}/{test.questionIds.length * 4}</span>
          : isNew(test.releasedAt) ? <span className="tag tag-blue">New</span> : null}
      </div>
      <div>
        <h3>{test.title}</h3>
        <p className="muted small" style={{ marginTop: 4 }}>{test.description}</p>
      </div>
      <div className="meta row" style={{ gap: 14 }}>
        <span>{kindLabel[test.kind]}</span>
        <span className="row" style={{ gap: 4 }}><FileText size={14} />{test.questionIds.length} questions</span>
        <span className="row" style={{ gap: 4 }}><Clock size={14} />{test.durationMin} min</span>
      </div>
    </Link>
  );
}
