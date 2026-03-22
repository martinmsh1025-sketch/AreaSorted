"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getCoverageForPostcode, normalisePostcode } from "@/lib/postcode-coverage";
import { PageLoading } from "@/components/shared/page-loading";

type IconProps = { className?: string };

function SearchIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 21s6-5.7 6-11a6 6 0 10-12 0c0 5.3 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

function CheckIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M5 12.5l4.2 4.2L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CleaningIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M8 4h8l-1 4H9L8 4z" />
      <path d="M10 8v12" />
      <path d="M7 13h6" />
      <path d="M7 17h6" />
    </svg>
  );
}

function PestIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <ellipse cx="12" cy="12" rx="3.4" ry="5" />
      <path d="M12 7V4M8.6 9 6 7M15.4 9 18 7M8.2 13H5M19 13h-3.2M9 17l-2.6 2M15 17l2.6 2" strokeLinecap="round" />
    </svg>
  );
}

function HandymanIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M14 5a3 3 0 01-4 4L4 15l5 5 6-6a3 3 0 004-4l-3 3-2-2 3-3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AssemblyIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M4 8l8-4 8 4-8 4-8-4z" />
      <path d="M4 8v8l8 4 8-4V8" />
      <path d="M12 12v8" />
    </svg>
  );
}

function WasteIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M7 7h10l-1 13H8L7 7z" />
      <path d="M9 7V5h6v2M5 7h14" strokeLinecap="round" />
    </svg>
  );
}

function GardenIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 20V9" />
      <path d="M12 9c0-3.2 2.2-5 5-5 0 3.1-1.7 6-5 6" />
      <path d="M12 11C8.9 11 7 8.3 7 5c3 0 5 2 5 6" />
    </svg>
  );
}

function StepOneIcon({ className = "" }: IconProps) {
  return <PinIcon className={className} />;
}

function StepTwoIcon({ className = "" }: IconProps) {
  return <SearchIcon className={className} />;
}

function StepThreeIcon({ className = "" }: IconProps) {
  return <CheckIcon className={className} />;
}

const serviceItems = [
  { label: "Cleaning", description: "Regular, deep, and move-out cleaning.", image: "/images/homepage/service-pic-notext/cleaning.png" },
  { label: "Pest control", description: "Inspections and common pest treatments.", image: "/images/homepage/service-pic-notext/pest-control.png" },
  { label: "Handyman", description: "Repairs, fittings, and home fixes.", image: "/images/homepage/service-pic-notext/handyman.png" },
  { label: "Furniture assembly", description: "Flat-pack assembly and setup work.", image: "/images/homepage/service-pic-notext/furniture-assembly.png" },
  { label: "Waste removal", description: "Bulky waste, rubbish, and clearances.", image: "/images/homepage/service-pic-notext/waste-removal.png" },
  { label: "Garden maintenance", description: "Lawn care, tidy-ups, and trimming.", image: "/images/homepage/service-pic-notext/garden-maintenance.png" },
];

const howItWorks = [
  {
    title: "1. Enter your postcode",
    description: "Check whether local services are available in your area before you spend time filling a full booking flow.",
    icon: StepOneIcon,
  },
  {
    title: "2. See what is available",
    description: "Once coverage is confirmed, you can move into the right service options, quote flow, and booking details.",
    icon: StepTwoIcon,
  },
  {
    title: "3. Continue to booking",
    description: "Complete a structured quote and booking flow with one process for service details, notes, and support.",
    icon: StepThreeIcon,
  },
];

