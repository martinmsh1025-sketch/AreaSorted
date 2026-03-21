"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { listPublicCategories, listJobTypesForCategory, getServiceValueForCategory } from "@/lib/public-quote/service-mapping";
import {
  jobTypeCatalog,
  propertyTypeOptions,
  cleaningConditionOptions,
  calculateQuote,
  type CleaningConditionValue,
  type JobSizeValue,
  type PropertyTypeValue,
} from "@/lib/service-catalog";
import { UploadDropzone } from "@/lib/uploadthing";

type PublicCategoryKey = ReturnType<typeof listPublicCategories>[number]["key"];

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function money(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(value);
}

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

/**
 * Check if a cleaning job type uses room-count-based pricing.
 * Mirrors the logic in service-catalog.ts calculateQuote.
 */
function isRoomCountCleaning(serviceValue: string, subcategory: string): boolean {
  return serviceValue === "cleaning" && ["home-cleaning", "tenancy-cleaning"].includes(subcategory);
}

/** Estimate cleaning hours from room counts + condition (mirrors pricing engine) */
function estimateCleaningHours(
  bedrooms: number,
  bathrooms: number,
  kitchens: number,
  propertyType: string,
  cleaningCondition: CleaningConditionValue,
): number {
  const base = 0.8 + Math.max(bedrooms, 0) * 0.95 + Math.max(bathrooms, 0) * 0.55 + Math.max(kitchens, 1) * 0.45;
  let multiplier = 1;
  if (propertyType === "terraced") multiplier = 1.05;
  else if (propertyType === "semi-detached") multiplier = 1.1;
  else if (propertyType === "detached") multiplier = 1.2;
  else if (propertyType === "commercial") multiplier = 1.3;
  const condOption = cleaningConditionOptions.find((o) => o.value === cleaningCondition);
  return Math.round(base * multiplier * (condOption?.multiplier ?? 1) * 10) / 10;
}

