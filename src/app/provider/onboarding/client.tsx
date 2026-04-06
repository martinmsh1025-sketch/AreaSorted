"use client";

import type { JsonValue } from "@prisma/client/runtime/library";
import { useMemo, useState } from "react";
import { Check, Circle, Upload, FileText, AlertCircle, ChevronRight, ChevronLeft, Building2, Briefcase, MapPin, FileCheck } from "lucide-react";
import { ProviderStatusBadge } from "@/components/providers/status-badge";
import { getPostcodesForCouncils, londonCouncilOptions } from "@/lib/providers/london-coverage";
import { getProviderDocuments, providerDocumentAcceptedFileTypes, providerDocumentAcceptedFormatsLabel, providerDocumentMaxFileSizeBytes, providerDocumentTotalMaxSizeBytes } from "@/lib/providers/onboarding-config";
import { getProviderCategoryByKey, providerServiceCatalog } from "@/lib/providers/service-catalog-mapping";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAgreementContent, onboardingBusinessTypeOptions } from "@/lib/providers/onboarding-legal";
import type { ProviderOnboardingMetadata } from "@/lib/providers/onboarding-profile";
import { groupPostcodePrefixes } from "@/lib/postcodes/group-prefixes";
import { ProviderPublicProfileCard } from "@/components/provider/public-profile-card";

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
    profileImageUrl?: string | null;
    profileImageType?: string | null;
    headline?: string | null;
    bio?: string | null;
    yearsExperience?: number | null;
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

const nationalityOptions = [
  "British",
  "Irish",
  "Afghan",
  "American",
  "Australian",
  "Bangladeshi",
  "Brazilian",
  "Canadian",
  "Chinese",
  "French",
  "German",
  "Ghanaian",
  "Hong Konger",
  "Indian",
  "Italian",
  "Japanese",
  "Kenyan",
  "Malaysian",
  "Nigerian",
  "Pakistani",
  "Philippine",
  "Polish",
  "Portuguese",
  "Romanian",
  "South African",
  "Spanish",
  "Sri Lankan",
  "Ukrainian",
  "Other",
] as const;
const companyCountryOptions = ["United Kingdom", "Ireland", "Other"] as const;
const companyTypeOptions = ["Private Limited Company (Ltd)", "LLP", "Partnership", "Other"] as const;
const hmrcStatusOptions = ["Registered", "In progress", "Not registered yet"] as const;
const rightToWorkOptions = [
  "British or Irish citizen",
  "EU or settled status holder",
  "Visa or permit holder",
  "Will provide documents during review",
] as const;
const authorityOptions = ["Director", "Owner", "Manager", "Authorised signatory", "Other"] as const;
const workerCountOptions = ["1", "2-5", "6-10", "11-25", "25+"] as const;
const phoneCountryOptions = [
  { code: "+44", label: "United Kingdom", flag: "GB" },
  { code: "+353", label: "Ireland", flag: "IE" },
  { code: "+852", label: "Hong Kong", flag: "HK" },
  { code: "+1", label: "United States", flag: "US" },
  { code: "+61", label: "Australia", flag: "AU" },
  { code: "+1", label: "Canada", flag: "CA" },
  { code: "+64", label: "New Zealand", flag: "NZ" },
  { code: "+49", label: "Germany", flag: "DE" },
  { code: "+33", label: "France", flag: "FR" },
  { code: "+39", label: "Italy", flag: "IT" },
  { code: "+34", label: "Spain", flag: "ES" },
  { code: "+31", label: "Netherlands", flag: "NL" },
  { code: "+32", label: "Belgium", flag: "BE" },
  { code: "+41", label: "Switzerland", flag: "CH" },
  { code: "+45", label: "Denmark", flag: "DK" },
  { code: "+46", label: "Sweden", flag: "SE" },
  { code: "+47", label: "Norway", flag: "NO" },
  { code: "+351", label: "Portugal", flag: "PT" },
  { code: "+48", label: "Poland", flag: "PL" },
  { code: "+40", label: "Romania", flag: "RO" },
  { code: "+36", label: "Hungary", flag: "HU" },
  { code: "+420", label: "Czech Republic", flag: "CZ" },
  { code: "+421", label: "Slovakia", flag: "SK" },
  { code: "+30", label: "Greece", flag: "GR" },
  { code: "+91", label: "India", flag: "IN" },
  { code: "+92", label: "Pakistan", flag: "PK" },
  { code: "+880", label: "Bangladesh", flag: "BD" },
  { code: "+94", label: "Sri Lanka", flag: "LK" },
  { code: "+63", label: "Philippines", flag: "PH" },
  { code: "+60", label: "Malaysia", flag: "MY" },
  { code: "+65", label: "Singapore", flag: "SG" },
  { code: "+86", label: "China", flag: "CN" },
  { code: "+81", label: "Japan", flag: "JP" },
  { code: "+82", label: "South Korea", flag: "KR" },
  { code: "+971", label: "United Arab Emirates", flag: "AE" },
  { code: "+966", label: "Saudi Arabia", flag: "SA" },
  { code: "+234", label: "Nigeria", flag: "NG" },
  { code: "+27", label: "South Africa", flag: "ZA" },
  { code: "+233", label: "Ghana", flag: "GH" },
  { code: "+254", label: "Kenya", flag: "KE" },
  { code: "+20", label: "Egypt", flag: "EG" },
  { code: "+55", label: "Brazil", flag: "BR" },
  { code: "+52", label: "Mexico", flag: "MX" },
  { code: "+90", label: "Turkey", flag: "TR" },
  { code: "+380", label: "Ukraine", flag: "UA" },
] as const;

