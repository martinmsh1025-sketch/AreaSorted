"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Address3DMap } from "@/components/quote/address-3d-map";
import { saveBookingDraft } from "@/lib/booking-draft";
import {
  calculateQuote,
  cleaningConditionOptions,
  formatCurrency,
  getJobTypeByValue,
  getJobTypesByService,
  getServiceByValue,
  propertyTypeOptions,
  serviceCatalog,
  type CleaningConditionValue,
  type JobSizeValue,
  type PropertyTypeValue,
  type ServiceValue,
} from "@/lib/service-catalog";

type VisitEntry = {
  date: string;
  time: string;
};

const quoteSteps = [
  { key: "address", label: "Address" },
  { key: "service", label: "Service" },
  { key: "booking", label: "Booking" },
  { key: "extras", label: "Extras & notes" },
  { key: "customer", label: "Customer" },
  { key: "terms", label: "Terms" },
] as const;

function formatEstimatedHours(hours: number) {
  const roundedDown = Math.max(0.5, Math.floor(hours * 2) / 2);
  return Number.isInteger(roundedDown) ? `${roundedDown.toFixed(0)} hours` : `${roundedDown.toFixed(1)} hours`;
}

function floorCurrency(value: number) {
  return Math.floor(value);
}

type InstantQuoteFormProps = {
  initialPostcode: string;
  initialAddressLine1: string;
  initialAddressLine2: string;
  initialCity: string;
  initialService: string;
};

