import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { parseSupportAttachmentPaths } from "@/lib/support/attachments";

function getContentType(filePath: string) {
  if (filePath.endsWith(".pdf")) return "application/pdf";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function GET(request: Request, context: { params: Promise<{ enquiryId: string }> }) {
  const admin = await getAdminSession();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { enquiryId } = await context.params;
  const prisma = getPrisma();
  const enquiry = await prisma.contactEnquiry.findUnique({ where: { id: enquiryId }, select: { message: true } });
  if (!enquiry) {
    return new NextResponse("Not found", { status: 404 });
  }

  const attachments = parseSupportAttachmentPaths(enquiry.message);
  const url = new URL(request.url);
  const requestedIndex = Number(url.searchParams.get("index") || 0);
  const selectedPath = attachments[requestedIndex];
  if (!selectedPath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const allowedRoot = path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "provider-case-evidence");
  const normalized = path.normalize(path.resolve(allowedRoot, path.relative(".data/provider-case-evidence", selectedPath)));
  if (!normalized.startsWith(`${allowedRoot}${path.sep}`)) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  try {
    const buffer = await readFile(normalized);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": getContentType(normalized),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
