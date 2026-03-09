import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";

export const metadata: Metadata = {
  title: "JEE Study Materials, Notes, Strategy, and PYQs",
  description:
    "Access JEE study materials on Tayyari including topic notes, roadmaps, strategies, book guidance, and PYQ resources.",
  keywords: [
    "jee study materials",
    "jee materials",
    "jee matrials",
    "jee notes",
    "jee strategy",
    "jee pyq resources",
    "tayyari resources"
  ],
  alternates: {
    canonical: `${siteUrl}/resources`
  },
  openGraph: {
    title: "JEE Study Materials, Notes, Strategy, and PYQs | Tayyari",
    description: "Find JEE notes, strategy articles, roadmaps, and PYQ resources for Physics, Chemistry, and Maths.",
    url: `${siteUrl}/resources`,
    type: "website"
  }
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tayyari JEE Resources",
    url: `${siteUrl}/resources`,
    description: "JEE notes, strategy guides, study roadmaps, and PYQ resources for Physics, Chemistry, and Mathematics."
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {children}
    </>
  );
}