export function PublicQuoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categories = listPublicCategories();
  const [categoryKey, setCategoryKey] = useState<PublicCategoryKey>((categories[0]?.key || "CLEANING") as PublicCategoryKey);
  const options = useMemo(() => listJobTypesForCategory(categoryKey), [categoryKey]);
  const [serviceKey, setServiceKey] = useState(options[0]?.value || "");
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    postcode: "",
    addressLine1: "",
    addressLine2: "",
    city: "London",
    scheduledDate: getTomorrowDate(),
    scheduledTimeLabel: "10:00",
    sameDay: false,
    // Cleaning specific
    bedrooms: "2",
    bathrooms: "1",
    kitchens: "1",
    propertyType: "flat" as string,
    cleaningCondition: "standard" as CleaningConditionValue,
    supplies: "customer" as "customer" | "provider",
    // Generic
    jobSize: "standard" as JobSizeValue,
    estimatedHours: "3",
    // Add-ons (selected keys)
    selectedAddOns: [] as string[],
    // Notes
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState("");

  const serviceValue = getServiceValueForCategory(categoryKey) ?? "cleaning";
  const isCleaning = categoryKey === "CLEANING";
  const isPestControl = categoryKey === "PEST_CONTROL";

  // Auto-detect weekend from scheduledDate (Saturday=6, Sunday=0)
  const isWeekend = useMemo(() => {
    if (!form.scheduledDate) return false;
    const d = new Date(form.scheduledDate + "T12:00:00"); // noon to avoid timezone edge cases
    const day = d.getDay();
    return day === 0 || day === 6;
  }, [form.scheduledDate]);

  const selectedJob = useMemo(() => jobTypeCatalog.find((j) => j.value === serviceKey), [serviceKey]);
  const roomCount = selectedJob ? isRoomCountCleaning(selectedJob.service, selectedJob.subcategory) : false;
  const showJobSize = !roomCount;
  const showPropertyType = selectedJob ? selectedJob.propertyTypes.length > 0 : false;

  const removePhoto = useCallback((url: string) => {
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
  }, []);

  /* Reset add-ons when service changes */
  useEffect(() => {
    setForm((prev) => ({ ...prev, selectedAddOns: [] }));
  }, [serviceKey]);

  /* Pre-fill address fields from URL params (passed by homepage postcode form) */
  useEffect(() => {
    const postcode = searchParams.get("postcode");
    const line1 = searchParams.get("line1");
    const line2 = searchParams.get("line2");
    const city = searchParams.get("city");
    if (postcode || line1) {
      setForm((prev) => ({
        ...prev,
        ...(postcode ? { postcode } : {}),
        ...(line1 ? { addressLine1: line1 } : {}),
        ...(line2 ? { addressLine2: line2 } : {}),
        ...(city ? { city } : {}),
      }));
    }
  }, [searchParams]);

  /* ── Toggle add-on ── */
  const toggleAddOn = useCallback((key: string) => {
    setForm((prev) => ({
      ...prev,
      selectedAddOns: prev.selectedAddOns.includes(key)
        ? prev.selectedAddOns.filter((k) => k !== key)
        : [...prev.selectedAddOns, key],
    }));
  }, []);

  /* ── Live pricing estimate ── */
  const estimate = useMemo(() => {
    if (!selectedJob) return null;

    const commissionPct = 12;
    const bookingFee = selectedJob.bookingFee;

    // Calculate add-ons total
    const addOnsTotal = selectedJob.addOns
      .filter((a) => form.selectedAddOns.includes(a.value))
      .reduce((sum, a) => sum + a.amount, 0);

    if (isCleaning && roomCount) {
      // Room-count cleaning: use full calculation logic
      const bedrooms = Math.max(Number(form.bedrooms) || 0, 0);
      const bathrooms = Math.max(Number(form.bathrooms) || 0, 0);
      const kitchens = Math.max(Number(form.kitchens) || 1, 1);
      const hours = estimateCleaningHours(bedrooms, bathrooms, kitchens, form.propertyType, form.cleaningCondition);
      const suppliesSurcharge = form.supplies === "provider" ? 12 : 0;
      const minBase = selectedJob.recommendedHourlyRange.min * hours + suppliesSurcharge + addOnsTotal;
      const maxBase = selectedJob.recommendedHourlyRange.max * hours + suppliesSurcharge + addOnsTotal;
      const minCommission = Math.round(minBase * commissionPct / 100 * 100) / 100;
      const maxCommission = Math.round(maxBase * commissionPct / 100 * 100) / 100;

      // Timing adjustments
      let timingAdj = 0;
      if (form.sameDay || isWeekend) {
        if (isWeekend) timingAdj += 18;
        // sameDay is treated like urgency, shown separately
      }

      return {
        hours,
        minBase,
        maxBase,
        bookingFee,
        commissionPct,
        minCommission,
        maxCommission,
        timingAdjustment: timingAdj,
        addOnsTotal,
        minTotal: Math.round((minBase + bookingFee + minCommission + timingAdj) * 100) / 100,
        maxTotal: Math.round((maxBase + bookingFee + maxCommission + timingAdj) * 100) / 100,
        serviceName: selectedJob.label,
        startingPrice: selectedJob.startingPrice,
      };
    }

    if (isCleaning && !roomCount) {
      // Non-room-count cleaning (specialist): basePrice + sizeOption.priceDelta model
      const sizeOpt = selectedJob.sizeOptions.find((s) => s.value === form.jobSize) ?? selectedJob.sizeOptions[1];
      const suppliesSurcharge = form.supplies === "provider" ? 12 : 0;
      const basePrice = selectedJob.basePrice + (sizeOpt?.priceDelta ?? 0) + suppliesSurcharge + addOnsTotal;
      const commission = Math.round(basePrice * commissionPct / 100 * 100) / 100;
      const hours = selectedJob.durationHours[form.jobSize] ?? selectedJob.durationHours.standard;
      let timingAdj = 0;
      if (isWeekend) timingAdj += 18;

      return {
        hours,
        minBase: basePrice,
        maxBase: basePrice,
        bookingFee,
        commissionPct,
        minCommission: commission,
        maxCommission: commission,
        timingAdjustment: timingAdj,
        addOnsTotal,
        minTotal: Math.round((basePrice + bookingFee + commission + timingAdj) * 100) / 100,
        maxTotal: Math.round((basePrice + bookingFee + commission + timingAdj) * 100) / 100,
        serviceName: selectedJob.label,
        startingPrice: selectedJob.startingPrice,
      };
    }

    if (isPestControl) {
      // Pest control: basePrice + sizeOption.priceDelta
      const sizeOpt = selectedJob.sizeOptions.find((s) => s.value === form.jobSize) ?? selectedJob.sizeOptions[1];
      const basePrice = selectedJob.basePrice + (sizeOpt?.priceDelta ?? 0) + addOnsTotal;
      const commission = Math.round(basePrice * commissionPct / 100 * 100) / 100;
      const hours = selectedJob.durationHours[form.jobSize] ?? selectedJob.durationHours.standard;
      let timingAdj = 0;
      if (isWeekend) timingAdj += 18;

      return {
        hours,
        minBase: basePrice,
        maxBase: basePrice,
        bookingFee,
        commissionPct,
        minCommission: commission,
        maxCommission: commission,
        timingAdjustment: timingAdj,
        addOnsTotal,
        minTotal: Math.round((basePrice + bookingFee + commission + timingAdj) * 100) / 100,
        maxTotal: Math.round((basePrice + bookingFee + commission + timingAdj) * 100) / 100,
        serviceName: selectedJob.label,
        startingPrice: selectedJob.startingPrice,
      };
    }

    // Other categories: try jobSize → basePrice + priceDelta, else hourly × estimatedHours
    const sizeOpt = selectedJob.sizeOptions.find((s) => s.value === form.jobSize) ?? selectedJob.sizeOptions[1];
    const baseFromSize = selectedJob.basePrice + (sizeOpt?.priceDelta ?? 0) + addOnsTotal;
    const hours = selectedJob.durationHours[form.jobSize] ?? selectedJob.durationHours.standard ?? Math.max(Number(form.estimatedHours) || 1, 1);
    // Use range approach: min/max hourly × hours, but also show baseFromSize as reference
    const minBase = Math.min(selectedJob.recommendedHourlyRange.min * hours + addOnsTotal, baseFromSize);
    const maxBase = Math.max(selectedJob.recommendedHourlyRange.max * hours + addOnsTotal, baseFromSize);
    const minCommission = Math.round(minBase * commissionPct / 100 * 100) / 100;
    const maxCommission = Math.round(maxBase * commissionPct / 100 * 100) / 100;
    let timingAdj = 0;
    if (isWeekend) timingAdj += 18;

    return {
      hours,
      minBase,
      maxBase,
      bookingFee,
      commissionPct,
      minCommission,
      maxCommission,
      timingAdjustment: timingAdj,
      addOnsTotal,
      minTotal: Math.round((minBase + bookingFee + minCommission + timingAdj) * 100) / 100,
      maxTotal: Math.round((maxBase + bookingFee + maxCommission + timingAdj) * 100) / 100,
      serviceName: selectedJob.label,
      startingPrice: selectedJob.startingPrice,
    };
  }, [selectedJob, form.estimatedHours, form.bedrooms, form.bathrooms, form.kitchens, form.propertyType, form.jobSize, form.cleaningCondition, form.supplies, form.selectedAddOns, form.sameDay, isWeekend, isCleaning, isPestControl, roomCount]);

  /* ── Size option labels from catalog ── */
  const sizeOptions = useMemo(() => {
    if (!selectedJob) return [];
    return selectedJob.sizeOptions.map((s) => ({ value: s.value, label: s.label }));
  }, [selectedJob]);

  /* ── Property type options filtered for this job ── */
  const filteredPropertyTypes = useMemo(() => {
    if (!selectedJob || selectedJob.propertyTypes.length === 0) return propertyTypeOptions;
    return propertyTypeOptions.filter((pt) => selectedJob.propertyTypes.includes(pt.value as PropertyTypeValue));
  }, [selectedJob]);

  /* ── Map embed URL ── */
  const mapUrl = useMemo(() => {
    if (!GOOGLE_MAPS_KEY || !form.postcode || form.postcode.length < 3) return null;
    const q = encodeURIComponent(form.postcode + ", London, UK");
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=${q}&zoom=15`;
  }, [form.postcode]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    if (!form.customerName.trim() || !form.customerEmail.trim() || !form.postcode.trim() || !form.addressLine1.trim()) {
      setError("Please fill in all required fields (name, email, postcode, and address).");
      setSubmitting(false);
      return;
    }

    const payload: Record<string, unknown> = {
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      customerPhone: form.customerPhone,
      postcode: form.postcode,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2,
      city: form.city,
      categoryKey,
      serviceKey,
      sameDay: form.sameDay,
      weekend: isWeekend,
      scheduledDate: form.scheduledDate,
      scheduledTimeLabel: form.scheduledTimeLabel,
      jobPhotoUrls: photoUrls,
    };

    // Add-ons (if any selected)
    if (form.selectedAddOns.length > 0) {
      payload.addOns = form.selectedAddOns;
    }

    // Notes
    if (form.notes.trim()) {
      payload.notes = form.notes.trim();
    }

    // Property type (if shown)
    if (showPropertyType) {
      payload.propertyType = form.propertyType;
    }

    if (isCleaning && roomCount) {
      // Room-count cleaning
      payload.bedrooms = Number(form.bedrooms) || 0;
      payload.bathrooms = Number(form.bathrooms) || 0;
      payload.kitchens = Number(form.kitchens) || 1;
      payload.cleaningCondition = form.cleaningCondition;
      payload.supplies = form.supplies;
      payload.estimatedHours = estimate?.hours ?? 2;
    } else if (isCleaning && !roomCount) {
      // Specialist cleaning
      payload.jobSize = form.jobSize;
      payload.supplies = form.supplies;
      payload.estimatedHours = estimate?.hours ?? 2;
    } else if (isPestControl) {
      // Pest control
      payload.jobSize = form.jobSize;
      payload.estimatedHours = estimate?.hours ?? 2;
    } else {
      // All other categories
      payload.jobSize = form.jobSize;
      payload.estimatedHours = estimate?.hours ?? Number(form.estimatedHours) ?? 2;
    }

    try {
      const response = await fetch("/api/public-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setSubmitting(false);

      if (!response.ok) {
        setError(data.error || "Unable to create quote");
        return;
      }

      router.push(data.redirectUrl);
    } catch {
      setSubmitting(false);
      setError("Network error — please check your connection and try again.");
    }
  }

  return (
    <div className="panel card">
      <div className="eyebrow">Get a quote</div>
      <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>Tell us about your job</h1>
      <p className="lead" style={{ marginTop: "0.3rem", marginBottom: "1.2rem", fontSize: "0.95rem", color: "var(--color-text-muted)" }}>
        Fill in the details below and we will match you with available providers in your area.
      </p>

      <div className="quote-page-grid" style={{ marginTop: "1.5rem" }}>
        {/* ── Left column: form fields ── */}
        <form className="quote-form-sections" onSubmit={handleSubmit} id="quote-form">
          {/* Contact details */}
          <div className="panel card quote-section-card">
            <div className="quote-section-head">
              <div className="eyebrow">Step 1</div>
              <strong>Your details</strong>
            </div>
            <div className="quote-two-col-fields">
              <label className="quote-field-stack"><span>Full name *</span><input required placeholder="John Smith" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></label>
              <label className="quote-field-stack"><span>Email *</span><input required type="email" placeholder="john@example.com" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} /></label>
              <label className="quote-field-stack"><span>Phone</span><input type="tel" placeholder="07700 900 000" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /></label>
            </div>
          </div>

          {/* Address */}
          <div className="panel card quote-section-card">
            <div className="quote-section-head">
              <div className="eyebrow">Step 2</div>
              <strong>Service address</strong>
            </div>
            <div className="quote-two-col-fields">
              <label className="quote-field-stack"><span>Postcode *</span><input required placeholder="SW6 2NT" value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value.toUpperCase() })} /></label>
              <label className="quote-field-stack"><span>City</span><input placeholder="London" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
              <label className="quote-field-stack"><span>Address line 1 *</span><input required placeholder="10 Camden Road" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} /></label>
              <label className="quote-field-stack"><span>Address line 2</span><input placeholder="Flat 2" value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} /></label>
            </div>
          </div>

          {/* Service selection */}
          <div className="panel card quote-section-card">
            <div className="quote-section-head">
              <div className="eyebrow">Step 3</div>
              <strong>Service details</strong>
            </div>
            <div className="quote-two-col-fields">
              <label className="quote-field-stack">
                <span>Category *</span>
                <select value={categoryKey} onChange={(e) => {
                  const nextCategory = e.target.value as PublicCategoryKey;
                  setCategoryKey(nextCategory);
                  const nextOptions = listJobTypesForCategory(nextCategory);
                  setServiceKey(nextOptions[0]?.value || "");
                }}>
                  {categories.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
                </select>
              </label>
              <label className="quote-field-stack">
                <span>Service *</span>
                <select value={serviceKey} onChange={(e) => setServiceKey(e.target.value)}>
                  {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              {/* ── Property type (shown for services that define property types) ── */}
              {showPropertyType && (
                <label className="quote-field-stack">
                  <span>Property type</span>
                  <select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}>
                    {filteredPropertyTypes.map((pt) => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                  </select>
                </label>
              )}

              {/* ── Room-count cleaning fields ── */}
              {isCleaning && roomCount && (
                <>
                  <label className="quote-field-stack">
                    <span>Bedrooms</span>
                    <select value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}>
                      {[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n === 0 ? "Studio" : n}</option>)}
                    </select>
                  </label>
                  <label className="quote-field-stack">
                    <span>Bathrooms</span>
                    <select value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}>
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <label className="quote-field-stack">
                    <span>Kitchens</span>
                    <select value={form.kitchens} onChange={(e) => setForm({ ...form, kitchens: e.target.value })}>
                      {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <label className="quote-field-stack">
                    <span>Cleaning condition</span>
                    <select value={form.cleaningCondition} onChange={(e) => setForm({ ...form, cleaningCondition: e.target.value as CleaningConditionValue })}>
                      {cleaningConditionOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </label>
                </>
              )}

              {/* ── Cleaning supplies option ── */}
              {isCleaning && (
                <label className="quote-field-stack">
                  <span>Cleaning supplies</span>
                  <select value={form.supplies} onChange={(e) => setForm({ ...form, supplies: e.target.value as "customer" | "provider" })}>
                    <option value="customer">I will provide supplies</option>
                    <option value="provider">Provider brings supplies (+£12)</option>
                  </select>
                </label>
              )}

              {/* ── Job size (shown for non-room-count services) ── */}
              {showJobSize && sizeOptions.length > 0 && (
                <label className="quote-field-stack">
                  <span>Job scope</span>
                  <select value={form.jobSize} onChange={(e) => setForm({ ...form, jobSize: e.target.value as JobSizeValue })}>
                    {sizeOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
              )}
            </div>

            {/* ── Add-ons (if the job type has any) ── */}
            {selectedJob && selectedJob.addOns.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-text)" }}>
                  Add-ons
                </span>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  {selectedJob.addOns.map((addOn) => (
                    <label key={addOn.value} className="quote-check-item">
                      <input
                        type="checkbox"
                        checked={form.selectedAddOns.includes(addOn.value)}
                        onChange={() => toggleAddOn(addOn.value)}
                      />
                      <span>{addOn.label} (+{money(addOn.amount)})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="panel card quote-section-card">
            <div className="quote-section-head">
              <div className="eyebrow">Step 4</div>
              <strong>Scheduling</strong>
            </div>
            <div className="quote-two-col-fields">
              <label className="quote-field-stack"><span>Preferred date</span><input type="date" min={getTomorrowDate()} value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} /></label>
              <label className="quote-field-stack"><span>Preferred time</span><input type="time" value={form.scheduledTimeLabel} onChange={(e) => setForm({ ...form, scheduledTimeLabel: e.target.value })} /></label>
              <label className="quote-check-item"><input type="checkbox" checked={form.sameDay} onChange={(e) => setForm({ ...form, sameDay: e.target.checked })} /><span>Same-day service</span></label>
            </div>
            {isWeekend && (
              <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--color-brand)", fontWeight: 500, lineHeight: 1.5 }}>
                Your selected date falls on a weekend. A weekend surcharge will apply.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="panel card quote-section-card">
            <div className="quote-section-head">
              <div className="eyebrow">Optional</div>
              <strong>Job description / notes</strong>
              <p>Describe any special requirements or details the provider should know.</p>
            </div>
            <label className="quote-field-stack">
              <textarea
                placeholder="e.g. access code is 1234, pet in the house, focus on kitchen area..."
                maxLength={2000}
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                style={{ resize: "vertical" }}
              />
            </label>
            {form.notes.length > 0 && (
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem", textAlign: "right" }}>
                {form.notes.length}/2000
              </p>
            )}
          </div>

          {/* Photo upload */}
          <div className="panel card quote-section-card">
            <div className="quote-section-head">
              <div className="eyebrow">Optional</div>
              <strong>Photos</strong>
              <p>Upload up to 5 photos to help providers assess the job scope.</p>
            </div>

            {photoUrls.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                {photoUrls.map((url) => (
                  <div key={url} style={{ position: "relative", width: 80, height: 80, borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                    <img src={url} alt="Upload" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => removePhoto(url)}
                      style={{
                        position: "absolute", top: 2, right: 2, width: 20, height: 20,
                        borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff",
                        border: "none", cursor: "pointer", fontSize: "12px", lineHeight: 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      aria-label="Remove photo"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {photoUrls.length < 5 && (
              <UploadDropzone
                endpoint="jobPhotos"
                onClientUploadComplete={(res) => {
                  if (res) {
                    setPhotoUrls((prev) => [...prev, ...res.map((f) => f.ufsUrl)].slice(0, 5));
                  }
                  setUploadError("");
                }}
                onUploadError={(err) => {
                  setUploadError(err.message || "Upload failed");
                }}
                config={{ mode: "auto" }}
                appearance={{
                  container: {
                    border: "2px dashed var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "1rem",
                    background: "var(--color-surface-1, #fafafa)",
                  },
                  label: { color: "var(--color-text-muted)", fontSize: "0.85rem" },
                  allowedContent: { color: "var(--color-text-muted)", fontSize: "0.75rem" },
                  button: {
                    background: "var(--color-brand)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                  },
                }}
              />
            )}
            {uploadError && <p style={{ color: "var(--color-error)", fontSize: "0.85rem", marginTop: "0.25rem" }}>{uploadError}</p>}
          </div>

          {error ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>{error}</p> : null}
          <button className="button button-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
            {submitting ? "Creating quote..." : "Get Your Quote"}
          </button>
        </form>

        {/* ── Right sidebar: live pricing estimate + map ── */}
        <aside className="quote-sidebar-stack">
          {/* Pricing estimate */}
          <section className="panel card quote-summary-panel">
            <div className="eyebrow">Estimated pricing</div>
            {estimate ? (
              <>
                <h2 className="quote-total-number">
                  {estimate.minTotal === estimate.maxTotal
                    ? money(estimate.minTotal)
                    : `${money(estimate.minTotal)} – ${money(estimate.maxTotal)}`}
                </h2>
                <div className="quote-summary-list">
                  <div><span>Service</span><strong>{estimate.serviceName}</strong></div>
                  <div><span>Duration</span><strong>{estimate.hours}h estimated</strong></div>
                  <div>
                    <span>Provider rate</span>
                    <strong>
                      {money(estimate.minBase)}
                      {estimate.minBase !== estimate.maxBase ? ` – ${money(estimate.maxBase)}` : ""}
                    </strong>
                  </div>
                  {estimate.addOnsTotal > 0 && (
                    <div><span>Add-ons</span><strong>{money(estimate.addOnsTotal)}</strong></div>
                  )}
                  {estimate.timingAdjustment > 0 && (
                    <div><span>Weekend surcharge</span><strong>+{money(estimate.timingAdjustment)}</strong></div>
                  )}
                  <div><span>Booking fee</span><strong>{money(estimate.bookingFee)}</strong></div>
                  <div>
                    <span>Service fee ({estimate.commissionPct}%)</span>
                    <strong>
                      {money(estimate.minCommission)}
                      {estimate.minCommission !== estimate.maxCommission ? ` – ${money(estimate.maxCommission)}` : ""}
                    </strong>
                  </div>
                </div>
                {isCleaning && roomCount && (
                  <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                    Duration is estimated from your property details. Your final price will be confirmed after matching with an available provider.
                  </p>
                )}
                {isCleaning && !roomCount && (
                  <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                    Price is based on job scope and provider rates. Your final price will be confirmed after matching.
                  </p>
                )}
                {isPestControl && (
                  <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                    Price is based on the scope of the job. Providers may adjust after inspection if needed.
                  </p>
                )}
                {!isCleaning && !isPestControl && (
                  <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                    This is an estimate based on typical provider rates for this service. Your final price will be confirmed after matching with an available provider.
                  </p>
                )}
              </>
            ) : (
              <>
                <h2 className="quote-total-number" style={{ color: "var(--color-text-muted)" }}>—</h2>
                <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                  Select a service to see an estimated price breakdown.
                </p>
              </>
            )}
          </section>

          {/* Map panel */}
          {mapUrl ? (
            <section className="panel card quote-map-panel">
              <div className="quote-map-head">
                <div>
                  <div className="eyebrow">Service area</div>
                  <strong style={{ display: "block", marginTop: "0.3rem" }}>{form.postcode}</strong>
                </div>
                <span className="quote-map-badge">Covered</span>
              </div>
              <div className="quote-map-frame">
                <iframe
                  className="quote-map-iframe"
                  src={mapUrl}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Service location map"
                />
              </div>
            </section>
          ) : (
            <section className="panel card quote-map-panel">
              <div className="quote-map-head">
                <div>
                  <div className="eyebrow">Service area</div>
                  <strong style={{ display: "block", marginTop: "0.3rem" }}>Enter a postcode</strong>
                </div>
              </div>
              <div className="quote-map-frame">
                <div className="quote-map-overlay">
                  <strong>Map preview</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Enter your postcode to see the service area</span>
                </div>
              </div>
            </section>
          )}

          {/* Quick info */}
          <div className="panel card" style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--color-text-muted)" }}>
            <div className="eyebrow" style={{ marginBottom: "0.5rem" }}>How it works</div>
            <ol style={{ paddingLeft: "1.1rem", margin: 0, display: "grid", gap: "0.3rem" }}>
              <li>Fill in your job details</li>
              <li>We match you with available providers</li>
              <li>Compare prices and choose a provider</li>
              <li>Book and pay securely online</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
