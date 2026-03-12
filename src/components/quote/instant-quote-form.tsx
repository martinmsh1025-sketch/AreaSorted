"use client";

import { useMemo, useState } from "react";

const serviceOptions = [
  { value: "regular-home-cleaning", label: "Regular cleaning" },
  { value: "deep-cleaning", label: "Deep cleaning" },
  { value: "office-cleaning", label: "Office cleaning" },
  { value: "airbnb-turnover-cleaning", label: "Airbnb turnover cleaning" },
];

const propertyOptions = [
  { value: "flat", label: "Flat / apartment" },
  { value: "detached", label: "Detached house" },
  { value: "semi-detached", label: "Semi-detached house" },
  { value: "terraced", label: "Terraced house" },
  { value: "bungalow", label: "Bungalow" },
  { value: "office", label: "Office" },
];

const roomOptions = Array.from({ length: 8 }, (_, index) => `${index}`);

const hourOptions = Array.from({ length: 16 }, (_, index) => `${String(index + 6).padStart(2, "0")}`);
const minuteOptions = ["00", "15", "30", "45"];

const baseRates = {
  "regular-home-cleaning": { customer: 24, cleaner: 27 },
  "deep-cleaning": { customer: 30, cleaner: 33 },
  "office-cleaning": { customer: 26, cleaner: 29 },
  "airbnb-turnover-cleaning": { customer: 28, cleaner: 31 },
} as const;

const addOnFees = {
  oven: 20,
  fridge: 15,
  windows: 20,
  ironing: 5,
  eco: 5,
} as const;

function formatGBP(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
}

