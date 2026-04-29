import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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

function validateMagicBytes(mimeType: string, buffer: Buffer) {
  const valid = mimeType === "application/pdf"
    ? hasPdfSignature(buffer)
    : mimeType === "image/png"
      ? hasPngSignature(buffer)
      : mimeType === "image/jpeg"
        ? hasJpegSignature(buffer)
        : false;

  if (!valid) {
    throw new Error("The uploaded evidence file does not match its type. Please upload a real PDF, JPG, or PNG file.");
  }
}

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

export async function saveProviderCaseEvidenceUploads(providerCompanyId: string, complaintId: string, files: File[]) {
  if (files.length > 5) {
    throw new Error("Please upload no more than 5 evidence files.");
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new Error("Total evidence upload must stay under 20MB.");
  }

  const uploadRoot = path.join(process.cwd(), ".data", "provider-case-evidence", providerCompanyId);
  await mkdir(uploadRoot, { recursive: true });

  const savedPaths: string[] = [];

  for (const file of files) {
    if (!ACCEPTED_TYPES.includes(file.type || "")) {
      throw new Error("Evidence must be a PDF, JPG, or PNG file.");
    }

    if (file.size > MAX_FILE_BYTES) {
      throw new Error("Each evidence file must be 10MB or smaller.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    validateMagicBytes(file.type || "", buffer);

    const storedFileName = `${complaintId}-${Date.now()}-${sanitizeFileName(file.name || "evidence")}`;
    const fullPath = path.join(uploadRoot, storedFileName);
    await writeFile(fullPath, buffer);
    savedPaths.push(`.data/provider-case-evidence/${providerCompanyId}/${storedFileName}`);
  }

  return savedPaths;
}
