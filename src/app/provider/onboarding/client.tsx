"use client";

import type { JsonValue } from "@prisma/client/runtime/library";
import { useMemo, useState } from "react";
import { ProviderStatusBadge } from "@/components/providers/status-badge";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { getPostcodesForCouncils, londonCouncilOptions } from "@/lib/providers/london-coverage";
import { providerDocumentAcceptedFileTypes, providerDocumentAcceptedFormatsLabel, providerDocumentMaxFileSizeBytes, providerDocumentTotalMaxSizeBytes, providerRequiredDocuments } from "@/lib/providers/onboarding-config";
import { getProviderCategoryByKey } from "@/lib/providers/service-catalog-mapping";

type ChecklistItem = {
  key: string;
  label: string;
  complete: boolean;
  detail: string;
};

type ProviderDocument = {
  documentKey: string;
  status: string;
  fileName: string;
  sizeBytes?: number | null;
};

type ProviderOnboardingClientProps = {
  provider: {
    status: string;
    legalName: string | null;
    tradingName: string | null;
    companyNumber: string | null;
    registeredAddress: string | null;
    contactEmail: string;
    phone: string | null;
    vatNumber: string | null;
    serviceCategories: Array<{ categoryKey: string }>;
    coverageAreas: Array<{ postcodePrefix: string }>;
    agreements: Array<{ status: string }>;
    documents: ProviderDocument[];
    reviewNotes: string | null;
    stripeRequirementsJson?: JsonValue;
    approvedAt?: Date | null;
    stripeConnectedAccount?: { chargesEnabled: boolean; payoutsEnabled: boolean } | null;
  };
  inviteCategoryKey: string | null;
  inviteServiceKeys: string[];
  checklist: ChecklistItem[];
  canEdit: boolean;
  initialStep?: number;
  statusMessage: string;
  errorMessage: string;
  saveAction: (formData: FormData) => void;
  continueAction: (formData: FormData) => void;
  submitAction: () => void;
};

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function ChipSelector({ options, selected, onToggle, disabled = false }: { options: string[]; selected: string[]; onToggle: (value: string) => void; disabled?: boolean }) {
  return (
    <div className="choice-grid">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <label key={option} className={`choice-chip ${isSelected ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}`}>
            <input type="checkbox" checked={isSelected} onChange={() => onToggle(option)} disabled={disabled} />
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );
}

