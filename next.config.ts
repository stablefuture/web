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
        destination: "https://cal.eu/ben-grime/strategy-call",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
