"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Dashboard } from "@/components/dashboard";
import { useAuth } from "@/components/auth-provider";
import { ReviewSlider } from "@/components/review-slider";
import {
  BrainIcon,
  TargetIcon,
  TrendIcon
} from "@/components/ui-icons";
import { BADGE_PREVIEWS } from "@/lib/badge-assets";
import { fetchSearchIndex } from "@/lib/supabase-db";

const highlights = [
  {
    icon: TrendIcon,
    title: "Rank Prediction Engine",
    detail:
      "Get a clear rank projection after every mock with confidence-based updates. Track movement quickly and decide your next revision focus with certainty.",
    imageLight: "/f1-light.png",
    imageDark: "/f1-dark.png"
  },
  {
    icon: BrainIcon,
    title: "AI Study Signals",
    detail:
      "AI highlights your biggest score leaks from mistakes, speed, and accuracy patterns. You get practical next actions instead of generic advice.",
    imageLight: "/f2-light.png",
    imageDark: "/f2-dark.png"
  },
  {
    icon: TargetIcon,
    title: "Exam-Ready Practice",
    detail:
      "Switch smoothly from chapter drills to full exam simulations in one workflow. Practice, review, and improve in a loop built for rank gains.",
    imageLight: "/f3-light.png",
    imageDark: "/f3-dark.png"
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
    

      <div className="hero-grid">
        <div>
          <p className="eyebrow">Built for JEE 2026 and 2027 Aspirants</p>
          <h1 className="accent-head-1">
            Score Higher in JEE with Smart Mock Tests.
            <span className="accent-head">Predict Rank, Fix Doubts, and Improve Faster.</span>
          </h1>
          <p className="hero-copy">
            Attempt chapter-wise and full syllabus tests, get rank insights, and solve doubts instantly.
            Tayyari turns daily practice into measurable score improvement.
          </p>
          <div className="hero-actions">
            <Link href="/tests" className="btn btn-solid">
              Start JEE Mock Test
            </Link>
            <Link href="#core-features" className="btn btn-outline">
              See How It Works
            </Link>
          </div>
        </div>

        <aside className="hero-video" aria-label="Product walkthrough video">
          <div className="video-wrap">
            <video preload="metadata" poster="/hero-video-poster.jpg" autoPlay loop muted playsInline>
              <source src="/demo-vid.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </aside>
      </div>

      

      <section className="home-section" id="core-features">
        <div className="section-head">
          <p className="eyebrow">Core Features</p>
          <h2>Market-Leading Tools for Competitive Prep</h2>
        </div>
        <div className="feature-stack">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className={`feature-row ${idx % 2 === 1 ? "feature-row-alt" : ""}`}>
                <div className="feature-image-slot feature-image-theme">
                  <img src={item.imageLight} alt={`${item.title} preview`} className="feature-img feature-img-light" />
                  <img src={item.imageDark} alt={`${item.title} preview`} className="feature-img feature-img-dark" />
                </div>
                <div className="feature-copy">
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

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
          <article className="card badge-card">
            <h3>Achievements and Badges</h3>
            <p className="muted">Hover each badge to see what it means and how to unlock it.</p>
            <div className="badge-preview-grid">
              {BADGE_PREVIEWS.map((badge) => (
                <div key={badge.id} className="badge-preview-item" aria-label={badge.name}>
                  <img
                    src={encodeURI(badge.image)}
                    alt={badge.name}
                    className="badge-image"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/badges/curve%20text.png";
                    }}
                  />
                  <div className="badge-tooltip">
                    <strong>{badge.name}</strong>
                    <small>{badge.how}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>
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
        <Link href="/tests" className="btn btn-solid">
          Begin Your First Test
        </Link>
      </section>
    </section>
  );
}

export default function Page() {
  const { isLoggedIn } = useAuth();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";
  const homeStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Tayyari JEE Preparation Platform",
        url: siteUrl,
        description: "JEE preparation platform with mock tests, rank prediction engine, AI doubt solving, and analytics."
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is Tayyari useful for JEE Main and JEE Advanced preparation?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Tayyari offers topic-wise and full syllabus mock tests, rank prediction, and doubt solving for JEE Main and Advanced."
            }
          },
          {
            "@type": "Question",
            name: "Does Tayyari provide mock tests and rank prediction?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The platform includes JEE mock tests, score analytics, and a rank prediction engine to help track progress."
            }
          }
        ]
      }
    ]
  };

  return (
    <section className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }} />
      {isLoggedIn ? (
        <>
          <div className="page-head dashboard-head">
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
