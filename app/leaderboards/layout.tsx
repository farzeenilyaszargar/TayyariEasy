import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";

export const metadata: Metadata = {
  title: "JEE Leaderboard and Rank Progress",
  description:
    "Track JEE test performance on Tayyari leaderboards. Compare points, streaks, and progress with other aspirants.",
  keywords: [
    "jee leaderboard",
    "jee rank progress",
    "jee preparation leaderboard",
    "mock test ranking",
    "jee main leaderboard",
    "jee advanced leaderboard",
    "jee rank list",
    "tayyari leaderboard"
  ],
  alternates: {
    canonical: `${siteUrl}/leaderboards`
  },
  openGraph: {
    title: "JEE Leaderboard and Rank Progress | Tayyari",
    description: "Compare JEE performance, streaks, and test points on the Tayyari leaderboard.",
    url: `${siteUrl}/leaderboards`,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "JEE Leaderboard and Rank Progress | Tayyari",
    description: "Compare JEE performance, streaks, and test points on the Tayyari leaderboard."
  }
};

export default function LeaderboardsLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tayyari JEE Leaderboard",
    url: `${siteUrl}/leaderboards`,
    description: "Leaderboard for JEE aspirants based on mock test performance, streaks, and consistency."
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {children}
    </>
  );
}
