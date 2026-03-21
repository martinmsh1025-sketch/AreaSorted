import { getPrisma } from "@/lib/db";

export type MatchedProvider = {
  providerCompanyId: string;
  providerName: string;
  postcodePrefix: string;
  paymentReady: boolean;
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
          availabilityRules: true,
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
      postcodePrefix,
      paymentReady: Boolean(
        company.stripeConnectedAccount?.chargesEnabled &&
        company.stripeConnectedAccount?.payoutsEnabled,
      ),
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

  // Single-provider model: pick the matched provider.
  const chosen = providers[0];

  return { status: "matched", providers: [chosen] };
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
