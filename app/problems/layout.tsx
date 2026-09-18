import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";

export const metadata: Metadata = {
  title: "JEE Practice Tests",
  description:
    "Practice JEE questions with focused tests and clear score feedback on Tayyari.",
  keywords: [
    "jee question solving",
    "jee mock tests"
  ],
  alternates: {
    canonical: `${siteUrl}/problems`
  },
  openGraph: {
    title: "JEE Practice Tests | Tayyari",
    description: "Practice JEE questions with focused tests and score feedback.",
    url: `${siteUrl}/problems`,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "JEE Practice Tests | Tayyari",
    description: "Practice JEE questions with focused tests and score feedback."
  }
};

export default function ProblemsLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Tayyari JEE Practice",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: `${siteUrl}/tests`,
    description: "Focused JEE practice and test preparation."
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {children}
    </>
  );
}
