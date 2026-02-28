import type { Metadata } from "next";
import { Sora, Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/auth-provider";
import { SiteFooter } from "@/components/site-footer";

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
    default: "Tayyari | Rank Predictor, Mock Tests, AI Doubt Solver",
    template: "%s | Tayyari"
  },
  description:
    "Tayyari helps JEE aspirants improve scores with mock tests, rank prediction, AI doubt solving, analytics dashboards, and strategy articles.",
  keywords: [
    "JEE preparation platform",
    "JEE rank predictor",
    "JEE score predictor",
    "JEE Main mock test",
    "JEE Advanced preparation",
    "JEE strategy articles",
    "JEE roadmaps",
    "JEE analytics dashboard",
    "JEE doubts chatbot",
    "JEE exam strategy blog"
  ],
  applicationName: "Tayyari",
  category: "education",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Tayyari | Rank Predictor, Mock Tests, AI Doubt Solver",
    description:
      "All-in-one JEE prep with rank prediction, subject tests, AI analysis, doubt solving, and roadmap articles.",
    url: siteUrl,
    siteName: "Tayyari",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Tayyari"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Tayyari | Rank Predictor, Mock Tests, AI Doubt Solver",
    description: "JEE rank prediction, mock tests, AI doubt solving, analytics, and strategy resources in one platform.",
    images: ["/logo.png"]
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
    icon: [{ url: "/logo.ico" }],
    shortcut: [{ url: "/logo.ico" }],
    apple: [{ url: "/logo.png" }]
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
    logo: `${siteUrl}/logo.png`
  };

  return (
    <html lang="en">
      <body className={`${sora.variable} ${fraunces.variable} ${outfit.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        <AuthProvider>
          <Navbar />
          <main className="container">{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
