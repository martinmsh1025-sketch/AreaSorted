import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getProviderSession } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";

/**
 * Authenticated document serving endpoint.
 * Provider documents are stored outside public/ to prevent unauthenticated
 * access to PII such as ID documents, insurance records, and NI numbers.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ providerCompanyId: string; fileName: string }> },
) {
  const { providerCompanyId, fileName } = await params;

  if (!providerCompanyId || !fileName || providerCompanyId.includes("..") || fileName.includes("..") || fileName.includes("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const isAdmin = await isAdminAuthenticated();
  const prisma = getPrisma();
  const documentRecord = await prisma.providerOnboardingDocument.findFirst({
    where: {
      providerCompanyId,
      OR: [
        { storedFileName: path.basename(fileName) },
        { storagePath: { endsWith: fileName } },
      ],
    },
    select: { status: true, storagePath: true, storedFileName: true },
  });

  if (!documentRecord) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  if (!isAdmin) {
    const providerSession = await getProviderSession();
    if (!providerSession || providerSession.providerCompany.id !== providerCompanyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const safeFileName = path.basename(documentRecord.storedFileName);
  const dataRoot = path.join(process.cwd(), ".data", "provider-documents");
  const legacyRoot = path.join(process.cwd(), "public", "uploads", "provider-documents");
  const candidateFiles = [
    path.join(dataRoot, providerCompanyId, safeFileName),
    path.join(legacyRoot, providerCompanyId, safeFileName),
  ];

  let resolvedPath: string | null = null;
  for (const candidate of candidateFiles) {
    const normalized = path.normalize(candidate);
    if (!normalized.startsWith(`${dataRoot}${path.sep}`) && !normalized.startsWith(`${legacyRoot}${path.sep}`)) {
      continue;
    }

    try {
      await stat(/*turbopackIgnore: true*/ normalized);
      resolvedPath = normalized;
      break;
    } catch {
      // Try next storage location.
    }
  }

  if (!resolvedPath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buffer = await readFile(/*turbopackIgnore: true*/ resolvedPath);
  const ext = path.extname(resolvedPath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
  };

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Content-Disposition": `inline; filename="${safeFileName.replace(/[^\w.\-]/g, "_")}"`,
      "Cache-Control": "private, no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