const onboardingSelectClass = "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-white dark:text-slate-950 dark:focus:border-blue-700 dark:focus:ring-blue-950 appearance-none";
const onboardingInputClass = "h-11 rounded-xl border-slate-200 bg-white px-3 py-2 text-slate-950 shadow-sm dark:border-slate-700 dark:bg-white dark:text-slate-950";

function normaliseDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function toFlagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function splitPhone(value: string) {
  const trimmed = value.trim();
  const matched = phoneCountryOptions.find((option) => trimmed.startsWith(option.code));
  if (!matched) {
    return { countryCode: "+44", localNumber: trimmed.replace(/^\+\d+\s*/, "") };
  }
  return {
    countryCode: matched.code,
    localNumber: trimmed.slice(matched.code.length).trim(),
  };
}

function combinePhone(countryCode: string, localNumber: string) {
  const cleaned = localNumber.replace(/\s+/g, " ").trim();
  return cleaned ? `${countryCode} ${cleaned}` : countryCode;
}

function PhoneField({
  id,
  name,
  label,
  countryCode,
  localNumber,
  onCountryCodeChange,
  onLocalNumberChange,
  disabled,
  required,
}: {
  id: string;
  name: string;
  label: string;
  countryCode: string;
  localNumber: string;
  onCountryCodeChange: (value: string) => void;
  onLocalNumberChange: (value: string) => void;
  disabled: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{required ? <span className="text-red-500"> *</span> : null}</Label>
      <input type="hidden" name={name} value={combinePhone(countryCode, localNumber)} />
      <div className="grid gap-2 sm:grid-cols-[minmax(0,220px)_1fr]">
        <select
          value={countryCode}
          onChange={(event) => onCountryCodeChange(event.target.value)}
          disabled={disabled}
          className={onboardingSelectClass}
        >
          {phoneCountryOptions.map((option, index) => (
            <option key={`${option.flag}-${option.code}-${index}`} value={option.code}>
              {toFlagEmoji(option.flag)} {option.label} ({option.code})
            </option>
          ))}
        </select>
        <Input
          id={id}
          value={localNumber}
          onChange={(event) => onLocalNumberChange(event.target.value)}
          disabled={disabled}
          required={required}
          placeholder="Phone number"
          inputMode="tel"
          className="h-11 rounded-xl px-3 py-2"
        />
      </div>
    </div>
  );
}

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
  const isInviteFlow = Boolean(inviteCategoryKey);
  const lockedCategory = getProviderCategoryByKey(inviteCategoryKey || "");
  const initialCategories = lockedCategory ? [lockedCategory.key] : provider.serviceCategories.map((item) => item.categoryKey);
  const savedServiceKeys =
    provider.stripeRequirementsJson &&
    typeof provider.stripeRequirementsJson === "object" &&
    !Array.isArray(provider.stripeRequirementsJson) &&
    Array.isArray(provider.stripeRequirementsJson.approvedServiceKeys)
      ? provider.stripeRequirementsJson.approvedServiceKeys.map((item) => String(item)).filter(Boolean)
      : inviteServiceKeys;
  const initialPostcodes = isInviteFlow ? [] : Array.from(new Set(provider.coverageAreas.map((item) => item.postcodePrefix)));
  const initialCouncils = londonCouncilOptions.filter((council) =>
    getPostcodesForCouncils([council]).some((postcode) => initialPostcodes.includes(postcode)),
  );
  const [businessType, setBusinessType] = useState<"company" | "sole_trader">(onboardingMetadata.businessType || "company");
  const agreement = getAgreementContent(businessType);
  const providerDocuments = useMemo(() => getProviderDocuments(businessType), [businessType]);
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
  const initialPhone = splitPhone(provider.phone || "");
  const [phoneCountryCode, setPhoneCountryCode] = useState(initialPhone.countryCode);
  const [phoneLocalNumber, setPhoneLocalNumber] = useState(initialPhone.localNumber);
  const phone = combinePhone(phoneCountryCode, phoneLocalNumber);
  const [registeredAddress, setRegisteredAddress] = useState(provider.registeredAddress || "");
  const [vatNumber, setVatNumber] = useState(provider.vatNumber || "");
  const [companyCountry, setCompanyCountry] = useState(onboardingMetadata.companyCountry || "United Kingdom");
  const [companyIncorporationDate, setCompanyIncorporationDate] = useState(onboardingMetadata.companyIncorporationDate || "");
  const [companyType, setCompanyType] = useState(onboardingMetadata.companyType || "Private Limited Company (Ltd)");
  const [website, setWebsite] = useState(onboardingMetadata.website || "");
  const [authorisedSignatoryName, setAuthorisedSignatoryName] = useState(onboardingMetadata.authorisedSignatoryName || "");
  const [authorisedSignatoryTitle, setAuthorisedSignatoryTitle] = useState(onboardingMetadata.authorisedSignatoryTitle || "");
  const [authorisedSignatoryEmail, setAuthorisedSignatoryEmail] = useState(onboardingMetadata.authorisedSignatoryEmail || "");
  const initialAuthorisedSignatoryPhone = splitPhone(onboardingMetadata.authorisedSignatoryPhone || "");
  const [authorisedSignatoryPhoneCountryCode, setAuthorisedSignatoryPhoneCountryCode] = useState(initialAuthorisedSignatoryPhone.countryCode);
  const [authorisedSignatoryPhoneLocalNumber, setAuthorisedSignatoryPhoneLocalNumber] = useState(initialAuthorisedSignatoryPhone.localNumber);
  const authorisedSignatoryPhone = combinePhone(authorisedSignatoryPhoneCountryCode, authorisedSignatoryPhoneLocalNumber);
  const [authorisedSignatoryAuthority, setAuthorisedSignatoryAuthority] = useState(onboardingMetadata.authorisedSignatoryAuthority || "");
  const [operationsContactName, setOperationsContactName] = useState(onboardingMetadata.operationsContactName || "");
  const [operationsContactRole, setOperationsContactRole] = useState(onboardingMetadata.operationsContactRole || "");
  const initialOperationsContactPhone = splitPhone(onboardingMetadata.operationsContactPhone || "");
  const [operationsContactPhoneCountryCode, setOperationsContactPhoneCountryCode] = useState(initialOperationsContactPhone.countryCode);
  const [operationsContactPhoneLocalNumber, setOperationsContactPhoneLocalNumber] = useState(initialOperationsContactPhone.localNumber);
  const operationsContactPhone = combinePhone(operationsContactPhoneCountryCode, operationsContactPhoneLocalNumber);
  const [operationsContactEmail, setOperationsContactEmail] = useState(onboardingMetadata.operationsContactEmail || "");
  const [emergencyContactName, setEmergencyContactName] = useState(onboardingMetadata.emergencyContactName || "");
  const [emergencyContactRole, setEmergencyContactRole] = useState(onboardingMetadata.emergencyContactRole || "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(onboardingMetadata.emergencyContactPhone || "");
  const [emergencyContactEmail, setEmergencyContactEmail] = useState(onboardingMetadata.emergencyContactEmail || "");
  const [workerCount, setWorkerCount] = useState(onboardingMetadata.workerCount || "");
  const [dateOfBirth, setDateOfBirth] = useState(onboardingMetadata.dateOfBirth || "");
  const [nationality, setNationality] = useState(onboardingMetadata.nationality || "");
  const [rightToWorkStatus, setRightToWorkStatus] = useState(onboardingMetadata.rightToWorkStatus || "");
  const [businessAddress, setBusinessAddress] = useState(onboardingMetadata.businessAddress || "");
  const [nationalInsuranceNumber, setNationalInsuranceNumber] = useState(onboardingMetadata.nationalInsuranceNumber || "");
  const [utrNumber, setUtrNumber] = useState(onboardingMetadata.utrNumber || "");
  const [hmrcStatus, setHmrcStatus] = useState(onboardingMetadata.hmrcStatus || "");
  const [profileImageUrl, setProfileImageUrl] = useState(provider.profileImageUrl || "");
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState(provider.profileImageUrl || "");
  const [selectedProfileImageName, setSelectedProfileImageName] = useState("");
  const [profileImageType, setProfileImageType] = useState(provider.profileImageType || "logo");
  const [headline, setHeadline] = useState(provider.headline || "");
  const [bio, setBio] = useState(provider.bio || "");
  const [yearsExperience, setYearsExperience] = useState(provider.yearsExperience ? String(provider.yearsExperience) : "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(isInviteFlow ? initialCategories : []);
  const [selectedServices, setSelectedServices] = useState<string[]>(isInviteFlow ? savedServiceKeys : []);
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
  const groupedAvailablePostcodes = useMemo(() => groupPostcodePrefixes(availablePostcodes), [availablePostcodes]);
  const takenPostcodesSet = useMemo(() => new Set(takenPostcodes), [takenPostcodes]);
  const profileComplete = businessType === "sole_trader"
    ? Boolean(profileImageUrl.trim() && legalName.trim() && registeredAddress.trim() && contactEmail.trim() && phone.trim() && dateOfBirth.trim() && nationality.trim() && rightToWorkStatus.trim())
    : Boolean(profileImageUrl.trim() && legalName.trim() && companyNumber.trim() && registeredAddress.trim() && contactEmail.trim() && phone.trim() && authorisedSignatoryName.trim() && authorisedSignatoryEmail.trim());
  const servicesComplete = selectedCategories.length > 0 && selectedServices.length > 0;
  const coverageComplete = selectedPostcodes.length > 0;
  const readyForConfirmation = profileComplete && servicesComplete && coverageComplete && agreementAccepted;
  const totalPendingUploadBytes = Object.values(pendingUploads).reduce((sum, item) => sum + item.sizeBytes, 0);
  const flaggedDocuments = provider.documents.filter((document) =>
    ["REJECTED", "NEEDS_RESUBMISSION"].includes(document.status),
  );
  const hasReviewFeedback = Boolean(provider.reviewNotes?.trim() || flaggedDocuments.length > 0);
  const availableServices = selectedCategories.flatMap((categoryKey) => getProviderCategoryByKey(categoryKey)?.services || []);

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
          <input type="hidden" name="rightToWorkStatus" value={rightToWorkStatus} />
          <input type="hidden" name="profileImageUrl" value={profileImageUrl} />
          <input type="hidden" name="profileImageType" value={profileImageType} />
          <input type="hidden" name="headline" value={headline} />
          <input type="hidden" name="bio" value={bio} />
          <input type="hidden" name="yearsExperience" value={yearsExperience} />
          <input type="hidden" name="businessAddress" value={businessAddress} />
          <input type="hidden" name="nationalInsuranceNumber" value={nationalInsuranceNumber} />
          <input type="hidden" name="utrNumber" value={utrNumber} />
          <input type="hidden" name="hmrcStatus" value={hmrcStatus} />
          <input type="hidden" name="postcodePrefixes" value={selectedPostcodes.join(", ")} />
          {agreementAccepted && <input type="hidden" name="agreementAccepted" value="on" />}

          {/* ─── Step 1: Business details ─── */}
          <Card className="provider-form-card" style={{ display: step === 1 ? "flex" : "none" }}>
            <CardHeader>
              <CardTitle>{businessType === "sole_trader" ? "Provider details" : "Company details"}</CardTitle>
              <CardDescription>{businessType === "sole_trader" ? "Complete your sole trader onboarding profile with the core identity, contact, and tax details we need to review your application." : "Provide your registered company, signatory, and operational contact details in one place."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="provider-form-section space-y-3">
                <div>
                  <h3 className="provider-form-section-title">Business identity</h3>
                  <p className="provider-form-section-copy">Start with the business type, legal identity, and primary provider contact details.</p>
                </div>
                <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,0.92fr)_380px]">
                  <div className="provider-field-stack">
                    <Label>Profile image</Label>
                    <div className="rounded-2xl border bg-white p-4 text-center max-w-[260px]">
                      {profileImagePreviewUrl || profileImageUrl ? (
                        <img src={profileImagePreviewUrl || profileImageUrl} alt="Provider profile" className="mx-auto h-36 w-36 rounded-3xl object-cover" />
                      ) : (
                        <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-3xl bg-slate-100 text-sm text-muted-foreground">
                          No image
                        </div>
                      )}
                      <div className="mt-3 flex justify-center">
                        <label htmlFor="profileImageFile" className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-medium text-white transition-colors hover:bg-blue-700">
                          Upload image
                        </label>
                        <input
                          id="profileImageFile"
                          name="profileImageFile"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            setSelectedProfileImageName(file.name);
                            setUploadError("");
                            const objectUrl = URL.createObjectURL(file);
                            setProfileImagePreviewUrl(objectUrl);
                          }}
                        />
                      </div>
                      {selectedProfileImageName ? <p className="provider-field-help" style={{ textAlign: "center", marginTop: "0.5rem", overflowWrap: "anywhere" }}>{selectedProfileImageName}</p> : null}
                      <p className="provider-field-help" style={{ textAlign: "center", marginTop: "0.5rem" }}>Image or logo, up to 16MB.</p>
                      {uploadError ? <p className="text-xs text-red-600" style={{ marginTop: "0.4rem" }}>{uploadError}</p> : null}
                    </div>
                  </div>
                  <div className="space-y-4 min-w-0">
                    <div className="provider-field-stack">
                      <Label htmlFor="profileImageType">Image type</Label>
                      <select id="profileImageType" value={profileImageType} onChange={(event) => setProfileImageType(event.target.value)} disabled={!canEdit} className={onboardingSelectClass}>
                        <option value="logo">Company logo</option>
                        <option value="person">Personal photo</option>
                      </select>
                    </div>
                    <div className="provider-field-stack">
                      <Label htmlFor="headline">Headline</Label>
                      <Input id="headline" className={onboardingInputClass} value={headline} onChange={(event) => setHeadline(event.target.value)} disabled={!canEdit} placeholder="e.g. End of tenancy cleaning specialist" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="provider-field-stack">
                        <Label htmlFor="yearsExperience">Years of experience</Label>
                        <Input id="yearsExperience" type="number" min="0" className={onboardingInputClass} value={yearsExperience} onChange={(event) => setYearsExperience(event.target.value)} disabled={!canEdit} placeholder="e.g. 5" />
                      </div>
                    </div>
                    <div className="provider-field-stack">
                      <Label htmlFor="bio">Short description</Label>
                      <textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} disabled={!canEdit} rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Describe the kind of work you do, what customers can expect, and what you are best known for." />
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-white p-5 min-w-0">
                    <div className="mb-3">
                      <strong style={{ display: "block", fontSize: "1rem" }}>Live preview</strong>
                      <p className="provider-field-help">This is how customers can see your shortlist card while comparing providers.</p>
                    </div>
                    <ProviderPublicProfileCard
                      profile={{
                        providerName: tradingName || legalName || "Your provider profile",
                        profileImageUrl: profileImagePreviewUrl || profileImageUrl,
                        headline,
                        bio,
                        yearsExperience: yearsExperience ? Number(yearsExperience) : null,
                        hasDbs: false,
                        hasInsurance: false,
                      }}
                    />
                  </div>
                </div>
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
              <div className="provider-form-section">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="provider-field-stack">
                  <Label htmlFor="legalName">{businessType === "sole_trader" ? "Full legal name" : "Legal company name"} <span className="text-red-500">*</span></Label>
                  <Input id="legalName" name="legalName" className={onboardingInputClass} value={legalName} onChange={(event) => setLegalName(event.target.value)} required disabled={!canEdit} placeholder={businessType === "sole_trader" ? "e.g. Jane Smith" : "e.g. ABC Cleaning Ltd"} />
                  <p className="provider-field-help">This should match the name used for verification and payout setup.</p>
                </div>
                <div className="provider-field-stack">
                  <Label htmlFor="tradingName">Trading name</Label>
                  <Input id="tradingName" name="tradingName" className={onboardingInputClass} value={tradingName} onChange={(event) => setTradingName(event.target.value)} disabled={!canEdit} placeholder="Leave blank if same as legal name" />
                  <p className="provider-field-help">Only add a trading name if customers know you by a different brand.</p>
                </div>
              </div>
              <div className={`grid gap-4 ${businessType === "sole_trader" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
                {businessType === "company" && (
                  <div className="provider-field-stack">
                    <Label htmlFor="companyNumber">Company number <span className="text-red-500">*</span></Label>
                    <Input id="companyNumber" name="companyNumber" className={onboardingInputClass} value={companyNumber} onChange={(event) => setCompanyNumber(event.target.value)} required disabled={!canEdit} placeholder="e.g. 12345678" />
                    <p className="provider-field-help">Used to verify registered companies.</p>
                  </div>
                )}
                <div className="provider-field-stack">
                  <Label htmlFor="contactEmail">Email <span className="text-red-500">*</span></Label>
                  <input type="hidden" name="contactEmail" value={contactEmail} />
                  <Input id="contactEmail" type="email" className={onboardingInputClass} value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} required readOnly disabled={!canEdit} />
                  <p className="provider-field-help">We use this for verification, booking updates, and payout-related contact.</p>
                </div>
                <div className="provider-field-stack">
                  <PhoneField
                    id="phone"
                    name="phone"
                    label="Phone"
                    countryCode={phoneCountryCode}
                    localNumber={phoneLocalNumber}
                    onCountryCodeChange={setPhoneCountryCode}
                    onLocalNumberChange={setPhoneLocalNumber}
                    disabled={!canEdit}
                    required
                  />
                  <p className="provider-field-help">This should be the main number we can use for urgent booking contact.</p>
                </div>
              </div>
              </div>
              {businessType === "sole_trader" ? (
                <div className="provider-form-section grid gap-4 sm:grid-cols-2">
                  <div className="provider-field-stack">
                    <Label htmlFor="dateOfBirth">Date of birth <span className="text-red-500">*</span></Label>
                    <Input id="dateOfBirth" type="text" inputMode="numeric" className={onboardingInputClass} value={dateOfBirth} onChange={(event) => setDateOfBirth(normaliseDateInput(event.target.value))} disabled={!canEdit} placeholder="DD/MM/YYYY" />
                    <p className="provider-field-help">Type naturally and we will format it for you.</p>
                  </div>
                  <div className="provider-field-stack">
                    <Label htmlFor="nationality">Nationality <span className="text-red-500">*</span></Label>
                    <select id="nationality" value={nationality} onChange={(event) => setNationality(event.target.value)} disabled={!canEdit} className={onboardingSelectClass}>
                      <option value="">Select nationality</option>
                      {nationalityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <p className="provider-field-help">If your nationality is not listed, choose Other and we can confirm later during review.</p>
                  </div>
                  <div className="provider-field-stack sm:col-span-2">
                    <Label htmlFor="rightToWorkStatus">Right to work in the UK <span className="text-red-500">*</span></Label>
                    <select id="rightToWorkStatus" value={rightToWorkStatus} onChange={(event) => setRightToWorkStatus(event.target.value)} disabled={!canEdit} className={onboardingSelectClass}>
                      <option value="">Select your status</option>
                      {rightToWorkOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <p className="provider-field-help">We use this to confirm whether you can legally take self-employed work in the UK.</p>
                  </div>
                </div>
              ) : (
                <div className="provider-form-section grid gap-4 sm:grid-cols-3">
                  <div className="provider-field-stack">
                    <Label htmlFor="companyCountry">Country of incorporation</Label>
                    <select id="companyCountry" value={companyCountry} onChange={(event) => setCompanyCountry(event.target.value)} disabled={!canEdit} className={onboardingSelectClass}>
                      {companyCountryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="provider-field-stack">
                    <Label htmlFor="companyIncorporationDate">Date of incorporation</Label>
                    <Input id="companyIncorporationDate" type="text" inputMode="numeric" className={onboardingInputClass} value={companyIncorporationDate} onChange={(event) => setCompanyIncorporationDate(normaliseDateInput(event.target.value))} disabled={!canEdit} placeholder="DD/MM/YYYY" />
                  </div>
                  <div className="provider-field-stack">
                    <Label htmlFor="companyType">Company type</Label>
                    <select id="companyType" value={companyType} onChange={(event) => setCompanyType(event.target.value)} disabled={!canEdit} className={onboardingSelectClass}>
                      {companyTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div className="provider-form-section provider-field-stack">
                <Label htmlFor="registeredAddress">{businessType === "sole_trader" ? "Home address" : "Registered address"} <span className="text-red-500">*</span></Label>
                <Input id="registeredAddress" name="registeredAddress" className={onboardingInputClass} value={registeredAddress} onChange={(event) => setRegisteredAddress(event.target.value)} required disabled={!canEdit} placeholder={businessType === "sole_trader" ? "Home address" : "Full registered address"} />
                <p className="provider-field-help">Use the address tied to your company registration or sole trader identity checks.</p>
              </div>
              <div className="provider-form-section">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="provider-field-stack">
                  <Label htmlFor="vatNumber">VAT number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input id="vatNumber" name="vatNumber" className={onboardingInputClass} value={vatNumber} onChange={(event) => setVatNumber(event.target.value)} disabled={!canEdit} placeholder="e.g. GB123456789" />
                </div>
                <div className="provider-field-stack">
                  <Label htmlFor="website">Website <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input id="website" className={onboardingInputClass} value={website} onChange={(event) => setWebsite(event.target.value)} disabled={!canEdit} placeholder="https://example.com" />
                </div>
              </div>
              </div>
              {businessType === "sole_trader" ? (
                <>
                  <div className="provider-form-section">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="provider-field-stack">
                      <Label htmlFor="businessAddress">Business address</Label>
                      <Input id="businessAddress" className={onboardingInputClass} value={businessAddress} onChange={(event) => setBusinessAddress(event.target.value)} disabled={!canEdit} placeholder="If different from home address" />
                    </div>
                    <div className="provider-field-stack">
                      <Label htmlFor="nationalInsuranceNumber">National Insurance no.</Label>
                      <Input id="nationalInsuranceNumber" className={onboardingInputClass} value={nationalInsuranceNumber} onChange={(event) => setNationalInsuranceNumber(event.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="provider-field-stack">
                      <Label htmlFor="utrNumber">UTR</Label>
                      <Input id="utrNumber" className={onboardingInputClass} value={utrNumber} onChange={(event) => setUtrNumber(event.target.value)} disabled={!canEdit} />
                    </div>
                  </div>
                  <div className="provider-field-stack mt-4">
                    <Label htmlFor="hmrcStatus">HMRC self-employed status</Label>
                    <select id="hmrcStatus" value={hmrcStatus} onChange={(event) => setHmrcStatus(event.target.value)} disabled={!canEdit} className={onboardingSelectClass}>
                      <option value="">Select status</option>
                      {hmrcStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="provider-form-section">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="provider-field-stack">
                      <Label htmlFor="authorisedSignatoryName">Authorised signatory name <span className="text-red-500">*</span></Label>
                      <Input id="authorisedSignatoryName" className={onboardingInputClass} value={authorisedSignatoryName} onChange={(event) => setAuthorisedSignatoryName(event.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="provider-field-stack">
                      <Label htmlFor="authorisedSignatoryTitle">Authorised signatory title</Label>
                      <Input id="authorisedSignatoryTitle" className={onboardingInputClass} value={authorisedSignatoryTitle} onChange={(event) => setAuthorisedSignatoryTitle(event.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="provider-field-stack">
                      <Label htmlFor="authorisedSignatoryEmail">Authorised signatory email <span className="text-red-500">*</span></Label>
                      <Input id="authorisedSignatoryEmail" type="email" className={onboardingInputClass} value={authorisedSignatoryEmail} onChange={(event) => setAuthorisedSignatoryEmail(event.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="provider-field-stack">
                      <PhoneField
                        id="authorisedSignatoryPhone"
                        name="authorisedSignatoryPhone"
                        label="Authorised signatory phone"
                        countryCode={authorisedSignatoryPhoneCountryCode}
                        localNumber={authorisedSignatoryPhoneLocalNumber}
                        onCountryCodeChange={setAuthorisedSignatoryPhoneCountryCode}
                        onLocalNumberChange={setAuthorisedSignatoryPhoneLocalNumber}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                  </div>
                  <div className="provider-form-section">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="provider-field-stack">
                      <Label htmlFor="authorisedSignatoryAuthority">Authority basis</Label>
                      <select id="authorisedSignatoryAuthority" value={authorisedSignatoryAuthority} onChange={(event) => setAuthorisedSignatoryAuthority(event.target.value)} disabled={!canEdit} className={onboardingSelectClass}>
                        <option value="">Select authority</option>
                        {authorityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <div className="provider-field-stack">
                      <Label htmlFor="operationsContactName">Operations contact</Label>
                      <Input id="operationsContactName" className={onboardingInputClass} value={operationsContactName} onChange={(event) => setOperationsContactName(event.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="provider-field-stack">
                      <Label htmlFor="operationsContactEmail">Operations email</Label>
                      <Input id="operationsContactEmail" type="email" className={onboardingInputClass} value={operationsContactEmail} onChange={(event) => setOperationsContactEmail(event.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="provider-field-stack">
                      <PhoneField
                        id="operationsContactPhone"
                        name="operationsContactPhone"
                        label="Operations phone"
                        countryCode={operationsContactPhoneCountryCode}
                        localNumber={operationsContactPhoneLocalNumber}
                        onCountryCodeChange={setOperationsContactPhoneCountryCode}
                        onLocalNumberChange={setOperationsContactPhoneLocalNumber}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="provider-field-stack">
                      <Label htmlFor="workerCount">Workers / cleaners available</Label>
                      <select id="workerCount" value={workerCount} onChange={(event) => setWorkerCount(event.target.value)} disabled={!canEdit} className={onboardingSelectClass}>
                        <option value="">Select range</option>
                        {workerCountOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
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

              {!lockedCategory && (
                <div className="space-y-3">
                  <Label>Service categories <span className="text-red-500">*</span></Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {providerServiceCatalog.map((category) => {
                      const isSelected = selectedCategories.includes(category.key);
                      return (
                        <button
                          key={category.key}
                          type="button"
                          onClick={() => canEdit && setSelectedCategories(toggleValue(selectedCategories, category.key))}
                          disabled={!canEdit}
                          className={`rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                            isSelected
                              ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100"
                              : "border-border bg-background text-foreground hover:border-blue-200 hover:bg-muted/50"
                          } ${!canEdit ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                        >
                          <div className="font-medium">{category.label}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{category.services.length} services available</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Services <span className="text-red-500">*</span></Label>
                <div className="space-y-2">
                  {availableServices.map((service) => {
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
                  {!availableServices.length && (
                    <p className="text-sm text-muted-foreground">No services found for this category.</p>
                  )}
                </div>
                {!selectedServices.length && (
                  <p className="text-xs text-red-600">Select at least one service to continue.</p>
                )}
              </div>
              {selectedCategories.map((categoryKey) => (
                <input key={categoryKey} type="hidden" name="categories" value={categoryKey} />
              ))}
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
                    <div className="space-y-3">
                      {groupedAvailablePostcodes.map((group) => (
                        <div key={group.areaKey} className="rounded-lg border p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.areaName}</div>
                            <Badge variant="outline" className="text-[10px]">{group.prefixes.length}</Badge>
                          </div>
                          <ChipSelector
                            options={group.prefixes}
                            selected={selectedPostcodes}
                            disabled={!canEdit}
                            taken={takenPostcodesSet}
                            competitors={competitorPostcodes}
                            onToggle={(value) => setSelectedPostcodes(toggleValue(selectedPostcodes, value))}
                          />
                        </div>
                      ))}
                    </div>
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
              <CardDescription>Upload the documents that apply to your business type and accept the provider agreement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {businessType === "sole_trader" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                  DBS is optional for sole traders. However, providers with a DBS may be prioritised for some jobs where another applicant has stronger trust credentials.
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {providerDocuments.map((document) => {
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
                            {document.requiredFor.includes(businessType) && <span className="text-red-500"> *</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{document.helperText} {providerDocumentAcceptedFormatsLabel}</p>
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
                <div className="rounded-lg border bg-background p-4 space-y-3">
                  <p className="text-sm font-medium">Read the full agreement before accepting</p>
                  <p className="text-xs text-muted-foreground">
                    Open the full agreement in a dedicated page, or download a copy before accepting.
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
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                    The full agreement opens in its own page so you can read, print, or download it without leaving the onboarding flow open in the background.
                  </div>
                </div>
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
                <button
                  type="submit"
                  name="nextStep"
                  value={String(step + 1)}
                  disabled={
                    (step === 1 && !profileComplete) ||
                    (step === 2 && !servicesComplete) ||
                    (step === 3 && !coverageComplete)
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Continue
                  <ChevronRight className="size-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  formAction={continueAction}
                  disabled={!canEdit || Boolean(uploadError) || Object.keys(uploadFieldErrors).length > 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent px-3 h-9 text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Review and submit
                </button>
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
