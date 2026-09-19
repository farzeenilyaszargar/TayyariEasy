"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { resources, slugifyResourceTitle, type SubjectTag } from "@/lib/data";
import { BookIcon, DownloadIcon, SearchIcon } from "@/components/ui-icons";

const subjects: SubjectTag[] = ["Physics", "Chemistry", "Mathematics"];
const categories = ["Roadmaps", "Strategies", "Books"] as const;

export default function ResourcesPage() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<SubjectTag | "All">("All");

  const filteredResources = useMemo(
    () =>
      resources.filter(
        (resource) =>
          (resource.title.toLowerCase().includes(query.toLowerCase()) ||
            resource.preview.toLowerCase().includes(query.toLowerCase()) ||
            resource.category.toLowerCase().includes(query.toLowerCase())) &&
          (subject === "All" || resource.subject === subject)
      ),
    [query, subject]
  );

  const grouped = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          items: filteredResources.filter((item) => item.category === category)
        }))
        .filter((section) => section.items.length > 0),
    [filteredResources]
  );

  return (
    <section className="page resources-page">
      <div className="page-head">
        <p className="result-eyebrow">Preparation library</p>
        <h1>Resources that keep your preparation moving.</h1>
        <p className="muted">Short roadmaps, practical strategies, and curated books for focused JEE revision.</p>
      </div>

      <div className="resources-toolbar">
        <div className="search-input-wrap">
          <SearchIcon size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, category, or topic"
          />
        </div>
        <div className="tag-filter">
          <button className={`subject-tag ${subject === "All" ? "active" : ""}`} onClick={() => setSubject("All")}>
            All
          </button>
          {subjects.map((item) => (
            <button
              key={item}
              className={`subject-tag ${item.toLowerCase()} ${subject === item ? "active" : ""}`}
              onClick={() => setSubject(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? <article className="card empty-state">No resources found.</article> : null}

      {grouped.map((section) => (
        <section key={section.category} className="resource-section">
          <div className="section-head resource-section-head">
            <h2>{section.category}</h2>
            <span className="resource-count">{section.items.length} resources</span>
          </div>

          <div className="resource-grid">
            {section.items.map((resource) =>
              resource.type === "Article" ? (
                <Link
                  key={resource.title}
                  className="card resource-card resource-rich-card resource-card-link"
                  href={`/resources/${slugifyResourceTitle(resource.title)}`}
                  aria-label={`Read ${resource.title}`}
                >
                  <div className="resource-head">
                    <span className={`subject-tag ${resource.subject.toLowerCase()}`}>{resource.subject}</span>
                    <span className="resource-type">{resource.type}</span>
                  </div>
                  <h3>{resource.title}</h3>
                  <p className="muted resource-card-desc">{resource.preview}</p>
                  <div className="resource-foot">
                    <span className="muted">{resource.size}</span>
                    <span className="resource-download" aria-hidden="true">
                      <BookIcon size={16} />
                    </span>
                  </div>
                </Link>
              ) : (
                <article key={resource.title} className="card resource-card resource-rich-card">
                  <div className="resource-head">
                    <span className={`subject-tag ${resource.subject.toLowerCase()}`}>{resource.subject}</span>
                    <span className="resource-type">{resource.type}</span>
                  </div>
                  <h3>{resource.title}</h3>
                  <p className="muted resource-card-desc">{resource.preview}</p>
                  <div className="resource-foot">
                    <span className="muted">{resource.size}</span>
                    <a className="resource-download" href={resource.href} aria-label={`Download ${resource.title}`}>
                      <DownloadIcon size={16} />
                    </a>
                  </div>
                </article>
              )
            )}
          </div>
        </section>
      ))}
    </section>
  );
}
