import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "AreaSorted — Trusted Local Services in London",
    template: "%s | AreaSorted",
  },
  description:
    "Book trusted local services across London — cleaning, pest control, handyman, furniture assembly, waste removal, and garden maintenance. Vetted providers, transparent pricing, instant quotes.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://areasorted.com"),
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
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="page-shell">{children}</div>
      </body>
    </html>
  );
}
