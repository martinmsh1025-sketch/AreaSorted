import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProviderOrdersAccess } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  acceptBookingAction,
  rejectBookingAction,
  startBookingAction,
  completeBookingAction,
  requestOrderSupportAction,
} from "../actions";
import {
  AcceptOrderButton,
  DeclineOrderButton,
  StartJobButton,
  CompleteJobButton,
} from "@/components/provider/order-action-dialogs";
import {
  CounterOfferButton,
  CounterOffersList,
} from "@/components/provider/counter-offer-dialogs";
import {
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ExternalLink,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { serviceTypeLabels, propertyTypeLabels, formatEnumLabel } from "@/lib/providers/service-catalog-mapping";
import { formatPreferredScheduleOption, parsePreferredScheduleOptions } from "@/lib/quotes/preferred-schedule";
import { formatMoney } from "@/lib/format";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  AWAITING_PAYMENT: "outline",
  PAID: "default",
  PENDING_ASSIGNMENT: "default",
  ASSIGNED: "secondary",
  IN_PROGRESS: "secondary",
  COMPLETED: "default",
  CANCELLED: "destructive",
  NO_CLEANER_FOUND: "destructive",
  REFUND_PENDING: "outline",
  REFUNDED: "outline",
};

const statusLabel: Record<string, string> = {
  AWAITING_PAYMENT: "Awaiting Payment",
  PAID: "Captured",
  PENDING_ASSIGNMENT: "Authorised — Needs Confirmation",
  ASSIGNED: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_CLEANER_FOUND: "Declined",
  REFUND_PENDING: "Refund Pending",
  REFUNDED: "Refunded",
};

