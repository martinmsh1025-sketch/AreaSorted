import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { Prisma, BookingStatus } from "@prisma/client";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const prisma = getPrisma();
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate")?.trim() || "";
  const endDate = searchParams.get("endDate")?.trim() || "";
  const payment = searchParams.get("payment")?.trim() || "";
  const bookingStatus = searchParams.get("bookingStatus")?.trim() || "";

  const where: Prisma.BookingWhereInput = {};

  if (startDate || endDate) {
    where.scheduledDate = {};
    if (startDate) where.scheduledDate.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      where.scheduledDate.lte = end;
    }
  }

  if (bookingStatus) {
    where.bookingStatus = bookingStatus as BookingStatus;
  }

  // H-31 FIX: Add row limit to prevent OOM on large datasets
  const bookings = await prisma.booking.findMany({
    where,
    take: 10000,
    include: {
      customer: true,
      marketplaceProviderCompany: {
        select: { tradingName: true, legalName: true, contactEmail: true },
      },
      paymentRecords: { select: { paymentState: true }, orderBy: { createdAt: "desc" }, take: 1 },
      payments: { select: { paymentStatus: true }, orderBy: { createdAt: "desc" }, take: 1 },
      jobs: { select: { jobStatus: true }, orderBy: { createdAt: "desc" }, take: 1 },
      jobAssignments: {
        select: { assignmentStatus: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      refundRecords: { select: { status: true }, orderBy: { createdAt: "desc" }, take: 1 },
      quoteRequest: { select: { reference: true } },
    },
    orderBy: { scheduledDate: "asc" },
  });

  // Filter by payment status in JS if needed
  const filtered = payment
    ? bookings.filter((b) => {
        const pr = b.paymentRecords[0];
        const p = b.payments[0];
        const status = pr ? pr.paymentState : p ? p.paymentStatus : "PENDING";
        return status === payment;
      })
    : bookings;

  const rows = [
    [
      "booking_id",
      "reference",
      "customer_name",
      "customer_email",
      "customer_phone",
      "service",
      "service_date",
      "service_time",
      "postcode",
      "total_amount",
      "provider",
      "booking_status",
      "payment_status",
      "job_status",
      "assignment_status",
      "refund_status",
      "created_at",
      "updated_at",
    ],
    ...filtered.map((booking) => {
      const providerName =
        booking.marketplaceProviderCompany?.tradingName ||
        booking.marketplaceProviderCompany?.legalName ||
        booking.marketplaceProviderCompany?.contactEmail ||
        "";
      const paymentStatus =
        booking.paymentRecords[0]?.paymentState ||
        booking.payments[0]?.paymentStatus ||
        "PENDING";
      const jobStatus = booking.jobs[0]?.jobStatus || "CREATED";
      const assignmentStatus =
        booking.jobAssignments[0]?.assignmentStatus || "UNASSIGNED";
      const refundStatus = booking.refundRecords[0]?.status || "NONE";

      return [
        booking.id,
        booking.quoteRequest?.reference || "",
        `${booking.customer.firstName} ${booking.customer.lastName}`,
        booking.customer.email,
        booking.customer.phone,
        booking.serviceType,
        booking.scheduledDate.toISOString().slice(0, 10),
        booking.scheduledStartTime,
        booking.servicePostcode,
        Number(booking.totalAmount),
        providerName,
        booking.bookingStatus,
        paymentStatus,
        jobStatus,
        assignmentStatus,
        refundStatus,
        booking.createdAt.toISOString(),
        booking.updatedAt.toISOString(),
      ];
    }),
  ];

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const dateLabel = startDate || "all";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="areasorted-bookings-${dateLabel}.csv"`,
    },
  });
}
