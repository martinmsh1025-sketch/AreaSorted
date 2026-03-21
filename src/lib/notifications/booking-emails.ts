import { getPrisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/notifications/email";

/**
 * Send booking confirmation email to the customer after successful payment.
 */
export async function sendBookingConfirmationEmail(bookingId: string) {
  const prisma = getPrisma();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      providerCompany: true,
      priceSnapshot: true,
    },
  });

  if (!booking || !booking.customer) return;

  const customer = booking.customer;
  const provider = booking.providerCompany;
  const dateStr = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "To be confirmed";
  const timeStr = booking.scheduledTimeSlot || "To be confirmed";
  const serviceLabel = booking.serviceLabel || booking.serviceKey || "Cleaning service";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const bookingUrl = `${appUrl}/account/bookings/${booking.reference}`;

  const totalAmount = booking.priceSnapshot?.customerTotalPrice
    ? `£${Number(booking.priceSnapshot.customerTotalPrice).toFixed(2)}`
    : "";

  const text = [
    `Hi ${customer.firstName},`,
    ``,
    `Your booking has been confirmed! Here are the details:`,
    ``,
    `Reference: ${booking.reference}`,
    `Service: ${serviceLabel}`,
    `Date: ${dateStr}`,
    `Time: ${timeStr}`,
    `Location: ${booking.servicePostcode || ""}`,
    totalAmount ? `Total paid: ${totalAmount}` : "",
    provider ? `Provider: ${provider.tradingName}` : "",
    ``,
    `You can view your booking and track its status here:`,
    bookingUrl,
    ``,
    `If you have any questions, please don't hesitate to contact us.`,
    ``,
    `Thank you for choosing AreaSorted!`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await sendTransactionalEmail({
      to: customer.email,
      subject: `Booking confirmed — ${booking.reference}`,
      text,
    });
  } catch {
    // Non-critical — don't fail the webhook over email
  }
}

/**
 * Send status update email to the customer when a booking status changes.
 */
export async function sendBookingStatusEmail(
  bookingId: string,
  newStatus: string,
) {
  const prisma = getPrisma();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      providerCompany: true,
    },
  });

  if (!booking || !booking.customer) return;

  const customer = booking.customer;
  const provider = booking.providerCompany;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const bookingUrl = `${appUrl}/account/bookings/${booking.reference}`;
  const serviceLabel = booking.serviceLabel || booking.serviceKey || "Cleaning service";

  let subject = "";
  let bodyLines: string[] = [];

  switch (newStatus) {
    case "ASSIGNED":
      subject = `Your booking has been assigned — ${booking.reference}`;
      bodyLines = [
        `Hi ${customer.firstName},`,
        ``,
        `Great news! A provider has been assigned to your booking.`,
        ``,
        `Reference: ${booking.reference}`,
        `Service: ${serviceLabel}`,
        provider ? `Provider: ${provider.tradingName}` : "",
        ``,
        `You can view the full details here:`,
        bookingUrl,
      ];
      break;

    case "IN_PROGRESS":
      subject = `Your service is in progress — ${booking.reference}`;
      bodyLines = [
        `Hi ${customer.firstName},`,
        ``,
        `Your ${serviceLabel} service is now in progress.`,
        ``,
        `Reference: ${booking.reference}`,
        provider ? `Provider: ${provider.tradingName}` : "",
        ``,
        bookingUrl,
      ];
      break;

    case "COMPLETED":
      subject = `Service completed — ${booking.reference}`;
      bodyLines = [
        `Hi ${customer.firstName},`,
        ``,
        `Your ${serviceLabel} service has been completed.`,
        ``,
        `Reference: ${booking.reference}`,
        provider ? `Provider: ${provider.tradingName}` : "",
        ``,
        `We hope everything went well! You can view the details here:`,
        bookingUrl,
        ``,
        `Thank you for using AreaSorted.`,
      ];
      break;

    case "CANCELLED":
      subject = `Booking cancelled — ${booking.reference}`;
      bodyLines = [
        `Hi ${customer.firstName},`,
        ``,
        `Your booking has been cancelled.`,
        ``,
        `Reference: ${booking.reference}`,
        `Service: ${serviceLabel}`,
        ``,
        `If you have any questions about this cancellation, please contact us.`,
        ``,
        bookingUrl,
      ];
      break;

    default:
      return; // Don't send email for other statuses
  }

  const text = bodyLines.filter(Boolean).join("\n");
  if (!subject) return;

  try {
    await sendTransactionalEmail({
      to: customer.email,
      subject,
      text,
    });
  } catch {
    // Non-critical
  }
}
