"use client";

import { useMemo, useState } from "react";

const serviceOptions = [
  { value: "regular-home-cleaning", label: "Regular cleaning" },
  { value: "deep-cleaning", label: "Deep cleaning" },
  { value: "office-cleaning", label: "Office cleaning" },
  { value: "airbnb-turnover-cleaning", label: "Airbnb turnover cleaning" },
];

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
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [hours, setHours] = useState("");
  const [service, setService] = useState(initialService || "regular-home-cleaning");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredHour, setPreferredHour] = useState("10");
  const [preferredMinute, setPreferredMinute] = useState("00");
  const [frequency, setFrequency] = useState("one-off");
  const [supplies, setSupplies] = useState<"customer" | "cleaner">("customer");
  const [pets, setPets] = useState("no");
  const [oven, setOven] = useState(false);
  const [fridge, setFridge] = useState(false);
  const [windows, setWindows] = useState(false);
  const [ironing, setIroning] = useState(false);
  const [eco, setEco] = useState(false);
  const [additionalRequests, setAdditionalRequests] = useState("");
  const [entryNotes, setEntryNotes] = useState("");
  const [parkingNotes, setParkingNotes] = useState("");

  const preferredTime = `${preferredHour}:${preferredMinute}`;

  const pricing = useMemo(() => {
    const parsedHours = Math.max(Number(hours) || 0, 0);
    const rateTable = baseRates[service as keyof typeof baseRates] ?? baseRates["regular-home-cleaning"];
    const hourlyRate = rateTable[supplies];
    const baseAmount = hourlyRate * parsedHours;

    const bookingDate = preferredDate ? new Date(`${preferredDate}T${preferredTime || "10:00"}:00`) : null;
    const day = bookingDate?.getDay();
    const hour = Number((preferredTime || "0:00").split(":")[0]);
    const weekendSurcharge = day === 0 || day === 6 ? parsedHours * 3 : 0;
    const eveningSurcharge = hour >= 18 ? parsedHours * 3 : 0;
    const urgentSurcharge = bookingDate && bookingDate.getTime() - Date.now() <= 1000 * 60 * 60 * 48 ? 15 : 0;
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
      total: baseAmount + addOns + weekendSurcharge + eveningSurcharge + urgentSurcharge,
    };
  }, [hours, service, supplies, preferredDate, preferredTime, oven, fridge, windows, ironing, eco]);

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
                <p>Hours usually drive the biggest part of the quote. Increase them for larger homes or first visits.</p>
              </div>
              <div className="quote-two-col-fields">
                <label className="quote-field-stack">
                  <span>Property type</span>
                  <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>
                    <option value="flat">Flat</option>
                    <option value="house">House</option>
                    <option value="office">Office</option>
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Bedrooms</span>
                  <input placeholder="e.g. 2" value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} />
                </label>
                <label className="quote-field-stack">
                  <span>Bathrooms</span>
                  <input placeholder="e.g. 1" value={bathrooms} onChange={(event) => setBathrooms(event.target.value)} />
                </label>
                <label className="quote-field-stack">
                  <span>Estimated hours</span>
                  <input placeholder="e.g. 4" value={hours} onChange={(event) => setHours(event.target.value)} />
                </label>
              </div>
            </section>

            <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Section C</div>
                <strong>Service details</strong>
                <p>Service type, timing, and supplies all affect the estimate.</p>
              </div>
              <div className="quote-two-col-fields">
                <label className="quote-field-stack">
                  <span>Service type</span>
                  <select value={service} onChange={(event) => setService(event.target.value)}>
                    {serviceOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
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
              </div>
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
