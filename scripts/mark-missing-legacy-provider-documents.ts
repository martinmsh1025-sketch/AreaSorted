import { access } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APPLY_FLAG = "--apply";
const REVIEW_NOTE = "Legacy public upload file is missing. Please re-upload this document.";

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const apply = process.argv.includes(APPLY_FLAG);

  const legacyDocuments = await prisma.providerOnboardingDocument.findMany({
    where: {
      storagePath: {
        startsWith: "/uploads/provider-documents/",
      },
    },
    select: {
      id: true,
      providerCompanyId: true,
      documentKey: true,
      fileName: true,
      storedFileName: true,
      storagePath: true,
      status: true,
      reviewNotes: true,
      providerCompany: {
        select: {
          tradingName: true,
          legalName: true,
          contactEmail: true,
          status: true,
        },
      },
    },
  });

  const missingDocuments = [] as typeof legacyDocuments;

  for (const document of legacyDocuments) {
    const fileName = document.storedFileName || path.basename(document.storagePath);
    const legacyPath = path.join(process.cwd(), "public", "uploads", "provider-documents", document.providerCompanyId, fileName);
    const dataPath = path.join(process.cwd(), ".data", "provider-documents", document.providerCompanyId, fileName);
    const exists = (await fileExists(legacyPath)) || (await fileExists(dataPath));

    if (!exists) {
      missingDocuments.push(document);
    }
  }

  if (!missingDocuments.length) {
    console.log("No missing legacy provider documents found.");
    return;
  }

  console.log(JSON.stringify({
    apply,
    count: missingDocuments.length,
    documents: missingDocuments.map((document) => ({
      id: document.id,
      providerCompanyId: document.providerCompanyId,
      providerName: document.providerCompany.tradingName || document.providerCompany.legalName || "Unknown provider",
      contactEmail: document.providerCompany.contactEmail,
      providerStatus: document.providerCompany.status,
      documentKey: document.documentKey,
      currentStatus: document.status,
      storagePath: document.storagePath,
    })),
  }, null, 2));

  if (!apply) {
    console.log(`\nDry run only. Re-run with ${APPLY_FLAG} to update these records.`);
    return;
  }

  for (const document of missingDocuments) {
    const reviewNotes = document.reviewNotes
      ? `${document.reviewNotes}\n${REVIEW_NOTE}`
      : REVIEW_NOTE;

    await prisma.providerOnboardingDocument.update({
      where: { id: document.id },
      data: {
        status: "NEEDS_RESUBMISSION",
        reviewNotes,
        reviewedAt: new Date(),
      },
    });
  }

  console.log(`\nUpdated ${missingDocuments.length} provider document record(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
