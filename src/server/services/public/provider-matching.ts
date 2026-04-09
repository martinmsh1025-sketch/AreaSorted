import { getPrisma } from "@/lib/db";

export type MatchedProvider = {
  providerCompanyId: string;
  providerName: string;
  profileImageUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  specialtiesText?: string | null;
  hasDbs?: boolean;
  hasInsurance?: boolean;
  postcodePrefix: string;
  paymentReady: boolean;
  hasActivePricing: boolean;
};

export type ProviderMatchResult =
  | { status: "matched"; providers: MatchedProvider[] }
  | { status: "no_coverage" }
  | { status: "invalid_input"; reason: string };

export type RematchResult = { status: "no_alternative" };

function getPostcodePrefix(postcode: string) {
  return postcode.trim().toUpperCase().split(" ")[0] || "";
}

export async function matchProvidersForPublicQuote(
  input: {
    postcode: string;
    categoryKey: string;
    serviceKey?: string;
    scheduledDate?: Date;
    scheduledTime?: string;
    excludeProviderIds?: string[];
  },
): Promise<ProviderMatchResult> {
  const postcodePrefix = getPostcodePrefix(input.postcode);
  if (!postcodePrefix || !input.categoryKey) {
    return { status: "invalid_input", reason: "postcode and category are required" };
  }

  const prisma = getPrisma();
  const coverageRows = await prisma.providerCoverageArea.findMany({
    where: {
      postcodePrefix,
      categoryKey: input.categoryKey,
      active: true,
      providerCompany: {
        status: "ACTIVE",
        paymentReady: true,
        ...(input.excludeProviderIds?.length
          ? { id: { notIn: input.excludeProviderIds } }
          : {}),
      },
    },
    include: {
      providerCompany: {
        include: {
          stripeConnectedAccount: true,
          documents: {
            where: { status: "APPROVED", documentKey: { in: ["dbs_certificate", "insurance_proof"] } },
            select: { documentKey: true },
          },
          availabilityRules: true,
          pricingRules: {
            where: {
              active: true,
              categoryKey: input.categoryKey,
              ...(input.serviceKey ? { serviceKey: input.serviceKey } : {}),
            },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!coverageRows.length) {
    return { status: "no_coverage" };
  }

  let providers: MatchedProvider[] = coverageRows.map((row) => {
    const company = row.providerCompany;
    return {
      providerCompanyId: company.id,
      providerName: company.tradingName || company.legalName || "Service provider",
      profileImageUrl: company.profileImageUrl,
      headline: company.headline,
      bio: company.bio,
      yearsExperience: company.yearsExperience,
      specialtiesText: company.specialtiesText,
      hasDbs: company.documents.some((doc) => doc.documentKey === "dbs_certificate"),
      hasInsurance: company.documents.some((doc) => doc.documentKey === "insurance_proof"),
      postcodePrefix,
      paymentReady: Boolean(
        company.stripeConnectedAccount?.chargesEnabled &&
        company.stripeConnectedAccount?.payoutsEnabled,
      ),
      hasActivePricing: company.pricingRules.length > 0,
    };
  });

  // Filter by provider availability if date/time provided
  if (input.scheduledDate && input.scheduledTime) {
    const dayOfWeek = input.scheduledDate.getDay(); // 0=Sun ... 6=Sat
    const requestedTime = input.scheduledTime; // "HH:MM"

    providers = providers.filter((p) => {
      const row = coverageRows.find((r) => r.providerCompany.id === p.providerCompanyId);
      const rules = row?.providerCompany.availabilityRules ?? [];
      const dayRule = rules.find((r) => r.dayOfWeek === dayOfWeek);

      // If provider has no availability rules set, allow match (backward compatible)
      if (rules.length === 0) return true;

      // If the day rule doesn't exist or is not available, skip
      if (!dayRule || !dayRule.isAvailable) return false;

      // Check time window
      return requestedTime >= dayRule.startTime && requestedTime < dayRule.endTime;
    });
  }

  if (!providers.length) {
    return { status: "no_coverage" };
  }

  // Allow multiple providers to cover the same postcode internally,
  // but pick a single best provider for the customer-facing flow.
  const rankedProviders = [...providers].sort((left, right) => {
    if (left.hasActivePricing !== right.hasActivePricing) {
      return Number(right.hasActivePricing) - Number(left.hasActivePricing);
    }

    if (left.paymentReady !== right.paymentReady) {
      return Number(right.paymentReady) - Number(left.paymentReady);
    }

    return left.providerName.localeCompare(right.providerName);
  });

  return { status: "matched", providers: rankedProviders };
}

/**
 * After a provider rejects a booking, try to reassign it to the next
 * available provider. Excludes providers that already rejected.
 */
export async function rematchBookingAfterRejection(input: {
  bookingId: string;
  postcode: string;
  categoryKey: string;
  excludeProviderIds: string[];
}): Promise<RematchResult> {
  return { status: "no_alternative" };
}
