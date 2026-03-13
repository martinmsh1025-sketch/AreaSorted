import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listBookingRecords } from "@/lib/booking-record-store";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const bookings = await listBookingRecords();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date")?.trim() || "";
  const payment = searchParams.get("payment")?.trim() || "";

  const filtered = bookings.filter((booking) => {
    const dateMatch = !date || booking.preferredDate === date;
    const paymentMatch = !payment || booking.stripePaymentStatus === payment;
    return dateMatch && paymentMatch;
  });

  const rows = [
    [
      "booking_reference",
      "customer_name",
      "customer_email",
      "customer_phone",
      "service",
      "service_date",
      "service_time",
      "postcode",
      "total_amount",
      "payment_status",
      "assignment_status",
      "job_status",
      "refund_status",
      "created_at",
      "updated_at",
    ],
    ...filtered.map((booking) => [
      booking.bookingReference,
      booking.customerName,
      booking.email,
      booking.contactPhone,
      booking.service,
      booking.preferredDate,
      booking.preferredTime,
      booking.postcode,
      booking.totalAmount,
      booking.stripePaymentStatus,
      booking.assignmentStatus,
      booking.jobStatus,
      booking.refundStatus,
      booking.createdAt,
      booking.updatedAt,
    ]),
  ];

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="washhub-bookings-${date || "all"}.csv"`,
    },
  });
}
