"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchIcon, StarIcon } from "@/components/ui-icons";
import { fetchTestsCatalog, type TestBlueprintRow } from "@/lib/supabase-db";
import { useAuth } from "@/components/auth-provider";
import { getStoredSession } from "@/lib/supabase-auth";

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
  const tags = buildCardTags(blueprint);
  const maxAchievablePoints = blueprint.question_count * 4;
  const ready = blueprint.availableQuestions >= blueprint.question_count;

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
        {blueprint.id !== "local-jee-main-seed-90" ? <span className="test-xp test-xp-formula"><StarIcon size={14} />Max Score: {maxAchievablePoints}</span> : null}
      </div>
      {blueprint.id === "local-jee-main-seed-90" ? <p className="test-unscored-note">Practice paper · verified scoring is being prepared</p> : null}
      <div className="test-cta-row">
        <button className="btn btn-solid" onClick={() => onLaunch(blueprint.id)} disabled={launching || !ready}>
          {launching ? "Launching..." : ready ? "Attempt" : "Being prepared"}
        </button>
      </div>
    </article>
  );
}

export default function TestsPage() {
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<TestBlueprintRow[]>([]);
  const [, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [launchingId, setLaunchingId] = useState("");
  const { isLoggedIn } = useAuth();
  const [billing, setBilling] = useState<{ plan: "free" | "pro"; freeTestsRemaining: number } | null>(null);

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

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = getStoredSession()?.accessToken;
    if (!token) return;
    fetch("/api/billing/status", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then(setBilling)
      .catch(() => setBilling(null));
  }, [isLoggedIn]);

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
    if (!isLoggedIn) {
      window.location.assign("/auth?next=/tests");
      return;
    }
    if (blueprintId !== "local-jee-main-seed-90" && billing?.plan === "free" && billing.freeTestsRemaining === 0) {
      window.location.assign("/pricings");
      return;
    }
    setLaunchingId(blueprintId);
    setCatalogError("");
    try {
      window.location.assign(`/tests/mock?blueprint=${encodeURIComponent(blueprintId)}`);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Failed to launch test.");
    } finally {
      setLaunchingId("");
    }
  };

  return (
    <section className="page tests-page-v2">
      <div className="page-head">
        <h1>JEE Test Series</h1>
        <p className="muted tests-lead">Choose the right level of practice, attempt with focus, and use every test to sharpen your next revision.</p>
      </div>
      {billing ? <div className="tests-plan-note"><span>{billing.plan === "pro" ? "Pro lifetime · unlimited tests" : `${billing.freeTestsRemaining} free test left this week`}</span>{billing.plan === "free" ? <a href="/pricings">See Pro · ₹199 lifetime →</a> : null}</div> : null}

      <label className="search-input-wrap tests-search" htmlFor="test-search">
        <SearchIcon size={17} />
        <input id="test-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by subject, topic, or test name" />
      </label>

      <div className="tests-availability-strip" aria-label="Test series overview">
        <span><strong>{fullTests.length}</strong> full mocks</span>
        <span><strong>{fullTests[0]?.question_count ?? 0}</strong> questions</span>
        <span><strong>{fullTests[0]?.duration_minutes ?? 0}</strong> minutes</span>
      </div>

      <section className="tests-primary-section">
        <div className="tests-section-intro">
          <div>
            <span className="tests-section-kicker">Start here</span>
            <h2>Full syllabus mock tests</h2>
          </div>
          <p className="muted">A complete paper to measure your preparation under exam conditions.</p>
        </div>
        <div className="tests-card-grid tests-card-grid-primary">
          {fullTests.map((test) => (
            <BlueprintCard key={test.id} blueprint={test} onLaunch={startTest} launching={launchingId === test.id} />
          ))}
          {fullTests.length === 0 ? <p className="muted">No full syllabus test is available yet.</p> : null}
        </div>
      </section>

      {subjectTests.length > 0 ? (
        <section className="tests-secondary-section">
          <div className="tests-section-intro">
            <div>
              <span className="tests-section-kicker">Focused practice</span>
              <h2>Subject tests</h2>
            </div>
          </div>
          <div className="tests-card-grid">
            {subjectTests.map((test) => (
              <BlueprintCard key={test.id} blueprint={test} onLaunch={startTest} launching={launchingId === test.id} />
            ))}
          </div>
        </section>
      ) : null}

      {topicTests.length > 0 ? (
        <section className="tests-secondary-section">
          <div className="tests-section-intro">
            <div>
              <span className="tests-section-kicker">Targeted practice</span>
              <h2>Topic tests</h2>
            </div>
          </div>
          <div className="tests-card-grid">
            {topicTests.map((test) => (
              <BlueprintCard key={test.id} blueprint={test} onLaunch={startTest} launching={launchingId === test.id} />
            ))}
          </div>
        </section>
      ) : null}

    </section>
  );
}
