"use client";

import type { JsonValue } from "@prisma/client/runtime/library";
import { useMemo, useState } from "react";
import { Check, Circle, Upload, FileText, AlertCircle, ChevronRight, ChevronLeft, Building2, Briefcase, MapPin, FileCheck } from "lucide-react";
import { ProviderStatusBadge } from "@/components/providers/status-badge";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { getPostcodesForCouncils, londonCouncilOptions } from "@/lib/providers/london-coverage";
import { providerDocumentAcceptedFileTypes, providerDocumentAcceptedFormatsLabel, providerDocumentMaxFileSizeBytes, providerDocumentTotalMaxSizeBytes, providerRequiredDocuments } from "@/lib/providers/onboarding-config";
import { getProviderCategoryByKey } from "@/lib/providers/service-catalog-mapping";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  takenPostcodes?: string[];
  competitorPostcodes?: Record<string, number>;
  saveAction: (formData: FormData) => void;
  continueAction: (formData: FormData) => void;
  submitAction: () => void;
};

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/* ─── Step indicator ─── */
const stepMeta = [
  { label: "Company", icon: Building2 },
  { label: "Services", icon: Briefcase },
  { label: "Coverage", icon: MapPin },
  { label: "Documents", icon: FileCheck },
] as const;

function StepIndicator({ currentStep, unlockedStep, onStepClick }: { currentStep: number; unlockedStep: number; onStepClick: (step: number) => void }) {
  return (
    <nav className="flex items-center gap-1">
      {stepMeta.map((meta, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < unlockedStep;
        const isClickable = stepNumber <= unlockedStep;
        const Icon = meta.icon;

        return (
          <div key={meta.label} className="flex items-center gap-1">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(stepNumber)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : isCompleted
                    ? "text-blue-600 hover:bg-blue-50/50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                    : "text-muted-foreground"
              } ${isClickable ? "cursor-pointer" : "cursor-default opacity-50"}`}
            >
              <span className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                isActive
                  ? "bg-blue-600 text-white"
                  : isCompleted
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-muted text-muted-foreground"
              }`}>
                {isCompleted ? <Check className="size-3.5" /> : stepNumber}
              </span>
              <span className="hidden sm:inline">{meta.label}</span>
            </button>
            {index < stepMeta.length - 1 && (
              <ChevronRight className="size-4 text-muted-foreground/40" />
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ─── Chip Selector ─── */
function ChipSelector({ options, selected, onToggle, disabled = false, taken = new Set<string>(), competitors = {} }: { options: string[]; selected: string[]; onToggle: (value: string) => void; disabled?: boolean; taken?: Set<string>; competitors?: Record<string, number> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        const isTaken = taken.has(option);
        const competitorCount = competitors[option] || 0;
        return (
          <button
            key={option}
            type="button"
            onClick={() => !disabled && !isTaken && onToggle(option)}
            disabled={disabled || isTaken}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
              isTaken
                ? "border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
                : isSelected
                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "border-border bg-background text-foreground hover:border-blue-200 hover:bg-blue-50/50 dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
            } ${disabled ? "pointer-events-none opacity-50" : isTaken ? "" : "cursor-pointer"}`}
          >
            {isSelected && !isTaken && <Check className="size-3.5" />}
            {option}
            {isTaken && <span className="ml-1 rounded bg-muted-foreground/20 px-1.5 py-0.5 text-xs">Taken</span>}
            {!isTaken && competitorCount > 0 && (
              <span className="ml-1 rounded bg-amber-100 text-amber-700 px-1.5 py-0.5 text-xs dark:bg-amber-900/30 dark:text-amber-400">
                {competitorCount} {competitorCount === 1 ? "provider" : "providers"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Document upload status ─── */
function getDocumentBadge(uploaded?: ProviderDocument, hasPending?: boolean) {
  if (hasPending) {
    return { variant: "secondary" as const, label: "Selected" };
  }
  if (!uploaded) {
    return { variant: "outline" as const, label: "Not uploaded" };
  }
  if (["REJECTED", "NEEDS_RESUBMISSION"].includes(uploaded.status)) {
    return {
      variant: "destructive" as const,
      label: uploaded.status === "REJECTED" ? "Rejected" : "Resubmit",
    };
  }
  return { variant: "secondary" as const, label: "Uploaded" };
}

/* ─── Main component ─── */
export function ProviderOnboardingClient({
  provider,
  inviteCategoryKey,
  inviteServiceKeys,
  checklist,
  canEdit,
  initialStep = 1,
  statusMessage,
  errorMessage,
  takenPostcodes = [],
  competitorPostcodes = {},
  saveAction,
  continueAction,
  submitAction,
}: ProviderOnboardingClientProps) {
  const totalSteps = 4;
  const lockedCategory = getProviderCategoryByKey(inviteCategoryKey || provider.serviceCategories[0]?.categoryKey || "");
  const initialCategories = lockedCategory ? [lockedCategory.key] : provider.serviceCategories.map((item) => item.categoryKey);
  const savedServiceKeys =
    provider.stripeRequirementsJson &&
    typeof provider.stripeRequirementsJson === "object" &&
    !Array.isArray(provider.stripeRequirementsJson) &&
    Array.isArray(provider.stripeRequirementsJson.approvedServiceKeys)
      ? provider.stripeRequirementsJson.approvedServiceKeys.map((item) => String(item)).filter(Boolean)
      : inviteServiceKeys;
  const initialPostcodes = Array.from(new Set(provider.coverageAreas.map((item) => item.postcodePrefix)));
  const initialCouncils = londonCouncilOptions.filter((council) =>
    getPostcodesForCouncils([council]).some((postcode) => initialPostcodes.includes(postcode)),
  );
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
  const [confirmedSteps, setConfirmedSteps] = useState<number[]>(() =>
    Array.from({ length: Math.max(0, Math.min(initialStep, totalSteps) - 1) }, (_, index) => index + 1),
  );
  const isReviewSubmitted = ["SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "APPROVED", "CHANGES_REQUESTED", "REJECTED"].includes(provider.status);
  const availablePostcodes = useMemo(() => getPostcodesForCouncils(selectedCouncils), [selectedCouncils]);
  const takenPostcodesSet = useMemo(() => new Set(takenPostcodes), [takenPostcodes]);
  const profileComplete = Boolean(legalName.trim() && companyNumber.trim() && registeredAddress.trim() && contactEmail.trim() && phone.trim());
  const servicesComplete = selectedCategories.length > 0 && selectedServices.length > 0;
  const coverageComplete = selectedPostcodes.length > 0;
  const readyForConfirmation = profileComplete && servicesComplete && coverageComplete && agreementAccepted;
  const totalPendingUploadBytes = Object.values(pendingUploads).reduce((sum, item) => sum + item.sizeBytes, 0);

  const visibleChecklist = checklist
    .filter((item) => ["profile", "categories", "coverage", "documents_uploaded", "agreement", "submitted", "approved", "stripe", "pricing"].includes(item.key))
    .map((item) => {
      if (item.key === "profile") return { ...item, complete: confirmedSteps.includes(1) };
      if (item.key === "categories") return { ...item, complete: confirmedSteps.includes(2) };
      if (item.key === "coverage") return { ...item, complete: confirmedSteps.includes(3) };
      if (item.key === "agreement") return { ...item, complete: agreementAccepted };
      return item;
    });

  const completedCount = visibleChecklist.filter((item) => item.complete).length;
  const progress = Math.round((completedCount / visibleChecklist.length) * 100);

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
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      {/* ─── Page header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Provider onboarding</h1>
          <p className="text-sm text-muted-foreground">Complete each section to submit your application for review.</p>
        </div>
        <div className="flex items-center gap-2">
          <ProviderStatusBadge status={provider.status} />
          <Badge variant="outline" className="text-xs">
            {progress}% complete
          </Badge>
        </div>
      </div>

      {/* ─── Status messages ─── */}
      {statusMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
          <Check className="size-4 shrink-0" />
          {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
          <AlertCircle className="size-4 shrink-0" />
          {errorMessage}
        </div>
      )}
      {isReviewSubmitted && !statusMessage && !errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          <Circle className="size-4 shrink-0" />
          Application submitted. Check status for updates.
        </div>
      )}

      {/* ─── Step indicator ─── */}
      <Card>
        <CardContent className="py-1">
          <StepIndicator currentStep={step} unlockedStep={unlockedStep} onStepClick={(s) => canGoToStep(s) && setStep(s)} />
        </CardContent>
      </Card>

      {/* ─── Main content grid ─── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ─── Form area ─── */}
        <form id="provider-onboarding-form" action={saveAction}>
          <input type="hidden" name="currentStep" value={String(step)} />
          {selectedCategories.map((category) => (
            <input key={`hidden-category-${category}`} type="hidden" name="categories" value={category} />
          ))}
          {selectedServices.map((serviceKey) => (
            <input key={`hidden-service-${serviceKey}`} type="hidden" name="serviceKeys" value={serviceKey} />
          ))}
          <input type="hidden" name="postcodePrefixes" value={selectedPostcodes.join(", ")} />
          {agreementAccepted && <input type="hidden" name="agreementAccepted" value="on" />}

          {/* ─── Step 1: Company details ─── */}
          <Card style={{ display: step === 1 ? "flex" : "none" }}>
            <CardHeader>
              <CardTitle>Company details</CardTitle>
              <CardDescription>Provide your registered company information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal company name <span className="text-red-500">*</span></Label>
                  <Input id="legalName" name="legalName" value={legalName} onChange={(event) => setLegalName(event.target.value)} required disabled={!canEdit} placeholder="e.g. ABC Cleaning Ltd" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tradingName">Trading name</Label>
                  <Input id="tradingName" name="tradingName" value={tradingName} onChange={(event) => setTradingName(event.target.value)} disabled={!canEdit} placeholder="Leave blank if same as legal name" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="companyNumber">Company number <span className="text-red-500">*</span></Label>
                  <Input id="companyNumber" name="companyNumber" value={companyNumber} onChange={(event) => setCompanyNumber(event.target.value)} required disabled={!canEdit} placeholder="e.g. 12345678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email <span className="text-red-500">*</span></Label>
                  <input type="hidden" name="contactEmail" value={contactEmail} />
                  <Input id="contactEmail" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} required readOnly disabled={!canEdit} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                  <Input id="phone" name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} required disabled={!canEdit} placeholder="e.g. 07123 456789" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="registeredAddress">Registered address <span className="text-red-500">*</span></Label>
                <Input id="registeredAddress" name="registeredAddress" value={registeredAddress} onChange={(event) => setRegisteredAddress(event.target.value)} required disabled={!canEdit} placeholder="Full registered address" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input id="vatNumber" name="vatNumber" value={vatNumber} onChange={(event) => setVatNumber(event.target.value)} disabled={!canEdit} placeholder="e.g. GB123456789" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Step 2: Services ─── */}
          <Card style={{ display: step === 2 ? "flex" : "none" }}>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>Select the services you want to offer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {lockedCategory && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Approved category: {lockedCategory.label}</p>
                  <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">Select which services you want to offer within this category.</p>
                  <input type="hidden" name="categories" value={lockedCategory.key} />
                </div>
              )}

              <div className="space-y-3">
                <Label>Services <span className="text-red-500">*</span></Label>
                <div className="space-y-2">
                  {(lockedCategory?.services || []).map((service) => {
                    const isSelected = selectedServices.includes(service.key);
                    return (
                      <button
                        key={service.key}
                        type="button"
                        onClick={() => canEdit && setSelectedServices(toggleValue(selectedServices, service.key))}
                        disabled={!canEdit}
                        className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                          isSelected
                            ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100"
                            : "border-border bg-background text-foreground hover:border-blue-200 hover:bg-muted/50"
                        } ${!canEdit ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                      >
                        <span className={`flex size-5 items-center justify-center rounded border text-white transition-colors ${
                          isSelected ? "border-blue-600 bg-blue-600" : "border-muted-foreground/30 bg-background"
                        }`}>
                          {isSelected && <Check className="size-3.5" />}
                        </span>
                        <span className="font-medium">{service.label}</span>
                      </button>
                    );
                  })}
                  {!lockedCategory?.services.length && (
                    <p className="text-sm text-muted-foreground">No services found for this category.</p>
                  )}
                </div>
                {!selectedServices.length && (
                  <p className="text-xs text-red-600">Select at least one service to continue.</p>
                )}
              </div>
              {selectedServices.map((serviceKey) => (
                <input key={serviceKey} type="hidden" name="serviceKeys" value={serviceKey} />
              ))}
            </CardContent>
          </Card>

          {/* ─── Step 3: Coverage ─── */}
          <Card style={{ display: step === 3 ? "flex" : "none" }}>
            <CardHeader>
              <CardTitle>Coverage area</CardTitle>
              <CardDescription>Choose where you want to receive jobs in London.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Region</Label>
                  <Badge variant="secondary">London</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Boroughs <span className="text-red-500">*</span></Label>
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

              <div className="space-y-3">
                <Label>Postcodes <span className="text-red-500">*</span></Label>
                {selectedCouncils.length ? (
                  <>
                    <ChipSelector
                      options={availablePostcodes}
                      selected={selectedPostcodes}
                      disabled={!canEdit}
                      taken={takenPostcodesSet}
                      competitors={competitorPostcodes}
                      onToggle={(value) => setSelectedPostcodes(toggleValue(selectedPostcodes, value))}
                    />
                    {Object.keys(competitorPostcodes).length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Postcodes showing a provider count already have active providers. You can still select them — customers will be able to compare and choose.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Select one or more boroughs first.</p>
                )}
                <input type="hidden" name="postcodePrefixes" value={selectedPostcodes.join(", ")} />
              </div>
            </CardContent>
          </Card>

          {/* ─── Step 4: Documents & agreement ─── */}
          <Card style={{ display: step === 4 ? "flex" : "none" }}>
            <CardHeader>
              <CardTitle>Documents and agreement</CardTitle>
              <CardDescription>Upload required documents and accept the provider agreement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {providerRequiredDocuments.map((document) => {
                  const uploaded = provider.documents.find((item) => item.documentKey === document.key);
                  const pendingUpload = pendingUploads[document.key];
                  const displaySize = pendingUpload?.sizeBytes || uploaded?.sizeBytes || null;
                  const displayName = pendingUpload?.fileName || uploaded?.fileName || null;
                  const badge = getDocumentBadge(uploaded, Boolean(pendingUpload));

                  return (
                    <div key={document.key} className="space-y-2 rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">
                            {document.label}
                            {document.required && <span className="text-red-500"> *</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{providerDocumentAcceptedFormatsLabel}</p>
                        </div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 ${!canEdit ? "pointer-events-none opacity-50" : ""}`}>
                        <Upload className="size-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {displayName ? `${displayName}${displaySize ? ` (${formatFileSize(displaySize)})` : ""}` : "Choose file"}
                        </span>
                        <input
                          type="file"
                          name={document.key}
                          accept={providerDocumentAcceptedFileTypes}
                          disabled={!canEdit}
                          className="sr-only"
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
                                nextErrors[document.key] = `${document.label} is too large. Each file must be 10 MB or less.`;
                                setUploadFieldErrors(nextErrors);
                                delete next[document.key];
                                return next;
                              }

                              next[document.key] = { fileName: file.name, sizeBytes: file.size };

                              const totalSize = Object.values(next).reduce((sum, item) => sum + item.sizeBytes, 0);
                              if (totalSize > providerDocumentTotalMaxSizeBytes) {
                                event.currentTarget.value = "";
                                setUploadError("Total upload is too large. Keep all selected files under 30 MB.");
                                nextErrors[document.key] = "This file pushes the total upload over 30 MB.";
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
                      </label>
                      {uploadFieldErrors[document.key] && (
                        <p className="text-xs text-red-600">{uploadFieldErrors[document.key]}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                  <AlertCircle className="size-4 shrink-0" />
                  {uploadError}
                </div>
              )}

              {!uploadError && totalPendingUploadBytes > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selected files total: {(totalPendingUploadBytes / (1024 * 1024)).toFixed(1)} MB of 30 MB
                </p>
              )}

              {/* Agreement checkbox */}
              <div className="rounded-lg border p-4">
                <label className={`flex items-start gap-3 ${canEdit ? "cursor-pointer" : "pointer-events-none opacity-70"}`}>
                  <input
                    type="checkbox"
                    name="agreementAccepted"
                    checked={agreementAccepted}
                    onChange={() => setAgreementAccepted((current) => !current)}
                    disabled={!canEdit}
                    className="mt-0.5 size-4 rounded border-muted-foreground/30 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">I accept the provider agreement</p>
                    <p className="text-xs text-muted-foreground">
                      By checking this box, you agree to the terms and conditions of the AreaSorted provider partnership.
                    </p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* ─── Navigation buttons ─── */}
          <div className="mt-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              disabled={step === 1}
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    (step === 1 && !profileComplete) ||
                    (step === 2 && !servicesComplete) ||
                    (step === 3 && !coverageComplete)
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <FormSubmitButton
                  label="Review and submit"
                  pendingLabel="Checking..."
                  formAction={continueAction}
                  disabled={!canEdit || Boolean(uploadError) || Object.keys(uploadFieldErrors).length > 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent px-2.5 h-8 text-sm font-medium transition-all"
                />
              )}
            </div>
          </div>
          {step === totalSteps && !readyForConfirmation && (
            <p className="mt-2 text-xs text-red-600">
              Complete all sections, upload documents, and accept the agreement before submitting.
            </p>
          )}
        </form>

        {/* ─── Sidebar ─── */}
        <div className="space-y-4">
          {/* Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Setup checklist</CardTitle>
              <CardDescription className="text-xs">{completedCount} of {visibleChecklist.length} complete</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {visibleChecklist.map((item) => (
                  <div key={item.key} className="flex items-center gap-2.5">
                    <span className={`flex size-5 items-center justify-center rounded-full ${
                      item.complete
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {item.complete ? <Check className="size-3" /> : <Circle className="size-3" />}
                    </span>
                    <span className={`text-sm ${item.complete ? "text-foreground" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What's next */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">After approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment account</span>
                  <Badge variant={provider.approvedAt ? "secondary" : "outline"} className="text-xs">
                    {provider.approvedAt ? "After approval" : "Locked"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pricing setup</span>
                  <Badge
                    variant={provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled ? "Ready" : "Locked"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
