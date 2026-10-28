"use client";

import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { TestList } from "@/components/TestList";
import { Notice, PageHead } from "@/components/ui";
import { nextWeekReset, quotaFor } from "@/lib/quota";
import type { Subject, TestKind } from "@/lib/types";

const KINDS: { key: "all" | TestKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "full", label: "Full mocks" },
  { key: "subject", label: "Subject" },
  { key: "chapter", label: "Chapter" },
];
const SUBJECTS: ("all" | Subject)[] = ["all", "Physics", "Chemistry", "Mathematics"];

export default function TestsPage() {
  const { user, attempts, tests } = useApp();
  const [kind, setKind] = useState<"all" | TestKind>("all");
  const [subject, setSubject] = useState<"all" | Subject>("all");
  const quota = quotaFor(user, attempts);
  // full mocks cover every subject, so they stay visible under a subject filter
  const shown = tests.filter((t) => (kind === "all" || t.kind === kind) && (subject === "all" || t.subject === subject || t.kind === "full"));

  return (
    <div className="page stack">
      <PageHead title="Tests" sub="JEE Main pattern · +4 for correct, −1 for wrong." />

      {user && !quota.unlimited && (
        <Notice kind={quota.remaining ? "info" : "warn"}>
          {quota.remaining} of {quota.limit} free tests left this week. Resets {nextWeekReset().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}.
        </Notice>
      )}

      <div className="spread">
        <div className="seg">
          {KINDS.map((k) => <button key={k.key} className={kind === k.key ? "active" : ""} onClick={() => setKind(k.key)}>{k.label}</button>)}
        </div>
        <div className="seg">
          {SUBJECTS.map((s) => <button key={s} className={subject === s ? "active" : ""} onClick={() => setSubject(s)}>{s === "all" ? "All subjects" : s}</button>)}
        </div>
      </div>

      <TestList tests={shown} />
    </div>
  );
}
