"use client";

import { BarChart3, ClipboardList, Timer, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/components/AppProvider";
import { TestList } from "@/components/TestList";
import { FREE_TESTS_PER_WEEK } from "@/lib/config";

const FEATURES = [
  { icon: Timer, title: "Real exam interface", text: "Question palette, mark for review, section tabs, +4/−1 marking and a timer that auto-submits." },
  { icon: ClipboardList, title: "Full, subject and chapter tests", text: `${FREE_TESTS_PER_WEEK} free tests every week, with solutions for every question.` },
  { icon: Trophy, title: "Leaderboards", text: "Weekly, all-time and per-paper rankings so you know where you stand." },
  { icon: BarChart3, title: "Detailed analysis", text: "Chapter strengths, time per question and predicted percentile with Pro." },
];

export default function Home() {
  const { user, ready, tests } = useApp();
  const router = useRouter();
  useEffect(() => { if (ready && user) router.replace("/dashboard"); }, [ready, user, router]);

  return (
    <div className="page stack">
      <section className="intro">
        <h1>JEE mock tests that tell you where you stand.</h1>
        <p>Take free JEE Main–pattern tests every week, see your rank against other students, and review every solution.</p>
        <div className="row" style={{ marginTop: 24 }}>
          <Link href="/login" className="btn btn-lg">Start practising</Link>
          <Link href="/tests" className="btn btn-secondary btn-lg">Browse tests</Link>
        </div>
      </section>

      <div className="feature-list">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="feature">
            <Icon size={20} strokeWidth={1.7} />
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>

      <section className="stack-sm">
        <div className="spread">
          <h2>Latest tests</h2>
          <Link href="/tests" className="link small">All tests</Link>
        </div>
        <TestList tests={tests.slice(0, 4)} />
      </section>
    </div>
  );
}
