"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { listPublicCategories, listJobTypesForCategory, getServiceValueForCategory } from "@/lib/public-quote/service-mapping";
import {
  jobTypeCatalog,
  serviceCatalog,
  propertyTypeOptions,
  cleaningConditionOptions,
  type CleaningConditionValue,
  type JobSizeValue,
  type PropertyTypeValue,
} from "@/lib/service-catalog";
import { UploadDropzone } from "@/lib/uploadthing";

type PublicCategoryKey = ReturnType<typeof listPublicCategories>[number]["key"];

/* ── Helpers ── */

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function money(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(value);
}

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

function isRoomCountCleaning(serviceValue: string, subcategory: string): boolean {
  return serviceValue === "cleaning" && ["home-cleaning", "tenancy-cleaning"].includes(subcategory);
}

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

/* ── Step definitions ── */

const STEPS = [
  { key: "address", label: "Address" },
  { key: "service", label: "Service" },
  { key: "details", label: "Details" },
  { key: "schedule", label: "Schedule" },
  { key: "notes", label: "Notes" },
  { key: "contact", label: "Contact" },
] as const;

/* ── Server estimate type ── */

type ServerEstimate = {
  servicePrice: number;
  bookingFee: number;
  postcodeSurcharge: number;
  addOnsTotal: number;
  totalCustomerPay: number;
  quoteRequired: boolean;
};

/* ── Main component ── */

