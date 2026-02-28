import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticleResources, slugifyResourceTitle } from "@/lib/data";

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
          <span>SEO Focus: JEE {article.subject}</span>
          <span>Exam improvement article</span>
        </div>
      </header>

      <section className="card resource-article-body">
        <h2>Why this helps your JEE rank</h2>
        <p>
          This guide is designed for aspirants targeting better test accuracy, stronger chapter completion, and better rank
          prediction confidence through consistent execution.
        </p>
        <p>
          Use this article as an actionable weekly document: implement one block at a time, track outcomes in your mock
          analysis, and keep revising weak areas every 48-72 hours.
        </p>

        <h2>Execution Checklist</h2>
        <ul className="resource-article-list">
          {(article.checklist ?? [
            "Set weekly chapter targets and lock revision slots in advance.",
            "Take one timed test block and analyze all mistakes the same day.",
            "Re-attempt weak question types within 3 days."
          ]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>Weekly Plan Template</h2>
        <ul className="resource-article-list">
          <li>Day 1-2: Concept learning and formula consolidation.</li>
          <li>Day 3-4: Mixed problem solving with time constraints.</li>
          <li>Day 5: Chapter test + accuracy and speed audit.</li>
          <li>Day 6: Error-log revision and short drills.</li>
          <li>Day 7: Full-length section simulation and next-week planning.</li>
        </ul>

        <h2>Common mistakes to avoid</h2>
        <ul className="resource-article-list">
          <li>Skipping post-test analysis and moving to new chapters too quickly.</li>
          <li>Over-focusing on content consumption without timed question practice.</li>
          <li>Ignoring low-confidence topics that repeatedly reduce marks.</li>
        </ul>
      </section>

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
