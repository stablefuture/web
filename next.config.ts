import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/email",
        destination: "https://stablefuture.kit.com/email",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
