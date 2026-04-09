import { NextRequest, NextResponse } from "next/server";
import { requireMobileProviderOrdersSession } from "@/lib/provider-mobile-auth";
import { requestProviderOrderSupport } from "@/server/services/providers/orders";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireMobileProviderOrdersSession(request);
    const { id } = await context.params;
    const body = await request.json();
    const requestType = String(body?.requestType || "").trim();
    const message = String(body?.message || "").trim();

    if (!["RESCHEDULE", "CANCEL", "ISSUE"].includes(requestType)) {
      return NextResponse.json({ error: "Invalid request type." }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: "Please add a short explanation." }, { status: 400 });
    }

    const result = await requestProviderOrderSupport({
      providerCompanyId: session.providerCompany.id,
      providerName: session.providerCompany.tradingName || session.providerCompany.legalName || session.providerCompany.contactEmail,
      providerEmail: session.providerCompany.contactEmail,
      bookingId: id,
      requestType: requestType as "RESCHEDULE" | "CANCEL" | "ISSUE",
      message,
    });

    if (!result.ok) {
      return NextResponse.json({ error: "This request is only available for accepted or in-progress orders." }, { status: 409 });
    }

    return NextResponse.json({ ok: true, message: `${result.requestLabel} sent to support.` });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (code.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to contact support." }, { status: 500 });
  }
}