export function InstantQuoteForm({
  initialPostcode,
  initialAddressLine1,
  initialAddressLine2,
  initialCity,
  initialService,
}: InstantQuoteFormProps) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const timeOptions = Array.from({ length: 24 }, (_, index) => {
    const hour = String(Math.floor(index / 2)).padStart(2, "0");
    const minute = index % 2 === 0 ? "00" : "30";
    return `${hour}:${minute}`;
  }).filter((value) => value >= "08:00" && value <= "20:30");

  const safeInitialService = serviceCatalog.some((option) => option.value === initialService) ? (initialService as ServiceValue) : "";
  const [service, setService] = useState<ServiceValue | "">(safeInitialService);
  const serviceDefinition = service ? getServiceByValue(service) : null;
  const serviceJobTypes = service ? getJobTypesByService(service) : [];
  const [jobType, setJobType] = useState("");
  const activeJobType = service && jobType ? getJobTypeByValue(jobType, service as ServiceValue) : null;
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const initialPropertyType = activeJobType?.propertyTypes[0] ?? "flat";
  const [postcode, setPostcode] = useState(initialPostcode);
  const [addressLine1, setAddressLine1] = useState(initialAddressLine1);
  const [addressLine2, setAddressLine2] = useState(initialAddressLine2);
  const [city, setCity] = useState(initialCity || "London");
  const [propertyType, setPropertyType] = useState<PropertyTypeValue>(initialPropertyType);
  const [jobSize, setJobSize] = useState<JobSizeValue>("small");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("10:00");
  const [visits, setVisits] = useState<VisitEntry[]>([{ date: "", time: "10:00" }]);
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [kitchens, setKitchens] = useState("1");
  const [areaSize, setAreaSize] = useState("");
  const [cleaningCondition, setCleaningCondition] = useState<CleaningConditionValue>("standard");
  const [suppliesProvidedBy, setSuppliesProvidedBy] = useState<"customer" | "provider">("customer");
  const [customerName, setCustomerName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [additionalRequests, setAdditionalRequests] = useState("");
  const [entryNotes, setEntryNotes] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasPrefilledAddress = Boolean(initialAddressLine1 || initialCity);
  const activeSteps = hasPrefilledAddress ? quoteSteps.slice(1) : quoteSteps;
  const [currentStep, setCurrentStep] = useState(0);

  const availablePropertyTypes = propertyTypeOptions.filter((option) => activeJobType?.propertyTypes.includes(option.value));
  const isCleaningService = service === "cleaning";
  const activeVisits = isCleaningService ? visits.filter((visit) => visit.date) : [{ date: preferredDate, time: preferredTime }];
  const primaryVisit = activeVisits[0] ?? { date: preferredDate, time: preferredTime };
  const progressPercent = Math.round(((currentStep + 1) / activeSteps.length) * 100);

  const pricing = useMemo(
    () =>
      service && activeJobType ? calculateQuote({
        service,
        jobType,
        postcode,
        propertyType,
        jobSize,
        urgency: "planned",
        preferredDate: primaryVisit?.date || preferredDate,
        preferredTime: primaryVisit?.time || preferredTime,
        selectedAddOns,
        bedrooms: Number(bedrooms) || 0,
        bathrooms: Number(bathrooms) || 0,
        kitchens: Number(kitchens) || 0,
        areaSize: Number(areaSize) || 0,
        cleaningCondition,
        visitCount: activeVisits.length,
        suppliesProvidedBy,
      }) : null,
    [service, activeJobType, jobType, postcode, propertyType, jobSize, preferredDate, preferredTime, selectedAddOns, bedrooms, bathrooms, kitchens, areaSize, cleaningCondition, activeVisits.length, primaryVisit?.date, primaryVisit?.time, suppliesProvidedBy],
  );

  const quoteReady = pricing && activeJobType
    ? (isCleaningService
        ? Boolean(Number(bedrooms) > 0 && Number(bathrooms) >= 0 && Number(kitchens) > 0 && pricing.coverage.supported)
        : Boolean(pricing.coverage.supported))
    : false;

  const canAdvanceFromServiceStep = Boolean(service && selectedSubcategory && activeJobType);

  function toggleAddOn(value: string) {
    setSelectedAddOns((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  async function nextStep() {
    if (isAdvancing) return;
    if (currentStep === (hasPrefilledAddress ? 0 : 1) && !canAdvanceFromServiceStep) {
      setQuoteError("Please choose a service and service option first.");
      return;
    }
    setQuoteError("");
    setIsAdvancing(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    setCurrentStep((value) => Math.min(value + 1, activeSteps.length - 1));
    setIsAdvancing(false);
  }

  async function previousStep() {
    if (isAdvancing) return;
    setQuoteError("");
    setIsAdvancing(true);
    await new Promise((resolve) => setTimeout(resolve, 180));
    setCurrentStep((value) => Math.max(value - 1, 0));
    setIsAdvancing(false);
  }

  async function handleContinueToBooking() {
    if (!pricing || !serviceDefinition || !activeJobType || isSubmitting) return;

    const missingFields: string[] = [];

    if (!postcode.trim()) missingFields.push("postcode");
    if (!addressLine1.trim()) missingFields.push("address line 1");
    if (!city.trim()) missingFields.push("city");
    if (isCleaningService) {
      if (!activeVisits.length) missingFields.push("at least one visit date");
    } else if (!preferredDate.trim()) {
      missingFields.push("preferred date");
    }
    if (!customerName.trim()) missingFields.push("customer name");
    if (!contactPhone.trim()) missingFields.push("contact phone");
    if (!email.trim()) missingFields.push("email");

    if (!pricing.coverage.supported) {
      setQuoteError("This postcode is outside the current London launch coverage. Please try a supported London postcode.");
      return;
    }

    if (!acceptedTerms) missingFields.push("Terms & Conditions");

    if (missingFields.length) {
      setQuoteError(`Please complete: ${missingFields.join(", ")}.`);
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 350));

    saveBookingDraft({
      postcode,
      addressLine1,
      addressLine2,
      city,
      service,
      jobType,
      propertyType,
      jobSize,
      urgency: "planned",
      preferredDate: primaryVisit?.date || preferredDate,
      preferredTime: primaryVisit?.time || preferredTime,
      visits: activeVisits,
      bedrooms,
      bathrooms,
      kitchens,
      areaSize,
      cleaningCondition,
      suppliesProvidedBy,
      customerName,
      contactPhone,
      email,
      selectedAddOns,
      additionalRequests,
      entryNotes,
      acceptedTerms,
      pricing,
    });

    router.push("/book");
  }

  return (
    <main className="section">
      {isAdvancing || isSubmitting ? (
        <div className="page-loading-overlay" role="status" aria-live="polite">
          <div className="page-loading-card">
            <span className="page-loading-spinner" />
            <strong>Loading...</strong>
            <span>Please wait...</span>
          </div>
        </div>
      ) : null}
      <div className="container">
        <div style={{ maxWidth: 760, marginBottom: "2rem" }}>
          <div className="eyebrow">Instant quote</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2.2rem, 4vw, 4rem)" }}>
            Build a clear service quote before you book.
          </h1>
          <p className="lead">Choose the service first, then refine the job details, slot, and add-ons.</p>
          <div className="quote-progress-wrap">
            <div className="quote-progress-topline">
              <strong>{activeSteps[currentStep]?.label}</strong>
              <span>{progressPercent}% completed</span>
            </div>
            <div className="quote-progress-track">
              <div className="quote-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="quote-page-grid">
          <form className="quote-form-sections">
            {!hasPrefilledAddress && currentStep === 0 ? <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section A</div>
                <strong>Address</strong>
                <p>Check the postcode first, then move on to the property and service details.</p>
              </div>
              <input placeholder="Postcode" value={postcode} onChange={(event) => setPostcode(event.target.value.toUpperCase())} />
              <input placeholder="Address line 1" value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} />
              <input placeholder="Address line 2" value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} />
              <input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
            </section> : null}

            {currentStep === (hasPrefilledAddress ? 0 : 1) ? <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section B</div>
                <strong>Service details</strong>
                <p>Choose the service type first, then the exact service option. The rest appears after that.</p>
              </div>
              <div className="quote-field-stack">
                <span>Service type</span>
                <div className="service-chip-grid">
                  {serviceCatalog.map((option) => {
                    const isSelected = service === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`service-chip ${isSelected ? "service-chip-selected" : ""}`}
                        onClick={() => {
                          const nextService = option.value;
                          setService(nextService);
                          setSelectedSubcategory("");
                          setJobType("");
                          setPropertyType("flat");
                          setSelectedAddOns([]);
                          setQuoteError("");
                        }}
                      >
                        <strong>{option.label}</strong>
                      </button>
                    );
                  })}
                </div>
              </div>

              {service ? <div className="quote-field-stack" style={{ marginTop: "1rem" }}>
                <span>Service option</span>
                <div className="service-chip-grid service-subcategory-grid">
                  {serviceDefinition?.subcategories.map((subcategory) => {
                    const isSelected = selectedSubcategory === subcategory.value;
                    return (
                      <button
                        key={subcategory.value}
                        type="button"
                        className={`service-chip ${isSelected ? "service-chip-selected" : ""}`}
                        onClick={() => {
                          setSelectedSubcategory(subcategory.value);
                          setJobType("");
                          setSelectedAddOns([]);
                        }}
                      >
                        <strong>{subcategory.label}</strong>
                      </button>
                    );
                  })}
                </div>
              </div> : null}

              {service && selectedSubcategory ? <div className="quote-field-stack" style={{ marginTop: "1rem" }}>
                <span>Job list</span>
                <div className="service-option-list">
                  {serviceJobTypes
                    .filter((option) => option.subcategory === selectedSubcategory)
                    .map((option) => {
                      const isSelected = jobType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`service-option-item ${isSelected ? "service-option-item-selected" : ""}`}
                          onClick={() => {
                            const nextJobType = getJobTypeByValue(option.value, service as ServiceValue);
                            setJobType(nextJobType.value);
                            setPropertyType(nextJobType.propertyTypes[0] ?? "flat");
                            setSelectedAddOns([]);
                          }}
                        >
                          <strong>{option.label}</strong>
                        </button>
                      );
                    })}
                </div>
              </div> : null}

              {activeJobType ? <label className="quote-field-stack" style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
                <span>Details</span>
                <textarea value={activeJobType.strapline} readOnly aria-readonly="true" rows={2} />
              </label> : null}

              {activeJobType ? <div className="quote-two-col-fields" style={{ marginTop: "0.2rem" }}>
                <label className="quote-field-stack">
                  <span>Property type *</span>
                  <select value={propertyType} onChange={(event) => setPropertyType(event.target.value as PropertyTypeValue)}>
                    {availablePropertyTypes.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                {!isCleaningService ? (
                  <label className="quote-field-stack">
                    <span>Job size *</span>
                    <select value={jobSize} onChange={(event) => setJobSize(event.target.value as JobSizeValue)}>
                      {activeJobType.sizeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div> : null}

              {activeJobType && isCleaningService ? (
                <div className="quote-two-col-fields" style={{ marginTop: "0.2rem" }}>
                  <label className="quote-field-stack">
                    <span>Bedrooms</span>
                    <select value={bedrooms} onChange={(event) => setBedrooms(event.target.value)}>
                      {Array.from({ length: 8 }, (_, index) => String(index)).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="quote-field-stack">
                    <span>Bathrooms</span>
                    <select value={bathrooms} onChange={(event) => setBathrooms(event.target.value)}>
                      {Array.from({ length: 6 }, (_, index) => String(index)).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="quote-field-stack">
                    <span>Kitchens</span>
                    <select value={kitchens} onChange={(event) => setKitchens(event.target.value)}>
                      {Array.from({ length: 4 }, (_, index) => String(index + 1)).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="quote-field-stack">
                    <span>Approx area (sq ft)</span>
                    <input type="number" min="0" step="10" value={areaSize} onChange={(event) => setAreaSize(event.target.value)} placeholder="650" />
                  </label>
                  <label className="quote-field-stack">
                    <span>Condition</span>
                    <select value={cleaningCondition} onChange={(event) => setCleaningCondition(event.target.value as CleaningConditionValue)}>
                      {cleaningConditionOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="quote-field-stack" style={{ gridColumn: "1 / -1" }}>
                    <span>Supplies</span>
                    <select value={suppliesProvidedBy} onChange={(event) => setSuppliesProvidedBy(event.target.value as "customer" | "provider")}>
                      <option value="customer">Customer provides supplies</option>
                      <option value="provider">Provider brings supplies</option>
                    </select>
                  </label>
                  <label className="quote-field-stack" style={{ gridColumn: "1 / -1" }}>
                    <span>Estimated provider time</span>
                    <input value={pricing ? formatEstimatedHours(pricing.estimatedDurationHours) : "Pending"} readOnly aria-readonly="true" />
                  </label>
                </div>
              ) : activeJobType ? (
                <div className="quote-two-col-fields" style={{ marginTop: "0.2rem" }}>
                  <label className="quote-field-stack" style={{ gridColumn: "1 / -1" }}>
                    <span>Estimated provider time</span>
                    <input value={pricing ? formatEstimatedHours(pricing.estimatedDurationHours) : "Pending"} readOnly aria-readonly="true" />
                  </label>
                </div>
              ) : null}

              {hasPrefilledAddress ? (
                <div style={{ marginTop: "1rem" }}>
                  <Address3DMap addressLine1={addressLine1} addressLine2={addressLine2} city={city} postcode={postcode} />
                </div>
              ) : null}
            </section> : null}

            {currentStep === (hasPrefilledAddress ? 1 : 2) ? <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section C</div>
                <strong>Booking details</strong>
                <p>{isCleaningService ? "Cleaning can include multiple visits. Past dates are blocked and time choices run in 30-minute steps only." : "Select the preferred slot. Past dates are blocked and time choices run in 30-minute steps only."}</p>
              </div>
              {isCleaningService ? (
                <div style={{ display: "grid", gap: "0.8rem" }}>
                  {visits.map((visit, index) => (
                    <div key={`${index}-${visit.date}-${visit.time}`} className="quote-two-col-fields">
                      <label className="quote-field-stack">
                        <span>{index === 0 ? "Preferred date" : `Additional date ${index}`}</span>
                        <input
                          type="date"
                          min={today}
                          value={visit.date}
                          onChange={(event) => {
                            const next = [...visits];
                            next[index] = { ...next[index], date: event.target.value };
                            setVisits(next);
                          }}
                        />
                      </label>
                      <label className="quote-field-stack">
                        <span>{index === 0 ? "Preferred time" : `Additional time ${index}`}</span>
                        <select
                          value={visit.time}
                          onChange={(event) => {
                            const next = [...visits];
                            next[index] = { ...next[index], time: event.target.value };
                            setVisits(next);
                          }}
                        >
                          {timeOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))}
                  <div className="button-row">
                    <button type="button" className="button button-secondary" onClick={() => setVisits([...visits, { date: "", time: "10:00" }])}>Add another visit</button>
                    {visits.length > 1 ? <button type="button" className="button button-secondary" onClick={() => setVisits(visits.slice(0, -1))}>Remove last visit</button> : null}
                  </div>
                </div>
              ) : (
                <div className="quote-two-col-fields">
                  <label className="quote-field-stack">
                    <span>Preferred date *</span>
                    <input type="date" min={today} value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} />
                  </label>
                  <label className="quote-field-stack">
                    <span>Preferred time *</span>
                    <select value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)}>
                      {timeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </section> : null}

            {currentStep === (hasPrefilledAddress ? 2 : 3) ? <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section D</div>
                <strong>Extras & notes</strong>
                <p>Optional extras and notes stay together so customers only fill one extra-details step.</p>
              </div>
              {activeJobType ? <div className="quote-check-grid">
                {activeJobType.addOns.map((addOn) => (
                  <label key={addOn.value} className="quote-check-item"><input type="checkbox" checked={selectedAddOns.includes(addOn.value)} onChange={() => toggleAddOn(addOn.value)} /><span>{`${addOn.label} + ${formatCurrency(addOn.amount)}`}</span></label>
                ))}
              </div> : null}
              <textarea placeholder="Additional requests" rows={4} value={additionalRequests} onChange={(event) => setAdditionalRequests(event.target.value)} />
              <textarea placeholder="Entry notes, access instructions, or photo guidance" rows={3} value={entryNotes} onChange={(event) => setEntryNotes(event.target.value)} />
            </section> : null}

            {currentStep === (hasPrefilledAddress ? 3 : 4) ? <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section E</div>
                <strong>Customer details</strong>
                <p>These details are needed for confirmation, updates, receipts, and payment.</p>
              </div>
              <div className="quote-two-col-fields">
                <label className="quote-field-stack">
                  <span>Customer name *</span>
                  <input placeholder="Full name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                </label>
                <label className="quote-field-stack">
                  <span>Contact phone *</span>
                  <input placeholder="Phone number" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
                </label>
                <label className="quote-field-stack" style={{ gridColumn: "1 / -1" }}>
                  <span>Email *</span>
                  <input placeholder="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </label>
              </div>
            </section> : null}

            {currentStep === (hasPrefilledAddress ? 4 : 5) ? <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section F</div>
                <strong>Terms & Conditions</strong>
                <p>The customer must agree to the booking terms before payment.</p>
              </div>
              <label className="quote-check-item">
                <input type="checkbox" checked={acceptedTerms} onChange={() => setAcceptedTerms((value) => !value)} />
                <span>
                  I agree to the <a href="/terms-and-conditions" style={{ color: "var(--color-accent)", fontWeight: 700 }}>Terms & Conditions</a>. *
                </span>
              </label>
            </section> : null}

            <div className="button-row" style={{ justifyContent: currentStep === 0 ? "flex-end" : "space-between" }}>
              {currentStep > 0 ? <button type="button" className="button button-secondary" onClick={previousStep}>Back</button> : null}
              {currentStep < activeSteps.length - 1 ? <button type="button" className="button button-primary" onClick={nextStep} disabled={isAdvancing}>{isAdvancing ? <span className="button-spinner-wrap"><span className="button-spinner" />Loading</span> : "Next"}</button> : null}
            </div>
          </form>

          <aside className="quote-sidebar-stack">
            <section className="panel card quote-summary-panel">
              <div className="eyebrow">Quote summary</div>
              {quoteReady && pricing && activeJobType ? (
                <>
                  <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>Estimated total</h2>
                  <div className="quote-total-number">{formatCurrency(floorCurrency(pricing.total))}</div>
                  <div className="quote-summary-list">
                    <div><span>Base amount</span><strong>{formatCurrency(floorCurrency(pricing.basePrice))}</strong></div>
                    {pricing.showJobSize ? <div><span>Job size uplift</span><strong>{formatCurrency(floorCurrency(pricing.jobSizeAdjustment))}</strong></div> : null}
                    {pricing.scopeAdjustment ? <div><span>{isCleaningService ? "Room count & condition" : "Scope adjustment"}</span><strong>{formatCurrency(floorCurrency(pricing.scopeAdjustment))}</strong></div> : null}
                    <div><span>Property uplift</span><strong>{formatCurrency(floorCurrency(pricing.propertyAdjustment))}</strong></div>
                    <div><span>Timing uplift</span><strong>{formatCurrency(floorCurrency(pricing.timingAdjustment))}</strong></div>
                    <div><span>Postcode uplift</span><strong>{formatCurrency(floorCurrency(pricing.postcodeAdjustment))}</strong></div>
                    <div><span>Add-ons</span><strong>{formatCurrency(floorCurrency(pricing.addOnsTotal))}</strong></div>
                    {isCleaningService ? <div><span>Visits</span><strong>{pricing.visitCount}</strong></div> : null}
                    <div><span>Booking fee</span><strong>{formatCurrency(floorCurrency(pricing.bookingFee))}</strong></div>
                  </div>
                  <ul className="list-clean quote-meta-list">
                    <li>{pricing.jobTypeLabel}</li>
                    <li>{formatEstimatedHours(pricing.estimatedDurationHours)} estimated provider time</li>
                    {pricing.coverage.supported ? <li>{pricing.coverage.zoneLabel}</li> : <li>{pricing.coverage.leadTimeLabel}</li>}
                  </ul>
                </>
              ) : (
                <>
                  <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>Estimate pending</h2>
                  <p className="lead" style={{ marginBottom: 0 }}>Complete the service details and booking step first. We will show the estimate once there is enough information to price the job properly.</p>
                </>
              )}
              {currentStep === activeSteps.length - 1 ? (
                <>
                  {quoteError ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>{quoteError}</p> : null}
                  <button className="button button-primary quote-summary-button" type="button" onClick={handleContinueToBooking} disabled={isSubmitting}>{isSubmitting ? <span className="button-spinner-wrap"><span className="button-spinner" />Preparing booking</span> : "Continue to Booking"}</button>
                </>
              ) : (
                <p className="lead" style={{ marginTop: "1rem", marginBottom: 0 }}>Complete the remaining steps to continue to booking.</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
