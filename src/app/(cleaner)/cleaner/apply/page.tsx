"use client";

import { useMemo, useState } from "react";

const regions = {
  North: {
    boroughs: {
      Camden: ["NW1", "NW3", "NW5", "WC1"],
      Islington: ["EC1", "N1", "N5", "N7"],
      Barnet: ["EN4", "N2", "N3", "NW4", "NW7"],
      Haringey: ["N4", "N8", "N10", "N17"],
      Enfield: ["EN1", "EN2", "EN3", "N21"],
      Harrow: ["HA1", "HA2", "HA3", "HA5", "HA7"],
    },
  },
  South: {
    boroughs: {
      Lambeth: ["SE1", "SE5", "SW2", "SW9"],
      Southwark: ["SE1", "SE5", "SE15", "SE22"],
      Croydon: ["CR0", "CR2", "CR7", "SE25"],
      Wandsworth: ["SW11", "SW12", "SW17", "SW18"],
      Sutton: ["SM1", "SM2", "SM3", "SM5"],
      Merton: ["SW19", "SW20", "CR4"],
    },
  },
  East: {
    boroughs: {
      Newham: ["E6", "E7", "E13", "E16"],
      Hackney: ["E2", "E5", "E8", "N16"],
      TowerHamlets: ["E1", "E2", "E3", "E14"],
      Redbridge: ["IG1", "IG2", "IG4", "E18"],
      WalthamForest: ["E4", "E10", "E17"],
      BarkingAndDagenham: ["RM6", "RM8", "RM9", "IG11"],
    },
  },
  West: {
    boroughs: {
      Ealing: ["UB1", "W3", "W5", "W7", "W13"],
      Hillingdon: ["HA4", "UB3", "UB7", "UB8", "UB10"],
      Hounslow: ["TW3", "TW4", "TW5", "TW7", "W4"],
      Brent: ["HA0", "NW10", "NW2", "W5"],
      HammersmithAndFulham: ["W6", "W12", "SW6"],
      RichmondUponThames: ["TW1", "TW9", "TW10", "SW14"],
    },
  },
  Central: {
    boroughs: {
      Westminster: ["SW1", "W1", "W2", "WC2"],
      KensingtonAndChelsea: ["SW3", "SW5", "SW7", "W8", "W10"],
      CityOfLondon: ["EC1", "EC2", "EC3", "EC4"],
    },
  },
} as const;

const nationalityOptions = [
  "British",
  "Irish",
  "Indian",
  "Pakistani",
  "Bangladeshi",
  "Nigerian",
  "Ghanaian",
  "Romanian",
  "Polish",
  "Portuguese",
  "Italian",
  "Spanish",
  "French",
  "Other",
];

const transportModes = ["Public transport", "Car", "Bike", "Walk"];
const serviceTypes = ["Domestic cleaning", "Deep cleaning", "Office cleaning", "Airbnb turnover"];
const supplyItems = [
  "Vacuum cleaner",
  "Mop and bucket",
  "General cleaning products",
  "Bathroom cleaning products",
  "Glass cleaner",
  "Duster / microfiber cloths",
  "Iron and ironing board",
];
const weeklyDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

type ChipSelectorProps = {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
};

function ChipSelector({ options, selected, onToggle }: ChipSelectorProps) {
  return (
    <div className="choice-grid">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <label key={option} className={`choice-chip ${isSelected ? "is-selected" : ""}`}>
            <input type="checkbox" checked={isSelected} onChange={() => onToggle(option)} />
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );
}

