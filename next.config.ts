import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingExcludes: {
    "*": [
      "./backups/**/*",
      "./exports/**/*",
      "./uploads/**/*",
      "./prisma/*.db",
      "./prisma/*.db-journal",
      "./prisma/*.db-wal",
      "./prisma/*.db-shm",
      "./node_modules/.prisma/client/*.tmp*",
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
