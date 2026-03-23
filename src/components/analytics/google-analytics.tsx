"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { COOKIE_CONSENT_EVENT, readCookieConsent } from "@/lib/analytics/consent";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type GoogleAnalyticsProps = {
  measurementId: string;
};

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    function syncConsent() {
      setEnabled(readCookieConsent() === "accepted");
    }

    syncConsent();
    window.addEventListener(COOKIE_CONSENT_EVENT, syncConsent);
    window.addEventListener("storage", syncConsent);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, syncConsent);
      window.removeEventListener("storage", syncConsent);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (!window.gtag) return;
    const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    window.gtag("config", measurementId, { page_path: url });
  }, [enabled, measurementId, pathname, searchParams]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            send_page_view: true,
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}
