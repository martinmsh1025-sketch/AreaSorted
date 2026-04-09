import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireMobileProviderOrdersListSession } from "@/lib/provider-mobile-auth";
import { serializeMobileProviderOrder } from "@/lib/providers/mobile-serializers";

export async function GET(request: Request) {
  try {
    const session = await requireMobileProviderOrdersListSession(request);
    const prisma = getPrisma();
    const bookings = await prisma.booking.findMany({
      where: { providerCompanyId: session.providerCompany.id },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        priceSnapshot: true,
      },
      orderBy: [{ scheduledDate: "asc" }, { scheduledStartTime: "asc" }],
      take: 100,
    });

    return NextResponse.json({
      orders: bookings.map((booking) =>
        serializeMobileProviderOrder({
          id: booking.id,
          serviceType: booking.serviceType,
          servicePostcode: booking.servicePostcode,
          scheduledDate: booking.scheduledDate,
          scheduledStartTime: booking.scheduledStartTime,
          bookingStatus: booking.bookingStatus,
          totalAmount: Number(booking.totalAmount),
          cleanerPayoutAmount: booking.cleanerPayoutAmount ? Number(booking.cleanerPayoutAmount) : null,
          platformMarginAmount: booking.platformMarginAmount ? Number(booking.platformMarginAmount) : null,
          priceSnapshot: booking.priceSnapshot
            ? {
                providerExpectedPayout: Number(booking.priceSnapshot.providerExpectedPayout),
                platformCommissionAmount: Number(booking.priceSnapshot.platformCommissionAmount),
              }
            : null,
          customer: booking.customer,
          additionalNotes: booking.additionalNotes,
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
    return NextResponse.json({ error: "Unable to load orders." }, { status: 500 });
  }
}