function buildGoogleMapsUrl(booking: {
  serviceAddressLine1: string;
  serviceAddressLine2: string | null;
  serviceCity: string;
  servicePostcode: string;
}) {
  const parts = [
    booking.serviceAddressLine1,
    booking.serviceAddressLine2,
    booking.serviceCity,
    booking.servicePostcode,
  ].filter(Boolean);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
}

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderOrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  const session = await requireProviderOrdersAccess();
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const prisma = getPrisma();

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      providerCompanyId: session.providerCompany.id,
    },
    include: {
      // M-17 FIX: Exclude passwordHash from customer data
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      priceSnapshot: true,
      quoteRequest: true,
      payments: true,
      // M-18 FIX: Exclude sensitive Stripe IDs from payment records sent to provider
      paymentRecords: {
        select: {
          id: true,
          paymentState: true,
          grossAmount: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      counterOffers: {
        where: { providerCompanyId: session.providerCompany.id },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!booking) notFound();

  const needsAcceptance = booking.bookingStatus === "PENDING_ASSIGNMENT";
  const isAssigned = booking.bookingStatus === "ASSIGNED";
  const isInProgress = booking.bookingStatus === "IN_PROGRESS";
  const showInvoice = ["PAID", "ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(booking.bookingStatus);

  const hasPendingCounterOffer = booking.counterOffers.some((co) => co.status === "PENDING");
  const supportStatus = typeof resolvedSearchParams.supportStatus === "string" ? resolvedSearchParams.supportStatus : "";
  const supportError = typeof resolvedSearchParams.supportError === "string" ? resolvedSearchParams.supportError : "";
  const counterOffers = booking.counterOffers.map((co) => ({
    id: co.id,
    proposedPrice: co.proposedPrice ? Number(co.proposedPrice) : null,
    proposedDate: co.proposedDate ? co.proposedDate.toISOString() : null,
    proposedStartTime: co.proposedStartTime,
    message: co.message,
    status: co.status,
    responseNotes: co.responseNotes,
    createdAt: co.createdAt.toISOString(),
    respondedAt: co.respondedAt ? co.respondedAt.toISOString() : null,
  }));

  const currentPrice = booking.priceSnapshot
    ? Number(booking.priceSnapshot.providerExpectedPayout)
    : Number(booking.cleanerPayoutAmount || booking.totalAmount);

  const scheduledDateFormatted = new Date(booking.scheduledDate).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeSlot = booking.scheduledStartTime
    ? `${booking.scheduledStartTime}${booking.scheduledEndTime ? ` — ${booking.scheduledEndTime}` : ""}`
    : null;

  const customerName = booking.customer
    ? `${booking.customer.firstName} ${booking.customer.lastName}`
    : "—";

  const mapsUrl = buildGoogleMapsUrl(booking);
  const preferredScheduleOptions = parsePreferredScheduleOptions(booking.quoteRequest?.inputJson);

  return (
    <div className="space-y-6">
      {/* ─── Breadcrumb + Header ─── */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/provider/orders" className="hover:underline">
            My Orders
          </Link>
          <span>/</span>
          <span>{booking.id.slice(0, 8)}...</span>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Order #{booking.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {serviceTypeLabels[booking.serviceType] || formatEnumLabel(booking.serviceType)} — {booking.servicePostcode}
            </p>
          </div>
          <Badge variant={statusVariant[booking.bookingStatus] || "outline"} className="text-sm w-fit">
            {statusLabel[booking.bookingStatus] || booking.bookingStatus}
          </Badge>
        </div>
      </div>

      {/* ─── Quick reference bar ─── */}
      <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <span className="flex items-center gap-1.5">
          <Calendar className="size-4 text-muted-foreground" />
          {scheduledDateFormatted}
        </span>
        {timeSlot && (
          <span className="flex items-center gap-1.5">
            <Clock className="size-4 text-muted-foreground" />
            {timeSlot}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <MapPin className="size-4 text-muted-foreground" />
          {booking.servicePostcode}
        </span>
        <span className="flex items-center gap-1.5">
          <User className="size-4 text-muted-foreground" />
          {customerName}
        </span>
        <span className="ml-auto font-semibold text-green-700 dark:text-green-400">
          {booking.priceSnapshot
            ? formatMoney(Number(booking.priceSnapshot.providerExpectedPayout))
            : formatMoney(Number(booking.cleanerPayoutAmount || booking.totalAmount))}
          {" "}payout
        </span>
      </div>

      {/* ─── Action bar: needs acceptance ─── */}
      {needsAcceptance && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/10">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">This order needs your response</p>
              <p className="text-sm text-muted-foreground">
                Accept to confirm you will handle this job and capture payment, or decline to release the card hold.
                {!hasPendingCounterOffer && " You can also make a counter offer."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AcceptOrderButton bookingId={booking.id} action={acceptBookingAction} />
              {!hasPendingCounterOffer && (
                <CounterOfferButton
                  bookingId={booking.id}
                  currentPrice={currentPrice}
                  currentDate={scheduledDateFormatted}
                />
              )}
              <DeclineOrderButton bookingId={booking.id} action={rejectBookingAction} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Action bar: accepted ─── */}
      {isAssigned && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/10">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">You have accepted this order</p>
              <p className="text-sm text-muted-foreground">
                Mark it as in-progress when you start the job.
              </p>
            </div>
            <StartJobButton bookingId={booking.id} action={startBookingAction} />
          </CardContent>
        </Card>
      )}

      {/* ─── Action bar: in progress ─── */}
      {isInProgress && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/10">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Job is in progress</p>
              <p className="text-sm text-muted-foreground">
                Mark it as completed when the work is done.
              </p>
            </div>
            <CompleteJobButton bookingId={booking.id} action={completeBookingAction} />
          </CardContent>
        </Card>
      )}

      {supportStatus && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-300">
          {supportStatus}
        </div>
      )}

      {supportError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
          {supportError}
        </div>
      )}

      {(isAssigned || isInProgress) && (
        <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/10">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Need to change or report something?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you need to request a reschedule, report an issue, or ask support to cancel this accepted job, send the details here. Support will review the request before any booking changes are made.
            </p>
            <form action={requestOrderSupportAction} className="space-y-4">
              <input type="hidden" name="bookingId" value={booking.id} />
              <div className="space-y-2">
                <Label htmlFor="message">What happened?</Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  minLength={10}
                  placeholder="Add the reason, what has changed, and what you need support to do."
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="submit" name="requestType" value="RESCHEDULE" className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
                  Request reschedule
                </button>
                <button type="submit" name="requestType" value="ISSUE" className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
                  Report issue
                </button>
                <button type="submit" name="requestType" value="CANCEL" className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow hover:bg-blue-700">
                  Request cancellation
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ─── Detail cards ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Service details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Service type" value={serviceTypeLabels[booking.serviceType] || formatEnumLabel(booking.serviceType)} />
            <Row label="Property type" value={propertyTypeLabels[booking.propertyType] || formatEnumLabel(booking.propertyType)} />
            {booking.bedroomCount != null && (
              <Row label="Bedrooms" value={String(booking.bedroomCount)} />
            )}
            {booking.bathroomCount != null && (
              <Row label="Bathrooms" value={String(booking.bathroomCount)} />
            )}
            <Row label="Duration" value={`${Number(booking.durationHours)} hours`} />
            <Row
              label="Cleaning supplies"
              value={booking.customerProvidesSupplies ? "Customer provides" : "Provider brings"}
            />
            <Separator />
            <Row label="Scheduled date" value={scheduledDateFormatted} />
            {timeSlot && <Row label="Time" value={timeSlot} />}
            {preferredScheduleOptions.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Customer flexibility</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {preferredScheduleOptions.map((option) => (
                    <span key={`${option.date}-${option.time}`} className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium">
                      {formatPreferredScheduleOption(option)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {booking.additionalNotes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Customer notes</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{booking.additionalNotes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Location with map link */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Location</CardTitle>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                Open in Maps
                <ExternalLink className="size-3" />
              </a>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Address" value={booking.serviceAddressLine1} />
            {booking.serviceAddressLine2 && (
              <Row label="" value={booking.serviceAddressLine2} />
            )}
            <Row label="City" value={booking.serviceCity} />
            <Row label="Postcode" value={booking.servicePostcode} />
            <Separator />
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
            >
              <MapPin className="size-4" />
              Get directions
              <ExternalLink className="ml-auto size-3" />
            </a>
          </CardContent>
        </Card>

        {/* Customer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{customerName}</span>
            </div>
            {booking.customer?.email && (
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <a
                  href={`mailto:${booking.customer.email}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {booking.customer.email}
                </a>
              </div>
            )}
            {booking.customer?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                <a
                  href={`tel:${booking.customer.phone}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {booking.customer.phone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Total amount" value={formatMoney(Number(booking.totalAmount))} />
            {booking.priceSnapshot && (
              <>
                <Row
                  label="Booking fee"
                  value={formatMoney(Number(booking.priceSnapshot.platformBookingFee))}
                />
                <Row
                  label="Platform commission"
                  value={`-${formatMoney(Number(booking.priceSnapshot.platformCommissionAmount))}`}
                />
                <Separator />
                <div className="flex items-baseline justify-between gap-4 rounded-md bg-green-50 px-3 py-2 dark:bg-green-950/20">
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Your payout
                  </span>
                  <span className="text-sm font-bold text-green-700 dark:text-green-400">
                    {formatMoney(Number(booking.priceSnapshot.providerExpectedPayout))}
                  </span>
                </div>
              </>
            )}
            {!booking.priceSnapshot && booking.cleanerPayoutAmount && (
              <>
                <Row
                  label="Your payout"
                  value={formatMoney(Number(booking.cleanerPayoutAmount))}
                />
                {booking.platformMarginAmount && (
                  <Row
                    label="Platform fee"
                    value={formatMoney(Number(booking.platformMarginAmount))}
                  />
                )}
              </>
            )}
            <Separator />
            <Row
              label="Created"
              value={new Date(booking.createdAt).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          </CardContent>
        </Card>
      </div>

      {/* ─── Counter Offers ─── */}
      {counterOffers.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <CounterOffersList offers={counterOffers} />
          </CardContent>
        </Card>
      )}

      {/* ─── Footer actions ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/provider/orders"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          Back to Orders
        </Link>
        {showInvoice && (
          <Link
            href={`/provider/orders/${id}/invoice`}
            className="inline-flex h-9 items-center gap-1.5 justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            <FileText className="size-3.5" />
            View Remittance Advice
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