export function PublicQuoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categories = listPublicCategories();

  const [step, setStep] = useState(0);
  const [categoryKey, setCategoryKey] = useState<PublicCategoryKey>((categories[0]?.key || "CLEANING") as PublicCategoryKey);
  const options = useMemo(() => listJobTypesForCategory(categoryKey), [categoryKey]);
  const [serviceKey, setServiceKey] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    password: "",
    confirmPassword: "",
    postcode: "",
    addressLine1: "",
    addressLine2: "",
    city: "London",
    scheduledDate: getTomorrowDate(),
    scheduledTimeLabel: "10:00",
    sameDay: false,
    bedrooms: "2",
    bathrooms: "1",
    kitchens: "1",
    propertyType: "flat" as string,
    cleaningCondition: "standard" as CleaningConditionValue,
    supplies: "customer" as "customer" | "provider",
    jobSize: "standard" as JobSizeValue,
    estimatedHours: "3",
    selectedAddOns: [] as string[],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({});
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState("");

  const serviceValue = getServiceValueForCategory(categoryKey) ?? "cleaning";
  const isCleaning = categoryKey === "CLEANING";
  const isPestControl = categoryKey === "PEST_CONTROL";

  const isWeekend = useMemo(() => {
    if (!form.scheduledDate) return false;
    const d = new Date(form.scheduledDate + "T12:00:00");
    const day = d.getDay();
    return day === 0 || day === 6;
  }, [form.scheduledDate]);
  const [schedulePassed, setSchedulePassed] = useState(false);

  const selectedJob = useMemo(() => jobTypeCatalog.find((j) => j.value === serviceKey), [serviceKey]);
  const roomCount = selectedJob ? isRoomCountCleaning(selectedJob.service, selectedJob.subcategory) : false;
  const showJobSize = !roomCount;
  const showPropertyType = selectedJob ? selectedJob.propertyTypes.length > 0 : false;

  const removePhoto = useCallback((url: string) => {
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
  }, []);

  useEffect(() => {
    setForm((prev) => ({ ...prev, selectedAddOns: [] }));
  }, [serviceKey]);

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

  const toggleAddOn = useCallback((key: string) => {
    setForm((prev) => ({
      ...prev,
      selectedAddOns: prev.selectedAddOns.includes(key)
        ? prev.selectedAddOns.filter((k) => k !== key)
        : [...prev.selectedAddOns, key],
    }));
  }, []);

  /* ── Server-side pricing estimate ── */
  const [estimate, setEstimate] = useState<ServerEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Build estimated hours for the API payload (same logic as before, needed for server)
  const estimatedHours = useMemo(() => {
    if (!selectedJob) return 2;
    if (isCleaning && roomCount) {
      return estimateCleaningHours(
        Math.max(Number(form.bedrooms) || 0, 0),
        Math.max(Number(form.bathrooms) || 0, 0),
        Math.max(Number(form.kitchens) || 1, 1),
        form.propertyType,
        form.cleaningCondition,
      );
    }
    if (selectedJob.durationHours[form.jobSize]) {
      return selectedJob.durationHours[form.jobSize];
    }
    return selectedJob.durationHours.standard ?? 2;
  }, [selectedJob, form.bedrooms, form.bathrooms, form.kitchens, form.propertyType, form.cleaningCondition, form.jobSize, isCleaning, roomCount]);

  // Fetch server estimate whenever pricing-relevant fields change
  const applyWeekendSurcharge = schedulePassed && isWeekend;

  useEffect(() => {
    // Need at least postcode + serviceKey to estimate
    if (!form.postcode.trim() || !serviceKey) {
      setEstimate(null);
      return;
    }

    // Debounce by 400ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setEstimateLoading(true);
      setEstimateError("");

      const payload: Record<string, unknown> = {
        postcode: form.postcode,
        categoryKey,
        serviceKey,
        estimatedHours,
        sameDay: form.sameDay,
        weekend: applyWeekendSurcharge,
      };

      // Cleaning-specific
      if (isCleaning && roomCount) {
        payload.bedrooms = Math.max(Number(form.bedrooms) || 0, 0);
        payload.bathrooms = Math.max(Number(form.bathrooms) || 0, 0);
        payload.kitchens = Math.max(Number(form.kitchens) || 1, 1);
        payload.cleaningCondition = form.cleaningCondition;
        payload.supplies = form.supplies;
        payload.propertyType = form.propertyType;
      } else if (isCleaning && !roomCount) {
        payload.jobSize = form.jobSize;
        payload.supplies = form.supplies;
      } else if (isPestControl) {
        payload.jobSize = form.jobSize;
      } else {
        payload.jobSize = form.jobSize;
      }

      if (showPropertyType && !payload.propertyType) {
        payload.propertyType = form.propertyType;
      }

      if (form.selectedAddOns.length > 0) {
        payload.addOns = form.selectedAddOns;
      }

      try {
        const res = await fetch("/api/quote-estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json();
          if (data.status === "no_coverage") {
            setEstimateError("No provider coverage for this postcode yet.");
          } else if (data.status === "no_pricing") {
            setEstimateError("Pricing not available for this service in your area.");
          } else {
            setEstimateError("Unable to estimate price.");
          }
          setEstimate(null);
          setEstimateLoading(false);
          return;
        }

        const data = await res.json();
        setEstimate({
          servicePrice: data.servicePrice,
          bookingFee: data.bookingFee,
          postcodeSurcharge: data.postcodeSurcharge,
          addOnsTotal: data.addOnsTotal,
          totalCustomerPay: data.totalCustomerPay,
          quoteRequired: data.quoteRequired,
        });
        setEstimateError("");
        setEstimateLoading(false);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setEstimateError("Unable to estimate price.");
        setEstimate(null);
        setEstimateLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    form.postcode, categoryKey, serviceKey, estimatedHours,
    form.sameDay, applyWeekendSurcharge,
    form.bedrooms, form.bathrooms, form.kitchens,
    form.propertyType, form.cleaningCondition, form.supplies,
    form.jobSize, form.selectedAddOns,
    isCleaning, isPestControl, roomCount, showPropertyType,
  ]);

  const sizeOptions = useMemo(() => {
    if (!selectedJob) return [];
    return selectedJob.sizeOptions.map((s) => ({ value: s.value, label: s.label }));
  }, [selectedJob]);

  const filteredPropertyTypes = useMemo(() => {
    if (!selectedJob || selectedJob.propertyTypes.length === 0) return propertyTypeOptions;
    return propertyTypeOptions.filter((pt) => selectedJob.propertyTypes.includes(pt.value as PropertyTypeValue));
  }, [selectedJob]);

  const mapUrl = useMemo(() => {
    if (!GOOGLE_MAPS_KEY || !form.postcode || form.postcode.length < 3) return null;
    const q = encodeURIComponent(form.postcode + ", London, UK");
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=${q}&zoom=15`;
  }, [form.postcode]);

  /* ── Step validation ── */
  function validateStep(s: number): string | null {
    switch (s) {
      case 0:
        if (!form.postcode.trim()) return "Please enter your postcode.";
        if (!form.addressLine1.trim()) return "Please enter your address.";
        return null;
      case 1:
        if (!serviceKey) return "Please select a service.";
        return null;
      case 2:
        return null;
      case 3:
        if (!form.scheduledDate) return "Please select a date.";
        return null;
      case 4:
        return null;
      case 5:
        if (!form.customerName.trim()) return "Please enter your name.";
        if (!form.customerEmail.trim()) return "Please enter your email.";
        if (!/\S+@\S+\.\S+/.test(form.customerEmail)) return "Please enter a valid email address.";
        if (!form.password) return "Please create a password for your account.";
        if (form.password.length < 8) return "Password must be at least 8 characters.";
        if (form.password !== form.confirmPassword) return "Passwords do not match.";
        return null;
      default:
        return null;
    }
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setStepErrors((prev) => ({ ...prev, [step]: err }));
      return;
    }
    setStepErrors((prev) => ({ ...prev, [step]: "" }));
    if (step === 3) setSchedulePassed(true);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToStep(target: number) {
    if (target <= step) {
      setStep(target);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const progressPct = Math.round(((step + 1) / STEPS.length) * 100);
  const showSidebar = step >= 1;

  const currentServiceCatalog = useMemo(() => {
    const cat = serviceCatalog.find((c) => c.value === (getServiceValueForCategory(categoryKey) ?? "cleaning"));
    if (!cat) return [];
    return cat.subcategories.map((sub) => ({
      ...sub,
      jobs: jobTypeCatalog.filter((j) => j.service === cat.value && j.subcategory === sub.value),
    }));
  }, [categoryKey]);

  /* ── Submit ── */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const contactErr = validateStep(5);
    if (contactErr) {
      setStepErrors((prev) => ({ ...prev, 5: contactErr }));
      setSubmitting(false);
      return;
    }

    const payload: Record<string, unknown> = {
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      customerPhone: form.customerPhone,
      password: form.password,
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

    if (form.selectedAddOns.length > 0) {
      payload.addOns = form.selectedAddOns;
    }
    if (form.notes.trim()) {
      payload.notes = form.notes.trim();
    }
    if (showPropertyType) {
      payload.propertyType = form.propertyType;
    }

    if (isCleaning && roomCount) {
      payload.bedrooms = Number(form.bedrooms) || 0;
      payload.bathrooms = Number(form.bathrooms) || 0;
      payload.kitchens = Number(form.kitchens) || 1;
      payload.cleaningCondition = form.cleaningCondition;
      payload.supplies = form.supplies;
      payload.estimatedHours = estimatedHours;
    } else if (isCleaning && !roomCount) {
      payload.jobSize = form.jobSize;
      payload.supplies = form.supplies;
      payload.estimatedHours = estimatedHours;
    } else if (isPestControl) {
      payload.jobSize = form.jobSize;
      payload.estimatedHours = estimatedHours;
    } else {
      payload.jobSize = form.jobSize;
      payload.estimatedHours = estimatedHours;
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

  /* ── Render ── */

  return (
    <div className="panel card">
      <div className="eyebrow">Get a quote</div>
      <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>
        Tell us about your job
      </h1>
      <p className="lead" style={{ marginTop: "0.3rem", marginBottom: "0", fontSize: "0.95rem", color: "var(--color-text-muted)" }}>
        Complete each step below and we will match you with an available provider in your area.
      </p>

      {/* ── Progress bar ── */}
      <div className="quote-progress-wrap">
        <div className="quote-progress-topline">
          <span>Step {step + 1} of {STEPS.length}: <strong>{STEPS[step].label}</strong></span>
          <strong>{progressPct}%</strong>
        </div>
        <div className="quote-progress-track">
          <div className="quote-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="quote-step-indicators">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`quote-step-dot ${i === step ? "quote-step-dot-active" : ""} ${i < step ? "quote-step-dot-done" : ""}`}
              onClick={() => goToStep(i)}
              aria-label={`Step ${i + 1}: ${s.label}`}
              title={s.label}
            >
              {i < step ? "\u2713" : i + 1}
            </button>
          ))}
          <span className="quote-step-label">{STEPS[step].label}</span>
        </div>
      </div>

      {/* ── Layout: form + optional sidebar ── */}
      <div className={`quote-wizard-layout ${showSidebar ? "has-sidebar" : ""}`} style={{ marginTop: "1.5rem" }}>
        <form onSubmit={handleSubmit} id="quote-form">
          <div className="quote-wizard-step" key={`step-${step}`}>

            {/* ═══════ STEP 0: ADDRESS ═══════ */}
            {step === 0 && (
              <div className="panel card quote-section-card">
                <div className="quote-section-head">
                  <strong>Confirm your service address</strong>
                  <p>Check the address below or update if needed.</p>
                </div>

                {form.postcode && form.addressLine1 && (
                  <div className="quote-address-confirm">
                    <strong>{form.addressLine1}{form.addressLine2 ? `, ${form.addressLine2}` : ""}</strong>
                    <span>{form.postcode}, {form.city || "London"}</span>
                  </div>
                )}

                <div className="quote-two-col-fields" style={{ marginTop: "1rem" }}>
                  <label className="quote-field-stack">
                    <span>Postcode *</span>
                    <input required placeholder="SW6 2NT" value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value.toUpperCase() })} />
                  </label>
                  <label className="quote-field-stack">
                    <span>City</span>
                    <input placeholder="London" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </label>
                  <label className="quote-field-stack">
                    <span>Address line 1 *</span>
                    <input required placeholder="10 Camden Road" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
                  </label>
                  <label className="quote-field-stack">
                    <span>Address line 2</span>
                    <input placeholder="Flat 2" value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
                  </label>
                </div>

                {mapUrl && (
                  <div className="quote-map-frame" style={{ marginTop: "1rem", minHeight: 280 }}>
                    <iframe
                      className="quote-map-iframe"
                      src={mapUrl}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Service location map"
                      style={{ height: 280 }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ═══════ STEP 1: SERVICE SELECTION ═══════ */}
            {step === 1 && (
              <div className="panel card quote-section-card">
                {/* Sub-step A: pick a category (show when no serviceKey yet) */}
                {!serviceKey ? (
                  <>
                    <div className="quote-section-head">
                      <strong>What do you need help with?</strong>
                    </div>
                    <div className="service-chip-grid">
                      {categories.map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          className={`service-chip ${categoryKey === cat.key ? "service-chip-selected" : ""}`}
                          onClick={() => {
                            const nextCategory = cat.key as PublicCategoryKey;
                            setCategoryKey(nextCategory);
                            /* Don't auto-select a job — let user pick */
                          }}
                        >
                          <strong>{cat.label}</strong>
                        </button>
                      ))}
                    </div>

                    {/* Show job types for selected category as list rows */}
                    {categoryKey && (
                      <div className="job-list" style={{ marginTop: "1.5rem" }}>
                        {currentServiceCatalog.map((sub) => (
                          sub.jobs.length > 0 && (
                            <div key={sub.value} className="job-list-group">
                              <div className="job-list-group-title">{sub.label}</div>
                              {sub.jobs.map((job) => (
                                <button
                                  key={job.value}
                                  type="button"
                                  className="job-list-row"
                                  onClick={() => setServiceKey(job.value)}
                                >
                                  <span className="job-list-row-name">{job.label}</span>
                                  <span className="job-list-row-price">From {money(job.startingPrice)}</span>
                                </button>
                              ))}
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* Sub-step B: category chosen + job selected — show summary with change option */
                  <>
                    <div className="quote-section-head">
                      <strong>Your selection</strong>
                    </div>
                    <div className="quote-service-chosen">
                      <div className="quote-service-chosen-info">
                        <span className="muted">{categories.find((c) => c.key === categoryKey)?.label}</span>
                        <strong>{selectedJob?.label}</strong>
                      </div>
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() => setServiceKey("")}
                      >
                        Change
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ═══════ STEP 2: SERVICE DETAILS ═══════ */}
            {step === 2 && (
              <div className="panel card quote-section-card">
                <div className="quote-section-head">
                  <strong>Service details</strong>
                  <p>Tell us more about the job so we can provide an accurate quote.</p>
                </div>
                <div className="quote-two-col-fields">
                  {showPropertyType && (
                    <label className="quote-field-stack">
                      <span>Property type</span>
                      <select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}>
                        {filteredPropertyTypes.map((pt) => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                      </select>
                    </label>
                  )}

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

                  {isCleaning && (
                    <label className="quote-field-stack">
                      <span>Cleaning supplies</span>
                      <select value={form.supplies} onChange={(e) => setForm({ ...form, supplies: e.target.value as "customer" | "provider" })}>
                        <option value="customer">I will provide supplies</option>
                        <option value="provider">Provider brings supplies (+£12)</option>
                      </select>
                    </label>
                  )}

                  {showJobSize && sizeOptions.length > 0 && (
                    <label className="quote-field-stack">
                      <span>Job scope</span>
                      <select value={form.jobSize} onChange={(e) => setForm({ ...form, jobSize: e.target.value as JobSizeValue })}>
                        {sizeOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </label>
                  )}
                </div>

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
            )}

            {/* ═══════ STEP 3: SCHEDULING ═══════ */}
            {step === 3 && (
              <div className="panel card quote-section-card">
                <div className="quote-section-head">
                  <strong>Scheduling</strong>
                  <p>When would you like the service?</p>
                </div>
                <div className="quote-two-col-fields">
                  <label className="quote-field-stack">
                    <span>Preferred date</span>
                    <input type="date" min={getTomorrowDate()} value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
                  </label>
                  <label className="quote-field-stack">
                    <span>Preferred time</span>
                    <input type="time" value={form.scheduledTimeLabel} onChange={(e) => setForm({ ...form, scheduledTimeLabel: e.target.value })} />
                  </label>
                  <label className="quote-check-item">
                    <input type="checkbox" checked={form.sameDay} onChange={(e) => setForm({ ...form, sameDay: e.target.checked })} />
                    <span>Same-day service</span>
                  </label>
                </div>
                {isWeekend && (
                  <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--color-brand)", fontWeight: 500, lineHeight: 1.5 }}>
                    Your selected date falls on a weekend. A weekend surcharge will apply.
                  </p>
                )}
              </div>
            )}

            {/* ═══════ STEP 4: NOTES & PHOTOS ═══════ */}
            {step === 4 && (
              <div style={{ display: "grid", gap: "1rem" }}>
                <div className="panel card quote-section-card">
                  <div className="quote-section-head">
                    <strong>Job description / notes</strong>
                    <p>Describe any special requirements or details the provider should know. This step is optional.</p>
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

                <div className="panel card quote-section-card">
                  <div className="quote-section-head">
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
              </div>
            )}

            {/* ═══════ STEP 5: CONTACT INFO (LAST) ═══════ */}
            {step === 5 && (
              <div className="panel card quote-section-card">
                <div className="quote-section-head">
                  <strong>Your contact details</strong>
                  <p>We will use this to send your quote and booking confirmation.</p>
                </div>
                <div className="quote-two-col-fields">
                  <label className="quote-field-stack">
                    <span>Full name *</span>
                    <input required placeholder="John Smith" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
                  </label>
                  <label className="quote-field-stack">
                    <span>Email *</span>
                    <input required type="email" placeholder="john@example.com" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
                  </label>
                  <label className="quote-field-stack">
                    <span>Phone</span>
                    <input type="tel" placeholder="07700 900 000" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
                  </label>
                </div>
                <div className="quote-section-head" style={{ marginTop: "1.5rem" }}>
                  <strong>Create your account</strong>
                  <p>Set a password so you can track your booking and manage your account.</p>
                </div>
                <div className="quote-two-col-fields">
                  <label className="quote-field-stack">
                    <span>Password *</span>
                    <input required type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </label>
                  <label className="quote-field-stack">
                    <span>Confirm password *</span>
                    <input required type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ── Step error ── */}
          {stepErrors[step] && (
            <p style={{ color: "var(--color-error)", lineHeight: 1.6, marginTop: "0.75rem" }}>{stepErrors[step]}</p>
          )}

          {/* ── Submission error ── */}
          {error && step === 5 && (
            <p style={{ color: "var(--color-error)", lineHeight: 1.6, marginTop: "0.75rem" }}>{error}</p>
          )}

          {/* ── Navigation buttons ── */}
          <div className="quote-wizard-nav">
            {step > 0 && (
              <button type="button" className="button button-secondary" onClick={goBack}>
                Back
              </button>
            )}
            {step === 4 && (
              <button type="button" className="quote-step-skip" onClick={goNext} style={{ marginRight: "auto" }}>
                Skip this step &rarr;
              </button>
            )}
            {step < STEPS.length - 1 && (
              <button type="button" className="button button-primary" onClick={goNext}>
                Continue
              </button>
            )}
            {step === STEPS.length - 1 && (
              <button className="button button-primary" type="submit" disabled={submitting}>
                {submitting ? "Creating quote..." : "Get Your Quote"}
              </button>
            )}
          </div>
        </form>

        {/* ── Right sidebar: pricing + info (visible from Step 1 onwards) ── */}
        {showSidebar && (
          <aside className="quote-sidebar-stack">
            {/* Pricing estimate */}
            <section className="panel card quote-summary-panel">
              <div className="eyebrow">Your price</div>
              {estimateLoading && !estimate && (
                <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
                  <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Calculating price...</p>
                </div>
              )}
              {estimateError && !estimate && (
                <div style={{ padding: "1rem 0" }}>
                  <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{estimateError}</p>
                </div>
              )}
              {estimate ? (
                <>
                  <h2 className="quote-total-number" style={estimateLoading ? { opacity: 0.5 } : undefined}>
                    {money(estimate.totalCustomerPay)}
                  </h2>
                  <div className="quote-summary-list">
                    <div><span>Service</span><strong>{selectedJob?.label ?? serviceKey}</strong></div>
                    <div><span>Service price</span><strong>{money(estimate.servicePrice)}</strong></div>
                    {estimate.addOnsTotal > 0 && (
                      <div><span>Add-ons</span><strong>{money(estimate.addOnsTotal)}</strong></div>
                    )}
                    {estimate.postcodeSurcharge > 0 && (
                      <div><span>Area surcharge</span><strong>+{money(estimate.postcodeSurcharge)}</strong></div>
                    )}
                    <div><span>Booking fee</span><strong>{money(estimate.bookingFee)}</strong></div>
                  </div>
                  {estimate.quoteRequired && (
                    <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-brand)", fontWeight: 500, lineHeight: 1.6 }}>
                      This service requires a manual review. You will receive a confirmed quote by email.
                    </p>
                  )}
                  {!estimate.quoteRequired && (
                    <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                      This is the price you will pay. You can book and pay securely after submitting.
                    </p>
                  )}
                </>
              ) : !estimateLoading && !estimateError ? (
                <>
                  <h2 className="quote-total-number" style={{ color: "var(--color-text-muted)" }}>—</h2>
                  <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                    Select a service to see your price.
                  </p>
                </>
              ) : null}
            </section>

            {/* Map panel */}
            {mapUrl && (
              <section className="panel card quote-map-panel">
                <div className="quote-map-head">
                  <div>
                    <div className="eyebrow">Service area</div>
                    <strong style={{ display: "block", marginTop: "0.3rem" }}>{form.postcode}</strong>
                  </div>
                  <span className="quote-map-badge">Covered</span>
                </div>
                <div className="quote-map-frame" style={{ minHeight: 280 }}>
                  <iframe
                    className="quote-map-iframe"
                    src={mapUrl}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Service location map"
                    style={{ height: 280 }}
                  />
                </div>
              </section>
            )}

            {/* Quick info */}
            <div className="panel card" style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--color-text-muted)" }}>
              <div className="eyebrow" style={{ marginBottom: "0.5rem" }}>How it works</div>
              <ol style={{ paddingLeft: "1.1rem", margin: 0, display: "grid", gap: "0.3rem" }}>
                <li>Fill in your job details</li>
                <li>We match you with an available provider</li>
                <li>Review your quote</li>
                <li>Book and pay securely online</li>
              </ol>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