export function ProviderOnboardingClient({ provider, inviteCategoryKey, inviteServiceKeys, checklist, canEdit, initialStep = 1, statusMessage, errorMessage, saveAction, continueAction, submitAction }: ProviderOnboardingClientProps) {
  const totalSteps = 4;
  const lockedCategory = getProviderCategoryByKey(inviteCategoryKey || provider.serviceCategories[0]?.categoryKey || "");
  const initialCategories = lockedCategory ? [lockedCategory.key] : provider.serviceCategories.map((item) => item.categoryKey);
  const savedServiceKeys = provider.stripeRequirementsJson && typeof provider.stripeRequirementsJson === "object" && !Array.isArray(provider.stripeRequirementsJson) && Array.isArray(provider.stripeRequirementsJson.approvedServiceKeys)
    ? provider.stripeRequirementsJson.approvedServiceKeys.map((item) => String(item)).filter(Boolean)
    : inviteServiceKeys;
  const initialPostcodes = Array.from(new Set(provider.coverageAreas.map((item) => item.postcodePrefix)));
  const initialCouncils = londonCouncilOptions.filter((council) => getPostcodesForCouncils([council]).some((postcode) => initialPostcodes.includes(postcode)));
  const agreementSigned = provider.agreements.some((agreement) => agreement.status === "SIGNED");
  const initialUnlockedStep = (() => {
    const hasStep1 = Boolean(provider.legalName?.trim() && provider.companyNumber?.trim() && provider.registeredAddress?.trim() && provider.contactEmail.trim() && provider.phone?.trim());
    const hasStep2 = initialCategories.length > 0 && savedServiceKeys.length > 0;
    const hasStep3 = initialPostcodes.length > 0;

    if (!hasStep1) return 1;
    if (!hasStep2) return 2;
    if (!hasStep3) return 3;
    return 4;
  })();

  function getDocumentDisplay(uploaded?: ProviderDocument) {
    if (!uploaded) {
      return { className: "status-badge status-badge-legacy", label: "Not uploaded" };
    }

    if (["REJECTED", "NEEDS_RESUBMISSION"].includes(uploaded.status)) {
      return {
        className: `status-badge ${uploaded.status === "REJECTED" ? "status-badge-restricted" : "status-badge-wip"}`,
        label: uploaded.status === "REJECTED" ? "Rejected" : "Needs resubmission",
      };
    }

    return { className: "status-badge status-badge-pending", label: "Uploaded" };
  }

  const [step, setStep] = useState(Math.min(4, Math.max(1, initialStep)));
  const [legalName, setLegalName] = useState(provider.legalName || "");
  const [tradingName, setTradingName] = useState(provider.tradingName || "");
  const [companyNumber, setCompanyNumber] = useState(provider.companyNumber || "");
  const [contactEmail, setContactEmail] = useState(provider.contactEmail || "");
  const [phone, setPhone] = useState(provider.phone || "");
  const [registeredAddress, setRegisteredAddress] = useState(provider.registeredAddress || "");
  const [vatNumber, setVatNumber] = useState(provider.vatNumber || "");
  const [selectedCategories] = useState<string[]>(initialCategories);
  const [selectedServices, setSelectedServices] = useState<string[]>(savedServiceKeys);
  const [selectedCouncils, setSelectedCouncils] = useState<string[]>(initialCouncils);
  const [selectedPostcodes, setSelectedPostcodes] = useState<string[]>(initialPostcodes);
  const [agreementAccepted, setAgreementAccepted] = useState(agreementSigned && !canEdit);
  const [pendingUploads, setPendingUploads] = useState<Record<string, { fileName: string; sizeBytes: number }>>({});
  const [uploadFieldErrors, setUploadFieldErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState("");
  const [unlockedStep, setUnlockedStep] = useState(initialUnlockedStep);
  const [confirmedSteps, setConfirmedSteps] = useState<number[]>(() => Array.from({ length: Math.max(0, Math.min(initialStep, totalSteps) - 1) }, (_, index) => index + 1));
  const isReviewSubmitted = ["SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "APPROVED", "CHANGES_REQUESTED", "REJECTED"].includes(provider.status);
  const availablePostcodes = useMemo(() => getPostcodesForCouncils(selectedCouncils), [selectedCouncils]);
  const profileComplete = Boolean(legalName.trim() && companyNumber.trim() && registeredAddress.trim() && contactEmail.trim() && phone.trim());
  const servicesComplete = selectedCategories.length > 0 && selectedServices.length > 0;
  const coverageComplete = selectedPostcodes.length > 0;
  const readyForConfirmation = profileComplete && servicesComplete && coverageComplete && agreementAccepted;
  const totalPendingUploadBytes = Object.values(pendingUploads).reduce((sum, item) => sum + item.sizeBytes, 0);
  const visibleChecklist = checklist.filter((item) => ["profile", "categories", "coverage", "documents_uploaded", "agreement", "submitted", "approved", "stripe", "pricing"].includes(item.key)).map((item) => {
    if (item.key === "profile") {
      return { ...item, complete: confirmedSteps.includes(1) };
    }

    if (item.key === "categories") {
      return { ...item, complete: confirmedSteps.includes(2) };
    }

    if (item.key === "coverage") {
      return { ...item, complete: confirmedSteps.includes(3) };
    }

    if (item.key === "agreement") {
      return { ...item, complete: agreementAccepted };
    }

    return item;
  });

  const progress = Math.round((step / totalSteps) * 100);

  function canGoToStep(targetStep: number) {
    return targetStep >= 1 && targetStep <= unlockedStep;
  }

  function nextStep() {
    const nextStepNumber = Math.min(totalSteps, step + 1);

    if (step === 1 && !profileComplete) return;
    if (step === 2 && !servicesComplete) return;
    if (step === 3 && !coverageComplete) return;

    setConfirmedSteps((current) => (current.includes(step) ? current : [...current, step]));
    setUnlockedStep((current) => Math.max(current, nextStepNumber));
    setStep(nextStepNumber);
  }

  function formatFileSize(sizeBytes?: number | null) {
    if (!sizeBytes) return "";
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 1120 }}>
        <section className="panel card" style={{ marginBottom: "0.85rem", padding: "0.9rem" }}>
          <div className="compact-header">
            <div>
              <div className="eyebrow">Provider onboarding</div>
              <h1 className="title">Finish your setup</h1>
            </div>
            <div className="button-row" style={{ marginTop: 0 }}>
              <ProviderStatusBadge status={provider.status} />
              <span className="provider-soft-pill">Step {step} of {totalSteps}</span>
              <span className="provider-soft-pill">{progress}%</span>
            </div>
          </div>
          <div className="provider-step-tabs">
            {["Company", "Services", "Coverage", "Documents"].map((label, index) => (
              <button key={label} type="button" className={`provider-step-tab ${step === index + 1 ? "is-active" : ""}`} onClick={() => canGoToStep(index + 1) && setStep(index + 1)} disabled={!canGoToStep(index + 1)}>
                {label}
              </button>
            ))}
          </div>
          {statusMessage ? <p style={{ color: "var(--color-success)", marginTop: "0.65rem", lineHeight: 1.5 }}>{statusMessage}</p> : null}
          {errorMessage ? <p style={{ color: "var(--color-error)", marginTop: "0.65rem", lineHeight: 1.5 }}>{errorMessage}</p> : null}
          {isReviewSubmitted ? <p style={{ color: "var(--color-text-muted)", marginTop: "0.65rem", lineHeight: 1.5 }}>Application submitted. Check status for updates.</p> : null}
        </section>

        <section className="provider-shell-grid" style={{ marginBottom: "0.85rem" }}>
          <section className="provider-main-card">
            <form id="provider-onboarding-form" action={saveAction} className="provider-step-form">
              <input type="hidden" name="currentStep" value={String(step)} />
              {selectedCategories.map((category) => <input key={`hidden-category-${category}`} type="hidden" name="categories" value={category} />)}
              {selectedServices.map((serviceKey) => <input key={`hidden-service-${serviceKey}`} type="hidden" name="serviceKeys" value={serviceKey} />)}
              <input type="hidden" name="postcodePrefixes" value={selectedPostcodes.join(", ")} />
              {agreementAccepted ? <input type="hidden" name="agreementAccepted" value="on" /> : null}
              <section className="provider-step-card" style={{ display: step === 1 ? "block" : "none" }}>
                  <div className="provider-step-head">
                    <div className="eyebrow">Section 1</div>
                    <h2>Company details</h2>
                  </div>
                  <div className="admin-filter-grid">
                    <label className="quote-field-stack admin-filter-span-6">
                      <span>Legal company name</span>
                      <input name="legalName" value={legalName} onChange={(event) => setLegalName(event.target.value)} required disabled={!canEdit} />
                    </label>
                    <label className="quote-field-stack admin-filter-span-6">
                      <span>Trading name</span>
                      <input name="tradingName" value={tradingName} onChange={(event) => setTradingName(event.target.value)} disabled={!canEdit} />
                    </label>
                    <label className="quote-field-stack admin-filter-span-4">
                      <span>Company number</span>
                      <input name="companyNumber" value={companyNumber} onChange={(event) => setCompanyNumber(event.target.value)} required disabled={!canEdit} />
                    </label>
                    <label className="quote-field-stack admin-filter-span-4">
                      <span>Email</span>
                      <input type="hidden" name="contactEmail" value={contactEmail} />
                      <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} required readOnly disabled={!canEdit} />
                    </label>
                    <label className="quote-field-stack admin-filter-span-4">
                      <span>Phone</span>
                      <input name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} required disabled={!canEdit} />
                    </label>
                    <label className="quote-field-stack admin-filter-span-12">
                      <span>Registered address</span>
                      <input name="registeredAddress" value={registeredAddress} onChange={(event) => setRegisteredAddress(event.target.value)} required disabled={!canEdit} />
                    </label>
                    <label className="quote-field-stack admin-filter-span-6">
                      <span>VAT number (optional)</span>
                      <input name="vatNumber" value={vatNumber} onChange={(event) => setVatNumber(event.target.value)} disabled={!canEdit} />
                    </label>
                  </div>
                </section>

              <section className="provider-step-card" style={{ display: step === 2 ? "block" : "none" }}>
                  <div className="provider-step-head">
                    <div className="eyebrow">Section 2</div>
                    <h2>Services</h2>
                  </div>
                  <div className="quote-field-stack">
                    <span>Approved category</span>
                    <div className="quote-check-grid">
                      {lockedCategory ? <div className="provider-soft-panel"><strong>{lockedCategory.label}</strong><span>Choose the services you want to offer in this category.</span><input type="hidden" name="categories" value={lockedCategory.key} /></div> : null}
                    </div>
                  </div>
                  <div className="quote-field-stack">
                    <span>Services</span>
                      <p className="lead" style={{ margin: 0 }}>Tick at least one service before you continue.</p>
                    {selectedServices.map((serviceKey) => <input key={serviceKey} type="hidden" name="serviceKeys" value={serviceKey} />)}
                    <div className="provider-service-list">
                      {(lockedCategory?.services || []).map((service) => (
                        <button
                          key={service.key}
                          type="button"
                          className={`provider-service-row ${selectedServices.includes(service.key) ? "is-selected" : ""} ${!canEdit ? "is-disabled" : ""}`}
                          onClick={() => canEdit && setSelectedServices(toggleValue(selectedServices, service.key))}
                          disabled={!canEdit}
                        >
                          <span className="provider-service-label">{service.label}</span>
                        </button>
                      ))}
                      {!lockedCategory?.services.length ? <div className="provider-empty-note">No services found for this category.</div> : null}
                    </div>
                    {!selectedServices.length ? <p style={{ color: "var(--color-error)", margin: 0, lineHeight: 1.6 }}>Choose at least one service.</p> : null}
                  </div>
                </section>

              <section className="provider-step-card" style={{ display: step === 3 ? "block" : "none" }}>
                  <div className="provider-step-head">
                    <div className="eyebrow">Section 3</div>
                    <h2>Coverage</h2>
                    <p className="lead" style={{ margin: 0 }}>Choose where you want jobs.</p>
                  </div>
                  <div className="provider-step-block">
                    <span className="provider-step-label">Area</span>
                    <div className="button-row">
                      <span className="provider-soft-pill is-active">London</span>
                    </div>
                  </div>
                  <div className="provider-step-block">
                    <span className="provider-step-label">Council</span>
                    <ChipSelector
                      options={londonCouncilOptions}
                      selected={selectedCouncils}
                      disabled={!canEdit}
                      onToggle={(value) => {
                        const nextCouncils = toggleValue(selectedCouncils, value);
                        setSelectedCouncils(nextCouncils);
                        const validPostcodes = getPostcodesForCouncils(nextCouncils);
                        setSelectedPostcodes((current) => current.filter((postcode) => validPostcodes.includes(postcode)));
                      }}
                    />
                  </div>
                  <div className="provider-step-block">
                    <span className="provider-step-label">Postcodes</span>
                    {selectedCouncils.length ? (
                      <ChipSelector options={availablePostcodes} selected={selectedPostcodes} disabled={!canEdit} onToggle={(value) => setSelectedPostcodes(toggleValue(selectedPostcodes, value))} />
                    ) : (
                      <div className="provider-empty-note">Choose one or more councils first.</div>
                    )}
                    <input type="hidden" name="postcodePrefixes" value={selectedPostcodes.join(", ")} />
                  </div>
                </section>

              <section className="provider-step-card" style={{ display: step === 4 ? "block" : "none" }}>
                  <div className="provider-step-head">
                    <div className="eyebrow">Section 4</div>
                    <h2>Documents and agreement</h2>
                  </div>
                  <div className="admin-filter-grid">
                    {providerRequiredDocuments.map((document) => {
                      const uploaded = provider.documents.find((item) => item.documentKey === document.key);
                      const pendingUpload = pendingUploads[document.key];
                      const displaySize = pendingUpload?.sizeBytes || uploaded?.sizeBytes || null;
                      const displayName = pendingUpload?.fileName || uploaded?.fileName || "No file yet";
                      const displayStatus = pendingUpload ? { className: "status-badge status-badge-pending", label: "Uploaded" } : getDocumentDisplay(uploaded);
                      return (
                        <label key={document.key} className="quote-field-stack admin-filter-span-6 provider-upload-card">
                          <span>{document.label}{document.required ? " *" : " (optional)"}</span>
                          <span className="provider-field-hint">Accepted format: {providerDocumentAcceptedFormatsLabel}</span>
                          <input
                            type="file"
                            name={document.key}
                            accept={providerDocumentAcceptedFileTypes}
                             disabled={!canEdit}
                             onChange={(event) => {
                               const file = event.currentTarget.files?.[0];
                              setPendingUploads((current) => {
                                const next = { ...current };
                                const nextErrors = { ...uploadFieldErrors };

                                if (!file) {
                                  delete next[document.key];
                                  delete nextErrors[document.key];
                                  setUploadFieldErrors(nextErrors);
                                  setUploadError("");
                                  return next;
                                }

                                if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type || "")) {
                                  event.currentTarget.value = "";
                                  nextErrors[document.key] = `${document.label} must be PDF, JPG or PNG.`;
                                  setUploadFieldErrors(nextErrors);
                                  delete next[document.key];
                                  return next;
                                }

                                if (file.size > providerDocumentMaxFileSizeBytes) {
                                  event.currentTarget.value = "";
                                  nextErrors[document.key] = `${document.label} is too large. Each file must be 10MB or less.`;
                                  setUploadFieldErrors(nextErrors);
                                  delete next[document.key];
                                  return next;
                                }

                                next[document.key] = {
                                  fileName: file.name,
                                  sizeBytes: file.size,
                                };

                                const totalSize = Object.values(next).reduce((sum, item) => sum + item.sizeBytes, 0);
                                if (totalSize > providerDocumentTotalMaxSizeBytes) {
                                  event.currentTarget.value = "";
                                  setUploadError("Total upload is too large. Keep all selected files under 30MB in total.");
                                  nextErrors[document.key] = "This file pushes the total upload over 30MB.";
                                  setUploadFieldErrors(nextErrors);
                                  delete next[document.key];
                                  return next;
                                }

                                delete nextErrors[document.key];
                                setUploadFieldErrors(nextErrors);
                                setUploadError("");
                                return next;
                              });
                            }}
                          />
                          <div className="button-row" style={{ alignItems: "center" }}>
                            <span className={displayStatus.className}>{displayStatus.label}</span>
                            <span className="provider-upload-name">{displayName}{displaySize ? ` (${formatFileSize(displaySize)})` : ""}</span>
                          </div>
                          {uploadFieldErrors[document.key] ? <p style={{ color: "var(--color-error)", margin: 0, lineHeight: 1.5 }}>{uploadFieldErrors[document.key]}</p> : null}
                        </label>
                      );
                    })}
                  </div>
                  {uploadError ? <p style={{ color: "var(--color-error)", marginTop: "0.85rem", lineHeight: 1.6 }}>{uploadError}</p> : null}
                  {!uploadError && totalPendingUploadBytes > 0 ? <p className="provider-field-hint" style={{ margin: "0.85rem 0 0" }}>Selected files total: {(totalPendingUploadBytes / (1024 * 1024)).toFixed(1)}MB of 30MB</p> : null}
                  {statusMessage ? <p className="provider-inline-success">{statusMessage}</p> : null}
                  <label className="quote-check-item provider-check-card" style={{ marginTop: "1rem", opacity: canEdit ? 1 : 0.7 }}>
                    <input type="checkbox" name="agreementAccepted" checked={agreementAccepted} onChange={() => setAgreementAccepted((current) => !current)} disabled={!canEdit} />
                    <span>I accept the provider agreement</span>
                  </label>
                </section>

              <div className="provider-step-actions">
                <button type="button" className="button button-secondary" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1}>Back</button>
                {step < totalSteps ? (
                  <button type="button" className="button button-primary" onClick={nextStep} disabled={(step === 1 && !profileComplete) || (step === 2 && !servicesComplete) || (step === 3 && !coverageComplete)}>Next</button>
                ) : (
                  <FormSubmitButton label="Review and submit" pendingLabel="Checking" formAction={continueAction} disabled={!canEdit || Boolean(uploadError) || Object.keys(uploadFieldErrors).length > 0} />
                )}
              </div>
              {step === totalSteps && !readyForConfirmation ? <p style={{ color: "var(--color-error)", margin: 0, lineHeight: 1.6 }}>Before review, complete company details, choose services, add coverage, upload documents, and accept the agreement.</p> : null}
            </form>
          </section>

          <aside className="provider-side-card">
            <div className="provider-side-section">
              <div className="eyebrow">Application status</div>
              <div className="provider-status-panel">
                <ProviderStatusBadge status={provider.status} />
                <p className="lead" style={{ margin: 0 }}>After you submit, we will show review updates here.</p>
              </div>
            </div>
            <div className="provider-side-section">
              <div className="eyebrow">Checklist</div>
              <div className="provider-mini-list">
                {visibleChecklist.map((item) => (
                  <div key={item.key} className="provider-mini-row">
                    <span>{item.label}</span>
                    <strong>{item.complete ? "Done" : "Pending"}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="provider-side-section">
              <div className="eyebrow">Next unlocks</div>
              <div className="provider-mini-list">
                <div className="provider-mini-row"><span>Payment account</span><strong>{provider.approvedAt ? "After approval" : "Locked"}</strong></div>
                <div className="provider-mini-row"><span>Pricing</span><strong>{provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled ? "Ready" : "Locked"}</strong></div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
