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
import { getAgreementContent, onboardingBusinessTypeOptions } from "@/lib/providers/onboarding-legal";
import type { ProviderOnboardingMetadata } from "@/lib/providers/onboarding-profile";

type ChecklistItem = {
  key: string;
  label: string;
  complete: boolean;
  detail: string;
};

type ProviderDocument = {
  id: string;
  documentKey: string;
  label: string;
  status: string;
  fileName: string;
  sizeBytes?: number | null;
  reviewNotes?: string | null;
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
  onboardingMetadata: ProviderOnboardingMetadata;
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
  onboardingMetadata,
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
  const [businessType, setBusinessType] = useState<"company" | "sole_trader">(onboardingMetadata.businessType || "company");
  const agreement = getAgreementContent(businessType);
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
  const [companyCountry, setCompanyCountry] = useState(onboardingMetadata.companyCountry || "United Kingdom");
  const [companyIncorporationDate, setCompanyIncorporationDate] = useState(onboardingMetadata.companyIncorporationDate || "");
  const [companyType, setCompanyType] = useState(onboardingMetadata.companyType || "Private Limited Company (Ltd)");
  const [website, setWebsite] = useState(onboardingMetadata.website || "");
  const [authorisedSignatoryName, setAuthorisedSignatoryName] = useState(onboardingMetadata.authorisedSignatoryName || "");
  const [authorisedSignatoryTitle, setAuthorisedSignatoryTitle] = useState(onboardingMetadata.authorisedSignatoryTitle || "");
  const [authorisedSignatoryEmail, setAuthorisedSignatoryEmail] = useState(onboardingMetadata.authorisedSignatoryEmail || "");
  const [authorisedSignatoryPhone, setAuthorisedSignatoryPhone] = useState(onboardingMetadata.authorisedSignatoryPhone || "");
  const [authorisedSignatoryAuthority, setAuthorisedSignatoryAuthority] = useState(onboardingMetadata.authorisedSignatoryAuthority || "");
  const [operationsContactName, setOperationsContactName] = useState(onboardingMetadata.operationsContactName || "");
  const [operationsContactRole, setOperationsContactRole] = useState(onboardingMetadata.operationsContactRole || "");
  const [operationsContactPhone, setOperationsContactPhone] = useState(onboardingMetadata.operationsContactPhone || "");
  const [operationsContactEmail, setOperationsContactEmail] = useState(onboardingMetadata.operationsContactEmail || "");
  const [emergencyContactName, setEmergencyContactName] = useState(onboardingMetadata.emergencyContactName || "");
  const [emergencyContactRole, setEmergencyContactRole] = useState(onboardingMetadata.emergencyContactRole || "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(onboardingMetadata.emergencyContactPhone || "");
  const [emergencyContactEmail, setEmergencyContactEmail] = useState(onboardingMetadata.emergencyContactEmail || "");
  const [workerCount, setWorkerCount] = useState(onboardingMetadata.workerCount || "");
  const [dateOfBirth, setDateOfBirth] = useState(onboardingMetadata.dateOfBirth || "");
  const [nationality, setNationality] = useState(onboardingMetadata.nationality || "");
  const [businessAddress, setBusinessAddress] = useState(onboardingMetadata.businessAddress || "");
  const [nationalInsuranceNumber, setNationalInsuranceNumber] = useState(onboardingMetadata.nationalInsuranceNumber || "");
  const [utrNumber, setUtrNumber] = useState(onboardingMetadata.utrNumber || "");
  const [hmrcStatus, setHmrcStatus] = useState(onboardingMetadata.hmrcStatus || "");
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
  const profileComplete = businessType === "sole_trader"
    ? Boolean(legalName.trim() && registeredAddress.trim() && contactEmail.trim() && phone.trim() && dateOfBirth.trim() && nationality.trim())
    : Boolean(legalName.trim() && companyNumber.trim() && registeredAddress.trim() && contactEmail.trim() && phone.trim() && authorisedSignatoryName.trim() && authorisedSignatoryEmail.trim());
  const servicesComplete = selectedCategories.length > 0 && selectedServices.length > 0;
  const coverageComplete = selectedPostcodes.length > 0;
  const readyForConfirmation = profileComplete && servicesComplete && coverageComplete && agreementAccepted;
  const totalPendingUploadBytes = Object.values(pendingUploads).reduce((sum, item) => sum + item.sizeBytes, 0);
  const flaggedDocuments = provider.documents.filter((document) =>
    ["REJECTED", "NEEDS_RESUBMISSION"].includes(document.status),
  );
  const hasReviewFeedback = Boolean(provider.reviewNotes?.trim() || flaggedDocuments.length > 0);

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

      {hasReviewFeedback && canEdit && (
        <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/10">
          <CardHeader>
            <CardTitle className="text-base">Review feedback</CardTitle>
            <CardDescription>
              The review team has flagged changes. Update the relevant sections below and re-submit when ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {provider.reviewNotes?.trim() && (
              <div className="rounded-md border border-amber-200 bg-background p-4 dark:border-amber-900">
                <div className="mb-2 text-sm font-medium">Application notes</div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{provider.reviewNotes.trim()}</p>
              </div>
            )}

            {flaggedDocuments.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-background p-4 dark:border-amber-900">
                <div className="mb-3 text-sm font-medium">Documents to review or replace</div>
                <div className="space-y-3">
                  {flaggedDocuments.map((document) => (
                    <div key={document.id} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">{document.label}</span>
                        <Badge variant="destructive" className="text-[10px]">
                          {document.status === "NEEDS_RESUBMISSION" ? "Resubmission needed" : "Rejected"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                        {document.reviewNotes?.trim() || "Please upload a corrected version of this document before re-submitting."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
        <form id="provider-onboarding-form" action={saveAction} className="order-2 lg:order-1">
          <input type="hidden" name="currentStep" value={String(step)} />
          <input type="hidden" name="businessType" value={businessType} />
          {selectedCategories.map((category) => (
            <input key={`hidden-category-${category}`} type="hidden" name="categories" value={category} />
          ))}
          {selectedServices.map((serviceKey) => (
            <input key={`hidden-service-${serviceKey}`} type="hidden" name="serviceKeys" value={serviceKey} />
          ))}
          <input type="hidden" name="companyCountry" value={companyCountry} />
          <input type="hidden" name="companyIncorporationDate" value={companyIncorporationDate} />
          <input type="hidden" name="companyType" value={companyType} />
          <input type="hidden" name="website" value={website} />
          <input type="hidden" name="authorisedSignatoryName" value={authorisedSignatoryName} />
          <input type="hidden" name="authorisedSignatoryTitle" value={authorisedSignatoryTitle} />
          <input type="hidden" name="authorisedSignatoryEmail" value={authorisedSignatoryEmail} />
          <input type="hidden" name="authorisedSignatoryPhone" value={authorisedSignatoryPhone} />
          <input type="hidden" name="authorisedSignatoryAuthority" value={authorisedSignatoryAuthority} />
          <input type="hidden" name="operationsContactName" value={operationsContactName} />
          <input type="hidden" name="operationsContactRole" value={operationsContactRole} />
          <input type="hidden" name="operationsContactPhone" value={operationsContactPhone} />
          <input type="hidden" name="operationsContactEmail" value={operationsContactEmail} />
          <input type="hidden" name="emergencyContactName" value={emergencyContactName} />
          <input type="hidden" name="emergencyContactRole" value={emergencyContactRole} />
          <input type="hidden" name="emergencyContactPhone" value={emergencyContactPhone} />
          <input type="hidden" name="emergencyContactEmail" value={emergencyContactEmail} />
          <input type="hidden" name="workerCount" value={workerCount} />
          <input type="hidden" name="dateOfBirth" value={dateOfBirth} />
          <input type="hidden" name="nationality" value={nationality} />
          <input type="hidden" name="businessAddress" value={businessAddress} />
          <input type="hidden" name="nationalInsuranceNumber" value={nationalInsuranceNumber} />
          <input type="hidden" name="utrNumber" value={utrNumber} />
          <input type="hidden" name="hmrcStatus" value={hmrcStatus} />
          <input type="hidden" name="postcodePrefixes" value={selectedPostcodes.join(", ")} />
          {agreementAccepted && <input type="hidden" name="agreementAccepted" value="on" />}

          {/* ─── Step 1: Business details ─── */}
          <Card style={{ display: step === 1 ? "flex" : "none" }}>
            <CardHeader>
              <CardTitle>{businessType === "sole_trader" ? "Provider details" : "Company details"}</CardTitle>
              <CardDescription>{businessType === "sole_trader" ? "Complete your sole trader onboarding profile." : "Provide your registered company information and signatory details."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label>Business type <span className="text-red-500">*</span></Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {onboardingBusinessTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => canEdit && setBusinessType(option.value)}
                      className={`rounded-lg border px-4 py-3 text-left text-sm transition-all ${businessType === option.value ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100" : "border-border bg-background text-foreground hover:border-blue-200 hover:bg-muted/50"} ${!canEdit ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                    >
                      <div className="font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legalName">{businessType === "sole_trader" ? "Full legal name" : "Legal company name"} <span className="text-red-500">*</span></Label>
                  <Input id="legalName" name="legalName" value={legalName} onChange={(event) => setLegalName(event.target.value)} required disabled={!canEdit} placeholder={businessType === "sole_trader" ? "e.g. Jane Smith" : "e.g. ABC Cleaning Ltd"} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tradingName">Trading name</Label>
                  <Input id="tradingName" name="tradingName" value={tradingName} onChange={(event) => setTradingName(event.target.value)} disabled={!canEdit} placeholder="Leave blank if same as legal name" />
                </div>
              </div>
              <div className={`grid gap-4 ${businessType === "sole_trader" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
                {businessType === "company" && (
                  <div className="space-y-2">
                    <Label htmlFor="companyNumber">Company number <span className="text-red-500">*</span></Label>
                    <Input id="companyNumber" name="companyNumber" value={companyNumber} onChange={(event) => setCompanyNumber(event.target.value)} required disabled={!canEdit} placeholder="e.g. 12345678" />
                  </div>
                )}
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
              {businessType === "sole_trader" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of birth <span className="text-red-500">*</span></Label>
                    <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality <span className="text-red-500">*</span></Label>
                    <Input id="nationality" value={nationality} onChange={(event) => setNationality(event.target.value)} disabled={!canEdit} placeholder="e.g. British" />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="companyCountry">Country of incorporation</Label>
                    <Input id="companyCountry" value={companyCountry} onChange={(event) => setCompanyCountry(event.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyIncorporationDate">Date of incorporation</Label>
                    <Input id="companyIncorporationDate" type="date" value={companyIncorporationDate} onChange={(event) => setCompanyIncorporationDate(event.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyType">Company type</Label>
                    <Input id="companyType" value={companyType} onChange={(event) => setCompanyType(event.target.value)} disabled={!canEdit} placeholder="e.g. Ltd, PLC, LLP" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="registeredAddress">{businessType === "sole_trader" ? "Home address" : "Registered address"} <span className="text-red-500">*</span></Label>
                <Input id="registeredAddress" name="registeredAddress" value={registeredAddress} onChange={(event) => setRegisteredAddress(event.target.value)} required disabled={!canEdit} placeholder={businessType === "sole_trader" ? "Home address" : "Full registered address"} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input id="vatNumber" name="vatNumber" value={vatNumber} onChange={(event) => setVatNumber(event.target.value)} disabled={!canEdit} placeholder="e.g. GB123456789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input id="website" value={website} onChange={(event) => setWebsite(event.target.value)} disabled={!canEdit} placeholder="https://example.com" />
                </div>
              </div>
              {businessType === "sole_trader" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="businessAddress">Business address</Label>
                      <Input id="businessAddress" value={businessAddress} onChange={(event) => setBusinessAddress(event.target.value)} disabled={!canEdit} placeholder="If different from home address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationalInsuranceNumber">National Insurance no.</Label>
                      <Input id="nationalInsuranceNumber" value={nationalInsuranceNumber} onChange={(event) => setNationalInsuranceNumber(event.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="utrNumber">UTR</Label>
                      <Input id="utrNumber" value={utrNumber} onChange={(event) => setUtrNumber(event.target.value)} disabled={!canEdit} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hmrcStatus">HMRC self-employed status</Label>
                    <Input id="hmrcStatus" value={hmrcStatus} onChange={(event) => setHmrcStatus(event.target.value)} disabled={!canEdit} placeholder="Yes / No / In progress" />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="authorisedSignatoryName">Authorised signatory name <span className="text-red-500">*</span></Label>
                      <Input id="authorisedSignatoryName" value={authorisedSignatoryName} onChange={(event) => setAuthorisedSignatoryName(event.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorisedSignatoryTitle">Authorised signatory title</Label>
                      <Input id="authorisedSignatoryTitle" value={authorisedSignatoryTitle} onChange={(event) => setAuthorisedSignatoryTitle(event.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorisedSignatoryEmail">Authorised signatory email <span className="text-red-500">*</span></Label>
                      <Input id="authorisedSignatoryEmail" type="email" value={authorisedSignatoryEmail} onChange={(event) => setAuthorisedSignatoryEmail(event.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorisedSignatoryPhone">Authorised signatory phone</Label>
                      <Input id="authorisedSignatoryPhone" value={authorisedSignatoryPhone} onChange={(event) => setAuthorisedSignatoryPhone(event.target.value)} disabled={!canEdit} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="authorisedSignatoryAuthority">Authority basis</Label>
                      <Input id="authorisedSignatoryAuthority" value={authorisedSignatoryAuthority} onChange={(event) => setAuthorisedSignatoryAuthority(event.target.value)} disabled={!canEdit} placeholder="Director / Manager / Owner" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operationsContactName">Operations contact</Label>
                      <Input id="operationsContactName" value={operationsContactName} onChange={(event) => setOperationsContactName(event.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operationsContactEmail">Operations email</Label>
                      <Input id="operationsContactEmail" type="email" value={operationsContactEmail} onChange={(event) => setOperationsContactEmail(event.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operationsContactPhone">Operations phone</Label>
                      <Input id="operationsContactPhone" value={operationsContactPhone} onChange={(event) => setOperationsContactPhone(event.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workerCount">Workers / cleaners available</Label>
                      <Input id="workerCount" value={workerCount} onChange={(event) => setWorkerCount(event.target.value)} disabled={!canEdit} />
                    </div>
                  </div>
                </>
              )}
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
                      setSelectedPostcodes((current) => {
                        const retained = current.filter((postcode) => validPostcodes.includes(postcode));
                        return Array.from(new Set([...retained, ...validPostcodes]));
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Selecting a borough automatically preselects its postcode prefixes. You can remove any individual postcode below if needed.
                  </p>
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
                        Postcodes showing a provider count already have active providers in the wider network view. Your final approved coverage is still controlled by AreaSorted.
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
              <div className="rounded-lg border p-4 space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="size-4" />
                    {agreement.title}
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{agreement.version}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{agreement.intro}</p>
                  <div className="mt-4 max-h-72 space-y-4 overflow-y-auto pr-2">
                    {agreement.sections.map((section) => (
                      <div key={section.heading} className="space-y-2">
                        <h4 className="text-sm font-semibold">{section.heading}</h4>
                        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                          {section.points.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <details className="rounded-lg border bg-background p-4">
                  <summary className="cursor-pointer text-sm font-medium">Read full agreement text</summary>
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Open the full agreement in a dedicated page, download a copy, or print it to PDF before accepting.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={businessType === "sole_trader" ? "/provider/agreements/sole-trader" : "/provider/agreements/company"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        Open full agreement
                      </a>
                      <a
                        href={businessType === "sole_trader" ? "/provider-agreements/sole-trader-v1.txt" : "/provider-agreements/company-provider-v1.txt"}
                        download
                        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        Download text
                      </a>
                    </div>
                    <iframe
                      src={businessType === "sole_trader" ? "/provider-agreements/sole-trader-v1.txt" : "/provider-agreements/company-provider-v1.txt"}
                      title={`${agreement.title} full text`}
                      className="h-72 w-full rounded-lg border bg-white"
                    />
                  </div>
                </details>
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
                    <p className="text-sm font-medium">I accept the {agreement.title}</p>
                    <p className="text-xs text-muted-foreground">
                      By checking this box, you confirm you have read version {agreement.version} and agree to the provider terms for your business type.
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
        <div className="order-1 space-y-4 lg:order-2">
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
