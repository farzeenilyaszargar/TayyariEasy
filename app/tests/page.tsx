"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "@/components/ui-icons";
import { useAuth } from "@/components/auth-provider";
import { fetchTestsCatalog, launchBlueprintTest, type TestBlueprintRow } from "@/lib/supabase-db";

const GUEST_FREE_TEST_KEY = "tayyari-guest-free-test-used-v1";

function rewardFor(test: TestBlueprintRow) {
  return {
    completion: 20,
    correctness: Math.min(30, Math.max(12, Math.round(test.question_count * 0.4)))
  };
}

type TagTone = "physics" | "chemistry" | "mathematics" | "neutral";

function subjectTone(subject: TestBlueprintRow["subject"]): TagTone {
  if (subject === "Physics") {
    return "physics";
  }
  if (subject === "Chemistry") {
    return "chemistry";
  }
  if (subject === "Mathematics") {
    return "mathematics";
  }
  return "neutral";
}

function buildCardTags(blueprint: TestBlueprintRow): Array<{ label: string; tone: TagTone }> {
  if (blueprint.scope === "topic") {
    return [
      { label: blueprint.subject || "Topic", tone: subjectTone(blueprint.subject) },
      { label: blueprint.topic || "Topic", tone: "neutral" }
    ];
  }

  if (blueprint.scope === "subject") {
    return [{ label: blueprint.subject || "Subject", tone: subjectTone(blueprint.subject) }];
  }

  return [{ label: "Full Syllabus", tone: "neutral" }];
}

function BlueprintCard({ blueprint, onLaunch, launching }: { blueprint: TestBlueprintRow; onLaunch: (id: string) => void; launching: boolean }) {
  const reward = rewardFor(blueprint);
  const tags = buildCardTags(blueprint);

  return (
    <article className="test-card test-card-attractive test-card-polished">
      <div className="test-card-head">
        <div className="test-card-tags">
          {tags.map((tag) => (
            <span key={`${blueprint.id}-${tag.label}`} className={`test-chip ${tag.tone}`}>
              {tag.label}
            </span>
          ))}
        </div>
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
  const { isLoggedIn } = useAuth();
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<TestBlueprintRow[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [launchingId, setLaunchingId] = useState("");
  const [subjectStart, setSubjectStart] = useState(0);
  const [fullStart, setFullStart] = useState(0);
  const topCardsPerPanel = 3;

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

  const subjectVisible = subjectTests.slice(
    Math.min(subjectStart, Math.max(subjectTests.length - topCardsPerPanel, 0)),
    Math.min(subjectStart, Math.max(subjectTests.length - topCardsPerPanel, 0)) + topCardsPerPanel
  );
  const fullVisible = fullTests.slice(
    Math.min(fullStart, Math.max(fullTests.length - topCardsPerPanel, 0)),
    Math.min(fullStart, Math.max(fullTests.length - topCardsPerPanel, 0)) + topCardsPerPanel
  );

  const startTest = async (blueprintId: string) => {
    if (!isLoggedIn) {
      const freeTestUsed = window.localStorage.getItem(GUEST_FREE_TEST_KEY) === "1";
      if (freeTestUsed) {
        setCatalogError("Free guest test already used. Please sign in to continue with unlimited tests.");
        router.push("/login");
        return;
      }
    }

    setLaunchingId(blueprintId);
    setCatalogError("");
    try {
      const session = await launchBlueprintTest(blueprintId);
      const enriched = {
        ...session,
        launchedAt: Date.now()
      };
      window.sessionStorage.setItem("tayyari-active-test", JSON.stringify(enriched));
      if (!isLoggedIn) {
        window.localStorage.setItem(GUEST_FREE_TEST_KEY, "1");
      }
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
        <p className="muted">
          Every test has fixed question sets per blueprint to avoid repeated shuffling between attempts. One free test is available before sign-in.
        </p>
      </div>

      {loadingCatalog ? <article className="card">Loading test catalog...</article> : null}
      {catalogError ? <article className="card">{catalogError}</article> : null}

      <div className="tests-layout-v3">
        <div className="tests-top-row">
          <section className="card test-section-card tests-half-panel">
            <div className="section-head tests-section-head-row">
              <h2>Subject-wise Tests</h2>
              <div className="resource-slider-controls">
                <button
                  type="button"
                  className="resource-slider-btn"
                  aria-label="Previous subject tests"
                  disabled={subjectStart <= 0}
                  onClick={() => setSubjectStart((prev) => Math.max(prev - 1, 0))}
                >
                  <ChevronLeftIcon size={16} />
                </button>
                <button
                  type="button"
                  className="resource-slider-btn"
                  aria-label="Next subject tests"
                  disabled={subjectStart >= Math.max(subjectTests.length - topCardsPerPanel, 0)}
                  onClick={() => setSubjectStart((prev) => Math.min(prev + 1, Math.max(subjectTests.length - topCardsPerPanel, 0)))}
                >
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            </div>
            <div className="tests-card-grid">
              {subjectVisible.map((test) => (
                <BlueprintCard key={test.id} blueprint={test} onLaunch={startTest} launching={launchingId === test.id} />
              ))}
              {subjectTests.length === 0 ? <p className="muted">No subject-wise tests found.</p> : null}
            </div>
          </section>

          <aside className="card test-section-card tests-half-panel">
            <div className="section-head tests-section-head-row">
              <h2>Full Syllabus All India Tests</h2>
              <div className="resource-slider-controls">
                <button
                  type="button"
                  className="resource-slider-btn"
                  aria-label="Previous full tests"
                  disabled={fullStart <= 0}
                  onClick={() => setFullStart((prev) => Math.max(prev - 1, 0))}
                >
                  <ChevronLeftIcon size={16} />
                </button>
                <button
                  type="button"
                  className="resource-slider-btn"
                  aria-label="Next full tests"
                  disabled={fullStart >= Math.max(fullTests.length - topCardsPerPanel, 0)}
                  onClick={() => setFullStart((prev) => Math.min(prev + 1, Math.max(fullTests.length - topCardsPerPanel, 0)))}
                >
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            </div>
            <div className="tests-card-grid">
              {fullVisible.map((test) => (
                <BlueprintCard key={test.id} blueprint={test} onLaunch={startTest} launching={launchingId === test.id} />
              ))}
              {fullTests.length === 0 ? <p className="muted">No full syllabus tests found.</p> : null}
            </div>
          </aside>
        </div>

        <section className="card test-section-card tests-bottom-full">
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
    </section>
  );
}
