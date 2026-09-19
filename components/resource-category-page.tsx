import Link from "next/link";
import { resources, slugifyResourceTitle } from "@/lib/data";

type ResourceCategory = "articles" | "pyqs" | "free-books";

const pageConfig: Record<ResourceCategory, { title: string; description: string }> = {
  articles: { title: "Articles", description: "Clear roadmaps, revision strategies, and practical JEE preparation guidance." },
  pyqs: { title: "PYQs", description: "Previous year questions to help you understand patterns, weightage, and exam-level thinking." },
  "free-books": { title: "Free Books", description: "Useful books and study material collected in one focused place." }
};

export function ResourceCategoryPage({ category }: { category: ResourceCategory }) {
  const config = pageConfig[category];
  const items = resources.filter((resource) => {
    if (category === "articles") return resource.type === "Article" && resource.category !== "PYQs" && resource.category !== "Books";
    if (category === "pyqs") return resource.category === "PYQs";
    return resource.category === "Books";
  });

  return (
    <section className="page resource-category-page">
      <Link href="/resources" className="resource-back-link">← Resources</Link>
      <div className="page-head">
        <h1>{config.title}</h1>
        <p className="muted">{config.description}</p>
      </div>
      <div className="resource-category-grid">
        {items.length > 0 ? items.map((resource) => (
          resource.type === "Article" ? (
            <Link className="resource-category-card" href={`/resources/${slugifyResourceTitle(resource.title)}`} key={resource.title}>
              <span className={`subject-tag ${resource.subject.toLowerCase()}`}>{resource.subject}</span>
              <h2>{resource.title}</h2>
              <p>{resource.preview}</p>
              <span className="resource-category-action">Read article →</span>
            </Link>
          ) : (
            <article className="resource-category-card" key={resource.title}>
              <span className={`subject-tag ${resource.subject.toLowerCase()}`}>{resource.subject}</span>
              <h2>{resource.title}</h2>
              <p>{resource.preview}</p>
              <a className="resource-category-action" href={resource.href}>Open resource →</a>
            </article>
          )
        )) : (
          <article className="resource-category-card resource-category-empty">
            <h2>More coming soon</h2>
            <p>This library is being curated and will be available here shortly.</p>
          </article>
        )}
      </div>
    </section>
  );
}
