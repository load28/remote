import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => [
    {
      source: "/api/proxy/:path*",
      destination: `${process.env.API_BASE_URL ?? "https://jsonplaceholder.typicode.com"}/:path*`,
    },
  ],
};

export default nextConfig;
