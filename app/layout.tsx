import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { AppProvider } from "@/components/AppProvider";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  title: "Tayyari — JEE mock papers",
  description: "Free weekly JEE Main mock papers with leaderboards, badges and detailed performance analysis.",
  metadataBase: new URL("https://tayyari.online"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
