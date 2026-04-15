import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => [
    {
      // /api/proxy/posts → https://external-api.com/posts
      // /api/proxy/users/1 → https://external-api.com/users/1
      source: "/api/proxy/:path*",
      destination: `${process.env.API_BASE_URL ?? "https://jsonplaceholder.typicode.com"}/:path*`,
    },
  ],
};

export default nextConfig;
