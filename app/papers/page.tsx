"use client";

import { Atom, Calculator, FlaskConical, Layers, Sparkles, Timer, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { PaperCard } from "@/components/PaperCard";
import { ProMini } from "@/components/ui";
import { nextWeekReset, quotaFor } from "@/lib/quota";
import type { Subject, TestPaper } from "@/lib/types";

const FILTERS: ("All" | Subject)[] = ["All", "Physics", "Chemistry", "Mathematics"];

function Section({ title, sub, icon: Icon, color, tests }: { title: string; sub: string; icon: LucideIcon; color: string; tests: TestPaper[] }) {
  if (!tests.length) return null;
  return (
    <section>
      <div className="section-title">
        <span className="bubble" style={{ background: color }}><Icon size={20} /></span>
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
        <div>
          <h2>Hi {(user?.name ?? "").split(" ")[0]}! Ready for a paper?</h2>
          <p style={{ marginTop: 4 }}>
            {quota.unlimited ? "Pro: unlimited papers this week." : `${quota.remaining} of ${quota.limit} free papers left this week · resets ${nextWeekReset().toLocaleDateString("en-IN", { weekday: "long" })}`}
          </p>
        </div>
        {pending
          ? <Link href={`/papers/${pending.testId}/attempt?a=${pending.id}`} className="btn btn-white">Resume paper</Link>
          : fresh[0] && <Link href={`/papers/${fresh[0].id}`} className="btn btn-white">Start {fresh[0].kind === "full" ? "mock" : "paper"}</Link>}
      </div>

      {!quota.unlimited && quota.remaining <= 1 && (
        <ProMini text={quota.remaining === 0 ? "You've used this week's free papers. Pro unlocks unlimited papers right now." : "Last free paper this week. Want more? Pro gives you unlimited papers."} />
      )}

      <div className="chips">
        {FILTERS.map((f) => <button key={f} className={`chip-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}
      </div>

      <Section title="New this week" sub="Fresh papers, released every Monday." icon={Sparkles} color="var(--yellow)" tests={fresh} />
      <Section title="Full mock tests" sub="Complete JEE Main papers across Physics, Chemistry and Maths." icon={Layers} color="var(--purple)" tests={by("full")} />
      <Section title="Physics papers" sub="Subject-wise sectionals." icon={Atom} color="var(--blue)" tests={by("subject", "Physics")} />
      <Section title="Chemistry papers" sub="Subject-wise sectionals." icon={FlaskConical} color="var(--green)" tests={by("subject", "Chemistry")} />
      <Section title="Maths papers" sub="Subject-wise sectionals." icon={Calculator} color="var(--orange)" tests={by("subject", "Mathematics")} />
      <Section title="Chapter sprints" sub="Short papers on one topic, perfect for 10 free minutes." icon={Timer} color="var(--red)" tests={by("chapter")} />
    </div>
  );
}
