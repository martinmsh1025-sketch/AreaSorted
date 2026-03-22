import { getPrisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { formatPreferredScheduleOption, parsePreferredScheduleOptions } from "@/lib/quotes/preferred-schedule";
import { getAppUrl } from "@/lib/config/env";

/**
 * Send booking authorisation email to the customer after card hold is placed.
 */
export async function sendBookingConfirmationEmail(bookingId: string) {
  const prisma = getPrisma();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { select: { firstName: true, email: true } },
      marketplaceProviderCompany: { select: { tradingName: true, legalName: true } },
      priceSnapshot: true,
      quoteRequest: { select: { reference: true, serviceKey: true, inputJson: true } },
    },
  });

  if (!booking || !booking.customer) return;

  const customer = booking.customer;
  const provider = booking.marketplaceProviderCompany;
  const reference = booking.quoteRequest?.reference || booking.id.slice(-8).toUpperCase();
  const dateStr = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "To be confirmed";
  const timeStr = booking.scheduledStartTime || "To be confirmed";
  const serviceLabel = booking.quoteRequest?.serviceKey || "Service";
  const appUrl = getAppUrl();
  const bookingUrl = `${appUrl}/account/bookings/${reference}`;

  const totalAmount = booking.priceSnapshot?.customerTotalAmount
    ? `£${Number(booking.priceSnapshot.customerTotalAmount).toFixed(2)}`
    : "";
  const preferredScheduleOptions = parsePreferredScheduleOptions(booking.quoteRequest?.inputJson);

  const text = [
    `Hi ${customer.firstName},`,
    ``,
    `We have placed a temporary hold on your card while the provider confirms your booking. Here are the details:`,
    ``,
    `Reference: ${reference}`,
    `Service: ${serviceLabel}`,
    `Date: ${dateStr}`,
    `Time: ${timeStr}`,
    preferredScheduleOptions.length > 1 ? "Other preferred options:" : "",
    ...preferredScheduleOptions.slice(1).map((option) => `- ${formatPreferredScheduleOption(option)}`),
    `Location: ${booking.servicePostcode || ""}`,
    totalAmount ? `Authorised amount: ${totalAmount}` : "",
    ``,
    `You are only charged once the provider confirms the job. If they do not confirm within 24 hours, the hold is released automatically.`,
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
        subject: `Booking hold placed — ${reference}`,
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
      customer: { select: { firstName: true, email: true } },
      marketplaceProviderCompany: { select: { tradingName: true, legalName: true } },
      quoteRequest: { select: { reference: true, serviceKey: true, inputJson: true } },
    },
  });

  if (!booking || !booking.customer) return;

  const customer = booking.customer;
  const provider = booking.marketplaceProviderCompany;
  const reference = booking.quoteRequest?.reference || booking.id.slice(-8).toUpperCase();
  const appUrl = getAppUrl();
  const bookingUrl = `${appUrl}/account/bookings/${reference}`;
  const serviceLabel = booking.quoteRequest?.serviceKey || "Service";

  const providerName = provider?.tradingName || provider?.legalName || "Your assigned provider";
  const preferredScheduleOptions = parsePreferredScheduleOptions(booking.quoteRequest?.inputJson);

  let subject = "";
  let bodyLines: string[] = [];

  switch (newStatus) {
    case "ASSIGNED":
      subject = `Your booking has been assigned — ${reference}`;
      bodyLines = [
        `Hi ${customer.firstName},`,
        ``,
        `Great news! A provider has been assigned to your booking.`,
        ``,
        `Reference: ${reference}`,
        `Service: ${serviceLabel}`,
        provider ? `Provider: ${providerName}` : "",
        `Your card hold has now been converted into a confirmed payment.`,
        preferredScheduleOptions.length > 1 ? "Other preferred options:" : "",
        ...preferredScheduleOptions.slice(1).map((option) => `- ${formatPreferredScheduleOption(option)}`),
        ``,
        `You can view the full details here:`,
        bookingUrl,
      ];
      break;

    case "IN_PROGRESS":
      subject = `Your service is in progress — ${reference}`;
      bodyLines = [
        `Hi ${customer.firstName},`,
        ``,
        `Your ${serviceLabel} service is now in progress.`,
        ``,
        `Reference: ${reference}`,
        provider ? `Provider: ${providerName}` : "",
        ``,
        bookingUrl,
      ];
      break;

    case "COMPLETED":
      subject = `Service completed — ${reference}`;
      bodyLines = [
        `Hi ${customer.firstName},`,
        ``,
        `Your ${serviceLabel} service has been completed.`,
        ``,
        `Reference: ${reference}`,
        provider ? `Provider: ${providerName}` : "",
        ``,
        `We hope everything went well! You can view the details here:`,
        bookingUrl,
        ``,
        `Thank you for using AreaSorted.`,
      ];
      break;

    case "CANCELLED":
      subject = `Booking cancelled — ${reference}`;
      bodyLines = [
        `Hi ${customer.firstName},`,
        ``,
        `Your booking has been cancelled.`,
        ``,
        `Reference: ${reference}`,
        `Service: ${serviceLabel}`,
        ``,
        `If you have any questions about this cancellation, please contact us.`,
        ``,
        bookingUrl,
      ];
      break;

    case "NO_CLEANER_FOUND":
      subject = `Booking update — ${reference}`;
      bodyLines = [
        `Hi ${customer.firstName},`,
        ``,
        `We could not secure provider confirmation for your booking, so the temporary card hold has been released.`,
        ``,
        `Reference: ${reference}`,
        `Service: ${serviceLabel}`,
        ``,
        `Please check your booking for the latest status:`,
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
