import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireMobileProviderOrdersListSession } from "@/lib/provider-mobile-auth";
import { serializeMobileProviderOrder } from "@/lib/providers/mobile-serializers";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireMobileProviderOrdersListSession(request);
    const prisma = getPrisma();
    const { id } = await context.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        providerCompanyId: session.providerCompany.id,
      },
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
    });

    if (!booking) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const detailsUnlocked = booking.bookingStatus !== "PENDING_ASSIGNMENT";

    return NextResponse.json({
      order: {
        ...serializeMobileProviderOrder({
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
          customer: detailsUnlocked ? booking.customer : {
            firstName: "Confirmed",
            lastName: "customer",
            email: null,
            phone: null,
          },
          additionalNotes: booking.additionalNotes,
        }),
        serviceAddressLine1: detailsUnlocked ? booking.serviceAddressLine1 : "Full address unlocks after acceptance",
        serviceAddressLine2: detailsUnlocked ? booking.serviceAddressLine2 : null,
        serviceCity: detailsUnlocked ? booking.serviceCity : "London area",
        scheduledEndTime: booking.scheduledEndTime,
        propertyType: booking.propertyType,
        bedroomCount: booking.bedroomCount,
        bathroomCount: booking.bathroomCount,
        customerProvidesSupplies: booking.customerProvidesSupplies,
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (code.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to load order." }, { status: 500 });
  }
}
