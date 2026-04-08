import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "frame-src 'self'",
  "frame-ancestors 'none'",
  `script-src 'self' ${isDev ? `'unsafe-inline' 'unsafe-eval'` : `'unsafe-inline'`} https://api.mapbox.com https://*.mapbox.com`,
  `script-src-elem 'self' ${isDev ? `'unsafe-inline' 'unsafe-eval'` : `'unsafe-inline'`} https://api.mapbox.com https://*.mapbox.com`,
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://*.mapbox.com",
  "style-src-elem 'self' 'unsafe-inline' https://api.mapbox.com https://*.mapbox.com",
  "img-src 'self' data: blob: https://api.mapbox.com https://*.mapbox.com https://res.cloudinary.com",
  "media-src 'self' blob:",
  "font-src 'self' data: https://api.mapbox.com https://*.mapbox.com",
  "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.mapbox.com",
  "worker-src 'self' blob:",
  "child-src blob:",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
] as const;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920, 2560, 3840],
    imageSizes: [256, 320, 480, 640, 800],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...SECURITY_HEADERS],
      },
    ];
  },
};

export default nextConfig;