export default function CleanerApplyPage() {
  const [step, setStep] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<keyof typeof regions | "">("");
  const [selectedBoroughs, setSelectedBoroughs] = useState<string[]>([]);
  const [selectedPostcodes, setSelectedPostcodes] = useState<string[]>([]);
  const [selectedTransportModes, setSelectedTransportModes] = useState<string[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [selectedSupplyItems, setSelectedSupplyItems] = useState<string[]>([]);

  const totalSteps = 7;
  const progress = Math.round((step / totalSteps) * 100);

  const boroughOptions = useMemo(() => {
    if (!selectedRegion) return [];
    return Object.keys(regions[selectedRegion].boroughs);
  }, [selectedRegion]);

  const postcodeOptions = useMemo(() => {
    if (!selectedRegion) return [];
    return Array.from(new Set(selectedBoroughs.flatMap((borough) => regions[selectedRegion].boroughs[borough as keyof typeof regions[typeof selectedRegion]["boroughs"]] || []))).sort();
  }, [selectedRegion, selectedBoroughs]);

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 920 }}>
        <div style={{ maxWidth: 760, marginBottom: "1.5rem" }}>
          <div className="eyebrow">Cleaner onboarding</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.3rem)" }}>
            Join WashHub as a self-employed cleaner.
          </h1>
          <p className="lead">
            We will ask one group of questions at a time so the onboarding stays clear, fast, and professional.
          </p>
        </div>

        <div className="panel card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div className="eyebrow">Progress</div>
              <strong style={{ fontSize: "1.15rem" }}>Step {step} of {totalSteps}</strong>
            </div>
            <div style={{ fontWeight: 800, color: "var(--color-accent)" }}>{progress}% complete</div>
          </div>
          <div style={{ marginTop: "1rem", height: "10px", borderRadius: "999px", background: "#eef2f7", overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "var(--color-accent)" }} />
          </div>
        </div>

        <div className="panel mini-form quote-section-card">
          {step === 1 ? (
            <>
              <div className="quote-section-head">
                <div className="eyebrow">Step 1</div>
                <strong>Personal details</strong>
                <p>These details form the cleaner profile and contact record.</p>
              </div>
              <div className="quote-two-col-fields">
                <label className="quote-field-stack">
                  <span>Full legal name *</span>
                  <input placeholder="Full name" />
                </label>
                <label className="quote-field-stack">
                  <span>Date of birth *</span>
                  <input type="date" />
                </label>
                <label className="quote-field-stack">
                  <span>Email *</span>
                  <input type="email" placeholder="Email address" />
                </label>
                <label className="quote-field-stack">
                  <span>Phone *</span>
                  <input placeholder="Phone number" />
                </label>
                <label className="quote-field-stack" style={{ gridColumn: "1 / -1" }}>
                  <span>Home address *</span>
                  <input placeholder="Address line 1" />
                </label>
                <label className="quote-field-stack">
                  <span>City *</span>
                  <input placeholder="City" />
                </label>
                <label className="quote-field-stack">
                  <span>Postcode *</span>
                  <input placeholder="Postcode" />
                </label>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="quote-section-head">
                <div className="eyebrow">Step 2</div>
                <strong>Work eligibility</strong>
                <p>Right-to-work and visa information are needed before activation.</p>
              </div>
              <div className="quote-two-col-fields">
                <label className="quote-field-stack">
                  <span>Nationality *</span>
                  <select defaultValue="">
                    <option value="" disabled>Select nationality</option>
                    {nationalityOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Right to work in the UK? *</span>
                  <select defaultValue="">
                    <option value="" disabled>Select</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Visa / permit status</span>
                  <input placeholder="If applicable" />
                </label>
                <label className="quote-field-stack">
                  <span>Visa / permit expiry</span>
                  <input type="date" />
                </label>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="quote-section-head">
                <div className="eyebrow">Step 3</div>
                <strong>Which part of London do you mainly cover?</strong>
                <p>Start broad, then we will narrow it down into boroughs and postcode areas.</p>
              </div>
              <ChipSelector
                options={Object.keys(regions)}
                selected={selectedRegion ? [selectedRegion] : []}
                onToggle={(value) => {
                  const region = value as keyof typeof regions;
                  setSelectedRegion(region === selectedRegion ? "" : region);
                  setSelectedBoroughs([]);
                  setSelectedPostcodes([]);
                }}
              />
            </>
          ) : null}

          {step === 4 ? (
            <>
              <div className="quote-section-head">
                <div className="eyebrow">Step 4</div>
                <strong>Which boroughs do you cover?</strong>
                <p>Choose the councils / boroughs you actually work in. We will then show the related postcode areas.</p>
              </div>
              {selectedRegion ? (
                <ChipSelector
                  options={boroughOptions}
                  selected={selectedBoroughs}
                  onToggle={(value) => {
                    const nextBoroughs = toggleValue(selectedBoroughs, value);
                    setSelectedBoroughs(nextBoroughs);
                    const validPostcodes = Array.from(new Set(nextBoroughs.flatMap((borough) => regions[selectedRegion].boroughs[borough as keyof typeof regions[typeof selectedRegion]["boroughs"]] || [])));
                    setSelectedPostcodes((current) => current.filter((postcode) => validPostcodes.includes(postcode)));
                  }}
                />
              ) : (
                <p className="lead" style={{ margin: 0 }}>Please go back and choose a London region first.</p>
              )}
            </>
          ) : null}

          {step === 5 ? (
            <>
              <div className="quote-section-head">
                <div className="eyebrow">Step 5</div>
                <strong>Which postcode areas do you cover?</strong>
                <p>Select only the postcode prefixes you really cover, because future dispatch should match jobs using these areas.</p>
              </div>
              {postcodeOptions.length ? (
                <ChipSelector
                  options={postcodeOptions}
                  selected={selectedPostcodes}
                  onToggle={(value) => setSelectedPostcodes(toggleValue(selectedPostcodes, value))}
                />
              ) : (
                <p className="lead" style={{ margin: 0 }}>Please choose one or more boroughs first.</p>
              )}
            </>
          ) : null}

          {step === 6 ? (
            <>
              <div className="quote-section-head">
                <div className="eyebrow">Step 6</div>
                <strong>Transport, service types, and equipment</strong>
                <p>These details affect whether a cleaner is suitable for a booking and what kind of jobs should be offered.</p>
              </div>
              <div className="quote-field-stack">
                <span>Transport modes *</span>
                <ChipSelector options={transportModes} selected={selectedTransportModes} onToggle={(value) => setSelectedTransportModes(toggleValue(selectedTransportModes, value))} />
              </div>
              <div className="quote-field-stack">
                <span>Service types accepted *</span>
                <ChipSelector options={serviceTypes} selected={selectedServiceTypes} onToggle={(value) => setSelectedServiceTypes(toggleValue(selectedServiceTypes, value))} />
              </div>
              <label className="quote-field-stack">
                <span>Maximum travel distance (miles)</span>
                <input type="number" placeholder="Example: 8" />
              </label>
              <label className="quote-field-stack">
                <span>Own supplies / equipment *</span>
                <select defaultValue="">
                  <option value="" disabled>Select</option>
                  <option>Yes, fully equipped</option>
                  <option>Yes, partially equipped</option>
                  <option>No</option>
                </select>
              </label>
              <div className="quote-field-stack">
                <span>Tools and supplies you can bring</span>
                <ChipSelector options={supplyItems} selected={selectedSupplyItems} onToggle={(value) => setSelectedSupplyItems(toggleValue(selectedSupplyItems, value))} />
              </div>
            </>
          ) : null}

          {step === 7 ? (
            <>
              <div className="quote-section-head">
                <div className="eyebrow">Step 7</div>
                <strong>Weekly availability and uploads</strong>
                <p>These details feed the dispatch engine and the admin review process before activation.</p>
              </div>
              <div style={{ display: "grid", gap: "0.85rem" }}>
                {weeklyDays.map((day) => (
                  <div key={day} className="panel" style={{ padding: "1rem 1rem 0.95rem", borderRadius: "20px", boxShadow: "none" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center", marginBottom: "0.85rem" }}>
                      <strong>{day}</strong>
                      <label className="quote-check-item" style={{ margin: 0 }}>
                        <input type="checkbox" />
                        <span>Available</span>
                      </label>
                    </div>
                    <div className="quote-two-col-fields">
                      <label className="quote-field-stack">
                        <span>Start time</span>
                        <input type="time" />
                      </label>
                      <label className="quote-field-stack">
                        <span>End time</span>
                        <input type="time" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="quote-two-col-fields" style={{ marginTop: "1rem" }}>
                <label className="quote-field-stack">
                  <span>ID / passport *</span>
                  <input type="file" />
                </label>
                <label className="quote-field-stack">
                  <span>Recent photo *</span>
                  <input type="file" />
                </label>
                <label className="quote-field-stack">
                  <span>CV *</span>
                  <input type="file" />
                </label>
                <label className="quote-field-stack">
                  <span>Working visa / permit (if any)</span>
                  <input type="file" />
                </label>
                <label className="quote-field-stack">
                  <span>Proof of address *</span>
                  <input type="file" />
                </label>
                <label className="quote-field-stack">
                  <span>Optional 30-second intro video</span>
                  <input type="file" accept="video/*" />
                </label>
              </div>

              <label className="quote-check-item">
                <input type="checkbox" />
                <span>I understand that WashHub treats approved cleaners as self-employed contractors, not employees.</span>
              </label>
              <label className="quote-check-item">
                <input type="checkbox" />
                <span>I confirm my details and uploads are accurate and can be reviewed by admin.</span>
              </label>
              <label className="quote-check-item">
                <input type="checkbox" />
                <span>I agree to the privacy policy, GDPR policy, and contractor onboarding terms.</span>
              </label>
            </>
          ) : null}

          <div className="button-row" style={{ marginTop: "1.25rem" }}>
            {step > 1 ? (
              <button className="button button-secondary" type="button" onClick={() => setStep(step - 1)}>
                Back
              </button>
            ) : null}
            {step < totalSteps ? (
              <button className="button button-primary" type="button" onClick={() => setStep(step + 1)}>
                Next step
              </button>
            ) : (
              <button className="button button-primary" type="button">Submit application</button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
