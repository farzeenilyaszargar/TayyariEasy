import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "xgukepyyaplsyiaifjji.supabase.co" }] },
  async redirects() {
    return [
      { source: "/tests/:path*", destination: "/papers/:path*", permanent: false },
      { source: "/dashboard", destination: "/analytics", permanent: false },
      { source: "/results", destination: "/analytics", permanent: false },
      { source: "/badges", destination: "/profile", permanent: false },
      { source: "/pricing", destination: "/pro", permanent: false },
    ];
  },
};

export default nextConfig;
