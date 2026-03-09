import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";

export const metadata: Metadata = {
  title: "AI Doubt Solver for JEE Physics, Chemistry, and Maths",
  description:
    "Ask JEE doubts in Physics, Chemistry, and Mathematics. Tayyari AI doubt solver gives concise concept explanations and problem-solving help.",
  keywords: [
    "jee doubt solver",
    "ai doubt solving for jee",
    "physics chemistry maths doubts",
    "jee question solving",
    "tayyari ai chatbot"
  ],
  alternates: {
    canonical: `${siteUrl}/problems`
  },
  openGraph: {
    title: "AI Doubt Solver for JEE | Tayyari",
    description: "Resolve JEE concept and numerical doubts with Tayyari AI for Physics, Chemistry, and Mathematics.",
    url: `${siteUrl}/problems`,
    type: "website"
  }
};

export default function ProblemsLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Tayyari AI Doubt Solver",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: `${siteUrl}/problems`,
    description: "AI doubt solving assistant for JEE Main and Advanced preparation."
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {children}
    </>
  );
}
