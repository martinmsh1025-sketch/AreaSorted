import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireMobileProviderOrdersSession } from "@/lib/provider-mobile-auth";
import { serializeMobilePayout } from "@/lib/providers/mobile-serializers";

export async function GET(request: Request) {
  try {
    const session = await requireMobileProviderOrdersSession(request);
    const prisma = getPrisma();
    const payouts = await prisma.payoutRecord.findMany({
      where: { providerCompanyId: session.providerCompany.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        booking: {
          select: {
            id: true,
            bookingStatus: true,
            scheduledDate: true,
            quoteRequest: { select: { reference: true } },
          },
        },
      },
    });

    const totals = payouts.reduce(
      (acc, payout) => {
        const amount = Number(payout.amount);
        if (payout.status === "ON_HOLD") acc.onHold += amount;
        if (payout.status === "ELIGIBLE") acc.eligible += amount;
        if (["RELEASED", "PAID"].includes(payout.status)) acc.released += amount;
        return acc;
      },
      { onHold: 0, eligible: 0, released: 0 },
    );

    return NextResponse.json({
      totals,
      payouts: payouts.map((payout) =>
        serializeMobilePayout({
          id: payout.id,
          bookingId: payout.bookingId,
          status: payout.status,
          amount: Number(payout.amount),
          holdUntil: payout.holdUntil,
          availableOn: payout.availableOn,
          releasedAt: payout.releasedAt,
          paidAt: payout.paidAt,
          blockedReason: payout.blockedReason,
          booking: payout.booking,
        }),
      ),
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (code.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to load payouts." }, { status: 500 });
  }
}
