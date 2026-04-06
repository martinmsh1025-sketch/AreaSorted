"use client";

import { useMemo, useState } from "react";
import { ProviderPublicProfileCard } from "@/components/provider/public-profile-card";

type ProviderOption = {
  id: string;
  providerName: string;
  profileImageUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  totalCustomerPay: number;
  providerBasePrice: number;
  bookingFee: number;
  postcodeSurcharge: number;
  hasDbs: boolean;
  hasInsurance: boolean;
  recommended: boolean;
  selected: boolean;
};

function money(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
}

export function ProviderOptionSelector({
  quoteReference,
  options,
  onSelect,
  inlineOnly = false,
}: {
  quoteReference: string;
  options: ProviderOption[];
  onSelect?: (providerId: string) => void;
  inlineOnly?: boolean;
}) {
  const [sortBy, setSortBy] = useState<"recommended" | "lowest_price">("recommended");
  const [dbsOnly, setDbsOnly] = useState(false);
  const [insuredOnly, setInsuredOnly] = useState(false);

  const visibleOptions = useMemo(() => {
    let next = [...options];
    if (dbsOnly) next = next.filter((option) => option.hasDbs);
    if (insuredOnly) next = next.filter((option) => option.hasInsurance);

    next.sort((left, right) => {
      if (sortBy === "lowest_price") {
        if (left.totalCustomerPay !== right.totalCustomerPay) {
          return left.totalCustomerPay - right.totalCustomerPay;
        }
      } else {
        if (left.recommended !== right.recommended) {
          return Number(right.recommended) - Number(left.recommended);
        }
        if (left.totalCustomerPay !== right.totalCustomerPay) {
          return left.totalCustomerPay - right.totalCustomerPay;
        }
      }
      return left.providerName.localeCompare(right.providerName);
    });

    return next;
  }, [options, dbsOnly, insuredOnly, sortBy]);

  return (
    <section className="panel card quote-summary-panel">
      <div className="eyebrow">Provider options</div>
      <strong style={{ display: "block", marginTop: "0.4rem" }}>Choose a verified provider option</strong>
      {!inlineOnly ? (
        <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.84rem" }}>
            <span>Sort</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as "recommended" | "lowest_price")} style={{ borderRadius: 10, padding: "0.35rem 0.55rem" }}>
              <option value="recommended">Recommended</option>
              <option value="lowest_price">Lowest price</option>
            </select>
          </label>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.84rem" }}>
            <input type="checkbox" checked={dbsOnly} onChange={() => setDbsOnly((current) => !current)} /> DBS only
          </label>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.84rem" }}>
            <input type="checkbox" checked={insuredOnly} onChange={() => setInsuredOnly((current) => !current)} /> Insured only
          </label>
        </div>
      ) : null}

      <div style={{ marginTop: "1rem", display: "grid", gap: "0.9rem" }}>
        {visibleOptions.length === 0 ? (
          <div className="rounded-xl border p-4" style={{ color: "var(--color-text-muted)" }}>
            No providers match the selected filters.
          </div>
        ) : (
          visibleOptions.map((option) => (
            <div key={option.id} className="rounded-xl border p-4" style={option.selected ? { borderColor: "var(--color-brand)" } : undefined}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <ProviderPublicProfileCard
                    profile={{
                      providerName: option.providerName,
                      profileImageUrl: option.profileImageUrl,
                      headline: option.headline,
                      bio: option.bio,
                      yearsExperience: option.yearsExperience,
                      hasDbs: option.hasDbs,
                      hasInsurance: option.hasInsurance,
                    }}
                  />
                  {option.recommended ? <div style={{ marginTop: "0.5rem" }}><span className="quote-map-badge">Recommended</span></div> : null}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>{money(option.totalCustomerPay)}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>total</div>
                </div>
              </div>
              <div className="quote-summary-list" style={{ marginTop: "0.8rem" }}>
                <div><span>Service price</span><strong>{money(option.providerBasePrice)}</strong></div>
                <div><span>Booking fee</span><strong>{money(option.bookingFee)}</strong></div>
              </div>
              {!option.selected ? (
                <div style={{ marginTop: "1rem" }}>
                  {inlineOnly ? (
                    <button type="button" className="button button-secondary" onClick={() => onSelect?.(option.id)}>
                      Choose this provider
                    </button>
                  ) : (
                    <a className="button button-secondary" href={`/quote/${quoteReference}?selectedQuoteOptionId=${encodeURIComponent(option.id)}`}>
                      Choose this provider
                    </a>
                  )}
                </div>
              ) : (
                <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>This provider is currently selected for your booking request.</p>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
