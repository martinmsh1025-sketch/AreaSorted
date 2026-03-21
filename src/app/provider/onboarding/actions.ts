"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireProviderOnboardingAccess } from "@/lib/provider-auth";
import { canProviderEditOnboarding } from "@/lib/providers/status";
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

async function persistProviderOnboarding(sessionProviderCompanyId: string, formData: FormData) {
  await updateProviderCompanyProfile({
    providerCompanyId: sessionProviderCompanyId,
    legalName: String(formData.get("legalName") || "").trim(),
    tradingName: String(formData.get("tradingName") || "").trim(),
    companyNumber: String(formData.get("companyNumber") || "").trim(),
    registeredAddress: String(formData.get("registeredAddress") || "").trim(),
    contactEmail: String(formData.get("contactEmail") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    vatNumber: String(formData.get("vatNumber") || "").trim(),
    insuranceExpiry: formData.get("insuranceExpiry") ? new Date(String(formData.get("insuranceExpiry"))) : null,
    complianceNotes: String(formData.get("complianceNotes") || "").trim(),
    categories: parseMultiValues(formData, "categories"),
    serviceKeys: parseServiceKeys(formData),
    postcodePrefixes: parseMultiValue(formData.get("postcodePrefixes")),
  });

  await saveProviderDocumentUploads(sessionProviderCompanyId, formData);

  if (formData.get("agreementAccepted") === "on") {
    await markProviderAgreementSigned(sessionProviderCompanyId);
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
