"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireProviderOnboardingAccess } from "@/lib/provider-auth";
import { canProviderEditOnboarding } from "@/lib/providers/status";
import { getProviderAgreementVersion } from "@/lib/providers/onboarding-profile";
import { markProviderAgreementSigned, submitProviderForReview, updateProviderCompanyProfile } from "@/lib/providers/repository";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { saveProviderDocumentUploads } from "@/server/services/providers/documents";

function parseMultiValue(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMultiValues(formData: FormData, name: string) {
  const values = formData
    .getAll(name)
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  if (values.length) {
    return Array.from(new Set(values));
  }

  return Array.from(new Set(parseMultiValue(formData.get(name))));
}

function parseServiceKeys(formData: FormData) {
  return Array.from(new Set(formData
    .getAll("serviceKeys")
    .map((item) => String(item || "").trim())
    .filter(Boolean)));
}

function getOnboardingErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.map((item) => String(item)) : [];

    if (target.includes("companyNumber")) {
      return "Company number is already used by another provider account.";
    }

    if (target.includes("contactEmail") || target.includes("email")) {
      return "Email is already used by another provider account.";
    }

    if (target.includes("phone")) {
      return "Phone number is already used by another provider account.";
    }

    if (target.includes("postcodePrefix") || target.includes("categoryKey")) {
      return "A duplicate postcode entry was detected for your account. Please try again.";
    }

    return "This provider record conflicts with an existing account.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while saving your onboarding details.";
}

function getOnboardingErrorStep(error: unknown, fallbackStep: number) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.map((item) => String(item)) : [];

    if (target.includes("companyNumber") || target.includes("contactEmail") || target.includes("email")) {
      return 1;
    }

    if (target.includes("postcodePrefix") || target.includes("categoryKey")) {
      return 3;
    }
  }

  if (error instanceof Error) {
    if (/company number|email is already used|phone number is already used/i.test(error.message)) {
      return 1;
    }

    if (/upload|file|document|30mb|pdf|jpg|png/i.test(error.message)) {
      return 4;
    }
  }

  return fallbackStep;
}

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

function validateProviderOnboardingForm(formData: FormData, currentStep: number) {
  const businessType = String(formData.get("businessType") || "company") === "sole_trader" ? "sole_trader" : "company";
  const legalName = String(formData.get("legalName") || "").trim();
  const companyNumber = String(formData.get("companyNumber") || "").trim();
  const registeredAddress = String(formData.get("registeredAddress") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const authorisedSignatoryName = String(formData.get("authorisedSignatoryName") || "").trim();
  const authorisedSignatoryEmail = String(formData.get("authorisedSignatoryEmail") || "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") || "").trim();
  const nationality = String(formData.get("nationality") || "").trim();
  const categories = parseMultiValues(formData, "categories");
  const serviceKeys = parseServiceKeys(formData);
  const postcodePrefixes = parseMultiValue(formData.get("postcodePrefixes"));

  if (currentStep >= 1) {
    if (!legalName) throw new Error(businessType === "sole_trader" ? "Full legal name is required." : "Company name is required.");
    if (businessType === "company" && !companyNumber) throw new Error("Company number is required.");
    if (!registeredAddress) throw new Error("Registered address is required.");
    if (!contactEmail || !isValidEmail(contactEmail)) throw new Error("A valid email address is required.");
    if (!phone) throw new Error("Phone number is required.");
    if (businessType === "sole_trader") {
      if (!dateOfBirth) throw new Error("Date of birth is required for sole traders.");
      if (!nationality) throw new Error("Nationality is required for sole traders.");
    } else {
      if (!authorisedSignatoryName) throw new Error("Authorised signatory name is required.");
      if (!authorisedSignatoryEmail || !isValidEmail(authorisedSignatoryEmail)) throw new Error("A valid authorised signatory email is required.");
    }
  }

  if (currentStep >= 2) {
    if (!categories.length) throw new Error("Choose at least one service category.");
    if (!serviceKeys.length) throw new Error("Choose at least one approved service.");
  }

  if (currentStep >= 3) {
    if (!postcodePrefixes.length) throw new Error("Choose at least one coverage postcode.");
  }

  if (currentStep >= 4 && formData.get("agreementAccepted") !== "on") {
    throw new Error("You must accept the provider agreement before continuing.");
  }
}

