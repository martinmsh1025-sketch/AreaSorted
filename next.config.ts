import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  experimental: {
    serverActions: {
      // H-30 FIX: Reduced from 30MB to 4MB — server actions don't need large bodies
      // (file uploads go through uploadthing, not server actions)
      // M-13 FIX: Raised to 10MB — provider onboarding document uploads go through
      // server actions (saveProviderDocumentUploads) and can be up to 10MB per file.
      bodySizeLimit: "10mb",
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
