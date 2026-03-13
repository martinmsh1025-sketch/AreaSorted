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

const londonBoroughs = [
  "Barking and Dagenham",
  "Barnet",
  "Bexley",
  "Brent",
  "Bromley",
  "Camden",
  "Croydon",
  "Ealing",
  "Enfield",
  "Greenwich",
  "Hackney",
  "Hammersmith and Fulham",
  "Haringey",
  "Harrow",
  "Havering",
  "Hillingdon",
  "Hounslow",
  "Islington",
  "Kensington and Chelsea",
  "Kingston upon Thames",
  "Lambeth",
  "Lewisham",
  "Merton",
  "Newham",
  "Redbridge",
  "Richmond upon Thames",
  "Southwark",
  "Sutton",
  "Tower Hamlets",
  "Waltham Forest",
  "Wandsworth",
  "Westminster",
];

const postcodeAreas = [
  "HA1",
  "HA2",
  "HA3",
  "HA4",
  "HA5",
  "NW1",
  "NW2",
  "NW3",
  "NW4",
  "W1",
  "W2",
  "W8",
  "SW1",
  "SW3",
  "SW6",
  "E1",
  "E14",
  "N1",
  "N7",
  "EC1",
];

const weeklyDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function CleanerApplyPage() {
  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 860, marginBottom: "2rem" }}>
          <div className="eyebrow">Cleaner onboarding</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
            Join WashHub as a self-employed cleaner.
          </h1>
          <p className="lead">
            This onboarding flow is designed to collect the identity, work eligibility, availability, service area, and trust information needed before a cleaner can be reviewed and activated.
          </p>
        </div>

        <div className="quote-page-grid">
          <form className="quote-form-sections">
            <section className="panel mini-form quote-section-card">
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
            </section>

            <section className="panel mini-form quote-section-card">
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
            </section>

            <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Step 3</div>
                <strong>Service areas and availability</strong>
                <p>These details drive postcode matching, dispatch priority, and whether a cleaner is offered a job.</p>
              </div>
              <div className="quote-two-col-fields">
                <div className="quote-field-stack" style={{ gridColumn: "1 / -1" }}>
                  <span>London boroughs you cover *</span>
                  <div className="quote-check-grid">
                    {londonBoroughs.map((borough) => (
                      <label key={borough} className="quote-check-item">
                        <input type="checkbox" />
                        <span>{borough}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="quote-field-stack" style={{ gridColumn: "1 / -1" }}>
                  <span>Postcode areas you cover *</span>
                  <div className="quote-check-grid">
                    {postcodeAreas.map((postcode) => (
                      <label key={postcode} className="quote-check-item">
                        <input type="checkbox" />
                        <span>{postcode}</span>
                      </label>
                    ))}
                  </div>
                  <p className="lead" style={{ margin: 0, fontSize: "0.95rem" }}>
                    Select every postcode area you actually cover, for example `HA1`, `HA2`, and `HA5`. Dispatch should match jobs against these areas later.
                  </p>
                </div>
                <label className="quote-field-stack">
                  <span>Primary work area *</span>
                  <input placeholder="Example: Harrow / HA5" />
                </label>
                <label className="quote-field-stack">
                  <span>Maximum travel distance (miles)</span>
                  <input type="number" placeholder="Example: 8" />
                </label>
                <div className="quote-field-stack" style={{ gridColumn: "1 / -1" }}>
                  <span>Transport modes *</span>
                  <div className="quote-check-grid">
                    {[
                      "Public transport",
                      "Car",
                      "Bike",
                      "Walk",
                    ].map((mode) => (
                      <label key={mode} className="quote-check-item">
                        <input type="checkbox" />
                        <span>{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <label className="quote-field-stack">
                  <span>Own supplies / equipment *</span>
                  <select defaultValue="">
                    <option value="" disabled>Select</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </label>
                <label className="quote-field-stack">
                  <span>Service types accepted *</span>
                  <select defaultValue="">
                    <option value="" disabled>Select main type</option>
                    <option>Domestic cleaning</option>
                    <option>Deep cleaning</option>
                    <option>Office cleaning</option>
                    <option>Airbnb turnover</option>
                  </select>
                </label>
              </div>

              <div className="quote-section-head" style={{ marginTop: "1rem" }}>
                <div className="eyebrow">Weekly availability engine input</div>
                <strong>Working days and times</strong>
                <p>Each day should carry its own available time windows so the dispatch engine can match jobs properly later.</p>
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
            </section>

            <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Step 4</div>
                <strong>Experience and profile</strong>
                <p>These details help with cleaner review, trust, and future customer matching.</p>
              </div>
              <div className="quote-two-col-fields">
                <label className="quote-field-stack">
                  <span>Years of experience *</span>
                  <input placeholder="Years of cleaning experience" />
                </label>
                <label className="quote-field-stack">
                  <span>DBS status</span>
                  <select defaultValue="">
                    <option value="" disabled>Select</option>
                    <option>Available</option>
                    <option>Not available</option>
                    <option>Willing to apply</option>
                  </select>
                </label>
                <label className="quote-field-stack" style={{ gridColumn: "1 / -1" }}>
                  <span>Cleaning experience summary *</span>
                  <textarea rows={4} placeholder="Tell WashHub about your domestic / office / Airbnb cleaning experience" />
                </label>
              </div>
            </section>

            <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Step 5</div>
                <strong>Uploads</strong>
                <p>These uploads are required for identity verification and profile quality.</p>
              </div>
              <div className="quote-two-col-fields">
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
            </section>

            <section className="panel mini-form quote-section-card">
              <div className="quote-section-head">
                <div className="eyebrow">Step 6</div>
                <strong>Self-employed declaration and contract</strong>
                <p>Cleaners must understand the self-employed model before review and activation.</p>
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
              <div className="button-row" style={{ marginTop: "1rem" }}>
                <button className="button button-primary" type="button">Submit application</button>
              </div>
            </section>
          </form>

          <aside className="quote-sidebar-stack">
            <section className="panel card quote-summary-panel">
              <div className="eyebrow">Onboarding summary</div>
              <h2 className="title" style={{ marginTop: "0.65rem", fontSize: "2rem" }}>What WashHub needs before activation</h2>
              <ul className="list-clean quote-meta-list">
                <li>Identity, photo, CV, and right-to-work proof</li>
                <li>Service areas, postcode coverage, and weekly availability</li>
                <li>Cleaning experience and optional intro video</li>
                <li>Self-employed declaration and contractor agreement</li>
              </ul>
            </section>

            <section className="panel card">
              <div className="eyebrow">Review flow</div>
              <ul className="list-clean quote-meta-list">
                <li>Application submitted</li>
                <li>Admin review</li>
                <li>More info if needed</li>
                <li>Contract sent</li>
                <li>Cleaner activated</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
