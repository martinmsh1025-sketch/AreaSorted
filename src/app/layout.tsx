import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AreaSorted.com",
  description: "Trusted local services across London with postcode-first matching, clear booking, and managed provider support.",
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
