import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db";
import { createProviderNotification } from "@/lib/providers/notifications";

function createInviteToken() {
  return randomUUID().replace(/-/g, "");
}

export async function createProviderInvite(input: { email: string; approvedCategoryKey?: string | null; approvedServiceKeys?: string[]; expiresInDays?: number }) {
  const prisma = getPrisma();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 14));

  return prisma.providerInvite.create({
    data: {
      email: input.email.toLowerCase(),
      approvedCategoryKey: input.approvedCategoryKey || null,
      approvedServiceKeysJson: input.approvedServiceKeys?.length ? input.approvedServiceKeys : undefined,
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
          documents: true,
        },
      },
    },
  });
}

export async function updateProviderInviteApproval(input: {
  token: string;
  approvedCategoryKey?: string | null;
  approvedServiceKeys?: string[];
}) {
  const prisma = getPrisma();
  return prisma.providerInvite.update({
    where: { token: input.token },
    data: {
      approvedCategoryKey: input.approvedCategoryKey || null,
      approvedServiceKeysJson: input.approvedServiceKeys?.length ? input.approvedServiceKeys : undefined,
    },
  });
}

export async function getLatestProviderInviteForCompany(providerCompanyId: string) {
  const prisma = getPrisma();
  return prisma.providerInvite.findFirst({
    where: { providerCompanyId },
    orderBy: { createdAt: "desc" },
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
      documents: true,
      pricingRules: true,
      user: true,
    },
  });
}

export async function getProviderCompanyById(id: string) {
  const prisma = getPrisma();
  return prisma.providerCompany.findUnique({
    where: { id },
    include: {
      user: true,
      stripeConnectedAccount: true,
      pricingRules: true,
      coverageAreas: true,
      serviceCategories: true,
      agreements: true,
      invites: true,
      documents: true,
    },
  });
}

export async function findProviderCompanyByEmail(email: string) {
  const prisma = getPrisma();
  return prisma.providerCompany.findFirst({
    where: { contactEmail: email.toLowerCase() },
    include: {
      user: true,
      stripeConnectedAccount: true,
      agreements: true,
      documents: true,
      serviceCategories: true,
      coverageAreas: true,
      pricingRules: true,
    },
  });
}

