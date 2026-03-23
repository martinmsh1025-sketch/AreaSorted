"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type CookieConsentChoice,
  COOKIE_CONSENT_EVENT,
  persistCookieConsent,
  readCookieConsent,
} from "@/lib/analytics/consent";

export function CookieConsentBanner() {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const nextChoice = readCookieConsent();
    setChoice(nextChoice);
    setShowPanel(nextChoice === null);

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== "areasorted_cookie_consent_v1") {
        return;
      }

      const storedChoice = readCookieConsent();
      setChoice(storedChoice);
      setShowPanel(storedChoice === null);
    }

    function handleConsentChange() {
      const storedChoice = readCookieConsent();
      setChoice(storedChoice);
      setShowPanel(false);
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(COOKIE_CONSENT_EVENT, handleConsentChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(COOKIE_CONSENT_EVENT, handleConsentChange);
    };
  }, []);

  function saveChoice(nextChoice: CookieConsentChoice) {
    persistCookieConsent(nextChoice);
    setChoice(nextChoice);
    setShowPanel(false);
  }

  return (
    <>
      {showPanel ? (
        <div className="cookie-consent-shell" role="dialog" aria-live="polite" aria-label="Cookie preferences">
          <div className="cookie-consent-card">
            <div>
              <div className="cookie-consent-eyebrow">Privacy choices</div>
              <h2 className="cookie-consent-title">Choose how AreaSorted uses cookies</h2>
              <p className="cookie-consent-copy">
                We always use essential cookies for login, security, and checkout. Analytics cookies help us understand
                how people use the site so we can improve booking journeys.
              </p>
            </div>
            <div className="cookie-consent-actions">
              <button type="button" className="button button-secondary" onClick={() => saveChoice("necessary")}>
                Reject analytics
              </button>
              <button type="button" className="button button-secondary" onClick={() => saveChoice("necessary")}>
                Only necessary
              </button>
              <button type="button" className="button button-primary" onClick={() => saveChoice("accepted")}>
                Accept analytics
              </button>
            </div>
            <p className="cookie-consent-meta">
              Reject analytics and only necessary both keep non-essential analytics turned off. You can change this later. Read our <Link href="/cookie-policy">Cookie Policy</Link> and{" "}
              <Link href="/privacy-policy">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      ) : null}

      {choice ? (
        <button
          type="button"
          className="cookie-settings-trigger"
          onClick={() => setShowPanel((current) => !current)}
          aria-label="Open cookie settings"
        >
          Cookie settings
        </button>
      ) : null}
    </>
  );
}
