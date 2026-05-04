import { notFound } from "next/navigation";
import Link from "next/link";
import { getPrisma } from "@/lib/db";
import { getDisplayPaymentStatus, getPaymentStatusLabel } from "@/lib/payments/display-status";
import { getCustomerSession } from "@/lib/customer-auth";
import { customerOwnsQuote, QUOTE_ACCESS_PARAM, verifyQuoteAccessToken } from "@/lib/quotes/access";
import { redactReference } from "@/lib/privacy/public-display";

function money(value: any) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(Number(value || 0));
}

type BookingConfirmationPageProps = {
  params: Promise<{ reference: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookingConfirmationPage({ params, searchParams }: BookingConfirmationPageProps) {
  const { reference } = await params;
  const query = (await searchParams) ?? {};
  const accessToken = typeof query[QUOTE_ACCESS_PARAM] === "string" ? query[QUOTE_ACCESS_PARAM] : "";
  const prisma = getPrisma();
  const quote = await prisma.quoteRequest.findUnique({
    where: { reference },
    include: {
      booking: {
        include: {
          marketplaceProviderCompany: {
            select: { tradingName: true, legalName: true },
          },
          priceSnapshot: true,
          paymentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  const booking = quote?.booking;
  if (!booking) notFound();

  const session = await getCustomerSession();
  const canAccessConfirmation = verifyQuoteAccessToken(reference, accessToken) || customerOwnsQuote(quote.customerEmail, session?.email);

  if (!canAccessConfirmation) {
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <div className="panel card">
            <div className="eyebrow">Booking confirmation</div>
            <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Secure booking access required.
            </h1>
            <p className="lead">
              For privacy, booking confirmation details are only shown from the secure booking link or inside the customer account.
            </p>
            <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Reference: {redactReference(reference)}
            </p>
            <div className="button-row" style={{ marginTop: "1.25rem" }}>
              <Link className="button button-primary" href={`/customer/login?redirectTo=${encodeURIComponent(`/booking/confirmation/${reference}`)}`}>
                Log in to view confirmation
              </Link>
              <Link className="button button-secondary" href="/support">Contact support</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const paymentStatus = getDisplayPaymentStatus({
    paymentState: booking.paymentRecords[0]?.paymentState,
    metadataJson: booking.paymentRecords[0]?.metadataJson,
    bookingStatus: booking.bookingStatus,
  });
  const isCaptured = paymentStatus === "CAPTURED";
  const providerName = isCaptured
    ? (booking.marketplaceProviderCompany?.tradingName ?? booking.marketplaceProviderCompany?.legalName ?? "Assigned provider")
    : "Verified local provider";
  const rebookHref = quote.serviceKey && quote.categoryKey
    ? `/quote?${new URLSearchParams({
        step: "4",
        rebookBookingId: booking.id,
        postcode: booking.servicePostcode,
        line1: booking.serviceAddressLine1,
        line2: booking.serviceAddressLine2 || "",
        city: booking.serviceCity,
        categoryKey: quote.categoryKey,
        serviceKey: quote.serviceKey,
        preferredProviderCompanyId: booking.providerCompanyId || "",
      }).toString()}`
    : null;

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="panel card" style={{ overflowWrap: "anywhere" }}>
          <div className="eyebrow">Booking confirmation</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)", maxWidth: 680, lineHeight: 1.08 }}>
            Thank you for your booking!
          </h1>
          <p className="lead" style={{ marginTop: "0.5rem", maxWidth: 720, lineHeight: 1.65 }}>
            Your booking request has been received. We have placed a temporary card hold and are waiting for provider confirmation.
          </p>
          <div className="panel" style={{ marginTop: "1rem", background: "var(--color-surface-muted)", padding: "1rem 1.1rem" }}>
            <strong style={{ display: "block", marginBottom: "0.45rem" }}>What happens next</strong>
            <ol style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--color-text-muted)", lineHeight: 1.65, display: "grid", gap: "0.45rem" }}>
              <li>We send your booking request for confirmation.</li>
              <li>Your card stays on temporary hold while you wait.</li>
              <li>Once confirmed, payment is captured and your status updates.</li>
            </ol>
          </div>
          <div className="quote-summary-list" style={{ marginTop: "1.25rem" }}>
            <div><span>Booking reference</span><strong>{reference}</strong></div>
            <div><span>Provider</span><strong>{providerName}</strong></div>
            <div><span>Status</span><strong>{booking.bookingStatus.replace(/_/g, " ")}</strong></div>
            <div><span>Payment</span><strong>{getPaymentStatusLabel(paymentStatus)}</strong></div>
            <div><span>Total</span><strong>{money(booking.priceSnapshot?.customerTotalAmount)}</strong></div>
          </div>
          <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.6, maxWidth: 720 }}>
            {isCaptured
              ? <>Your service will be carried out by <strong>{providerName}</strong>, an independent provider arranged through AreaSorted.</>
              : <>A verified local provider is reviewing your booking. You are only charged once the provider confirms the job. Most booking requests are reviewed within 24 hours.</>}
          </p>
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href={`/booking/status/${reference}${accessToken ? `?${QUOTE_ACCESS_PARAM}=${encodeURIComponent(accessToken)}` : ""}`} className="button button-primary">
              View booking status
            </Link>
            <Link href="/account/bookings" className="button button-secondary">
              Manage in my account
            </Link>
            {rebookHref ? (
              <Link href={rebookHref} className="button button-secondary">
                Book this provider again
              </Link>
            ) : null}
            <Link href="/support" className="button button-secondary">
              Get support
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
