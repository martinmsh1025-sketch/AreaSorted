import { getPrisma } from "@/lib/db";

export type ProviderMatchResult =
  | { status: "matched"; providerCompanyId: string; providerName: string; postcodePrefix: string; paymentReady: boolean }
  | { status: "no_coverage" }
  | { status: "manual_review"; reason: string }
  | { status: "invalid_input"; reason: string };

function getPostcodePrefix(postcode: string) {
  return postcode.trim().toUpperCase().split(" ")[0] || "";
}

export async function matchProviderForPublicQuote(input: { postcode: string; categoryKey: string }): Promise<ProviderMatchResult> {
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
      },
    },
    include: {
      providerCompany: {
        include: {
          stripeConnectedAccount: true,
        },
      },
    },
  });

  if (!coverageRows.length) {
    return { status: "no_coverage" };
  }

  if (coverageRows.length > 1) {
    console.error("[provider-match] multiple active providers matched", { postcodePrefix, categoryKey: input.categoryKey, providerIds: coverageRows.map((row) => row.providerCompanyId) });
    return { status: "manual_review", reason: "multiple_providers_matched" };
  }

  const matched = coverageRows[0].providerCompany;
  const paymentReady = Boolean(matched.stripeConnectedAccount?.chargesEnabled && matched.stripeConnectedAccount?.payoutsEnabled);

  return {
    status: "matched",
    providerCompanyId: matched.id,
    providerName: matched.tradingName || matched.legalName || matched.contactEmail,
    postcodePrefix,
    paymentReady,
  };
}
