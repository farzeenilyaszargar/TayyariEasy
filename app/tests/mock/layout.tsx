import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function MockTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
