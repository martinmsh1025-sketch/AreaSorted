import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  experimental: {
    proxyClientMaxBodySize: "30mb",
    serverActions: {
      // Provider onboarding document uploads go through server actions.
      // We allow up to 30MB total because onboarding can include multiple
      // PDF/image files and the upload layer already enforces per-file limits.
      bodySizeLimit: "30mb",
    },
  },
  // M-1 FIX: Security headers to protect against common web vulnerabilities
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://maps.googleapis.com https://www.googletagmanager.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https://utfs.io https://ufs.sh https://*.uploadthing.com https://*.stripe.com https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.ggpht.com https://www.google-analytics.com",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://api.stripe.com https://*.uploadthing.com https://*.ufs.sh https://utfs.io https://challenges.cloudflare.com https://*.googleapis.com https://*.google.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com",
            "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com https://www.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self' https://connect.stripe.com",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
