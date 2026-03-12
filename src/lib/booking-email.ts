import { BookingRecord } from "@/lib/booking-record-store";

export function buildBookingManageUrl(booking: BookingRecord) {
  return `${process.env.APP_BASE_URL || "http://localhost:3000"}/booking/manage?reference=${encodeURIComponent(booking.bookingReference)}&token=${encodeURIComponent(booking.accessToken || "")}`;
}

export function buildBookingConfirmationEmail(booking: BookingRecord) {
  const manageUrl = buildBookingManageUrl(booking);

  const subject = `WashHub booking confirmed - ${booking.bookingReference}`;
  const text = [
    `Hello ${booking.customerName || "Customer"},`,
    "",
    "Your WashHub booking has been confirmed.",
    `Booking reference: ${booking.bookingReference}`,
    `Service: ${booking.service}`,
    `Date: ${booking.preferredDate}`,
    `Time: ${booking.preferredTime}`,
    `Postcode: ${booking.postcode}`,
    `Amount paid: GBP ${booking.totalAmount.toFixed(2)}`,
    "",
    `Manage your booking: ${manageUrl}`,
  ].join("\n");

  return {
    subject,
    text,
    manageUrl,
  };
}
