import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getPrisma } from "@/lib/db";
import { getProviderOnboardingMetadata } from "@/lib/providers/onboarding-profile";
import { getRequiredProviderDocuments, providerDocumentAcceptedMimeTypes, providerDocumentMaxFileSizeBytes, providerDocumentTotalMaxSizeBytes, providerDocumentDefinitions } from "@/lib/providers/onboarding-config";
import { saveProviderDocuments } from "@/lib/providers/repository";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function hasPdfSignature(buffer: Buffer) {
  return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

function hasPngSignature(buffer: Buffer) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return signature.every((byte, index) => buffer[index] === byte);
}

function hasJpegSignature(buffer: Buffer) {
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
}

function validateMagicBytes(documentLabel: string, mimeType: string, buffer: Buffer) {
  const valid = mimeType === "application/pdf"
    ? hasPdfSignature(buffer)
    : mimeType === "image/png"
      ? hasPngSignature(buffer)
      : mimeType === "image/jpeg"
        ? hasJpegSignature(buffer)
        : false;

  if (!valid) {
    throw new Error(`${documentLabel} does not match its file type. Please upload a real PDF, JPG or PNG file.`);
  }
}

export async function saveProviderDocumentUploads(providerCompanyId: string, formData: FormData) {
  // C-5 FIX: Store provider documents OUTSIDE public/ to prevent unauthenticated access.
  // Documents contain sensitive PII (passports, insurance, NI numbers).
  // Serve them via an authenticated API route instead.
  const uploadRoot = path.join(process.cwd(), ".data", "provider-documents", providerCompanyId);
  await mkdir(uploadRoot, { recursive: true });

  const savedDocuments = [] as Array<{
    documentKey: string;
    label: string;
    fileName: string;
    storedFileName: string;
    storagePath: string;
    mimeType?: string | null;
    sizeBytes?: number | null;
  }>;
  let totalUploadBytes = 0;

  for (const document of providerDocumentDefinitions) {
    const entry = formData.get(document.key);
    if (!(entry instanceof File) || entry.size === 0) continue;

    if (!providerDocumentAcceptedMimeTypes.includes((entry.type || "") as (typeof providerDocumentAcceptedMimeTypes)[number])) {
      throw new Error(`${document.label} must be a PDF, JPG or PNG file.`);
    }

    if (entry.size > providerDocumentMaxFileSizeBytes) {
      throw new Error(`${document.label} must be 10MB or smaller.`);
    }

    totalUploadBytes += entry.size;
    if (totalUploadBytes > providerDocumentTotalMaxSizeBytes) {
      throw new Error("Total upload must stay under 30MB.");
    }

    const buffer = Buffer.from(await entry.arrayBuffer());
    validateMagicBytes(document.label, entry.type || "", buffer);
    const storedFileName = `${document.key}-${Date.now()}-${sanitizeFileName(entry.name || document.key)}`;
    const fullPath = path.join(uploadRoot, storedFileName);
    await writeFile(fullPath, buffer);

    savedDocuments.push({
      documentKey: document.key,
      label: document.label,
      fileName: entry.name || document.label,
      storedFileName,
      // C-5 FIX: Store relative path from .data/ root (NOT public/)
      storagePath: `.data/provider-documents/${providerCompanyId}/${storedFileName}`,
      mimeType: entry.type || null,
      sizeBytes: entry.size || null,
    });
  }

  if (savedDocuments.length) {
    await saveProviderDocuments({ providerCompanyId, documents: savedDocuments });
  }
}

export function getMissingRequiredDocuments(documents: Array<{ documentKey: string; status: string }>) {
  return documents;
}

export async function getMissingRequiredDocumentsForProvider(providerCompanyId: string, documents: Array<{ documentKey: string; status: string }>) {
  const prisma = getPrisma();
  const provider = await prisma.providerCompany.findUnique({
    where: { id: providerCompanyId },
    select: { stripeRequirementsJson: true },
  });
  const metadata = getProviderOnboardingMetadata(provider?.stripeRequirementsJson ?? null);
  const required = getRequiredProviderDocuments(metadata.businessType);
  return required.filter((item) => !documents.some((document) => document.documentKey === item.key && ["PENDING", "APPROVED"].includes(document.status)));
}
