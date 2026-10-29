"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { IconTile, type IconName } from "@/components/Icon";
import { PaperCard } from "@/components/PaperCard";
import { ProMini } from "@/components/ui";
import { nextWeekReset, quotaFor } from "@/lib/quota";
import type { Subject, TestPaper } from "@/lib/types";
import { Mark } from "@/components/Mark";

const FILTERS: ("All" | Subject)[] = ["All", "Physics", "Chemistry", "Mathematics"];

function Section({ title, sub, icon, tint, tests }: { title: string; sub: string; icon: IconName; tint: string; tests: TestPaper[] }) {
  if (!tests.length) return null;
  return (
    <section>
      <div className="section-title">
        <IconTile name={icon} tint={tint} size={44} />
        <div><h2>{title}</h2><p className="muted small">{sub}</p></div>
      </div>
      <div className="grid">{tests.map((t) => <PaperCard key={t.id} test={t} />)}</div>
    </section>
  );
}

export default function Papers() {
  const { user, attempts, tests, testMap } = useApp();
  const [filter, setFilter] = useState<"All" | Subject>("All");
  const quota = quotaFor(user, attempts);
  const papers = tests.filter((t) => t.kind !== "demo" && (filter === "All" || t.subject === filter || t.kind === "full"));
  const fresh = papers.filter((t) => Date.now() - new Date(t.releasedAt).getTime() < 7 * 864e5);
  const pending = attempts.find((a) => !a.submittedAt && testMap[a.testId]?.kind !== "demo");
  const by = (kind: string, subject?: Subject) => papers.filter((t) => t.kind === kind && (!subject || t.subject === subject));

  return (
    <div className="page stack">
      <div className="hello">
        <Mark size={260} grain className="hello-mark" />
        <div>
          <h2>Welcome back, <em>{(user?.name ?? "").split(" ")[0]}</em></h2>
          <p style={{ marginTop: 4 }}>
            {quota.unlimited ? "Pro: unlimited papers this week." : `${quota.remaining} of ${quota.limit} free papers left this week · resets ${nextWeekReset().toLocaleDateString("en-IN", { weekday: "long" })}`}
          </p>
        </div>
        {pending
          ? <Link href={`/papers/${pending.testId}/attempt?a=${pending.id}`} className="btn">Resume paper</Link>
          : fresh[0] && <Link href={`/papers/${fresh[0].id}`} className="btn">Start {fresh[0].kind === "full" ? "mock" : "paper"}</Link>}
      </div>

      {!quota.unlimited && quota.remaining <= 1 && (
        <ProMini text={quota.remaining === 0 ? "You've used this week's free papers. Pro unlocks unlimited papers right now." : "Last free paper this week. Want more? Pro gives you unlimited papers."} />
      )}

      <div className="chips">
        {FILTERS.map((f) => <button key={f} className={`chip-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}
      </div>

      <Section title="New this week" sub="Fresh papers, released every Monday." icon="sparkles" tint="var(--tint-amber)" tests={fresh} />
      <Section title="Full mock tests" sub="Complete JEE Main papers across Physics, Chemistry and Maths." icon="books" tint="var(--tint-violet)" tests={by("full")} />
      <Section title="Physics papers" sub="Subject-wise sectionals." icon="atom" tint="var(--tint-blue)" tests={by("subject", "Physics")} />
      <Section title="Chemistry papers" sub="Subject-wise sectionals." icon="flask" tint="var(--tint-green)" tests={by("subject", "Chemistry")} />
      <Section title="Maths papers" sub="Subject-wise sectionals." icon="abacus" tint="var(--tint-amber)" tests={by("subject", "Mathematics")} />
      <Section title="Chapter sprints" sub="Short papers on one topic, perfect for 10 free minutes." icon="stopwatch" tint="var(--tint-rose)" tests={by("chapter")} />
    </div>
  );
}