function calculateEstimatedHours({
  propertyType,
  bedrooms,
  bathrooms,
  kitchens,
  service,
}: {
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  kitchens: string;
  service: string;
}) {
  const bedCount = Number(bedrooms) || 0;
  const bathCount = Number(bathrooms) || 0;
  const kitchenCount = Number(kitchens) || 0;

  let total = 1.5;

  const propertyWeight: Record<string, number> = {
    flat: 0.3,
    detached: 1.2,
    "semi-detached": 0.8,
    terraced: 0.7,
    bungalow: 0.6,
    office: 1,
  };

  total += propertyWeight[propertyType] ?? 0.5;
  total += bedCount * 0.9;
  total += bathCount * 0.7;
  total += kitchenCount * 0.8;

  if (service === "deep-cleaning") total += 1.5;
  if (service === "office-cleaning") total += 1;
  if (service === "airbnb-turnover-cleaning") total += 0.75;

  return Math.max(2, Math.round(total * 2) / 2);
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
  const [postcode, setPostcode] = useState(initialPostcode);
  const [addressLine1, setAddressLine1] = useState(initialAddressLine1);
  const [addressLine2, setAddressLine2] = useState(initialAddressLine2);
  const [city, setCity] = useState(initialCity);
  const [propertyType, setPropertyType] = useState("flat");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [kitchens, setKitchens] = useState("1");
  const [service, setService] = useState(initialService || "regular-home-cleaning");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredHour, setPreferredHour] = useState("10");
  const [preferredMinute, setPreferredMinute] = useState("00");
  const [frequency, setFrequency] = useState("one-off");
  const [supplies, setSupplies] = useState<"customer" | "cleaner">("customer");
  const [customerName, setCustomerName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pets, setPets] = useState("no");
  const [oven, setOven] = useState(false);
  const [fridge, setFridge] = useState(false);
  const [windows, setWindows] = useState(false);
  const [ironing, setIroning] = useState(false);
  const [eco, setEco] = useState(false);
  const [additionalRequests, setAdditionalRequests] = useState("");
  const [entryNotes, setEntryNotes] = useState("");
  const [parkingNotes, setParkingNotes] = useState("");
  const [billingSameAsService, setBillingSameAsService] = useState(true);
  const [billingAddressLine1, setBillingAddressLine1] = useState("");
  const [billingAddressLine2, setBillingAddressLine2] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostcode, setBillingPostcode] = useState("");

  const preferredTime = `${preferredHour}:${preferredMinute}`;

  const estimatedHours = useMemo(
    () =>
      calculateEstimatedHours({
        propertyType,
        bedrooms,
        bathrooms,
        kitchens,
        service,
      }),
    [propertyType, bedrooms, bathrooms, kitchens, service],
  );

  const pricing = useMemo(() => {
    const parsedHours = estimatedHours;
    const rateTable = baseRates[service as keyof typeof baseRates] ?? baseRates["regular-home-cleaning"];
    const hourlyRate = rateTable[supplies];
    const baseAmount = hourlyRate * parsedHours;

    const bookingDate = preferredDate ? new Date(`${preferredDate}T${preferredTime || "10:00"}:00`) : null;
    const day = bookingDate?.getDay();
    const hour = Number((preferredTime || "0:00").split(":")[0]);
    const weekendSurcharge = day === 0 || day === 6 ? parsedHours * 3 : 0;
    const eveningSurcharge = hour >= 18 ? parsedHours * 3 : 0;
    const urgentSurcharge = bookingDate && bookingDate.getTime() - Date.now() <= 1000 * 60 * 60 * 48 ? 15 : 0;
    const recurringDiscount = frequency === "weekly" ? baseAmount * 0.05 : frequency === "fortnightly" ? baseAmount * 0.03 : 0;
    const addOns =
      (oven ? addOnFees.oven : 0) +
      (fridge ? addOnFees.fridge : 0) +
      (windows ? addOnFees.windows : 0) +
      (ironing ? addOnFees.ironing * parsedHours : 0) +
      (eco ? addOnFees.eco : 0);

    return {
      parsedHours,
      hourlyRate,
      baseAmount,
      addOns,
      weekendSurcharge,
      eveningSurcharge,
      urgentSurcharge,
      recurringDiscount,
      total: baseAmount + addOns + weekendSurcharge + eveningSurcharge + urgentSurcharge - recurringDiscount,
    };
  }, [estimatedHours, service, supplies, preferredDate, preferredTime, oven, fridge, windows, ironing, eco, frequency]);

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 760, marginBottom: "2rem" }}>
          <div className="eyebrow">Instant quote</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2.2rem, 4vw, 4rem)" }}>
            Build a clear cleaning quote before you book.
          </h1>
          <p className="lead">Pricing updates as the customer changes service, timing, supplies, and add-ons.</p>
          <div className="badge-row" style={{ marginTop: "1rem" }}>
            <span className="badge-pill">Verified cleaners</span>
            <span className="badge-pill">Transparent pricing</span>
            <span className="badge-pill">London launch coverage</span>
            <span className="badge-pill">Secure payment flow</span>
          </div>
        </div>

        <div className="quote-page-grid">
          <form className="quote-form-sections">
            <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section A</div>
                <strong>Address</strong>
                <p>Check the address first, then move on to property and service details.</p>
              </div>
              <input placeholder="Postcode" value={postcode} onChange={(event) => setPostcode(event.target.value.toUpperCase())} />
              <input placeholder="Address line 1" value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} />
              <input placeholder="Address line 2" value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} />
              <input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
            </section>

            <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section B</div>
                <strong>Property details</strong>
                <p>Choose the property and room counts. WashHub calculates the estimated hours automatically.</p>
              </div>
              <div className="quote-two-col-fields">
                <label className="quote-field-stack">
                  <span>Property type</span>
                  <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>
                    {propertyOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Service type</span>
                  <select value={service} onChange={(event) => setService(event.target.value)}>
                    {serviceOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Bedrooms</span>
                  <select value={bedrooms} onChange={(event) => setBedrooms(event.target.value)}>
                    {roomOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Bathrooms</span>
                  <select value={bathrooms} onChange={(event) => setBathrooms(event.target.value)}>
                    {roomOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Kitchens</span>
                  <select value={kitchens} onChange={(event) => setKitchens(event.target.value)}>
                    {roomOptions.slice(1, 5).map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Estimated hours</span>
                  <input value={`${estimatedHours} hours`} readOnly aria-readonly="true" />
                </label>
              </div>
            </section>

            <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section C</div>
                <strong>Booking details</strong>
                <p>Date, time, frequency, supplies, and pets can still affect the final estimate.</p>
              </div>
              <div className="quote-two-col-fields">
                <label className="quote-field-stack">
                  <span>Frequency</span>
                  <select value={frequency} onChange={(event) => setFrequency(event.target.value)}>
                    <option value="one-off">One-off</option>
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Preferred date</span>
                  <input type="date" value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} />
                </label>
                <label className="quote-field-stack">
                  <span>Preferred time</span>
                  <div className="quote-time-grid">
                    <select value={preferredHour} onChange={(event) => setPreferredHour(event.target.value)}>
                      {hourOptions.map((hour) => (
                        <option key={hour} value={hour}>{hour}</option>
                      ))}
                    </select>
                    <select value={preferredMinute} onChange={(event) => setPreferredMinute(event.target.value)}>
                      {minuteOptions.map((minute) => (
                        <option key={minute} value={minute}>{minute}</option>
                      ))}
                    </select>
                  </div>
                </label>
                <label className="quote-field-stack">
                  <span>Cleaning supplies</span>
                  <select value={supplies} onChange={(event) => setSupplies(event.target.value as "customer" | "cleaner")}>
                    <option value="customer">Customer provides supplies</option>
                    <option value="cleaner">Cleaner brings supplies</option>
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Pets</span>
                  <select value={pets} onChange={(event) => setPets(event.target.value)}>
                    <option value="no">No pets</option>
                    <option value="yes">Pets at property</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section D</div>
                <strong>Add-ons</strong>
                <p>Optional extras stay visible so nothing feels hidden before checkout.</p>
              </div>
              <div className="quote-check-grid">
                <label className="quote-check-item"><input type="checkbox" checked={oven} onChange={() => setOven((value) => !value)} /><span>Oven + GBP 20</span></label>
                <label className="quote-check-item"><input type="checkbox" checked={fridge} onChange={() => setFridge((value) => !value)} /><span>Fridge + GBP 15</span></label>
                <label className="quote-check-item"><input type="checkbox" checked={windows} onChange={() => setWindows((value) => !value)} /><span>Inside windows + GBP 20</span></label>
                <label className="quote-check-item"><input type="checkbox" checked={ironing} onChange={() => setIroning((value) => !value)} /><span>Ironing + GBP 5 per hour</span></label>
                <label className="quote-check-item"><input type="checkbox" checked={eco} onChange={() => setEco((value) => !value)} /><span>Eco products + GBP 5</span></label>
              </div>
              <textarea placeholder="Additional requests" rows={4} value={additionalRequests} onChange={(event) => setAdditionalRequests(event.target.value)} />
            </section>

            <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section E</div>
                <strong>Access notes</strong>
                <p>These details help with matching and reduce operational issues later.</p>
              </div>
              <textarea placeholder="Entry notes" rows={3} value={entryNotes} onChange={(event) => setEntryNotes(event.target.value)} />
              <textarea placeholder="Parking notes" rows={3} value={parkingNotes} onChange={(event) => setParkingNotes(event.target.value)} />
            </section>

            <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section F</div>
                <strong>Customer details</strong>
                <p>These details are needed for confirmation, updates, receipts, and payment.</p>
              </div>
              <div className="quote-two-col-fields">
                <label className="quote-field-stack">
                  <span>Customer name</span>
                  <input placeholder="Full name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                </label>
                <label className="quote-field-stack">
                  <span>Contact phone</span>
                  <input placeholder="Phone number" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
                </label>
                <label className="quote-field-stack" style={{ gridColumn: "1 / -1" }}>
                  <span>Email</span>
                  <input placeholder="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </label>
              </div>
            </section>

            <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section G</div>
                <strong>Billing address</strong>
                <p>By default, the billing address is the same as the cleaning address, but the customer can change it.</p>
              </div>
              <label className="quote-check-item">
                <input
                  type="checkbox"
                  checked={billingSameAsService}
                  onChange={() => setBillingSameAsService((value) => !value)}
                />
                <span>Billing address is the same as the cleaning address</span>
              </label>

              {!billingSameAsService ? (
                <div className="quote-two-col-fields">
                  <label className="quote-field-stack" style={{ gridColumn: "1 / -1" }}>
                    <span>Billing address line 1</span>
                    <input value={billingAddressLine1} onChange={(event) => setBillingAddressLine1(event.target.value)} />
                  </label>
                  <label className="quote-field-stack" style={{ gridColumn: "1 / -1" }}>
                    <span>Billing address line 2</span>
                    <input value={billingAddressLine2} onChange={(event) => setBillingAddressLine2(event.target.value)} />
                  </label>
                  <label className="quote-field-stack">
                    <span>Billing city</span>
                    <input value={billingCity} onChange={(event) => setBillingCity(event.target.value)} />
                  </label>
                  <label className="quote-field-stack">
                    <span>Billing postcode</span>
                    <input value={billingPostcode} onChange={(event) => setBillingPostcode(event.target.value.toUpperCase())} />
                  </label>
                </div>
              ) : null}
            </section>
          </form>

          <aside className="quote-sidebar-stack">
            <section className="panel card quote-summary-panel">
              <div className="eyebrow">Quote summary</div>
              <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>Estimated total</h2>
              <div className="quote-total-number">{formatGBP(pricing.total)}</div>
              <div className="quote-summary-list">
                <div><span>Hourly rate</span><strong>{formatGBP(pricing.hourlyRate)}</strong></div>
                <div><span>Base amount</span><strong>{formatGBP(pricing.baseAmount)}</strong></div>
                <div><span>Add-ons</span><strong>{formatGBP(pricing.addOns)}</strong></div>
                <div><span>Weekend surcharge</span><strong>{formatGBP(pricing.weekendSurcharge)}</strong></div>
                <div><span>Evening surcharge</span><strong>{formatGBP(pricing.eveningSurcharge)}</strong></div>
                <div><span>Urgent booking surcharge</span><strong>{formatGBP(pricing.urgentSurcharge)}</strong></div>
                <div><span>Recurring discount</span><strong>-{formatGBP(pricing.recurringDiscount)}</strong></div>
              </div>
              {pricing.parsedHours > 6 ? (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.95rem 1rem",
                    borderRadius: "16px",
                    background: "rgba(217, 37, 42, 0.06)",
                    border: "1px solid rgba(217, 37, 42, 0.14)",
                    color: "var(--color-text)",
                    lineHeight: 1.65,
                    fontSize: "0.95rem",
                  }}
                >
                  For larger bookings over 6 hours, we may assign additional cleaners to help complete the job more efficiently.
                </div>
              ) : null}
              <ul className="list-clean quote-meta-list">
                <li>{pricing.parsedHours || 0} planned hours for this estimate</li>
                <li>Price changes stay visible as the customer edits the form</li>
                <li>End of tenancy or unusual jobs may still need a manual review</li>
              </ul>
              <button className="button button-primary quote-summary-button" type="button">Continue to Booking</button>
            </section>

            <section className="panel card">
              <div className="eyebrow">Why customers trust WashHub</div>
              <ul className="list-clean quote-meta-list">
                <li>Cleaner verification happens before activation.</li>
                <li>Secure Stripe payment is planned for the booking step.</li>
                <li>One reschedule is allowed if requested at least 48 hours before the start time.</li>
                <li>If a cleaner cancels, the team handles reassignment operationally.</li>
              </ul>
            </section>
          </aside>
        </div>

        <div className="section-card-grid" style={{ marginTop: "2rem" }}>
          <section className="panel card span-7">
            <div className="eyebrow">Pricing transparency</div>
            <h2 className="title" style={{ marginTop: "0.75rem", fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}>What affects the quote</h2>
            <ul className="list-clean quote-meta-list">
              <li>Service type and estimated hours make up the main cost.</li>
              <li>Cleaner-supplied materials increase the hourly rate.</li>
              <li>Weekend, evening, and urgent bookings can add surcharges.</li>
              <li>Add-ons like oven, fridge, windows, ironing, and eco products are shown clearly.</li>
            </ul>
          </section>

          <section className="panel card span-5">
            <div className="eyebrow">Support</div>
            <h2 className="title" style={{ marginTop: "0.75rem", fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}>Need help before booking?</h2>
            <ul className="list-clean quote-meta-list">
              <li>support@washhub.co.uk</li>
              <li>020 0000 0000</li>
              <li>Mon-Sat, 9am-6pm</li>
              <li>Customers can contact the team before payment if anything is unclear.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
