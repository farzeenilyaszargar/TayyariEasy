"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Dashboard } from "@/components/dashboard";
import { useAuth } from "@/components/auth-provider";
import { ReviewSlider } from "@/components/review-slider";
import {
  AwardIcon,
  BrainIcon,
  SearchIcon,
  TargetIcon,
  TrendIcon
} from "@/components/ui-icons";
import { fetchSearchIndex } from "@/lib/supabase-db";

const highlights = [
  {
    icon: TrendIcon,
    title: "Rank Intelligence Engine",
    detail: "Track projected AIR bands and score confidence after every test cycle.",
    points: [
      "Live improvement trajectory from your mock history",
      "Topic-level signal on rank movement impact",
      "Confidence flag for stable vs volatile estimates"
    ]
  },
  {
    icon: BrainIcon,
    title: "AI Study Signals",
    detail: "See what to revise next based on mistakes, speed, and accuracy patterns.",
    points: [
      "Mistake clusters grouped by concept type",
      "Priority suggestions for revision sessions",
      "Speed vs accuracy optimization prompts"
    ]
  },
  {
    icon: TargetIcon,
    title: "Exam-Ready Practice",
    detail: "Move from chapter-level drills to full-mock pressure in one workflow.",
    points: [
      "Topic drills for weak-chapter correction",
      "Full mocks for exam endurance and pacing",
      "Post-test analysis loop with next-step actions"
    ]
  }
];

const reviews = [
  {
    name: "Riya K.",
    line: "My mock scores became consistent once I started following the AI analysis cards weekly.",
    rating: 5
  },
  {
    name: "Arjun M.",
    line: "The dashboard is focused and practical. No clutter, just what improves marks.",
    rating: 5
  },
  {
    name: "Mentor, Kota",
    line: "Students use this like a serious prep cockpit, not a distraction app.",
    rating: 4
  },
  {
    name: "Sneha T.",
    line: "The tests and analysis loop made me far more disciplined in revision planning.",
    rating: 5
  },
  {
    name: "Vansh P.",
    line: "I finally know where marks are leaking, and that changed my mock performance quickly.",
    rating: 4
  },
  {
    name: "Faculty Review",
    line: "The platform is serious, simple, and very practical for rank-focused preparation.",
    rating: 5
  }
];

function Hero() {
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const items = await fetchSearchIndex();
        if (alive) {
          setAllItems(items);
        }
      } catch {
        if (alive) {
          setAllItems([]);
        }
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, []);

  const suggestions = useMemo(
    () => allItems.filter((item) => item.toLowerCase().includes(query.toLowerCase())).slice(0, 6),
    [allItems, query]
  );

  return (
    <section className="hero">
      <div className="proof-strip">
        <span>12,000+ aspirants onboard</span>
        <span>91% better test consistency reported</span>
        <span>350+ curated practice assets</span>
      </div>

      <div className="hero-grid">
        <div>
          <p className="eyebrow">Built for serious JEE aspirants</p>
          <h1>
            Make Every Test Count.
            <span className="accent-head">Predict Rank with Confidence.</span>
          </h1>
          <p className="hero-copy">
            Tayyari blends score prediction, structured testing, and AI insights into a high-performance
            preparation workspace that stays clean, fast, and exam-focused.
          </p>
          <div className="hero-actions">
            <Link href="/tests" className="btn btn-solid">
              Start Practicing
            </Link>
            <Link href="/marketing" className="btn btn-outline">
              See Platform Tour
            </Link>
          </div>
        </div>

        <aside className="hero-video" aria-label="Product walkthrough video">
          <div className="video-wrap">
            <video controls preload="metadata" poster="/hero-video-poster.jpg">
              <source src="/hero-product-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </aside>
      </div>

      <div className="search-row card home-search">
        <div className="search-input-wrap">
          <SearchIcon size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tests and resources (chapters, books, mock tests)"
          />
        </div>
        <div className="search-suggestions">
          {suggestions.length === 0 ? (
            <span className="muted">No matches yet</span>
          ) : (
            suggestions.map((item) => (
              <span key={item} className="search-chip">
                {item}
              </span>
            ))
          )}
        </div>
      </div>

      <section className="home-section">
        <div className="section-head">
          <p className="eyebrow">Development Analytics</p>
          <h2>See Progress and Improvement Clearly</h2>
        </div>
        <div className="grid-2">
          <article className="card graph-panel">
            <h3>Weekly Score Growth</h3>
            <svg className="graph-svg" viewBox="0 0 420 190" role="img" aria-label="Score growth line graph">
              <polyline className="graph-axis" points="40,20 40,160 390,160" />
              <polyline className="graph-area" points="40,160 90,130 140,120 190,105 240,90 290,75 340,60 390,45 390,160 40,160" />
              <polyline className="graph-path" points="40,160 90,130 140,120 190,105 240,90 290,75 340,60 390,45" />
            </svg>
            <p className="muted">Average mock score moved from 142 to 198 in the last 8 tracked tests.</p>
          </article>
          <article className="card">
            <h3>Achievements and Badges</h3>
            <ul className="achievement-list">
              <li>
                <span className="badge-pill"><AwardIcon size={14} /> Precision Pilot</span>
                <small>85%+ accuracy in recent mocks</small>
              </li>
              <li>
                <span className="badge-pill"><TrendIcon size={14} /> Consistency Streak</span>
                <small>14-day focused revision streak</small>
              </li>
              <li>
                <span className="badge-pill"><TargetIcon size={14} /> Speed Solver</span>
                <small>50 timed problems under target</small>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <p className="eyebrow">Core Features</p>
          <h2>Market-Leading Tools for Competitive Prep</h2>
        </div>
        <div className="feature-stack">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="feature-row">
                <div className="feature-image-slot">Feature Image</div>
                <div className="feature-copy">
                  <span className="feature-emoji">
                    <Icon size={20} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                  <ul className="feature-bullets">
                    {item.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <p className="eyebrow">Student Reviews</p>
          <h2>Trusted by Aspirants and Mentors</h2>
        </div>
        <ReviewSlider reviews={reviews} />
      </section>

      <section className="cta-banner">
        <h2>Ready to turn preparation into measurable rank gains?</h2>
        <p>Join the platform designed for clarity, consistency, and exam performance.</p>
        <Link href="/tests" className="btn btn-solid">
          Begin Your First Test
        </Link>
      </section>
    </section>
  );
}

export default function Page() {
  const { isLoggedIn } = useAuth();

  return (
    <section className="page">
      {isLoggedIn ? (
        <>
          <div className="page-head">
            <p className="eyebrow">Home Dashboard</p>
            <h1>Your Progress Command Center</h1>
          </div>
          <Dashboard />
        </>
      ) : (
        <Hero />
      )}
    </section>
  );
}
