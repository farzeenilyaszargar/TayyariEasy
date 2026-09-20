import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/auth-provider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JEE Mock Tests for JEE Main & Advanced | Tayyari",
    template: "%s | Tayyari"
  },
  description:
    "Practice JEE mock tests for JEE Main and JEE Advanced with subject-wise, topic-wise, and full syllabus test series on Tayyari.",
  applicationName: "Tayyari",
  category: "education",
  openGraph: {
    title: "JEE Mock Tests for JEE Main & Advanced | Tayyari",
    description:
      "Practice JEE Main and JEE Advanced with focused mock tests, test series, and score analytics.",
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
    title: "JEE Mock Tests for JEE Main & Advanced | Tayyari",
    description: "JEE Main and JEE Advanced mock tests, test series, and score analytics.",
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
      <body className={spaceGrotesk.variable}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        <AuthProvider>
          <Navbar />
          <main className="container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
