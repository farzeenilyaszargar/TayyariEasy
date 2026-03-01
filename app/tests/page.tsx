"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/ui-icons";
import { fetchTestsCatalog, launchBlueprintTest, type TestBlueprintRow } from "@/lib/supabase-db";

function rewardFor(test: TestBlueprintRow) {
  return {
    completion: 20,
    correctness: Math.min(30, Math.max(12, Math.round(test.question_count * 0.4)))
  };
}

function BlueprintCard({ blueprint, onLaunch, launching }: { blueprint: TestBlueprintRow; onLaunch: (id: string) => void; launching: boolean }) {
  const reward = rewardFor(blueprint);

  return (
    <article className="test-card test-card-attractive test-card-polished">
      <div className="test-card-head">
        <span className="tiny-icon">{blueprint.scope === "topic" ? "T" : blueprint.scope === "subject" ? "S" : "F"}</span>
        <span className="subject-tag">{blueprint.scope.replace("_", " ")}</span>
      </div>
      <strong>{blueprint.name}</strong>
      <div className="test-stats">
        <span>Questions: {blueprint.question_count}</span>
        <span>Duration: {blueprint.duration_minutes} min</span>
        <span>Pool: {blueprint.availableQuestions}</span>
      </div>
      <div className="test-reward-row">
        <span className="test-xp">+{reward.completion} completion points</span>
        <span className="test-xp">+{reward.correctness} correctness bonus</span>
      </div>
      <div className="test-cta-row">
        <button className="btn btn-solid" onClick={() => onLaunch(blueprint.id)} disabled={blueprint.availableQuestions === 0 || launching}>
          {launching ? "Launching..." : "Attempt (Exam Mode)"}
        </button>
      </div>
    </article>
  );
}

export default function TestsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<TestBlueprintRow[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [launchingId, setLaunchingId] = useState("");

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoadingCatalog(true);
      setCatalogError("");
      try {
        const rows = await fetchTestsCatalog();
        if (alive) {
          setCatalog(rows);
        }
      } catch (error) {
        if (alive) {
          setCatalogError(error instanceof Error ? error.message : "Failed to load tests catalog.");
        }
      } finally {
        if (alive) {
          setLoadingCatalog(false);
        }
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return catalog;
    }
    return catalog.filter((item) => item.name.toLowerCase().includes(q));
  }, [catalog, query]);

  const subjectTests = filtered.filter((item) => item.scope === "subject");
  const topicTests = filtered.filter((item) => item.scope === "topic");
  const fullTests = filtered.filter((item) => item.scope === "full_mock");

  const startTest = async (blueprintId: string) => {
    setLaunchingId(blueprintId);
    setCatalogError("");
    try {
      const session = await launchBlueprintTest(blueprintId);
      const enriched = {
        ...session,
        launchedAt: Date.now()
      };
      window.sessionStorage.setItem("tayyari-active-test", JSON.stringify(enriched));
      router.push("/tests/mock");
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Failed to launch test.");
    } finally {
      setLaunchingId("");
    }
  };

  return (
    <section className="page tests-page-v2">
      <div className="page-head">
        <p className="eyebrow">Tests</p>
        <h1>Subject-wise, Topic-wise, and All India Mock Tests</h1>
      </div>

      <div className="search-row card tests-search-box">
        <div className="search-input-wrap">
          <SearchIcon size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tests by topic, subject, or mock name" />
        </div>
        <p className="muted">Every test has fixed question sets per blueprint to avoid repeated shuffling between attempts.</p>
      </div>

      {loadingCatalog ? <article className="card">Loading test catalog...</article> : null}
      {catalogError ? <article className="card">{catalogError}</article> : null}

      <div className="tests-layout">
        <div className="tests-left-col">
          <section className="card test-section-card">
            <div className="section-head">
              <h2>Subject-wise Tests</h2>
            </div>
            <div className="tests-card-grid">
              {subjectTests.map((test) => (
                <BlueprintCard key={test.id} blueprint={test} onLaunch={startTest} launching={launchingId === test.id} />
              ))}
              {subjectTests.length === 0 ? <p className="muted">No subject-wise tests found.</p> : null}
            </div>
          </section>

          <section className="card test-section-card">
            <div className="section-head">
              <h2>Topic-wise Test Series</h2>
            </div>
            <div className="tests-card-grid tests-card-grid-topic">
              {topicTests.map((test) => (
                <BlueprintCard key={test.id} blueprint={test} onLaunch={startTest} launching={launchingId === test.id} />
              ))}
              {topicTests.length === 0 ? <p className="muted">No topic-wise tests found.</p> : null}
            </div>
          </section>
        </div>

        <aside className="card test-section-card tests-right-col">
          <div className="section-head">
            <h2>Full Syllabus All India Tests</h2>
          </div>
          <div className="tests-card-grid tests-card-grid-full">
            {fullTests.map((test) => (
              <BlueprintCard key={test.id} blueprint={test} onLaunch={startTest} launching={launchingId === test.id} />
            ))}
            {fullTests.length === 0 ? <p className="muted">No full syllabus tests found.</p> : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
