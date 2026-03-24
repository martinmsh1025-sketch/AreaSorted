"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

const HIDDEN_PREFIXES = ["/admin", "/provider"];

export function CrispChat({ websiteId }: { websiteId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const shouldHide = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (shouldHide) {
      return;
    }

    window.$crisp = window.$crisp || [];
    window.CRISP_WEBSITE_ID = websiteId;

    if (document.querySelector('script[data-crisp-chat="true"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    script.setAttribute("data-crisp-chat", "true");
    document.body.appendChild(script);

    return () => {
      if (shouldHide) return;
    };
  }, [pathname, websiteId]);

  return null;
}
