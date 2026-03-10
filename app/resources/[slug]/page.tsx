import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticleResources, getLongformSections, slugifyResourceTitle } from "@/lib/data";
import { RoadmapChecklist } from "@/components/roadmap-checklist";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function buildKeywords(title: string, subject: string, category: string) {
  const base = [
    "JEE preparation",
    "JEE Main strategy",
    "JEE Advanced strategy",
    "JEE roadmap",
    "JEE study plan",
    "improve JEE score",
    "JEE rank improvement",
    "Tayyari resources",
    `${subject} JEE preparation`,
    `${category} for JEE`
  ];

  return [...new Set([...base, ...title.toLowerCase().split(/[\s,-]+/).filter((word) => word.length > 2)])];
}

export function generateStaticParams() {
  return getArticleResources().map((article) => ({
    slug: slugifyResourceTitle(article.title)
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found | Tayyari"
    };
  }

  const title = `${article.title} | Tayyari ${article.category}`;
  const description = article.preview;
  const canonical = `${siteUrl}/resources/${slug}`;
  const keywords = buildKeywords(article.title, article.subject, article.category);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      siteName: "Tayyari"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export default async function ResourceArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const related = getArticleResources()
    .filter((item) => item.title !== article.title && (item.subject === article.subject || item.category === article.category))
    .slice(0, 3);
  const longformSections = getLongformSections(article);
  const isRoadmap = article.category === "Roadmaps";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.preview,
    author: {
      "@type": "Organization",
      name: "Tayyari"
    },
    publisher: {
      "@type": "Organization",
      name: "Tayyari"
    },
    mainEntityOfPage: `${siteUrl}/resources/${slug}`,
    articleSection: article.category,
    keywords: buildKeywords(article.title, article.subject, article.category).join(", ")
  };

  return (
    <article className="page resource-article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="resource-article-head">
        <h1>{article.title}</h1>
        <p className="muted resource-article-subtitle">{article.preview}</p>
        <div className="resource-article-meta">
          <span>{article.size}</span>
          <span>JEE {article.subject}</span>
          <span>Exam improvement guide</span>
        </div>
      </header>

      {isRoadmap ? (
        <section className="card resource-article-body">
          <h2>JEE Main Roadmap Checklist</h2>
          <p className="muted">Check topics as you finish them. Progress is saved automatically.</p>
          <RoadmapChecklist slug={slug} items={article.checklist ?? []} />
        </section>
      ) : (
        <section className="card resource-article-body">
          <h2>Why this helps your JEE rank</h2>
          <p>
            <strong>Focused execution</strong> beats random practice. This guide targets accuracy, chapter completion,
            and consistent mock improvements.
          </p>
          <p>
            <em>Use it like a weekly playbook.</em> Implement one block at a time, track outcomes, and revisit weak areas
            on a fixed cadence.
          </p>

          {longformSections.map((section) => (
            <div key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph, idx) => (
                <p key={`${section.heading}-${idx}`}>{paragraph}</p>
              ))}
            </div>
          ))}

          <h2>Execution Checklist</h2>
          <ul className="resource-article-list">
            {(article.checklist ?? [
              "Set weekly chapter targets and lock revision slots in advance.",
              "Take one timed test block and analyze all mistakes the same day.",
              "Re-attempt weak question types within 3 days."
            ]).map((item) => (
              <li key={item}>
                <strong>{item.split(":")[0]}</strong>
                {item.includes(":") ? `: ${item.split(":").slice(1).join(":").trim()}` : ""}
              </li>
            ))}
          </ul>

          <h2>Weekly Plan Template</h2>
          <ul className="resource-article-list">
            <li>
              <strong>Day 1-2</strong>: Concepts + formula consolidation.
            </li>
            <li>
              <strong>Day 3-4</strong>: Mixed problem solving with time limits.
            </li>
            <li>
              <strong>Day 5</strong>: Chapter test + accuracy and speed audit.
            </li>
            <li>
              <strong>Day 6</strong>: Error-log revision and short drills.
            </li>
            <li>
              <strong>Day 7</strong>: Section simulation + next-week planning.
            </li>
          </ul>

          <h2>Common mistakes to avoid</h2>
          <ul className="resource-article-list">
            <li>
              <strong>Skipping analysis</strong> and jumping to new chapters too quickly.
            </li>
            <li>
              <strong>Only watching content</strong> without timed practice.
            </li>
            <li>
              <strong>Ignoring low-confidence topics</strong> that repeatedly cost marks.
            </li>
          </ul>
        </section>
      )}

      <section className="resource-related">
        <div className="section-head">
          <h2>Continue Reading</h2>
        </div>
        <div className="grid-3">
          {related.map((item) => (
            <Link
              key={item.title}
              className="card resource-related-card"
              href={`/resources/${slugifyResourceTitle(item.title)}`}
            >
              <h3>{item.title}</h3>
              <p className="muted">{item.preview}</p>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
