import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomerSession } from "@/lib/customer-auth";
import { getPrisma } from "@/lib/db";
import { getDisplayPaymentStatus, getPaymentStatusLabel } from "@/lib/payments/display-status";
import { CustomerCounterOfferBanner } from "@/components/customer/counter-offer-response";
import { CancelBookingSection } from "./cancel-booking-section";
import { RescheduleBookingSection } from "./reschedule-booking-section";

type BookingDetailPageProps = {
  params: Promise<{ reference: string }>;
};

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { reference } = await params;
  const customer = await requireCustomerSession();
  const prisma = getPrisma();

  const booking = await prisma.booking.findFirst({
    where: {
      customerId: customer.id,
      OR: [
        { quoteRequest: { reference } },
        { id: reference },
      ],
    },
    include: {
      quoteRequest: { select: { reference: true, serviceKey: true, categoryKey: true } },
      priceSnapshot: true,
      paymentRecords: { orderBy: { createdAt: "desc" }, take: 1, select: { paymentState: true, metadataJson: true } },
      marketplaceProviderCompany: { select: { tradingName: true, legalName: true } },
      counterOffers: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!booking) notFound();

  const ref = booking.quoteRequest?.reference ?? booking.id;
  const service = booking.quoteRequest?.serviceKey ?? booking.serviceType;
  const status = booking.bookingStatus.replace(/_/g, " ");
  const payment = getDisplayPaymentStatus({
    paymentState: booking.paymentRecords?.[0]?.paymentState,
    metadataJson: booking.paymentRecords?.[0]?.metadataJson,
    bookingStatus: booking.bookingStatus,
  });
  const providerName = payment === "CAPTURED"
    ? (booking.marketplaceProviderCompany?.tradingName ?? booking.marketplaceProviderCompany?.legalName ?? "Assigned provider")
    : "Verified local provider";

  const showInvoice = ["PAID", "ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(booking.bookingStatus);
  const canCancel = ["PAID", "PENDING_ASSIGNMENT", "ASSIGNED"].includes(booking.bookingStatus);
  const canReschedule = ["PAID", "PENDING_ASSIGNMENT", "ASSIGNED"].includes(booking.bookingStatus);

  // Prepare counter offers for client component
  const counterOffers = booking.counterOffers.map((co) => ({
    id: co.id,
    proposedPrice: co.proposedPrice ? Number(co.proposedPrice) : null,
    proposedDate: co.proposedDate ? co.proposedDate.toISOString() : null,
    proposedStartTime: co.proposedStartTime,
    message: co.message,
    status: co.status,
    createdAt: co.createdAt.toISOString(),
  }));

  const hasPendingOffer = counterOffers.some((o) => o.status === "PENDING");
  const formattedDate = booking.scheduledDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
        <div style={{ marginBottom: "1.25rem" }}>
          <Link href="/account/bookings" style={{ color: "var(--color-brand)", fontSize: "0.9rem", fontWeight: 600 }}>
            &larr; Back to bookings
          </Link>
        </div>

        <div className="panel card account-hero-card" style={{ marginBottom: "1.5rem" }}>
          <div className="eyebrow">Booking details</div>
          <h1 className="title" style={{ marginTop: "0.3rem", fontSize: "1.5rem" }}>
            {service}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Reference: {ref}
          </p>
          <div className="account-booking-meta-strip">
            <span>{status}</span>
            <span>{getPaymentStatusLabel(payment)}</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Counter offer banner — shown prominently if pending */}
        {counterOffers.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <CustomerCounterOfferBanner
              offers={counterOffers}
              providerName={providerName}
              currentPrice={booking.priceSnapshot ? Number(booking.priceSnapshot.customerTotalAmount) : null}
              currentDate={formattedDate}
              currentTime={booking.scheduledStartTime}
            />
          </div>
        )}

        <div className="panel card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.75rem" }}>Service details</h2>
          <div className="quote-summary-list">
            <div><span>Status</span><strong>{status}</strong></div>
            <div><span>Payment</span><strong>{getPaymentStatusLabel(payment)}</strong></div>
            <div><span>Date</span><strong>{formattedDate}</strong></div>
            <div><span>Time</span><strong>{booking.scheduledStartTime}</strong></div>
            <div><span>Duration</span><strong>Approx. {Number(booking.durationHours) <= 1 ? "1-2" : `${Number(booking.durationHours)}-${Number(booking.durationHours) + 1}`} hours</strong></div>
            <div><span>Provider</span><strong>{providerName}</strong></div>
          </div>
          <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
            Duration shown is an estimate only. Actual time may vary depending on property condition and scope of work. The service is complete when the agreed tasks are finished, regardless of time taken.
          </p>
          {payment === "AUTHORIZED" && (
            <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
              Your temporary card hold is active. We only show the provider company name after the booking is confirmed and payment is captured.
            </p>
          )}
        </div>

        <div className="panel card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.75rem" }}>Address</h2>
          <div className="quote-summary-list">
            <div><span>Address</span><strong>{booking.serviceAddressLine1}</strong></div>
            {booking.serviceAddressLine2 && (
              <div><span>Line 2</span><strong>{booking.serviceAddressLine2}</strong></div>
            )}
            <div><span>City</span><strong>{booking.serviceCity}</strong></div>
            <div><span>Postcode</span><strong>{booking.servicePostcode}</strong></div>
          </div>
        </div>

        {booking.priceSnapshot && (
          <div className="panel card" style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.75rem" }}>Pricing</h2>
            <div className="quote-summary-list">
              <div><span>Service</span><strong>&pound;{Number(booking.priceSnapshot.providerServiceAmount).toFixed(2)}</strong></div>
              <div><span>Booking fee</span><strong>&pound;{Number(booking.priceSnapshot.platformBookingFee).toFixed(2)}</strong></div>
              <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                <span>{booking.bookingStatus === "PENDING_ASSIGNMENT" ? "Authorised amount" : "Total paid"}</span>
                <strong>&pound;{Number(booking.priceSnapshot.customerTotalAmount).toFixed(2)}</strong>
              </div>
            </div>
            {hasPendingOffer && (
              <p style={{ fontSize: "0.8rem", color: "var(--color-brand, #d9252a)", fontWeight: 500, marginTop: "0.75rem" }}>
                A price change has been proposed — see above to accept or decline.
              </p>
            )}
            {showInvoice && (
              <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
                <Link
                  href={`/account/bookings/${ref}/invoice`}
                  className="button"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  View Receipt
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="panel card">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Manage booking</h2>
          {hasPendingOffer && (
            <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, #fff0f0 0%, #fff 100%)", border: "1px solid rgba(217,37,42,0.18)" }}>
              <strong style={{ display: "block", marginBottom: "0.35rem" }}>Provider response needed</strong>
              <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.55 }}>
                You have a pending counter offer above. Accept it to update this booking, or decline it to keep your current arrangement.
              </p>
            </div>
          )}
          {(canCancel || canReschedule) ? (
            <>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: "0 0 0.75rem" }}>
                 You can reschedule or cancel this booking below. If the provider has not confirmed yet, cancelling releases the card hold instead of capturing payment. For other changes, contact our support team.
               </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                {canReschedule && (
                  <RescheduleBookingSection
                    bookingId={booking.id}
                    currentDate={booking.scheduledDate.toISOString().split("T")[0]}
                    currentTime={booking.scheduledStartTime}
                  />
                )}
                {canCancel && (
                  <CancelBookingSection bookingId={booking.id} />
                )}
                <Link href="/support" className="button button-secondary">
                  Contact support
                </Link>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: "0 0 0.75rem" }}>
                {booking.bookingStatus === "CANCELLED"
                  ? "This booking has been cancelled."
                  : booking.bookingStatus === "COMPLETED"
                    ? "This booking is complete. Thank you for using AreaSorted!"
                    : "If you need help with this booking, please contact our support team."}
              </p>
              {booking.bookingStatus !== "CANCELLED" && (
                <Link href="/support" className="button button-secondary">
                  Contact support
                </Link>
              )}
            </>
          )}
        </div>
    </div>
  );
}
