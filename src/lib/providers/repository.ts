import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db";

function createInviteToken() {
  return randomUUID().replace(/-/g, "");
}

export async function createProviderInvite(input: { email: string; expiresInDays?: number }) {
  const prisma = getPrisma();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 14));

  return prisma.providerInvite.create({
    data: {
      email: input.email.toLowerCase(),
      token: createInviteToken(),
      expiresAt,
    },
  });
}

export async function getProviderInviteByToken(token: string) {
  const prisma = getPrisma();
  return prisma.providerInvite.findUnique({
    where: { token },
    include: {
      providerCompany: {
        include: {
          agreements: true,
          stripeConnectedAccount: true,
          pricingRules: true,
          coverageAreas: true,
          serviceCategories: true,
        },
      },
    },
  });
}

export async function listProviderCompanies() {
  const prisma = getPrisma();
  return prisma.providerCompany.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      stripeConnectedAccount: true,
      serviceCategories: true,
      coverageAreas: true,
      invites: true,
      agreements: true,
    },
  });
}

export async function getProviderCompanyById(id: string) {
  const prisma = getPrisma();
  return prisma.providerCompany.findUnique({
    where: { id },
    include: {
      stripeConnectedAccount: true,
      pricingRules: true,
      coverageAreas: true,
      serviceCategories: true,
      agreements: true,
      invites: true,
    },
  });
}

export async function updateProviderCompanyProfile(input: {
  providerCompanyId: string;
  legalName: string;
  tradingName?: string;
  companyNumber: string;
  registeredAddress: string;
  contactEmail: string;
  phone: string;
  vatNumber?: string;
  insuranceExpiry?: Date | null;
  complianceNotes?: string;
  categories: string[];
  postcodePrefixes: string[];
}) {
  const prisma = getPrisma();

  await prisma.providerCompany.update({
    where: { id: input.providerCompanyId },
    data: {
      legalName: input.legalName,
      tradingName: input.tradingName || null,
      companyNumber: input.companyNumber,
      registeredAddress: input.registeredAddress,
      contactEmail: input.contactEmail.toLowerCase(),
      phone: input.phone,
      vatNumber: input.vatNumber || null,
      insuranceExpiry: input.insuranceExpiry ?? null,
      complianceNotes: input.complianceNotes || null,
      status: "PROFILE_STARTED",
    },
  });

  await prisma.$transaction([
    prisma.providerServiceCategory.deleteMany({ where: { providerCompanyId: input.providerCompanyId } }),
    prisma.providerCoverageArea.deleteMany({ where: { providerCompanyId: input.providerCompanyId } }),
    ...input.categories.map((categoryKey) =>
      prisma.providerServiceCategory.create({
        data: { providerCompanyId: input.providerCompanyId, categoryKey },
      }),
    ),
    ...input.categories.flatMap((categoryKey) =>
      input.postcodePrefixes.map((postcodePrefix) =>
        prisma.providerCoverageArea.create({
          data: {
            providerCompanyId: input.providerCompanyId,
            postcodePrefix: postcodePrefix.toUpperCase(),
            categoryKey,
          },
        }),
      ),
    ),
  ]);
}

export async function setProviderCompanyStatus(providerCompanyId: string, status: "ACTIVE" | "SUSPENDED") {
  const prisma = getPrisma();
  return prisma.providerCompany.update({
    where: { id: providerCompanyId },
    data: {
      status,
      paymentReady: status === "ACTIVE" ? true : undefined,
    },
  });
}

export async function findProviderCompanyByEmail(email: string) {
  const prisma = getPrisma();
  return prisma.providerCompany.findFirst({
    where: { contactEmail: email.toLowerCase() },
    include: {
      stripeConnectedAccount: true,
      agreements: true,
    },
  });
}

export async function markProviderAgreementSigned(providerCompanyId: string, version = "v1") {
  const prisma = getPrisma();
  const existing = await prisma.providerAgreement.findFirst({
    where: { providerCompanyId, version },
  });

  if (existing) {
    return prisma.providerAgreement.update({
      where: { id: existing.id },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
      },
    });
  }

  return prisma.providerAgreement.create({
    data: {
      providerCompanyId,
      version,
      status: "SIGNED",
      signedAt: new Date(),
    },
  });
}

export async function setProviderCoverageAndCategories(input: {
  providerCompanyId: string;
  categories: string[];
  postcodePrefixes: string[];
}) {
  const prisma = getPrisma();
  await prisma.$transaction([
    prisma.providerServiceCategory.deleteMany({ where: { providerCompanyId: input.providerCompanyId } }),
    prisma.providerCoverageArea.deleteMany({ where: { providerCompanyId: input.providerCompanyId } }),
    ...input.categories.map((categoryKey) =>
      prisma.providerServiceCategory.create({
        data: { providerCompanyId: input.providerCompanyId, categoryKey },
      }),
    ),
    ...input.postcodePrefixes.map((postcodePrefix) =>
      prisma.providerCoverageArea.create({
        data: {
          providerCompanyId: input.providerCompanyId,
          postcodePrefix: postcodePrefix.toUpperCase(),
          categoryKey: "ALL",
        },
      }),
    ),
  ]);
}
