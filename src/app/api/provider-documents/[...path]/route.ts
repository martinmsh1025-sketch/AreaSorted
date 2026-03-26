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
    select: { status: true },
  });

  if (!isAdmin) {
    const providerSession = await getProviderSession();
    if (!providerSession || providerSession.providerCompany.id !== providerCompanyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  }

  const filePath = path.join(process.cwd(), ".data", "provider-documents", providerCompanyId, fileName);

  // Verify the resolved path doesn't escape the documents directory
  const documentsRoot = path.join(process.cwd(), ".data", "provider-documents");
  if (!filePath.startsWith(documentsRoot)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buffer = await readFile(filePath);
  const ext = path.extname(fileName).toLowerCase();
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
      "Content-Disposition": `inline; filename="${path.basename(fileName).replace(/[^\w.\-]/g, "_")}"`,
      "Cache-Control": "private, no-cache",
      // M-12 FIX: Prevent MIME-type sniffing
      "X-Content-Type-Options": "nosniff",
    },
  });
}