export default function HomePage() {
  const router = useRouter();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://areasorted.com";
  const [postcode, setPostcode] = useState("");
  const [addressId, setAddressId] = useState("");
  const [addresses, setAddresses] = useState<Array<{ ID: string; Line: string }>>([]);
  const [entryMode, setEntryMode] = useState<"lookup" | "manual">("lookup");
  const [manualAddress1, setManualAddress1] = useState("");
  const [manualAddress2, setManualAddress2] = useState("");
  const [manualCity, setManualCity] = useState("London");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [lookupReady, setLookupReady] = useState(false);

  const coverage = useMemo(() => getCoverageForPostcode(postcode), [postcode]);
  const selectedAddress = addresses.find((item) => item.ID === addressId);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".js-reveal-section"));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );

    sections.forEach((section, index) => {
      section.style.setProperty("--reveal-delay", `${index * 70}ms`);
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  function updatePostcode(value: string) {
    setPostcode(value.toUpperCase());
    setSubmitMessage("");
    setLookupReady(false);
  }

  async function lookupAddresses() {
    if (isLookingUp) return;

    if (!postcode.trim()) {
      setSubmitMessage("Please enter a postcode first.");
      return;
    }

    try {
      setIsLookingUp(true);
      const cleanPostcode = normalisePostcode(postcode);
      setPostcode(cleanPostcode);

      const response = await fetch(`/api/postcode-search?query=${encodeURIComponent(cleanPostcode)}`);
      const data = await response.json();

      if (!response.ok) {
        setAddresses([]);
        setAddressId("");
        setSubmitMessage(data.error || "Unable to look up addresses right now. Please use manual address entry.");
        return;
      }

      setAddresses(data.results || []);
      setAddressId("");
      setLookupReady(Boolean(data.results?.length));
      setSubmitMessage(
        data.instructionsTxt ||
          (data.results?.length
            ? "Select your address from the list."
            : "No addresses found. You can use manual address instead."),
      );
    } catch {
      setAddresses([]);
      setAddressId("");
      setSubmitMessage("Unable to look up addresses right now. Please use manual address entry.");
    } finally {
    setIsLookingUp(false);
  }
  }

  const coverageAreas = [
    "Central London",
    "North London",
    "South London",
    "East London",
    "West London",
    "Camden",
    "Greenwich",
    "Hackney",
    "Islington",
    "Kensington & Chelsea",
    "Lambeth",
    "Southwark",
    "Tower Hamlets",
    "Westminster",
    "...and all 32 boroughs!",
  ];

  const faqItems = [
    {
      question: "How does the matching process work?",
      answer: "Enter your postcode and job details, and AreaSorted checks coverage, pricing, and provider suitability in one managed flow before you continue to booking.",
    },
    {
      question: "How do I pay for my service?",
      answer: "We place a temporary card hold when you continue booking. You are only charged once the matched provider confirms the job.",
    },
    {
      question: "Are the service providers background checked?",
      answer: "Yes. Safety and trust are priorities, so providers go through identity and quality checks before joining the platform.",
    },
    {
      question: "What if I need to cancel or reschedule?",
      answer: "Bookings can be updated through your account. If a provider does not confirm or a booking cannot go ahead, the card hold is released or any captured payment is handled under the cancellation and refund policy.",
    },
  ];

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: "AreaSorted",
    url: siteUrl,
    areaServed: ["Greater London"],
    description:
      "AreaSorted helps customers book trusted local services across London, including cleaning, pest control, handyman work, furniture assembly, waste removal, and garden maintenance.",
    makesOffer: serviceItems.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.label,
        description: service.description,
        areaServed: "London",
      },
    })),
  };

  async function handleCoverageCheck() {
    if (isSubmitting) return;

    const cleanPostcode = normalisePostcode(postcode);

    if (!cleanPostcode) {
      setSubmitMessage("Please enter a postcode first.");
      return;
    }

    setPostcode(cleanPostcode);

    if (entryMode === "lookup" && !selectedAddress) {
      await lookupAddresses();
      return;
    }

    let line1 = "";
    let line2 = "";
    let city = "";

    if (entryMode === "lookup") {
      if (!addressId || !selectedAddress) {
        setSubmitMessage("Please find and select an address first.");
        return;
      }
      const parts = selectedAddress.Line.split(",").map((part) => part.trim()).filter(Boolean);
      line1 = parts[0] ?? selectedAddress.Line;
      line2 = parts[1] ?? "";
      city = parts[2] ?? "London";
    } else {
      if (!manualAddress1.trim()) {
        setSubmitMessage("Please enter address line 1.");
        return;
      }
      line1 = manualAddress1;
      line2 = manualAddress2;
      city = manualCity || "London";
    }

    setSubmitMessage("");
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    router.push(`/quote?${new URLSearchParams({ postcode: cleanPostcode, line1, line2, city }).toString()}`);
  }

  return (
    <main className="homepage-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      {isSubmitting ? (
        <PageLoading fullscreen title="Loading..." message="Please wait..." />
      ) : null}
      <section className="homepage-hero">
        <div className="homepage-hero-surface">
          <div className="homepage-hero-layout">
            <div className="homepage-hero-copy homepage-hero-copy-left">
              <div className="homepage-hero-kicker">Trusted local services booking</div>
              <h1 className="homepage-hero-title">Find trusted local services in your area.</h1>
              <p className="homepage-hero-text">
                Check postcode coverage for cleaning, handyman, waste removal, pest control, and garden work.
              </p>

              <form
                className="panel mini-form homepage-quote-card homepage-quote-card-left"
                onSubmit={(event) => {
                  event.preventDefault();
                }}
              >
                <div className="homepage-quote-head">
                  <div className="homepage-quote-icon">
                    <PinIcon className="homepage-service-icon" />
                  </div>
                  <div>
                    <div className="eyebrow">Coverage lookup</div>
                    <strong>Enter your postcode</strong>
                  </div>
                </div>

                <label className="quote-field-stack">
                  <span>Postcode</span>
                  <input
                    placeholder="e.g. SW6 2NT"
                    aria-label="Postcode"
                    value={postcode}
                    onChange={(event) => {
                      updatePostcode(event.target.value);
                    }}
                    onBlur={() => {
                      if (postcode.trim()) setPostcode(normalisePostcode(postcode));
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      if (entryMode === "lookup") {
                        void lookupAddresses();
                        return;
                      }
                      void handleCoverageCheck();
                    }}
                  />
                </label>

                <div className="button-row" style={{ justifyContent: "center", marginTop: "-0.2rem" }}>
                  <button type="button" className="button button-secondary" onClick={() => setEntryMode(entryMode === "lookup" ? "manual" : "lookup")}>{entryMode === "lookup" ? "Use manual address" : "Use postcode finder"}</button>
                </div>

                {entryMode === "lookup" ? (
                  <>
                    {addresses.length ? (
                      <label className="quote-field-stack">
                        <span>Address</span>
                        <select value={addressId} onChange={(event) => { setAddressId(event.target.value); setSubmitMessage(""); }}>
                          <option value="">Select address</option>
                          {addresses.map((address) => (
                            <option key={address.ID} value={address.ID}>{address.Line}</option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </>
                ) : (
                  <>
                    <label className="quote-field-stack">
                      <span>Address line 1</span>
                      <input value={manualAddress1} onChange={(event) => setManualAddress1(event.target.value)} placeholder="11 Camden Row" />
                    </label>
                    <label className="quote-field-stack">
                      <span>Address line 2</span>
                      <input value={manualAddress2} onChange={(event) => setManualAddress2(event.target.value)} placeholder="Pinner" />
                    </label>
                    <label className="quote-field-stack">
                      <span>City</span>
                      <input value={manualCity} onChange={(event) => setManualCity(event.target.value)} placeholder="London" />
                    </label>
                  </>
                )}

                {(lookupReady || selectedAddress || manualAddress1.trim()) && (
                  <div className="homepage-live-status">
                    <span className="homepage-live-status-dot" />
                    {selectedAddress
                      ? "Address ready — continue to live booking"
                      : manualAddress1.trim()
                        ? "Manual address ready — continue to booking"
                        : "Postcode recognised — choose your address"}
                  </div>
                )}

                {postcode ? <p className="hero-minimal-note">{coverage.leadTimeLabel}</p> : <p className="hero-minimal-note">Enter your postcode to check whether services are available in your area.</p>}
                {submitMessage ? <p className="hero-minimal-note" style={{ color: "var(--color-error)" }}>{submitMessage}</p> : null}

                <button type="button" className="button button-primary homepage-quote-button" onClick={handleCoverageCheck} disabled={isSubmitting}>
                  {isSubmitting || isLookingUp ? <span className="button-spinner-wrap"><span className="button-spinner" />Please wait</span> : entryMode === "lookup" && !selectedAddress ? "Find address" : "Check coverage"}
                </button>
              </form>
            </div>

            <div className="homepage-hero-art">
              <Image src="/images/homepage/hero.png" alt="Home services at work" fill className="homepage-hero-art-image" sizes="(max-width: 960px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      <section className="homepage-section homepage-section-gap-large js-reveal-section">
        <div className="homepage-section-head">
          <div className="eyebrow">Services</div>
          <h2 className="homepage-section-title">Services available in your area</h2>
        </div>
        <div className="section-card-grid">
          {serviceItems.map((item) => {
            return (
              <article key={item.label} className="panel card span-4 homepage-info-card homepage-service-card">
                <div className="homepage-service-illustration-wrap">
                  <img src={item.image} alt={item.label} className="homepage-service-photo" />
                </div>
                <strong>{item.label}</strong>
                <p className="lead" style={{ fontSize: "0.98rem", margin: "0.55rem 0 0" }}>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="homepage-section homepage-coverage-section js-reveal-section">
        <div className="homepage-coverage-copy">
          <div className="homepage-coverage-kicker">Covering all of London</div>
          <h2 className="homepage-coverage-title">Every Borough. Every Postcode.</h2>
          <p className="homepage-coverage-text">
            From Richmond to Romford, Enfield to Croydon - AreaSorted connects customers with trusted local services right across Greater London.
          </p>
          <button type="button" className="button homepage-dark-button" onClick={handleCoverageCheck}>Find pros near me</button>
        </div>
        <div className="homepage-coverage-tags-wrap">
          <div className="homepage-coverage-map-shape" aria-hidden="true" />
          <div className="homepage-coverage-tags">
            {coverageAreas.map((item, index) => (
              <span key={item} className={`homepage-coverage-tag${index < 5 ? " homepage-coverage-tag-primary" : ""}${item.startsWith("...") ? " homepage-coverage-tag-dashed" : ""}`}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="homepage-section homepage-how-section js-reveal-section">
        <div className="homepage-how-media panel">
          <Image src="/images/homepage/howitworks.png" alt="Book trusted home services" fill className="homepage-how-media-image" sizes="(max-width: 960px) 100vw, 50vw" />
          <div className="homepage-how-badge">
            <div className="homepage-how-badge-icon">
              <CheckIcon className="homepage-service-icon" />
            </div>
            <div>
              <strong>Instant quote</strong>
              <span>Takes about a minute</span>
            </div>
          </div>
        </div>

        <div className="homepage-how-copy">
          <div className="homepage-section-head">
            <div className="eyebrow">How it works</div>
            <h2 className="homepage-section-title">Three simple steps to a better home.</h2>
          </div>
          <div className="homepage-how-steps">
            {howItWorks.map((item, index) => {
              return (
                <article key={item.title} className="homepage-step-row">
                  <div className="homepage-step-watermark">{index + 1}</div>
                  <div className="homepage-step-icon">
                    <Image src={`/images/how-it-works-icons/step-${index + 1}.png`} alt={item.title} width={56} height={56} className="homepage-step-icon-image" />
                  </div>
                  <div className="homepage-step-content">
                    <strong>{item.title}</strong>
                    <p className="lead" style={{ fontSize: "0.98rem", marginBottom: 0 }}>{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="homepage-section homepage-app-section js-reveal-section">
        <div className="homepage-app-copy">
          <div className="homepage-app-kicker">Built for mobile booking</div>
          <h2 className="homepage-section-title">Book quickly on your phone, without downloading an app.</h2>
          <p className="homepage-app-text">Check coverage, continue booking, and manage your AreaSorted account from any modern mobile browser.</p>
          <div className="homepage-app-buttons">
            <button type="button" className="homepage-store-button" onClick={() => router.push("/quote")}>Continue booking</button>
            <button type="button" className="homepage-store-button" onClick={() => router.push("/services")}>Browse services</button>
          </div>
        </div>
        <div className="homepage-phone-wrap" aria-hidden="true">
          <div className="homepage-phone-shell">
            <div className="homepage-phone-notch" />
            <div className="homepage-phone-screen">
              <div className="homepage-phone-card homepage-phone-card-primary" />
              <div className="homepage-phone-card" />
              <div className="homepage-phone-card homepage-phone-card-short" />
              <div className="homepage-phone-nav">
                <span className="homepage-phone-dot homepage-phone-dot-active" />
                <span className="homepage-phone-dot" />
                <span className="homepage-phone-dot" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="homepage-section homepage-faq-section js-reveal-section">
        <div className="homepage-section-head homepage-section-head-center">
          <div className="eyebrow">FAQ</div>
          <h2 className="homepage-section-title">Frequently asked questions</h2>
        </div>
        <div className="homepage-faq-listing">
          {faqItems.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <button key={item.question} type="button" className={`homepage-faq-item${isOpen ? " homepage-faq-item-open" : ""}`} onClick={() => setOpenFaq(isOpen ? -1 : index)}>
                <div className="homepage-faq-item-head">
                  <strong>{item.question}</strong>
                  <span className={`homepage-faq-chevron${isOpen ? " homepage-faq-chevron-open" : ""}`}>⌄</span>
                </div>
                {isOpen ? <p>{item.answer}</p> : null}
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
