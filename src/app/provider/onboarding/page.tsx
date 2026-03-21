import { redirect } from "next/navigation";
import { requireProviderOnboardingAccess } from "@/lib/provider-auth";
import type { JsonValue } from "@prisma/client/runtime/library";
import { canProviderEditOnboarding, providerReviewVisibleStatuses } from "@/lib/providers/status";
import { getProviderCategoryByKey } from "@/lib/providers/service-catalog-mapping";
import { continueProviderSubmissionAction, saveProviderProfileAction, submitProviderForReviewAction } from "./actions";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { ProviderOnboardingClient } from "./client";
import { getPrisma } from "@/lib/db";
import { getProviderOnboardingMetadata } from "@/lib/providers/onboarding-profile";

type ProviderOnboardingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderOnboardingPage({ searchParams }: ProviderOnboardingPageProps) {
  const session = await requireProviderOnboardingAccess();
  const provider = {
    ...session.providerCompany,
    contactEmail: session.providerCompany.contactEmail || session.user.email || session.latestInvite?.email || "",
  };
  if (!canProviderEditOnboarding(provider.status) && providerReviewVisibleStatuses.has(provider.status)) {
    redirect("/provider/application-status");
  }
  const params = (await searchParams) ?? {};
  const status = typeof params.status === "string" ? params.status : "";
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : "";
  const currentStep = Number.parseInt(typeof params.step === "string" ? params.step : "1", 10);
  const lockedCategoryKey = session.latestInvite?.approvedCategoryKey || provider.serviceCategories[0]?.categoryKey || null;
  const lockedCategory = getProviderCategoryByKey(lockedCategoryKey || "");
  const inviteServiceKeys = Array.isArray(session.latestInvite?.approvedServiceKeysJson) ? session.latestInvite?.approvedServiceKeysJson.map((item) => String(item)) : [];
  const onboardingMetadata = getProviderOnboardingMetadata(provider.stripeRequirementsJson);
  const savedServiceKeys = provider.stripeRequirementsJson && typeof provider.stripeRequirementsJson === "object" && !Array.isArray(provider.stripeRequirementsJson) && Array.isArray((provider.stripeRequirementsJson as { approvedServiceKeys?: JsonValue }).approvedServiceKeys)
    ? ((provider.stripeRequirementsJson as { approvedServiceKeys: JsonValue[] }).approvedServiceKeys || []).map((item) => String(item)).filter(Boolean)
    : [];
  const filteredChecklist = buildProviderChecklist(provider).items.map((item) => {
    if (item.key === "profile") {
      return {
        ...item,
        complete: Boolean(
          provider.legalName?.trim() &&
          provider.registeredAddress?.trim() &&
          (provider.contactEmail?.trim() || session.user.email?.trim()) &&
          provider.phone?.trim() &&
          (onboardingMetadata.businessType === "sole_trader" || provider.companyNumber?.trim()),
        ),
      };
    }

    if (item.key === "categories") {
      return {
        ...item,
        complete: Boolean(lockedCategory?.key && savedServiceKeys.length > 0),
        detail: savedServiceKeys.length > 0 ? item.detail : "Choose at least one service and save",
      };
    }

    return item;
  });

  // Fetch postcodes that already have other providers for this category (informational, not blocking)
  const competitorPostcodes: Record<string, number> = {};
  if (lockedCategoryKey) {
    const prisma = getPrisma();
    const existing = await prisma.providerCoverageArea.groupBy({
      by: ["postcodePrefix"],
      where: {
        categoryKey: lockedCategoryKey,
        providerCompanyId: { not: provider.id },
        active: true,
      },
      _count: { postcodePrefix: true },
    });
    for (const row of existing) {
      competitorPostcodes[row.postcodePrefix] = row._count.postcodePrefix;
    }
  }

  return (
    <ProviderOnboardingClient
      provider={provider}
      inviteCategoryKey={lockedCategoryKey}
      inviteServiceKeys={inviteServiceKeys}
      onboardingMetadata={onboardingMetadata}
      checklist={filteredChecklist}
      canEdit={canProviderEditOnboarding(provider.status)}
      initialStep={Number.isFinite(currentStep) ? currentStep : 1}
      statusMessage={status === "documents_saved" ? "Documents saved." : status === "saved" ? "Saved." : status === "submitted" ? "Submitted for review." : ""}
      errorMessage={error}
      takenPostcodes={[]}
      competitorPostcodes={competitorPostcodes}
      saveAction={saveProviderProfileAction}
      continueAction={continueProviderSubmissionAction}
      submitAction={submitProviderForReviewAction}
    />
  );
}
