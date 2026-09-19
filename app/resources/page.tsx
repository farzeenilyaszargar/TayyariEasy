import Link from "next/link";

const resourceLinks = [
  { href: "/resources/articles", title: "Articles", detail: "Roadmaps, revision strategies, and practical preparation guidance.", label: "Read guides" },
  { href: "/resources/pyqs", title: "PYQs", detail: "Previous year questions organized for focused JEE practice.", label: "Browse PYQs" },
  { href: "/resources/free-books", title: "Free Books", detail: "A growing collection of useful books and study material.", label: "Explore books" }
];

export default function ResourcesHubPage() {
  return (
    <section className="page resources-hub-page">
      <div className="page-head">
        <h1>Resources for your next revision session.</h1>
        <p className="muted">Choose a focused library instead of searching through everything at once.</p>
      </div>
      <div className="resources-hub-grid">
        {resourceLinks.map((resource, index) => (
          <Link className="resources-hub-card" href={resource.href} key={resource.href}>
            <span className="resources-hub-index">0{index + 1}</span>
            <h2>{resource.title}</h2>
            <p>{resource.detail}</p>
            <span className="resources-hub-action">{resource.label} →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
