"use client";

import { useMemo, useState } from "react";
import { resources, type SubjectTag } from "@/lib/data";
import { BookIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, SearchIcon } from "@/components/ui-icons";

const subjects: SubjectTag[] = ["Physics", "Chemistry", "Mathematics"];
const categories = ["Roadmaps", "Strategies", "Notes", "Books", "PYQs"] as const;
const sliderCategories = new Set(["Roadmaps", "Strategies"]);
const cardsPerSlide = 3;

export default function ResourcesPage() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<SubjectTag | "All">("All");
  const [sliderStartByCategory, setSliderStartByCategory] = useState<Record<string, number>>({
    Roadmaps: 0,
    Strategies: 0
  });

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
    <section className="page">
      <div className="page-head">
        <p className="eyebrow">Resources</p>
        <h1>Roadmaps, Strategies, Notes, Books, and PYQs</h1>
      </div>

      <div className="search-row card tests-search-box">
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
            <p className="eyebrow">{section.category}</p>
            <h2>{section.category}</h2>
            {sliderCategories.has(section.category) ? (
              <div className="resource-slider-controls">
                <button
                  type="button"
                  className="resource-slider-btn"
                  aria-label={`Previous ${section.category}`}
                  disabled={(sliderStartByCategory[section.category] ?? 0) <= 0}
                  onClick={() =>
                    setSliderStartByCategory((current) => ({
                      ...current,
                      [section.category]: Math.max((current[section.category] ?? 0) - 1, 0)
                    }))
                  }
                >
                  <ChevronLeftIcon size={16} />
                </button>
                <button
                  type="button"
                  className="resource-slider-btn"
                  aria-label={`Next ${section.category}`}
                  disabled={(sliderStartByCategory[section.category] ?? 0) >= Math.max(section.items.length - cardsPerSlide, 0)}
                  onClick={() =>
                    setSliderStartByCategory((current) => ({
                      ...current,
                      [section.category]: Math.min(
                        (current[section.category] ?? 0) + 1,
                        Math.max(section.items.length - cardsPerSlide, 0)
                      )
                    }))
                  }
                >
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            ) : null}
          </div>

          <div className={sliderCategories.has(section.category) ? "resource-slider-grid" : "grid-2"}>
            {(sliderCategories.has(section.category)
              ? section.items.slice(
                  Math.min(sliderStartByCategory[section.category] ?? 0, Math.max(section.items.length - cardsPerSlide, 0)),
                  Math.min(sliderStartByCategory[section.category] ?? 0, Math.max(section.items.length - cardsPerSlide, 0)) +
                    cardsPerSlide
                )
              : section.items
            ).map((resource) => (
              <article key={resource.title} className="card resource-card resource-rich-card">
                <div className="resource-head">
                  <span className={`tiny-icon subject-dot ${resource.subject.toLowerCase()}`}>{resource.subject[0]}</span>
                  <span className={`subject-tag ${resource.subject.toLowerCase()}`}>{resource.subject}</span>
                  <span className="resource-type">{resource.type}</span>
                </div>
                <h3>{resource.title}</h3>
                <p className="muted">{resource.preview}</p>
                {resource.checklist?.length ? (
                  <ul className="resource-checklist">
                    {resource.checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="resource-foot">
                  <span className="muted">{resource.size}</span>
                  <a
                    className="resource-download"
                    href={resource.href}
                    aria-label={resource.type === "Article" ? `Read ${resource.title}` : `Download ${resource.title}`}
                  >
                    {resource.type === "Article" ? <BookIcon size={16} /> : <DownloadIcon size={16} />}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
