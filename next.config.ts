import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporary (307) on purpose: both destinations are third-party and may move.
  // A permanent 308 is cached by browsers and cannot be recalled once served.
  async redirects() {
    return [
      {
        source: "/email",
        destination: "https://stablefuture.kit.com/email",
        permanent: false,
      },
      {
        source: "/call",
        destination: "https://cal.com/ben-grime/strategy-call",
        permanent: false,
      },
      // The career check moved here on 7 Oct 2026; keep old links and search results working.
      {
        source: "/ai-career-check",
        destination: "/career-check",
        permanent: true,
      },
      {
        source: "/assessment",
        destination: "/pathfinder",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
