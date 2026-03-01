"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/ui-icons";
import { fetchTestsCatalog, launchBlueprintTest, type TestBlueprintRow } from "@/lib/supabase-db";

type ScopeFilter = "All" | "topic" | "subject" | "full_mock";

function BlueprintCard({ blueprint, onLaunch }: { blueprint: TestBlueprintRow; onLaunch: (id: string) => void }) {
  return (
    <article className="test-card test-card-attractive">
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
      <div className="test-cta-row">
        <button className="btn btn-solid" onClick={() => onLaunch(blueprint.id)} disabled={blueprint.availableQuestions === 0}>
          Attempt (Exam Mode)
        </button>
      </div>
    </article>
  );
}

export default function TestsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ScopeFilter>("All");
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

  const filtered = useMemo(
    () =>
      catalog.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) &&
          (scope === "All" || item.scope === scope)
      ),
    [catalog, query, scope]
  );

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
    <section className="page">
      <div className="page-head">
        <p className="eyebrow">Tests</p>
        <h1>Topic, Subject, and Full Mock Tests</h1>
      </div>

      <div className="search-row card tests-search-box">
        <div className="search-input-wrap">
          <SearchIcon size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tests" />
        </div>
        <div className="tag-filter">
          <button className={`subject-tag ${scope === "All" ? "active" : ""}`} onClick={() => setScope("All")}>All</button>
          <button className={`subject-tag ${scope === "topic" ? "active" : ""}`} onClick={() => setScope("topic")}>Topic</button>
          <button className={`subject-tag ${scope === "subject" ? "active" : ""}`} onClick={() => setScope("subject")}>Subject</button>
          <button className={`subject-tag ${scope === "full_mock" ? "active" : ""}`} onClick={() => setScope("full_mock")}>Full Mock</button>
        </div>
      </div>

      <article className="card">
        <h3>Available Tests</h3>
        <p className="muted">Launch full-screen exam mode to emulate real test flow.</p>
        {loadingCatalog ? <p className="muted">Loading test catalog...</p> : null}
        {catalogError ? <p className="muted">{catalogError}</p> : null}
        <ul className="test-list">
          {filtered.map((test) => (
            <li key={test.id} style={{ opacity: launchingId && launchingId !== test.id ? 0.75 : 1 }}>
              <BlueprintCard blueprint={test} onLaunch={startTest} />
              {launchingId === test.id ? <p className="muted">Launching exam mode...</p> : null}
            </li>
          ))}
          {!loadingCatalog && filtered.length === 0 ? <li className="empty-state">No tests found.</li> : null}
        </ul>
      </article>
    </section>
  );
}
