"use client";

import { useEffect, useMemo, useState } from "react";
import { DownloadIcon, SearchIcon } from "@/components/ui-icons";
import { fetchPublicResources, type ResourceRow, type SubjectTag } from "@/lib/supabase-db";

const subjects: SubjectTag[] = ["Physics", "Chemistry", "Mathematics"];
const categories = ["Roadmaps", "Strategies", "Notes", "Books", "Problems", "PYQs"] as const;

export default function ResourcesPage() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<SubjectTag | "All">("All");
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await fetchPublicResources();
        if (alive) {
          setResources(rows);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load resources from Supabase.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, []);

  const filteredResources = useMemo(
    () =>
      resources.filter(
        (resource) =>
          (resource.title.toLowerCase().includes(query.toLowerCase()) ||
            resource.preview.toLowerCase().includes(query.toLowerCase()) ||
            resource.category.toLowerCase().includes(query.toLowerCase())) &&
          (subject === "All" || resource.subject === subject)
      ),
    [resources, query, subject]
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
        <h1>Roadmaps, Strategies, Notes, Books, Problems, and PYQs</h1>
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

      {loading ? <article className="card">Loading resources from Supabase...</article> : null}
      {error ? <article className="card">{error}</article> : null}
      {!loading && grouped.length === 0 ? <article className="card empty-state">No resources found.</article> : null}

      {grouped.map((section) => (
        <section key={section.category} className="resource-section">
          <div className="section-head">
            <p className="eyebrow">{section.category}</p>
            <h2>{section.category} Library</h2>
          </div>

          <div className="grid-2">
            {section.items.map((resource) => (
              <article key={resource.id} className="card resource-card resource-rich-card">
                <div className="resource-head">
                  <span className={`tiny-icon subject-dot ${resource.subject.toLowerCase()}`}>{resource.subject[0]}</span>
                  <span className={`subject-tag ${resource.subject.toLowerCase()}`}>{resource.subject}</span>
                  <span className="resource-type">{resource.type}</span>
                </div>
                <h3>{resource.title}</h3>
                <p className="muted">{resource.preview}</p>
                <div className="resource-foot">
                  <span className="muted">{resource.size}</span>
                  <a className="resource-download" href={resource.href} aria-label={`Download ${resource.title}`}>
                    <DownloadIcon size={16} />
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
