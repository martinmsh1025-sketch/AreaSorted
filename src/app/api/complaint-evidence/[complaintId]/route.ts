import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";
import { getAdminSession } from "@/lib/admin-auth";
import { parseComplaintAttachmentPaths } from "@/lib/complaints/attachments";

function getContentType(filePath: string) {
  if (filePath.endsWith(".pdf")) return "application/pdf";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function GET(request: Request, context: { params: Promise<{ complaintId: string }> }) {
  const [customer, admin] = await Promise.all([getCustomerSession(), getAdminSession()]);
  if (!customer && !admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { complaintId } = await context.params;
  const prisma = getPrisma();
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: { id: true, customerId: true, attachmentPath: true },
  });

  if (!complaint?.attachmentPath) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!admin && complaint.customerId !== customer?.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const attachments = parseComplaintAttachmentPaths(complaint.attachmentPath);
  const url = new URL(request.url);
  const requestedIndex = Number(url.searchParams.get("index") || 0);
  const selectedPath = attachments[requestedIndex];
  if (!selectedPath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const allowedRoot = path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "complaint-evidence");
  const normalized = path.normalize(path.resolve(allowedRoot, path.relative(".data/complaint-evidence", selectedPath)));
  if (!normalized.startsWith(`${allowedRoot}${path.sep}`)) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  try {
    const buffer = await readFile(normalized);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": getContentType(normalized),
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="${path.basename(normalized).replace(/[^\w.\-]/g, "_")}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
