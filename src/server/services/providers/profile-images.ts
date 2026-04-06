import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PROFILE_IMAGE_BYTES = 16 * 1024 * 1024;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function hasPngSignature(buffer: Buffer) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return signature.every((byte, index) => buffer[index] === byte);
}

function hasJpegSignature(buffer: Buffer) {
  return buffer[0] === 0xff && buffer[1] === 0xd8;
}

function hasWebpSignature(buffer: Buffer) {
  return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
}

function validateImageBuffer(mimeType: string, buffer: Buffer) {
  if (mimeType === "image/png") return hasPngSignature(buffer);
  if (mimeType === "image/jpeg") return hasJpegSignature(buffer);
  if (mimeType === "image/webp") return hasWebpSignature(buffer);
  return false;
}

export async function saveProviderProfileImageUpload(providerCompanyId: string, formData: FormData, existingUrl?: string | null) {
  const entry = formData.get("profileImageFile");
  if (!(entry instanceof File) || entry.size === 0) {
    return existingUrl || null;
  }

  if (!ALLOWED_MIME_TYPES.has(entry.type)) {
    throw new Error("Profile image must be a JPG, PNG, or WebP file.");
  }

  if (entry.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("Profile image must be 16MB or smaller.");
  }

  const buffer = Buffer.from(await entry.arrayBuffer());
  if (!validateImageBuffer(entry.type, buffer)) {
    throw new Error("Profile image file type does not match its content.");
  }

  const uploadDir = path.join(process.cwd(), "public", "provider-profiles", providerCompanyId);
  await mkdir(uploadDir, { recursive: true });

  const storedFileName = `profile-${Date.now()}-${sanitizeFileName(entry.name || "image")}`;
  await writeFile(path.join(uploadDir, storedFileName), buffer);
  return `/provider-profiles/${providerCompanyId}/${storedFileName}`;
}
