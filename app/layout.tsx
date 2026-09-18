import type { Metadata } from "next";
import { Sora, Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";

const sora = Sora({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap"
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap"
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tayyari | JEE Preparation, Mock Tests, Rank Prediction",
    template: "%s | Tayyari"
  },
  description:
    "Tayyari is a focused JEE preparation platform with mock tests, rank prediction, score analytics, and chapter-wise resources.",
  keywords: [
    "jee preparation",
    "jee preparation platform",
    "jee mock tests",
    "jee main mock test",
    "jee advanced preparation",
    "jee rank prediction",
    "jee rank predictor",
    "jee study materials",
    "jee materials",
    "jee matrials",
    "tayyari",
    "tayyari jee",
    "jee test series",
    "jee score analytics"
  ],
  applicationName: "Tayyari",
  category: "education",
  openGraph: {
    title: "Tayyari | JEE Preparation with Mock Tests and Rank Prediction",
    description:
      "Prepare for JEE Main and Advanced with high-quality mock tests, rank prediction, and focused analytics.",
    url: "/",
    siteName: "Tayyari",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/tayyari-logo.png",
        width: 1200,
        height: 630,
        alt: "Tayyari"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Tayyari | JEE Preparation, Mock Tests, Rank Prediction",
    description: "JEE Main and Advanced preparation with mock tests, rank prediction, and focused analytics.",
    images: ["/tayyari-logo.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/tayyari-logo.png" }]
  },
  manifest: "/site.webmanifest"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Tayyari",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/resources?query={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tayyari",
    url: siteUrl,
    logo: `${siteUrl}/tayyari-logo.png`
  };

  return (
    <html lang="en" data-theme="light">
      <body className={`${sora.variable} ${fraunces.variable} ${outfit.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        <Navbar />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
