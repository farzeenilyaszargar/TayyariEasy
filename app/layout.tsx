import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/components/AppProvider";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Tayyari — JEE mock tests",
  description: "Free weekly JEE Main mock tests with leaderboards, badges and detailed performance analysis.",
  metadataBase: new URL("https://tayyari.online"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
