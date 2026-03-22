import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { NavigationLoadingOverlay } from "@/components/shared/navigation-loading-overlay";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";

function getSafeSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "https://areasorted.com";

  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return "https://areasorted.com";
  }
}

const siteUrl = getSafeSiteUrl();

export const metadata: Metadata = {
  title: {
    default: "AreaSorted — Trusted Local Services in London",
    template: "%s | AreaSorted",
  },
  description:
    "Book trusted local services across London — cleaning, pest control, handyman, furniture assembly, waste removal, and garden maintenance. Vetted providers, transparent pricing, instant quotes.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "AreaSorted",
    title: "AreaSorted — Trusted Local Services in London",
    description:
      "Book trusted local services across London — cleaning, pest control, handyman, furniture assembly, waste removal, and garden maintenance.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AreaSorted — Trusted Local Services in London",
    description:
      "Book trusted local services across London — cleaning, pest control, handyman, furniture assembly, waste removal, and garden maintenance.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AreaSorted",
    url: siteUrl,
    logo: `${siteUrl}/favicon.ico`,
    sameAs: [],
    areaServed: {
      "@type": "City",
      name: "London",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["English"],
      url: `${siteUrl}/contact`,
    },
  };
  const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        <Suspense fallback={null}>
          {googleAnalyticsId ? <GoogleAnalytics measurementId={googleAnalyticsId} /> : null}
        </Suspense>
        <Suspense fallback={null}>
          <NavigationLoadingOverlay />
        </Suspense>
        <div className="page-shell">{children}</div>
      </body>
    </html>
  );
}
