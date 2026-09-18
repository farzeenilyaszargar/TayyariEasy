import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";

export const metadata: Metadata = {
  title: "JEE Mock Tests & Test Series for JEE Main and Advanced",
  description:
    "Attempt JEE Main and JEE Advanced mock tests on Tayyari with subject-wise, topic-wise, and full syllabus test series.",
  alternates: {
    canonical: `${siteUrl}/tests`
  },
  openGraph: {
    title: "JEE Mock Tests & Test Series | Tayyari",
    description: "Practice JEE Main and JEE Advanced with topic-wise, subject-wise, and full syllabus mock tests.",
    url: `${siteUrl}/tests`,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "JEE Mock Tests & Test Series | Tayyari",
    description: "Practice JEE Main and JEE Advanced with topic-wise, subject-wise, and full syllabus mock tests."
  }
};

export default function TestsLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "JEE Mock Tests and Test Series",
    description:
      "Attempt JEE Main and JEE Advanced mock tests with topic-wise, subject-wise, and full syllabus tests on Tayyari.",
    url: `${siteUrl}/tests`,
    isPartOf: {
      "@type": "WebSite",
      name: "Tayyari",
      url: siteUrl
    },
    about: ["JEE mock tests", "JEE test series", "JEE Main", "JEE Advanced", "Physics", "Chemistry", "Mathematics"]
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What types of JEE mock tests are available?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tayyari offers subject-wise, topic-wise, and full syllabus tests for JEE Main and JEE Advanced preparation."
        }
      },
      {
        "@type": "Question",
        name: "Are these JEE mock tests useful for JEE Main?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Students can use subject and topic tests for revision, then full syllabus mocks for timed exam practice."
        }
      },
      {
        "@type": "Question",
        name: "How should I use a JEE test series?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Attempt consistently, review the result, record mistakes, and choose the next test based on the weakest area."
        }
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
      {children}
    </>
  );
}
