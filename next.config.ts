import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/email",
        destination: "https://stable-future.kit.com/career-checker",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
