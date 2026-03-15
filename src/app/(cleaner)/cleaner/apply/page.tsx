"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const regions = {
  GreaterLondon: {
    label: "Greater London",
    areas: {
      Camden: ["NW1", "NW3", "NW5", "WC1"],
      Islington: ["EC1", "N1", "N5", "N7"],
      Barnet: ["EN4", "N2", "N3", "NW4", "NW7"],
      Harrow: ["HA1", "HA2", "HA3", "HA5", "HA7"],
      Westminster: ["SW1", "W1", "W2", "WC2"],
      KensingtonAndChelsea: ["SW3", "SW5", "SW7", "W8", "W10"],
      Hounslow: ["TW3", "TW4", "TW5", "TW7", "W4"],
      Ealing: ["UB1", "W3", "W5", "W7", "W13"],
      Croydon: ["CR0", "CR2", "CR7", "SE25"],
      Newham: ["E6", "E7", "E13", "E16"],
    },
  },
  SouthEastEngland: {
    label: "South East England",
    areas: {
      Surrey: ["GU1", "GU2", "KT1", "KT2", "RH1"],
      Kent: ["BR8", "CT1", "DA1", "ME1", "TN1"],
      Essex: ["CM1", "CM2", "CO1", "IG7", "RM1"],
      Berkshire: ["RG1", "RG2", "SL1", "SL4"],
      Buckinghamshire: ["HP10", "HP11", "MK9", "SL7"],
    },
  },
  SouthWestEngland: {
    label: "South West England",
    areas: {
      Bristol: ["BS1", "BS3", "BS5", "BS8"],
      Devon: ["EX1", "EX2", "PL1", "TQ1"],
      Cornwall: ["TR1", "TR7", "PL25"],
      Dorset: ["BH1", "BH12", "DT1"],
    },
  },
  EastOfEngland: {
    label: "East of England",
    areas: {
      Hertfordshire: ["AL1", "AL7", "HP1", "SG1"],
      Bedfordshire: ["LU1", "LU2", "MK40"],
      Cambridgeshire: ["CB1", "CB2", "PE1"],
      Norfolk: ["NR1", "NR2", "PE30"],
    },
  },
  WestMidlands: {
    label: "West Midlands",
    areas: {
      Birmingham: ["B1", "B17", "B23", "B90"],
      Coventry: ["CV1", "CV2", "CV5"],
      Wolverhampton: ["WV1", "WV2", "WV6"],
      Dudley: ["DY1", "DY3", "DY8"],
    },
  },
  EastMidlands: {
    label: "East Midlands",
    areas: {
      Nottinghamshire: ["NG1", "NG2", "NG5"],
      Derbyshire: ["DE1", "DE3", "S41"],
      Leicestershire: ["LE1", "LE2", "LE67"],
      Northamptonshire: ["NN1", "NN3", "NN10"],
    },
  },
  NorthWestEngland: {
    label: "North West England",
    areas: {
      GreaterManchester: ["M1", "M3", "M20", "OL1"],
      Merseyside: ["L1", "L3", "L18", "CH41"],
      Lancashire: ["PR1", "PR2", "BB1", "FY1"],
      Cheshire: ["CH1", "CH2", "WA1", "CW1"],
    },
  },
  NorthEastEngland: {
    label: "North East England",
    areas: {
      TyneAndWear: ["NE1", "NE3", "SR1"],
      Durham: ["DH1", "DL1", "TS1"],
      Northumberland: ["NE23", "NE24", "TD15"],
    },
  },
  YorkshireAndTheHumber: {
    label: "Yorkshire and the Humber",
    areas: {
      Leeds: ["LS1", "LS6", "LS17"],
      Sheffield: ["S1", "S7", "S10"],
      Bradford: ["BD1", "BD2", "BD18"],
      Hull: ["HU1", "HU5", "HU9"],
    },
  },
  Scotland: {
    label: "Scotland",
    areas: {
      Glasgow: ["G1", "G12", "G41"],
      Edinburgh: ["EH1", "EH3", "EH11"],
      Aberdeen: ["AB10", "AB11", "AB15"],
      Dundee: ["DD1", "DD2", "DD5"],
    },
  },
  Wales: {
    label: "Wales",
    areas: {
      Cardiff: ["CF10", "CF11", "CF14"],
      Swansea: ["SA1", "SA2", "SA4"],
      Newport: ["NP10", "NP19", "NP20"],
    },
  },
  NorthernIreland: {
    label: "Northern Ireland",
    areas: {
      Belfast: ["BT1", "BT7", "BT9"],
      Derry: ["BT47", "BT48"],
      Lisburn: ["BT27", "BT28"],
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
const availabilityPresets = [
  "Weekdays only",
  "Weekdays 9:00-17:00",
  "Weekdays 10:00-18:00",
  "Weekends only",
  "Evenings only",
];
const quarterHours = [
  "00:00", "00:15", "00:30", "00:45",
  "01:00", "01:15", "01:30", "01:45",
  "02:00", "02:15", "02:30", "02:45",
  "03:00", "03:15", "03:30", "03:45",
  "04:00", "04:15", "04:30", "04:45",
  "05:00", "05:15", "05:30", "05:45",
  "06:00", "06:15", "06:30", "06:45",
  "07:00", "07:15", "07:30", "07:45",
  "08:00", "08:15", "08:30", "08:45",
  "09:00", "09:15", "09:30", "09:45",
  "10:00", "10:15", "10:30", "10:45",
  "11:00", "11:15", "11:30", "11:45",
  "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15", "15:30", "15:45",
  "16:00", "16:15", "16:30", "16:45",
  "17:00", "17:15", "17:30", "17:45",
  "18:00", "18:15", "18:30", "18:45",
  "19:00", "19:15", "19:30", "19:45",
  "20:00", "20:15", "20:30", "20:45",
  "21:00", "21:15", "21:30", "21:45",
  "22:00", "22:15", "22:30", "22:45",
  "23:00", "23:15", "23:30", "23:45",
];

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
        const display = option.includes("::") ? option.split("::")[1] : option;
        return (
          <label key={option} className={`choice-chip ${isSelected ? "is-selected" : ""}`}>
            <input type="checkbox" checked={isSelected} onChange={() => onToggle(option)} />
            <span>{display}</span>
          </label>
        );
      })}
    </div>
  );
}

