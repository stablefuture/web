import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/email",
        destination: "https://stablefuture.kit.com/email",
        permanent: true,
      },
      {
        source: "/call",
        destination: "https://cal.eu/ben-grime/strategy-call",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
