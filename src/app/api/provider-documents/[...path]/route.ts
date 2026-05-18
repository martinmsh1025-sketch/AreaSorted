import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getProviderSession } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";

/**
 * C-5 FIX: Authenticated document serving endpoint.
 * Provider documents are now stored in .data/ (outside public/) to prevent
 * unauthenticated access to PII (passports, insurance, NI numbers).
 *
 * Access is restricted to:
 * - Admin users (can view any provider's documents)
 * - The provider themselves (can only view their own documents)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const segments = (await params).path;

  if (!segments || segments.length < 2) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const [providerCompanyId, ...fileSegments] = segments;
  const fileName = fileSegments.join("/");

  // Sanitize to prevent directory traversal
  if (fileName.includes("..") || providerCompanyId.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // Auth check: admin or the provider themselves
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

  const safeFileName = documentRecord.storedFileName;
  const candidateFiles = [
    path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "provider-documents", providerCompanyId, safeFileName),
    path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads", "provider-documents", providerCompanyId, safeFileName),
  ];

  let resolvedPath: string | null = null;
  for (const candidate of candidateFiles) {
    const normalized = path.normalize(candidate);
    const allowedRoots = [
      path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "provider-documents"),
      path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads", "provider-documents"),
    ];

    if (!allowedRoots.some((root) => normalized.startsWith(root))) {
      continue;
    }

    try {
      await stat(normalized);
      resolvedPath = normalized;
      break;
    } catch {
      // Try next legacy/current storage location.
    }
  }

  if (!resolvedPath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buffer = await readFile(resolvedPath);
  const ext = path.extname(resolvedPath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
  };
  const contentType = mimeTypes[ext] || "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      // M-12 FIX: Sanitise filename — only use the basename and remove special chars
      // to prevent header injection via crafted filenames
      "Content-Disposition": `inline; filename="${path.basename(safeFileName).replace(/[^\w.\-]/g, "_")}"`,
      "Cache-Control": "private, no-cache",
      // M-12 FIX: Prevent MIME-type sniffing
      "X-Content-Type-Options": "nosniff",
    },
  });
}
