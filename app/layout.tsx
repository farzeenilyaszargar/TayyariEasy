import type { Metadata } from "next";
import { Sora, Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/auth-provider";
import { SiteFooter } from "@/components/site-footer";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tayyari.in"),
  title: "Tayyari | JEE Rank and Score Predictor",
  description: "An all-in-one platform for JEE aspirants with test practice, rank prediction, and AI analysis.",
  keywords: [
    "JEE preparation platform",
    "JEE rank predictor",
    "JEE score predictor",
    "JEE Main mock test",
    "JEE Advanced preparation",
    "JEE strategy articles",
    "JEE roadmaps"
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${fraunces.variable} ${outfit.variable}`}>
        <AuthProvider>
          <Navbar />
          <main className="container">{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