type AvailabilityDay = {
  available: boolean;
  start: string;
  end: string;
};

function buildAvailabilityState() {
  return Object.fromEntries(
    weeklyDays.map((day) => [
      day,
      {
        available: false,
        start: "09:00",
        end: "17:00",
      } satisfies AvailabilityDay,
    ]),
  ) as Record<string, AvailabilityDay>;
}

export default function CleanerApplyPage() {
  const router = useRouter();
  const [emailGate, setEmailGate] = useState("");
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailGateError, setEmailGateError] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [nationality, setNationality] = useState("");
  const [rightToWork, setRightToWork] = useState("");
  const [visaStatus, setVisaStatus] = useState("");
  const [visaExpiry, setVisaExpiry] = useState("");
  const [maxTravelMiles, setMaxTravelMiles] = useState("");
  const [ownSuppliesLevel, setOwnSuppliesLevel] = useState("");
  const [step, setStep] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<keyof typeof regions | "">("");
  const [selectedBoroughs, setSelectedBoroughs] = useState<string[]>([]);
  const [selectedPostcodes, setSelectedPostcodes] = useState<string[]>([]);
  const [selectedTransportModes, setSelectedTransportModes] = useState<string[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [selectedSupplyItems, setSelectedSupplyItems] = useState<string[]>([]);
  const [selectedAvailabilityPreset, setSelectedAvailabilityPreset] = useState("");
  const [availability, setAvailability] = useState<Record<string, AvailabilityDay>>(buildAvailabilityState);
  const [acceptSelfEmployed, setAcceptSelfEmployed] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [stepError, setStepError] = useState("");

  const totalSteps = 7;
  const progress = emailGate.trim() ? (emailChecked ? Math.round((step / totalSteps) * 100) : 3) : 0;

  const boroughOptions = useMemo(() => {
    if (!selectedRegion) return [];
    return Object.keys(regions[selectedRegion].areas);
  }, [selectedRegion]);

  const postcodeOptions = useMemo(() => {
    if (!selectedRegion) return [];
    return Array.from(new Set(selectedBoroughs.flatMap((borough) => regions[selectedRegion].areas[borough as keyof typeof regions[typeof selectedRegion]["areas"]] || []))).sort();
  }, [selectedRegion, selectedBoroughs]);

  function applyPreset(preset: string) {
    const nextPreset = selectedAvailabilityPreset === preset ? "" : preset;
    setSelectedAvailabilityPreset(nextPreset);

    if (!nextPreset) {
      setAvailability(buildAvailabilityState());
      return;
    }

    setAvailability(() => {
      const next = buildAvailabilityState();

      if (nextPreset === "Weekdays only") {
        weeklyDays.forEach((day, index) => {
          next[day] = {
            available: index < 5,
            start: "09:00",
            end: "17:00",
          };
        });
      }

      if (nextPreset === "Weekdays 9:00-17:00") {
        weeklyDays.forEach((day, index) => {
          next[day] = {
            available: index < 5,
            start: "09:00",
            end: "17:00",
          };
        });
      }

      if (nextPreset === "Weekdays 10:00-18:00") {
        weeklyDays.forEach((day, index) => {
          next[day] = {
            available: index < 5,
            start: "10:00",
            end: "18:00",
          };
        });
      }

      if (nextPreset === "Weekends only") {
        weeklyDays.forEach((day, index) => {
          next[day] = {
            available: index >= 5,
            start: "10:00",
            end: "16:00",
          };
        });
      }

      if (nextPreset === "Evenings only") {
        weeklyDays.forEach((day, index) => {
          next[day] = {
            available: index < 5,
            start: "18:00",
            end: "22:00",
          };
        });
      }

      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== totalSteps) return;

    if (!validateStep(step)) return;

    setSubmitState("submitting");
    setSubmitMessage("");

    const formData = new FormData(event.currentTarget);
    formData.set("fullName", fullName);
    formData.set("dateOfBirth", dateOfBirth);
    formData.set("email", emailGate);
    formData.set("phone", phone);
    formData.set("password", password);
    formData.set("addressLine1", addressLine1);
    formData.set("city", city);
    formData.set("postcode", postcode);
    formData.set("nationality", nationality);
    formData.set("rightToWork", rightToWork);
    formData.set("visaStatus", visaStatus);
    formData.set("visaExpiry", visaExpiry);
    formData.set("region", selectedRegion ? regions[selectedRegion].label : "");
    formData.set("boroughs", JSON.stringify(selectedBoroughs));
    formData.set("postcodeAreas", JSON.stringify(selectedPostcodes));
    formData.set("transportModes", JSON.stringify(selectedTransportModes));
    formData.set("serviceTypes", JSON.stringify(selectedServiceTypes));
    formData.set("maxTravelMiles", maxTravelMiles);
    formData.set("ownSuppliesLevel", ownSuppliesLevel);
    formData.set("supplyItems", JSON.stringify(selectedSupplyItems));
    formData.set("availability", JSON.stringify(availability));
    formData.set("acceptSelfEmployed", String(acceptSelfEmployed));
    formData.set("confirmAccuracy", String(confirmAccuracy));
    formData.set("acceptTerms", String(acceptTerms));

    try {
      const response = await fetch("/api/cleaner-applications", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { ok?: boolean; applicationId?: string };

      if (!response.ok || !data.ok) {
        throw new Error("Unable to submit cleaner application");
      }

      setSubmitState("done");
      setSubmitMessage(`Application submitted. Reference: ${data.applicationId}`);
      router.push(`/cleaner/application-submitted?applicationId=${encodeURIComponent(data.applicationId || "")}`);
    } catch {
      setSubmitState("error");
      setSubmitMessage("Unable to submit the application right now.");
    }
  }

  function handleFormKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();

    if (event.key === "Enter" && tagName !== "textarea") {
      event.preventDefault();
    }
  }

  async function handleEmailCheck() {
    setEmailGateError("");
    if (!emailGate.trim()) {
      setEmailGateError("Please enter an email address.");
      return;
    }

    const response = await fetch(`/api/cleaner-applications/check-email?email=${encodeURIComponent(emailGate.trim())}`);
    const data = (await response.json()) as { exists?: boolean };

    if (data.exists) {
      setEmailGateError("This email is already in use. Please log in to continue.");
      return;
    }

    setEmailChecked(true);
  }

  function validateStep(currentStep: number) {
    if (currentStep === 1) {
      if (!fullName.trim() || !dateOfBirth || !emailGate.trim() || !phone.trim() || !addressLine1.trim() || !city.trim() || !postcode.trim()) {
        setStepError("Please complete all required personal details before continuing.");
        return false;
      }
      if (password.length < 12) {
        setStepError("Password must be at least 12 characters.");
        return false;
      }
    }

    if (currentStep === 2 && (!nationality || !rightToWork)) {
      setStepError("Please complete the work eligibility details before continuing.");
      return false;
    }

    if (currentStep === 3 && !selectedRegion) {
      setStepError("Please choose the main UK region you cover.");
      return false;
    }

    if (currentStep === 4 && !selectedBoroughs.length) {
      setStepError("Please choose at least one borough or county.");
      return false;
    }

    if (currentStep === 5 && !selectedPostcodes.length) {
      setStepError("Please choose at least one postcode area.");
      return false;
    }

    if (currentStep === 6 && (!selectedTransportModes.length || !selectedServiceTypes.length || !ownSuppliesLevel)) {
      setStepError("Please complete transport, service type, and equipment details before continuing.");
      return false;
    }

    if (currentStep === 7 && (!acceptSelfEmployed || !confirmAccuracy || !acceptTerms)) {
      setStepError("Please complete the required declarations before submitting the application.");
      return false;
    }

    setStepError("");
    return true;
  }

  function handleNextStep() {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, totalSteps));
  }

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

        {!emailChecked ? (
          <div className="panel mini-form quote-section-card">
            <div className="quote-section-head">
              <div className="eyebrow">Cleaner registration</div>
              <strong>Start with your email</strong>
              <p>We check first that the email is not already registered before showing the full application form.</p>
            </div>
            <label className="quote-field-stack">
              <span>Email *</span>
              <input type="email" value={emailGate} onChange={(event) => setEmailGate(event.target.value)} placeholder="Email address" />
            </label>
            {emailGateError ? <p style={{ color: "var(--color-error)", margin: 0 }}>{emailGateError}</p> : null}
            <div className="button-row">
              <button className="button button-primary" type="button" onClick={handleEmailCheck}>Continue</button>
              <a className="button button-secondary" href="/cleaner/login">Already registered? Login</a>
            </div>
          </div>
        ) : (
          <form className="panel mini-form quote-section-card" onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
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
                  <input name="fullName" placeholder="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </label>
                <label className="quote-field-stack">
                  <span>Date of birth *</span>
                  <input name="dateOfBirth" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
                </label>
                <label className="quote-field-stack">
                  <span>Email *</span>
                  <input name="email" type="email" placeholder="Email address" value={emailGate} readOnly />
                </label>
                <label className="quote-field-stack">
                  <span>Phone *</span>
                  <input name="phone" placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} />
                </label>
                <label className="quote-field-stack">
                  <span>Create password *</span>
                  <input name="password" type="password" placeholder="Create password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} />
                </label>
                <label className="quote-field-stack" style={{ gridColumn: "1 / -1" }}>
                  <span>Home address *</span>
                  <input name="addressLine1" placeholder="Address line 1" value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} />
                </label>
                <label className="quote-field-stack">
                  <span>City *</span>
                  <input name="city" placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
                </label>
                <label className="quote-field-stack">
                  <span>Postcode *</span>
                  <input name="postcode" placeholder="Postcode" value={postcode} onChange={(event) => setPostcode(event.target.value)} />
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
                  <select name="nationality" value={nationality} onChange={(event) => setNationality(event.target.value)}>
                    <option value="" disabled>Select nationality</option>
                    {nationalityOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Right to work in the UK? *</span>
                  <select name="rightToWork" value={rightToWork} onChange={(event) => setRightToWork(event.target.value)}>
                    <option value="" disabled>Select</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Visa / permit status</span>
                  <input name="visaStatus" placeholder="If applicable" value={visaStatus} onChange={(event) => setVisaStatus(event.target.value)} />
                </label>
                <label className="quote-field-stack">
                  <span>Visa / permit expiry</span>
                  <input name="visaExpiry" type="date" value={visaExpiry} onChange={(event) => setVisaExpiry(event.target.value)} />
                </label>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="quote-section-head">
                <div className="eyebrow">Step 3</div>
                <strong>Which part of the UK do you mainly cover?</strong>
                <p>Start broad, then we will narrow it down into counties / boroughs and postcode areas.</p>
              </div>
              <ChipSelector
                options={Object.entries(regions).map(([key, value]) => `${key}::${value.label}`)}
                selected={selectedRegion ? [`${selectedRegion}::${regions[selectedRegion].label}`] : []}
                onToggle={(value) => {
                  const region = value.split("::")[0] as keyof typeof regions;
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
                <strong>Which boroughs / counties do you cover?</strong>
                <p>Choose the councils, boroughs, or county-level areas you actually work in. We will then show the related postcode areas.</p>
              </div>
              {selectedRegion ? (
                <ChipSelector
                  options={boroughOptions}
                  selected={selectedBoroughs}
                  onToggle={(value) => {
                    const nextBoroughs = toggleValue(selectedBoroughs, value);
                    setSelectedBoroughs(nextBoroughs);
                    const validPostcodes: string[] = Array.from(new Set(nextBoroughs.flatMap((borough) => regions[selectedRegion].areas[borough as keyof typeof regions[typeof selectedRegion]["areas"]] || [])));
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
                <input name="maxTravelMiles" type="number" placeholder="Example: 8" value={maxTravelMiles} onChange={(event) => setMaxTravelMiles(event.target.value)} />
              </label>
              <label className="quote-field-stack">
                  <span>Own supplies / equipment *</span>
                  <select name="ownSuppliesLevel" value={ownSuppliesLevel} onChange={(event) => setOwnSuppliesLevel(event.target.value)}>
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
                <p>Keep this fast. Pick a simple weekly pattern, then set only the days you actually want to work.</p>
              </div>
              <div className="quote-field-stack">
                <span>Quick availability presets</span>
                <div className="availability-preset-row">
                  {availabilityPresets.map((preset) => (
                    <label key={preset} className={`choice-chip ${selectedAvailabilityPreset === preset ? "is-selected" : ""}`}>
                      <input
                        type="checkbox"
                        checked={selectedAvailabilityPreset === preset}
                        onChange={() => applyPreset(preset)}
                      />
                      <span>{preset}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="availability-list">
                {weeklyDays.map((day) => (
                  <div key={day} className="availability-day-row">
                    <div className="availability-day-name">{day}</div>
                    <button
                      type="button"
                      className={`button button-secondary availability-toggle-button ${availability[day].available ? "is-on" : ""}`}
                      onClick={() =>
                        setAvailability((current) => ({
                          ...current,
                          [day]: {
                            ...current[day],
                            available: !current[day].available,
                          },
                        }))
                      }
                    >
                      {availability[day].available ? "Available" : "Off"}
                    </button>
                    <label className="quote-field-stack" style={{ margin: 0 }}>
                      <span>Start</span>
                      <select
                        value={availability[day].start}
                        onChange={(event) =>
                          setAvailability((current) => ({
                            ...current,
                            [day]: {
                              ...current[day],
                              start: event.target.value,
                            },
                          }))
                        }
                      >
                        {quarterHours.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </label>
                    <label className="quote-field-stack" style={{ margin: 0 }}>
                      <span>End</span>
                      <select
                        value={availability[day].end}
                        onChange={(event) =>
                          setAvailability((current) => ({
                            ...current,
                            [day]: {
                              ...current[day],
                              end: event.target.value,
                            },
                          }))
                        }
                      >
                        {quarterHours.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                ))}
              </div>

              <div className="quote-section-head" style={{ marginTop: "1rem" }}>
                <div className="eyebrow">Uploads</div>
                <strong>Required files</strong>
                <p>Upload the core files first. Optional files can still improve profile quality later.</p>
              </div>

              <div className="upload-grid">
                {[
                  ["ID / passport *", "Government-issued ID for identity verification."],
                  ["Recent photo *", "A clear profile photo for cleaner verification and trust."],
                  ["CV *", "Cleaning experience and work history."],
                  ["Working visa / permit", "Only if applicable."],
                  ["Proof of address *", "Recent utility bill, bank statement, or official letter."],
                  ["Optional 30-second intro video", "A short self-introduction can help with review later."],
                ].map(([title, copy]) => (
                  <label key={title} className="upload-card">
                    <strong>{title}</strong>
                    <p>{copy}</p>
                    <span className="upload-button">Choose file</span>
                    <input
                      name={
                        title === "ID / passport *"
                          ? "idDocument"
                          : title === "Recent photo *"
                            ? "photo"
                            : title === "CV *"
                              ? "cv"
                              : title === "Working visa / permit"
                                ? "visaDocument"
                                : title === "Proof of address *"
                                  ? "addressProof"
                                  : "introVideo"
                      }
                      type="file"
                      accept={title.includes("video") ? "video/*" : undefined}
                    />
                  </label>
                ))}
              </div>

              <label className="quote-check-item">
                <input type="checkbox" checked={acceptSelfEmployed} onChange={() => setAcceptSelfEmployed((value) => !value)} />
                <span>I understand that WashHub treats approved cleaners as self-employed contractors, not employees.</span>
              </label>
              <label className="quote-check-item">
                <input type="checkbox" checked={confirmAccuracy} onChange={() => setConfirmAccuracy((value) => !value)} />
                <span>I confirm my details and uploads are accurate and can be reviewed by admin.</span>
              </label>
              <label className="quote-check-item">
                <input type="checkbox" checked={acceptTerms} onChange={() => setAcceptTerms((value) => !value)} />
                <span>I agree to the privacy policy, GDPR policy, and contractor onboarding terms.</span>
              </label>
            </>
          ) : null}

            <div className="button-row" style={{ marginTop: "1.25rem" }}>
            {step > 1 ? (
              <button key={`back-${step}`} className="button button-secondary" type="button" onClick={() => setStep(step - 1)}>
                Back
              </button>
            ) : null}
            {step < totalSteps ? (
              <button key={`next-${step}`} className="button button-primary" type="button" onClick={handleNextStep}>
                Next step
              </button>
            ) : (
              <button key="submit-final" className="button button-primary" type="submit" disabled={submitState === "submitting"}>
                {submitState === "submitting" ? "Submitting..." : "Submit application"}
              </button>
            )}
          </div>
            {stepError ? (
              <p style={{ color: "var(--color-error)", marginTop: "0.4rem" }}>{stepError}</p>
            ) : null}
            {submitMessage ? (
              <p style={{ color: submitState === "error" ? "var(--color-error)" : "var(--color-success)", marginTop: "0.4rem" }}>
                {submitMessage}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </main>
  );
}
