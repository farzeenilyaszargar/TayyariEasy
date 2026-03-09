import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";

export const metadata: Metadata = {
  title: "Tayyari Platform for JEE Preparation",
  description:
    "Explore Tayyari platform features for JEE preparation including mock tests, rank prediction engine, AI analysis, and study resources.",
  keywords: [
    "tayyari",
    "jee preparation platform",
    "jee mock tests app",
    "jee rank prediction engine",
    "jee study platform"
  ],
  alternates: {
    canonical: `${siteUrl}/marketing`
  },
  openGraph: {
    title: "Tayyari Platform for JEE Preparation",
    description: "One focused platform for JEE mock tests, rank prediction, AI analysis, and resources.",
    url: `${siteUrl}/marketing`,
    type: "website"
  }
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
