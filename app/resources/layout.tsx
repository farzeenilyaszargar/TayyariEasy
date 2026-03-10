import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";

export const metadata: Metadata = {
  title: "JEE Roadmaps, Strategies, and Book Guides",
  description:
    "Access JEE roadmaps and strategies on Tayyari with curated book guides for Physics, Chemistry, and Mathematics.",
  keywords: [
    "jee study materials",
    "jee materials",
    "jee matrials",
    "jee roadmaps",
    "jee strategy",
    "jee study plan",
    "jee book list",
    "jee book guides",
    "tayyari resources"
  ],
  alternates: {
    canonical: `${siteUrl}/resources`
  },
  openGraph: {
    title: "JEE Roadmaps, Strategies, and Book Guides | Tayyari",
    description: "Find JEE roadmaps, strategy articles, and book guides for Physics, Chemistry, and Maths.",
    url: `${siteUrl}/resources`,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "JEE Roadmaps, Strategies, and Book Guides | Tayyari",
    description: "Find JEE roadmaps, strategy articles, and book guides for Physics, Chemistry, and Maths."
  }
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tayyari JEE Resources",
    url: `${siteUrl}/resources`,
    description: "JEE roadmaps, strategy guides, and book guides for Physics, Chemistry, and Mathematics."
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {children}
    </>
  );
}
