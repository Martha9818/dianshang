import type { NextConfig } from "next";

function buildContentSecurityPolicy() {
  const isDevelopment = process.env.NODE_ENV !== "production";

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:* http://localhost:* ws://localhost:*",
    "media-src 'self' data: blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ]
    .join("; ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy(),
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
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