export async function findProviderInviteByEmail(email: string) {
  const prisma = getPrisma();
  return prisma.providerInvite.findFirst({
    where: {
      email: email.toLowerCase(),
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: {
      providerCompany: true,
    },
  });
}

export async function updateProviderCompanyProfile(input: {
  providerCompanyId: string;
  businessType: "company" | "sole_trader";
  legalName: string;
  tradingName?: string;
  companyNumber?: string;
  registeredAddress: string;
  contactEmail: string;
  phone: string;
  vatNumber?: string;
  onboardingMetadata?: Record<string, unknown>;
  insuranceExpiry?: Date | null;
  complianceNotes?: string;
  categories: string[];
  serviceKeys: string[];
  postcodePrefixes: string[];
}) {
  const prisma = getPrisma();

  const existing = await prisma.providerCompany.findUnique({
    where: { id: input.providerCompanyId },
    select: { stripeRequirementsJson: true },
  });

  const existingJson =
    existing?.stripeRequirementsJson && typeof existing.stripeRequirementsJson === "object" && !Array.isArray(existing.stripeRequirementsJson)
      ? (existing.stripeRequirementsJson as Record<string, unknown>)
      : {};

  const nextStripeRequirementsJson = {
    ...existingJson,
    businessType: input.businessType,
    ...(input.onboardingMetadata || {}),
    ...(input.serviceKeys.length ? { approvedServiceKeys: input.serviceKeys } : {}),
  };

  await prisma.providerCompany.update({
    where: { id: input.providerCompanyId },
    data: {
      legalName: input.legalName || null,
      tradingName: input.tradingName || null,
      companyNumber: input.businessType === "sole_trader" ? null : input.companyNumber || null,
      registeredAddress: input.registeredAddress || null,
      contactEmail: input.contactEmail.toLowerCase(),
      phone: input.phone || null,
      vatNumber: input.vatNumber || null,
      insuranceExpiry: input.insuranceExpiry ?? null,
      complianceNotes: input.complianceNotes || null,
      status: "ONBOARDING_IN_PROGRESS",
      changesRequestedAt: null,
      rejectedAt: null,
      stripeRequirementsJson: nextStripeRequirementsJson,
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

export async function ensureProviderAgreementDraft(providerCompanyId: string, version = "v1") {
  const prisma = getPrisma();
  const existing = await prisma.providerAgreement.findFirst({
    where: { providerCompanyId, version },
  });

  if (existing) return existing;

  return prisma.providerAgreement.create({
    data: {
      providerCompanyId,
      version,
      status: "DRAFT",
    },
  });
}

export async function saveProviderDocuments(input: {
  providerCompanyId: string;
  documents: Array<{
    documentKey: string;
    label: string;
    fileName: string;
    storedFileName: string;
    storagePath: string;
    mimeType?: string | null;
    sizeBytes?: number | null;
  }>;
}) {
  const prisma = getPrisma();

  await Promise.all(
    input.documents.map((document) =>
      prisma.providerOnboardingDocument.upsert({
        where: {
          providerCompanyId_documentKey: {
            providerCompanyId: input.providerCompanyId,
            documentKey: document.documentKey,
          },
        },
        update: {
          label: document.label,
          fileName: document.fileName,
          storedFileName: document.storedFileName,
          storagePath: document.storagePath,
          mimeType: document.mimeType || null,
          sizeBytes: document.sizeBytes || null,
          status: "PENDING",
          reviewNotes: null,
          uploadedAt: new Date(),
        },
        create: {
          providerCompanyId: input.providerCompanyId,
          documentKey: document.documentKey,
          label: document.label,
          fileName: document.fileName,
          storedFileName: document.storedFileName,
          storagePath: document.storagePath,
          mimeType: document.mimeType || null,
          sizeBytes: document.sizeBytes || null,
          status: "PENDING",
        },
      }),
    ),
  );
}

export async function updateProviderReview(input: {
  providerCompanyId: string;
  status: "UNDER_REVIEW" | "CHANGES_REQUESTED" | "REJECTED" | "APPROVED";
  reviewNotes?: string;
}) {
  const prisma = getPrisma();
  const result = await prisma.providerCompany.update({
    where: { id: input.providerCompanyId },
    data: {
      status: input.status,
      reviewNotes: input.reviewNotes || null,
      reviewStartedAt: input.status === "UNDER_REVIEW" ? new Date() : undefined,
      changesRequestedAt: input.status === "CHANGES_REQUESTED" ? new Date() : undefined,
      rejectedAt: input.status === "REJECTED" ? new Date() : undefined,
      approvedAt: input.status === "APPROVED" ? new Date() : input.status === "REJECTED" || input.status === "CHANGES_REQUESTED" || input.status === "UNDER_REVIEW" ? null : undefined,
      paymentReady: input.status === "APPROVED" ? false : input.status === "REJECTED" || input.status === "CHANGES_REQUESTED" ? false : undefined,
    },
  });

  // Notify provider about review outcome
  try {
    const notifMap: Record<string, { title: string; message: string }> = {
      APPROVED: {
        title: "Application approved!",
        message: "Your application has been approved. Please complete the remaining setup steps to start receiving bookings.",
      },
      REJECTED: {
        title: "Application not approved",
        message: input.reviewNotes
          ? `Your application was not approved. Reason: ${input.reviewNotes}`
          : "Your application was not approved. Please contact support for details.",
      },
      CHANGES_REQUESTED: {
        title: "Changes requested on your application",
        message: input.reviewNotes
          ? `The review team has requested changes: ${input.reviewNotes}`
          : "The review team has requested changes to your application. Please check and resubmit.",
      },
      UNDER_REVIEW: {
        title: "Application under review",
        message: "Your application is now being reviewed. We'll notify you once a decision is made.",
      },
    };
    const notif = notifMap[input.status];
    if (notif) {
      await createProviderNotification({
        providerCompanyId: input.providerCompanyId,
        type: "PROFILE_UPDATE",
        title: notif.title,
        message: notif.message,
        link: "/provider/application-status",
      });
    }
  } catch {
    // Non-critical
  }

  return result;
}

export async function updateProviderDocumentReview(input: {
  documentId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_RESUBMISSION";
  reviewNotes?: string;
}) {
  const prisma = getPrisma();
  return prisma.providerOnboardingDocument.update({
    where: { id: input.documentId },
    data: {
      status: input.status,
      reviewNotes: input.reviewNotes || null,
      reviewedAt: new Date(),
    },
  });
}

export async function setProviderEmailVerified(providerCompanyId: string) {
  const prisma = getPrisma();
  return prisma.providerCompany.update({
    where: { id: providerCompanyId },
    data: {
      emailVerifiedAt: new Date(),
      status: "PASSWORD_SETUP_PENDING",
    },
  });
}

export async function setProviderPasswordSet(providerCompanyId: string) {
  const prisma = getPrisma();
  return prisma.providerCompany.update({
    where: { id: providerCompanyId },
    data: {
      passwordSetAt: new Date(),
      status: "ONBOARDING_IN_PROGRESS",
    },
  });
}

export async function submitProviderForReview(providerCompanyId: string) {
  const prisma = getPrisma();
  return prisma.providerCompany.update({
    where: { id: providerCompanyId },
    data: {
      status: "SUBMITTED_FOR_REVIEW",
      onboardingSubmittedAt: new Date(),
      reviewNotes: null,
    },
  });
}

export async function setProviderCompanyStatus(providerCompanyId: string, status: "ACTIVE" | "SUSPENDED") {
  const prisma = getPrisma();
  return prisma.providerCompany.update({
    where: { id: providerCompanyId },
    data: {
      status,
      paymentReady: status === "ACTIVE",
    },
  });
}

export async function countActivePricingRules(providerCompanyId: string) {
  const prisma = getPrisma();
  return prisma.providerPricingRule.count({
    where: {
      providerCompanyId,
      active: true,
    },
  });
}
