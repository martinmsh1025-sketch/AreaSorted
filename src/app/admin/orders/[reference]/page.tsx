import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import { applyRefundPolicyAction, confirmBookingOnBehalfAction, createAdminRefundAction, updateBookingStatusAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getDisplayPaymentStatus, getPaymentStatusLabel, getPaymentStatusVariant } from "@/lib/payments/display-status";

function dec(value: Decimal | null | undefined): number {
  return value ? Number(value) : 0;
}

function formatService(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

type AdminBookingDetailPageProps = {
  params: Promise<{ reference: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBookingDetailPage({ params, searchParams }: AdminBookingDetailPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const { reference } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const prisma = getPrisma();

  const booking = await prisma.booking.findUnique({
    where: { id: reference },
    include: {
      customer: true,
      customerAddress: true,
      marketplaceProviderCompany: {
        select: { id: true, tradingName: true, legalName: true, contactEmail: true },
      },
      payments: { orderBy: { createdAt: "desc" } },
      paymentRecords: { orderBy: { createdAt: "desc" } },
      payoutRecords: { orderBy: { createdAt: "desc" } },
      jobs: {
        include: {
          assignedCleaner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      jobAssignments: {
        include: {
          cleaner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      refunds: { orderBy: { createdAt: "desc" } },
      refundRecords: { orderBy: { createdAt: "desc" } },
      invoiceRecords: {
        where: { strategy: "REFUND_ADJUSTMENT_NOTE" },
        orderBy: { createdAt: "desc" },
      },
      addons: true,
      priceSnapshot: true,
      quoteRequest: { select: { reference: true } },
      counterOffers: {
        include: {
          providerCompany: { select: { tradingName: true, legalName: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!booking) notFound();

  const refundAuditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "BOOKING",
      entityId: booking.id,
      actionType: { in: ["ADMIN_FULL_REFUND_CREATED", "ADMIN_PARTIAL_REFUND_CREATED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  const serviceAddress = [
    booking.serviceAddressLine1,
    booking.serviceAddressLine2,
    booking.serviceCity,
    booking.servicePostcode,
  ]
    .filter(Boolean)
    .join(", ");

  const customerAddress = booking.customerAddress;
  const entryNotes = customerAddress?.entryNotes || "-";
  const parkingNotes = customerAddress?.parkingNotes || "-";

  const providerName = booking.marketplaceProviderCompany
    ? booking.marketplaceProviderCompany.tradingName ||
      booking.marketplaceProviderCompany.legalName ||
      booking.marketplaceProviderCompany.contactEmail
    : "Unassigned";

  const providerEmail = booking.marketplaceProviderCompany?.contactEmail || "-";

  const latestJob = booking.jobs[0];
  const latestAssignment = booking.jobAssignments[0];
  const assignedCleaner = latestJob?.assignedCleaner || latestAssignment?.cleaner;

  const latestPaymentRecord = booking.paymentRecords[0];
  const latestPayment = booking.payments[0];

  const paymentStatus = latestPaymentRecord
    ? getDisplayPaymentStatus({
        paymentState: latestPaymentRecord.paymentState,
        metadataJson: latestPaymentRecord.metadataJson,
        bookingStatus: booking.bookingStatus,
      })
    : latestPayment
      ? latestPayment.paymentStatus
      : getDisplayPaymentStatus({ bookingStatus: booking.bookingStatus });

  const stripeSessionId = latestPaymentRecord?.stripeCheckoutSessionId || "-";
  const isMockCapturedPayment = Boolean(
    latestPaymentRecord?.paymentState === "PAID" &&
    latestPaymentRecord?.stripeCheckoutSessionId?.startsWith("mock_") &&
    !latestPaymentRecord?.stripePaymentIntentId
  );
  const latestPayoutRecord = booking.payoutRecords[0];
  const refundStatusMessage = typeof resolvedSearchParams.refundStatus === "string" ? resolvedSearchParams.refundStatus : "";
  const refundErrorMessage = typeof resolvedSearchParams.refundError === "string" ? resolvedSearchParams.refundError : "";

  const bookingRef = booking.quoteRequest?.reference || booking.id.slice(0, 12).toUpperCase();
  const capturedAmount = Number(latestPaymentRecord?.grossAmount ?? booking.totalAmount ?? 0);
  const bookingFeeAmount = dec(booking.priceSnapshot?.platformBookingFee);
  const lateCancelRefundAmount = Math.max(0, capturedAmount - bookingFeeAmount);

  const showInvoice = ["PAID", "ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(booking.bookingStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          &larr; Back
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{bookingRef}</h1>
          <p className="text-muted-foreground">
            Booking detail &mdash; review information and update operational statuses.
          </p>
        </div>
        {showInvoice && (
          <Link
            href={`/admin/orders/${reference}/invoice`}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90"
          >
            View Reconciliation
          </Link>
        )}
      </div>

      {refundStatusMessage ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {refundStatusMessage}
        </div>
      ) : null}

      {refundErrorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {refundErrorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — info cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>Contact and customer details</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Name</dt>
                  <dd className="font-medium">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Email</dt>
                  <dd className="font-medium">{booking.customer.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{booking.customer.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Booking status</dt>
                  <dd>
                    <Badge>{booking.bookingStatus}</Badge>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Provider / Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Provider &amp; assignment</CardTitle>
              <CardDescription>Assigned provider company and cleaner</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Provider company</dt>
                  <dd className="font-medium">{providerName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Provider email</dt>
                  <dd className="font-medium">{providerEmail}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Assigned cleaner</dt>
                  <dd className="font-medium">
                    {assignedCleaner
                      ? `${assignedCleaner.firstName} ${assignedCleaner.lastName}`
                      : "Unassigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Cleaner email</dt>
                  <dd className="font-medium">{assignedCleaner?.email || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Cleaner payout</dt>
                  <dd className="font-medium tabular-nums">
                    &pound;{dec(booking.cleanerPayoutAmount).toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Platform margin</dt>
                  <dd className="font-medium tabular-nums">
                    &pound;{dec(booking.platformMarginAmount).toFixed(2)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Service details */}
          <Card>
            <CardHeader>
              <CardTitle>Service details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Service</dt>
                  <dd className="font-medium">{formatService(booking.serviceType)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Address</dt>
                  <dd className="font-medium">{serviceAddress}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Service date</dt>
                  <dd className="font-medium">
                    {booking.scheduledDate.toISOString().slice(0, 10)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Service time</dt>
                  <dd className="font-medium">{booking.scheduledStartTime}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Duration</dt>
                  <dd className="font-medium">{Number(booking.durationHours)} hours</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Property type</dt>
                  <dd className="font-medium">{booking.propertyType}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Bedrooms</dt>
                  <dd className="font-medium">{booking.bedroomCount ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Bathrooms</dt>
                  <dd className="font-medium">{booking.bathroomCount ?? "-"}</dd>
                </div>
                {booking.addons.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm text-muted-foreground">Add-ons</dt>
                    <dd className="font-medium">
                      {booking.addons.map((a) => `${a.addonName} (x${a.quantity})`).join(", ")}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted-foreground">Additional notes</dt>
                  <dd className="font-medium">{booking.additionalNotes || "None"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Entry notes</dt>
                  <dd className="font-medium">{entryNotes}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Parking notes</dt>
                  <dd className="font-medium">{parkingNotes}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Counter Offers (read-only — customers respond directly) */}
          {booking.counterOffers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Counter offers</CardTitle>
                <CardDescription>
                  {booking.counterOffers.length} offer{booking.counterOffers.length !== 1 ? "s" : ""} from provider — customers respond directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.counterOffers.map((offer) => {
                  const provName = offer.providerCompany.tradingName || offer.providerCompany.legalName || "Provider";
                  return (
                    <div key={offer.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{provName}</span>
                        <Badge
                          className={
                            offer.status === "ACCEPTED"
                              ? "bg-green-100 text-green-800"
                              : offer.status === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : offer.status === "WITHDRAWN"
                                  ? "bg-gray-100 text-gray-600"
                                  : offer.status === "EXPIRED"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                          }
                        >
                          {offer.status === "PENDING" ? "AWAITING CUSTOMER" : offer.status}
                        </Badge>
                      </div>

                      <dl className="grid gap-2 text-sm sm:grid-cols-3">
                        {offer.proposedPrice && (
                          <div>
                            <dt className="text-muted-foreground">Proposed price</dt>
                            <dd className="font-medium tabular-nums">&pound;{Number(offer.proposedPrice).toFixed(2)}</dd>
                          </div>
                        )}
                        {offer.proposedDate && (
                          <div>
                            <dt className="text-muted-foreground">Proposed date</dt>
                            <dd className="font-medium">{offer.proposedDate.toISOString().slice(0, 10)}</dd>
                          </div>
                        )}
                        {offer.proposedStartTime && (
                          <div>
                            <dt className="text-muted-foreground">Proposed time</dt>
                            <dd className="font-medium">{offer.proposedStartTime}</dd>
                          </div>
                        )}
                      </dl>

                      {offer.message && (
                        <p className="text-sm text-muted-foreground italic">&ldquo;{offer.message}&rdquo;</p>
                      )}

                      {offer.responseNotes && (
                        <p className="text-xs text-muted-foreground">Customer response: {offer.responseNotes}</p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Submitted {offer.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                        {offer.respondedAt && ` · Responded ${offer.respondedAt.toISOString().slice(0, 19).replace("T", " ")}`}
                      </p>

                      {offer.status === "PENDING" && (
                        <p className="text-xs text-amber-600 font-medium">
                          Awaiting customer response — counter offers are now handled directly between provider and customer.
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Price snapshot */}
          {booking.priceSnapshot && (
            <Card>
              <CardHeader>
                <CardTitle>Price breakdown</CardTitle>
                <CardDescription>Frozen at time of booking</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Provider service amount</dt>
                    <dd className="font-medium tabular-nums">
                      &pound;{dec(booking.priceSnapshot.providerServiceAmount).toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Booking fee</dt>
                    <dd className="font-medium tabular-nums">
                      &pound;{dec(booking.priceSnapshot.platformBookingFee).toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Commission</dt>
                    <dd className="font-medium tabular-nums">
                      &pound;{dec(booking.priceSnapshot.platformCommissionAmount).toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Customer total</dt>
                    <dd className="font-medium tabular-nums">
                      &pound;{dec(booking.priceSnapshot.customerTotalAmount).toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Provider expected payout</dt>
                    <dd className="font-medium tabular-nums">
                      &pound;{dec(booking.priceSnapshot.providerExpectedPayout).toFixed(2)}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — status controls + amount */}
        <div className="space-y-6">
          {booking.bookingStatus === "PENDING_ASSIGNMENT" && (
            <Card className="border-amber-200 bg-amber-50/60">
              <CardHeader>
                <CardTitle>Provider confirmation override</CardTitle>
                <CardDescription>
                  Use this only if the provider has confirmed offline and you need to capture the card hold on their behalf.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={confirmBookingOnBehalfAction} className="space-y-3">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <button
                    type="submit"
                    className="inline-flex h-9 w-full items-center justify-center rounded-md bg-amber-600 px-4 text-sm font-medium text-white shadow hover:bg-amber-700"
                  >
                    Confirm on behalf of provider
                  </button>
                  <p className="text-xs text-muted-foreground">
                    This captures the authorised payment and moves the booking to Assigned, the same way provider acceptance would.
                  </p>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
              <CardDescription>Change booking workflow state</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateBookingStatusAction} className="space-y-4">
                <input type="hidden" name="bookingId" value={booking.id} />

                <div>
                  <Label htmlFor="bookingStatus">Booking status</Label>
                  <select
                    id="bookingStatus"
                    name="bookingStatus"
                    defaultValue={booking.bookingStatus}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="AWAITING_PAYMENT">Awaiting payment</option>
                    <option value="PAID">Captured</option>
                    <option value="PENDING_ASSIGNMENT">Authorised hold</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="NO_CLEANER_FOUND">No cleaner found</option>
                    <option value="REFUND_PENDING">Refund pending</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="cleanerPayoutAmount">Cleaner payout (&pound;)</Label>
                  <Input
                    id="cleanerPayoutAmount"
                    name="cleanerPayoutAmount"
                    type="number"
                    step="0.01"
                    defaultValue={dec(booking.cleanerPayoutAmount)}
                  />
                </div>

                <div>
                  <Label htmlFor="platformMarginAmount">Platform margin (&pound;)</Label>
                  <Input
                    id="platformMarginAmount"
                    name="platformMarginAmount"
                    type="number"
                    step="0.01"
                    defaultValue={dec(booking.platformMarginAmount)}
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                >
                  Save changes
                </button>
              </form>
            </CardContent>
          </Card>

          {latestPaymentRecord?.paymentState === "PAID" && (
            <Card className="border-red-200 bg-red-50/40">
              <CardHeader>
                <CardTitle>Refund controls</CardTitle>
                <CardDescription>
                  Create a full or partial refund for this captured payment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isMockCapturedPayment ? (
                  <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    This is a mock/test payment. Refund actions here will update AreaSorted records only and will not send a real refund to Stripe.
                  </div>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-2 mb-4">
                  <form action={applyRefundPolicyAction} className="space-y-2">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="policy" value="PROVIDER_NO_SHOW" />
                    <input type="hidden" name="confirmAmount" value={capturedAmount.toFixed(2)} />
                    <input type="hidden" name="acknowledgeRefund" value="on" />
                    <Input name="adminPassword" type="password" autoComplete="current-password" placeholder="Admin password" required />
                    <button
                      type="submit"
                      className="inline-flex h-9 w-full items-center justify-center rounded-md border border-red-300 bg-white px-4 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
                    >
                      Provider no-show (refund {capturedAmount.toFixed(2)})
                    </button>
                  </form>
                  <form action={applyRefundPolicyAction} className="space-y-2">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="policy" value="CUSTOMER_LATE_CANCEL" />
                    <input type="hidden" name="confirmAmount" value={lateCancelRefundAmount.toFixed(2)} />
                    <input type="hidden" name="acknowledgeRefund" value="on" />
                    <Input name="adminPassword" type="password" autoComplete="current-password" placeholder="Admin password" required />
                    <button
                      type="submit"
                      className="inline-flex h-9 w-full items-center justify-center rounded-md border border-amber-300 bg-white px-4 text-sm font-medium text-amber-700 shadow-sm hover:bg-amber-50"
                    >
                      Customer late cancel (refund {lateCancelRefundAmount.toFixed(2)})
                    </button>
                  </form>
                </div>

                <Separator className="mb-4" />

                <form action={createAdminRefundAction} className="space-y-4">
                  <input type="hidden" name="bookingId" value={booking.id} />

                  <div>
                    <Label htmlFor="refundType">Refund type</Label>
                    <select
                      id="refundType"
                      name="refundType"
                      defaultValue="FULL"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="FULL">Full refund</option>
                      <option value="PARTIAL">Partial refund</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="partialAmount">Partial refund amount (&pound;)</Label>
                    <Input id="partialAmount" name="partialAmount" type="number" step="0.01" min="0" placeholder="Only used for partial refunds" />
                  </div>

                  <div>
                    <Label htmlFor="reason">Stripe reason</Label>
                    <select
                      id="reason"
                      name="reason"
                      defaultValue="requested_by_customer"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="requested_by_customer">Requested by customer</option>
                      <option value="duplicate">Duplicate</option>
                      <option value="fraudulent">Fraudulent</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="policyNote">Policy note</Label>
                    <textarea
                      id="policyNote"
                      name="policyNote"
                      rows={3}
                      className="flex min-h-[84px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="e.g. Provider no-show — full refund, or Customer cancelled within 24 hours — retain booking fee"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmAmount">Confirm final refund amount (&pound;)</Label>
                    <Input id="confirmAmount" name="confirmAmount" type="number" step="0.01" min="0" placeholder="Enter the exact refund amount to confirm" required />
                  </div>

                  <div>
                    <Label htmlFor="adminPassword">Admin password</Label>
                    <Input id="adminPassword" name="adminPassword" type="password" autoComplete="current-password" required />
                  </div>

                  <label className="flex items-start gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-xs text-red-800">
                    <input type="checkbox" name="acknowledgeRefund" className="mt-0.5" required />
                    <span>I confirm the refund amount above is correct and I want to proceed with this refund action.</span>
                  </label>

                  <button
                    type="submit"
                    className="inline-flex h-9 w-full items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white shadow hover:bg-red-700"
                  >
                    Create refund
                  </button>
                </form>
              </CardContent>
            </Card>
          )}

          {(booking.refundRecords.length > 0 || booking.invoiceRecords.length > 0 || refundAuditLogs.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Refund history</CardTitle>
                <CardDescription>Audit trail and reconciliation notes for refund activity on this booking.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.refundRecords.map((refund) => (
                  <div key={refund.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <strong>&pound;{Number(refund.amount).toFixed(2)}</strong>
                      <Badge variant="outline">{refund.status}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{refund.refundReason || "No refund note recorded."}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{refund.createdAt.toISOString().slice(0, 19).replace("T", " ")}</p>
                  </div>
                ))}

                {booking.invoiceRecords.map((invoice) => (
                  <div key={invoice.id} className="rounded-md border p-3 text-sm bg-muted/20">
                    <div className="flex items-center justify-between gap-3">
                      <strong>{invoice.number}</strong>
                      <span className="text-muted-foreground">Refund note</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">Amount: &pound;{Number(invoice.totalAmount).toFixed(2)}</p>
                  </div>
                ))}

                {refundAuditLogs.map((log) => (
                  <div key={log.id} className="rounded-md border p-3 text-xs text-muted-foreground">
                    <strong className="text-foreground">{log.actionType}</strong>
                    <div className="mt-1">{log.createdAt.toISOString().slice(0, 19).replace("T", " ")}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{booking.bookingStatus === "PENDING_ASSIGNMENT" ? "Authorised amount" : "Captured amount"}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                &pound;{dec(booking.totalAmount).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Payment status</dt>
                  <dd>
                    <Badge variant={getPaymentStatusVariant(paymentStatus)}>{getPaymentStatusLabel(paymentStatus)}</Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Job status</dt>
                  <dd>
                    <Badge>{latestJob?.jobStatus || "CREATED"}</Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Assignment</dt>
                  <dd>
                    <Badge>{latestAssignment?.assignmentStatus || "UNASSIGNED"}</Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Payout status</dt>
                  <dd>
                    <Badge variant="outline">{latestPayoutRecord?.status || "NONE"}</Badge>
                  </dd>
                </div>
              </dl>
              <Separator className="my-3" />
              <p className="text-xs text-muted-foreground">
                Stripe session: {stripeSessionId}
              </p>
              <p className="text-xs text-muted-foreground">
                Created: {booking.createdAt.toISOString().slice(0, 19).replace("T", " ")}
              </p>
              <p className="text-xs text-muted-foreground">
                Updated: {booking.updatedAt.toISOString().slice(0, 19).replace("T", " ")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
