import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";

export const metadata: Metadata = {
  title: "JEE Mock Tests and Test Series",
  description:
    "Attempt JEE Main and Advanced mock tests on Tayyari with topic-wise, subject-wise, and full syllabus test series.",
  keywords: [
    "jee mock tests",
    "jee test series",
    "jee main test series",
    "jee advanced mock test",
    "jee main mock tests",
    "jee advanced mock tests",
    "chapter wise tests",
    "subject wise tests",
    "full syllabus mock test",
    "physics chemistry maths mock test",
    "tayyari tests"
  ],
  alternates: {
    canonical: `${siteUrl}/tests`
  },
  openGraph: {
    title: "JEE Mock Tests and Test Series | Tayyari",
    description: "Practice JEE with topic-wise, subject-wise, and full syllabus mock tests.",
    url: `${siteUrl}/tests`,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "JEE Mock Tests and Test Series | Tayyari",
    description: "Practice JEE with topic-wise, subject-wise, and full syllabus mock tests."
  }
};

export default function TestsLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "JEE Mock Tests and Test Series",
    description:
      "Attempt JEE Main and Advanced mock tests with topic-wise, subject-wise, and full syllabus tests on Tayyari.",
    url: `${siteUrl}/tests`,
    isPartOf: {
      "@type": "WebSite",
      name: "Tayyari",
      url: siteUrl
    },
    about: ["JEE preparation", "JEE mock tests", "JEE Main", "JEE Advanced"]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {children}
    </>
  );
}
