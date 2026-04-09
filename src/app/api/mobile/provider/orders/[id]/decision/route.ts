import { NextRequest, NextResponse } from "next/server";
import { requireMobileProviderOrdersSession } from "@/lib/provider-mobile-auth";
import {
  acceptProviderBooking,
  completeProviderBooking,
  rejectProviderBooking,
  startProviderBooking,
} from "@/server/services/providers/orders";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireMobileProviderOrdersSession(request);
    const params = await context.params;
    const bookingId = params.id;
    const body = await request.json();
    const action = String(body?.action || "");
    const reason = String(body?.reason || "").trim();

    const result = action === "accept"
      ? await acceptProviderBooking({ providerCompanyId: session.providerCompany.id, bookingId })
      : action === "reject"
        ? await rejectProviderBooking({ providerCompanyId: session.providerCompany.id, bookingId, reason })
        : action === "start"
          ? await startProviderBooking({ providerCompanyId: session.providerCompany.id, bookingId })
          : action === "complete"
            ? await completeProviderBooking({ providerCompanyId: session.providerCompany.id, bookingId })
            : null;

    if (!result) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    if (!result.ok) {
      return NextResponse.json({ error: "Order is no longer available for that action." }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (code.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
  }
}