async function persistProviderOnboarding(sessionProviderCompanyId: string, formData: FormData) {
  const businessType = String(formData.get("businessType") || "company") === "sole_trader" ? "sole_trader" : "company";

  await updateProviderCompanyProfile({
    providerCompanyId: sessionProviderCompanyId,
    businessType,
    legalName: String(formData.get("legalName") || "").trim(),
    tradingName: String(formData.get("tradingName") || "").trim(),
    companyNumber: String(formData.get("companyNumber") || "").trim(),
    registeredAddress: String(formData.get("registeredAddress") || "").trim(),
    contactEmail: String(formData.get("contactEmail") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    vatNumber: String(formData.get("vatNumber") || "").trim(),
    onboardingMetadata: {
      businessType,
      companyCountry: String(formData.get("companyCountry") || "").trim(),
      companyIncorporationDate: String(formData.get("companyIncorporationDate") || "").trim(),
      companyType: String(formData.get("companyType") || "").trim(),
      website: String(formData.get("website") || "").trim(),
      authorisedSignatoryName: String(formData.get("authorisedSignatoryName") || "").trim(),
      authorisedSignatoryTitle: String(formData.get("authorisedSignatoryTitle") || "").trim(),
      authorisedSignatoryEmail: String(formData.get("authorisedSignatoryEmail") || "").trim(),
      authorisedSignatoryPhone: String(formData.get("authorisedSignatoryPhone") || "").trim(),
      authorisedSignatoryAuthority: String(formData.get("authorisedSignatoryAuthority") || "").trim(),
      operationsContactName: String(formData.get("operationsContactName") || "").trim(),
      operationsContactRole: String(formData.get("operationsContactRole") || "").trim(),
      operationsContactPhone: String(formData.get("operationsContactPhone") || "").trim(),
      operationsContactEmail: String(formData.get("operationsContactEmail") || "").trim(),
      emergencyContactName: String(formData.get("emergencyContactName") || "").trim(),
      emergencyContactRole: String(formData.get("emergencyContactRole") || "").trim(),
      emergencyContactPhone: String(formData.get("emergencyContactPhone") || "").trim(),
      emergencyContactEmail: String(formData.get("emergencyContactEmail") || "").trim(),
      workerCount: String(formData.get("workerCount") || "").trim(),
      dateOfBirth: String(formData.get("dateOfBirth") || "").trim(),
      nationality: String(formData.get("nationality") || "").trim(),
      businessAddress: String(formData.get("businessAddress") || "").trim(),
      nationalInsuranceNumber: String(formData.get("nationalInsuranceNumber") || "").trim(),
      utrNumber: String(formData.get("utrNumber") || "").trim(),
      hmrcStatus: String(formData.get("hmrcStatus") || "").trim(),
    },
    insuranceExpiry: formData.get("insuranceExpiry") ? new Date(String(formData.get("insuranceExpiry"))) : null,
    complianceNotes: String(formData.get("complianceNotes") || "").trim(),
    categories: parseMultiValues(formData, "categories"),
    serviceKeys: parseServiceKeys(formData),
    postcodePrefixes: parseMultiValue(formData.get("postcodePrefixes")),
  });

  await saveProviderDocumentUploads(sessionProviderCompanyId, formData);

  if (formData.get("agreementAccepted") === "on") {
    await markProviderAgreementSigned(sessionProviderCompanyId, getProviderAgreementVersion(businessType));
  }
}

function getSubmissionBlockingLabels(checklist: ReturnType<typeof buildProviderChecklist>) {
  const blockingKeys = ["profile", "categories", "coverage", "documents_uploaded", "agreement"];
  return checklist.items.filter((item) => blockingKeys.includes(item.key) && !item.complete).map((item) => item.label);
}

export async function saveProviderProfileAction(formData: FormData) {
  const session = await requireProviderOnboardingAccess();
  const currentStep = Math.min(4, Math.max(1, Number.parseInt(String(formData.get("currentStep") || "1"), 10) || 1));
  if (!canProviderEditOnboarding(session.providerCompany.status)) {
    redirect("/provider/onboarding?error=review_locked");
  }

  try {
    validateProviderOnboardingForm(formData, currentStep === 4 ? 3 : currentStep);
    await persistProviderOnboarding(session.providerCompany.id, formData);
  } catch (error) {
    redirect(`/provider/onboarding?error=${encodeURIComponent(getOnboardingErrorMessage(error))}&step=${getOnboardingErrorStep(error, currentStep)}`);
  }

  const nextStatus = currentStep === 4 ? "documents_saved" : "saved";
  redirect(`/provider/onboarding?status=${nextStatus}&step=${currentStep}`);
}

export async function continueProviderSubmissionAction(formData: FormData) {
  const session = await requireProviderOnboardingAccess();
  if (!canProviderEditOnboarding(session.providerCompany.status)) {
    redirect("/provider/onboarding?error=review_locked");
  }

  try {
    validateProviderOnboardingForm(formData, 4);
    await persistProviderOnboarding(session.providerCompany.id, formData);
  } catch (error) {
    redirect(`/provider/onboarding?error=${encodeURIComponent(getOnboardingErrorMessage(error))}&step=${getOnboardingErrorStep(error, 4)}`);
  }

  redirect("/provider/application-confirmation");
}

export async function submitProviderForReviewAction() {
  const session = await requireProviderOnboardingAccess();
  if (!canProviderEditOnboarding(session.providerCompany.status)) {
    redirect("/provider/onboarding?error=review_locked");
  }

  const refreshedSession = await requireProviderOnboardingAccess();
  const checklist = buildProviderChecklist(refreshedSession.providerCompany);
  const reviewBlockingKeys = ["email_verified", "password_set", "profile", "categories", "coverage", "documents_uploaded", "agreement"];

  const missing = checklist.items.filter((item) => reviewBlockingKeys.includes(item.key) && !item.complete).map((item) => item.label);
  if (missing.length) {
    redirect(`/provider/application-confirmation?error=${encodeURIComponent(missing.join(", "))}`);
  }

  await submitProviderForReview(session.providerCompany.id);
  redirect("/provider/application-status?status=submitted");
}
