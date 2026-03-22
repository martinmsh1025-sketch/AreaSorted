import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getRequiredProviderDocuments, providerDocumentAcceptedMimeTypes, providerDocumentMaxFileSizeBytes, providerDocumentTotalMaxSizeBytes, providerRequiredDocuments } from "@/lib/providers/onboarding-config";
import { saveProviderDocuments } from "@/lib/providers/repository";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
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

  for (const document of providerRequiredDocuments) {
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
  const required = getRequiredProviderDocuments();
  return required.filter((item) => !documents.some((document) => document.documentKey === item.key && ["PENDING", "APPROVED"].includes(document.status)));
}
