import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminTranslations } from "@/lib/i18n/server";
import { getPrisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import { confirmBookingOnBehalfAction, createAdminRefundAction, updateBookingStatusAction } from "./actions";
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

  const t = await getAdminTranslations();
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
          &larr; {t.common.back}
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{bookingRef}</h1>
          <p className="text-muted-foreground">
            {t.orderDetail.reviewInfo}
          </p>
        </div>
        {showInvoice && (
          <Link
            href={`/admin/orders/${reference}/invoice`}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90"
          >
            {t.orderDetail.viewReconciliation}
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

      <div className="grid gap-3 md:grid-cols-5">
        <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">{t.orderDetail.booking}</div><div className="mt-2"><Badge>{booking.bookingStatus}</Badge></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">{t.orderDetail.payment}</div><div className="mt-2"><Badge variant={getPaymentStatusVariant(paymentStatus)}>{getPaymentStatusLabel(paymentStatus)}</Badge></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">{t.orderDetail.refund}</div><div className="mt-2"><Badge variant="outline">{booking.refundRecords[0]?.status || "NONE"}</Badge></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">{t.orderDetail.payoutLabel}</div><div className="mt-2"><Badge variant="outline">{latestPayoutRecord?.status || "NONE"}</Badge></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">{t.orderDetail.paymentMode}</div><div className="mt-2"><Badge variant={isMockCapturedPayment ? "destructive" : "secondary"}>{isMockCapturedPayment ? t.orderDetail.mock : t.orderDetail.liveMode}</Badge></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.orderDetail.statusGuide}</CardTitle>
          <CardDescription>{t.orderDetail.statusGuideDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm">
          <div><div className="font-medium mb-1">{t.orderDetail.booking}</div><div className="space-y-1 text-muted-foreground"><p><strong className="text-foreground">{t.orderDetail.pendingAssignment}</strong> - {t.orderDetail.pendingAssignmentDesc}</p><p><strong className="text-foreground">{t.orderDetail.assignedInProgress}</strong> - {t.orderDetail.assignedInProgressDesc}</p><p><strong className="text-foreground">{t.orderDetail.completedStatus}</strong> - {t.orderDetail.completedStatusDesc}</p><p><strong className="text-foreground">{t.orderDetail.cancelledRefunded}</strong> - {t.orderDetail.cancelledRefundedDesc}</p></div></div>
          <div><div className="font-medium mb-1">{t.orderDetail.payment}</div><div className="space-y-1 text-muted-foreground"><p><strong className="text-foreground">{t.orderDetail.paymentPending}</strong> - {t.orderDetail.paymentPendingDesc}</p><p><strong className="text-foreground">{t.orderDetail.paymentPaid}</strong> - {t.orderDetail.paymentPaidDesc}</p><p><strong className="text-foreground">{t.orderDetail.partiallyRefunded}</strong> - {t.orderDetail.partiallyRefundedDesc}</p><p><strong className="text-foreground">{t.orderDetail.paymentRefunded}</strong> - {t.orderDetail.paymentRefundedDesc}</p></div></div>
          <div><div className="font-medium mb-1">{t.orderDetail.refund}</div><div className="space-y-1 text-muted-foreground"><p><strong className="text-foreground">{t.orderDetail.refundNone}</strong> - {t.orderDetail.refundNoneDesc}</p><p><strong className="text-foreground">{t.orderDetail.refundPending}</strong> - {t.orderDetail.refundPendingDesc}</p><p><strong className="text-foreground">{t.orderDetail.refundProcessed}</strong> - {t.orderDetail.refundProcessedDesc}</p></div></div>
          <div><div className="font-medium mb-1">{t.orderDetail.payoutLabel}</div><div className="space-y-1 text-muted-foreground"><p><strong className="text-foreground">{t.orderDetail.payoutOnHold}</strong> - {t.orderDetail.payoutOnHoldDesc}</p><p><strong className="text-foreground">{t.orderDetail.payoutEligible}</strong> - {t.orderDetail.payoutEligibleDesc}</p><p><strong className="text-foreground">{t.orderDetail.payoutReleased}</strong> - {t.orderDetail.payoutReleasedDesc}</p><p><strong className="text-foreground">{t.orderDetail.payoutBlocked}</strong> - {t.orderDetail.payoutBlockedDesc}</p></div></div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — info cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle>{t.orderDetail.customerSection}</CardTitle>
              <CardDescription>{t.orderDetail.contactAndCustomerDetails}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">{t.common.name}</dt>
                  <dd className="font-medium">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.common.email}</dt>
                  <dd className="font-medium">{booking.customer.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.common.phone}</dt>
                  <dd className="font-medium">{booking.customer.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.bookingStatus}</dt>
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
              <CardTitle>{t.orderDetail.providerAssignment}</CardTitle>
              <CardDescription>{t.orderDetail.assignedProviderDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.providerCompany}</dt>
                  <dd className="font-medium">{providerName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.providerEmail}</dt>
                  <dd className="font-medium">{providerEmail}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.assignedCleaner}</dt>
                  <dd className="font-medium">
                    {assignedCleaner
                      ? `${assignedCleaner.firstName} ${assignedCleaner.lastName}`
                      : t.orderDetail.unassigned}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.cleanerEmail}</dt>
                  <dd className="font-medium">{assignedCleaner?.email || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.cleanerPayout}</dt>
                  <dd className="font-medium tabular-nums">
                    &pound;{dec(booking.cleanerPayoutAmount).toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.platformMargin}</dt>
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
              <CardTitle>{t.orderDetail.serviceDetails}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orders.service}</dt>
                  <dd className="font-medium">{formatService(booking.serviceType)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.common.address}</dt>
                  <dd className="font-medium">{serviceAddress}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.serviceDate}</dt>
                  <dd className="font-medium">
                    {booking.scheduledDate.toISOString().slice(0, 10)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.serviceTime}</dt>
                  <dd className="font-medium">{booking.scheduledStartTime}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.duration}</dt>
                  <dd className="font-medium">{Number(booking.durationHours)} {t.orderDetail.hours}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.propertyType}</dt>
                  <dd className="font-medium">{booking.propertyType}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.bedrooms}</dt>
                  <dd className="font-medium">{booking.bedroomCount ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.bathrooms}</dt>
                  <dd className="font-medium">{booking.bathroomCount ?? "-"}</dd>
                </div>
                {booking.addons.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm text-muted-foreground">{t.orderDetail.addOns}</dt>
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
              <CardTitle>{t.common.notes}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.additionalNotes}</dt>
                  <dd className="font-medium">{booking.additionalNotes || t.common.none}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.entryNotes}</dt>
                  <dd className="font-medium">{entryNotes}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t.orderDetail.parkingNotes}</dt>
                  <dd className="font-medium">{parkingNotes}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Counter Offers (read-only — customers respond directly) */}
          {booking.counterOffers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t.orderDetail.counterOffers}</CardTitle>
                <CardDescription>
                  {booking.counterOffers.length} {booking.counterOffers.length !== 1 ? t.orderDetail.offers : t.orderDetail.offer} {t.orderDetail.counterOffersDesc}
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
                          {offer.status === "PENDING" ? t.orderDetail.awaitingCustomer : offer.status}
                        </Badge>
                      </div>

                      <dl className="grid gap-2 text-sm sm:grid-cols-3">
                        {offer.proposedPrice && (
                          <div>
                            <dt className="text-muted-foreground">{t.orderDetail.proposedPrice}</dt>
                            <dd className="font-medium tabular-nums">&pound;{Number(offer.proposedPrice).toFixed(2)}</dd>
                          </div>
                        )}
                        {offer.proposedDate && (
                          <div>
                            <dt className="text-muted-foreground">{t.orderDetail.proposedDate}</dt>
                            <dd className="font-medium">{offer.proposedDate.toISOString().slice(0, 10)}</dd>
                          </div>
                        )}
                        {offer.proposedStartTime && (
                          <div>
                            <dt className="text-muted-foreground">{t.orderDetail.proposedTime}</dt>
                            <dd className="font-medium">{offer.proposedStartTime}</dd>
                          </div>
                        )}
                      </dl>

                      {offer.message && (
                        <p className="text-sm text-muted-foreground italic">&ldquo;{offer.message}&rdquo;</p>
                      )}

                      {offer.responseNotes && (
                        <p className="text-xs text-muted-foreground">{t.orderDetail.customerResponse} {offer.responseNotes}</p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {t.orderDetail.submitted} {offer.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                        {offer.respondedAt && ` · ${t.orderDetail.responded} ${offer.respondedAt.toISOString().slice(0, 19).replace("T", " ")}`}
                      </p>

                      {offer.status === "PENDING" && (
                        <p className="text-xs text-amber-600 font-medium">
                          {t.orderDetail.awaitingCustomerResponse}
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
                <CardTitle>{t.orderDetail.priceBreakdown}</CardTitle>
                <CardDescription>{t.orderDetail.frozenAtBooking}</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">{t.orderDetail.providerServiceAmount}</dt>
                    <dd className="font-medium tabular-nums">
                      &pound;{dec(booking.priceSnapshot.providerServiceAmount).toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">{t.orderDetail.bookingFee}</dt>
                    <dd className="font-medium tabular-nums">
                      &pound;{dec(booking.priceSnapshot.platformBookingFee).toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">{t.orderDetail.commission}</dt>
                    <dd className="font-medium tabular-nums">
                      &pound;{dec(booking.priceSnapshot.platformCommissionAmount).toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">{t.orderDetail.customerTotal}</dt>
                    <dd className="font-medium tabular-nums">
                      &pound;{dec(booking.priceSnapshot.customerTotalAmount).toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">{t.orderDetail.providerExpectedPayout}</dt>
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
                <CardTitle>{t.orderDetail.providerConfirmOverride}</CardTitle>
                <CardDescription>
                  {t.orderDetail.providerConfirmOverrideDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={confirmBookingOnBehalfAction} className="space-y-3">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <button
                    type="submit"
                    className="inline-flex h-9 w-full items-center justify-center rounded-md bg-amber-600 px-4 text-sm font-medium text-white shadow hover:bg-amber-700"
                  >
                    {t.orderDetail.confirmOnBehalf}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {t.orderDetail.confirmOnBehalfHelp}
                  </p>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t.orderDetail.updateStatus}</CardTitle>
              <CardDescription>{t.orderDetail.changeWorkflowState}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateBookingStatusAction} className="space-y-4">
                <input type="hidden" name="bookingId" value={booking.id} />

                <div>
                  <Label htmlFor="bookingStatus">{t.orderDetail.bookingStatus}</Label>
                  <select
                    id="bookingStatus"
                    name="bookingStatus"
                    defaultValue={booking.bookingStatus}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="AWAITING_PAYMENT">{t.orderDetail.awaitingPaymentStatus}</option>
                    <option value="PAID">{t.orderDetail.capturedStatus}</option>
                    <option value="PENDING_ASSIGNMENT">{t.orderDetail.authorisedHoldStatus}</option>
                    <option value="ASSIGNED">{t.orderDetail.assignedStatus}</option>
                    <option value="IN_PROGRESS">{t.orderDetail.inProgressStatus}</option>
                    <option value="COMPLETED">{t.orderDetail.completedOrderStatus}</option>
                    <option value="CANCELLED">{t.orderDetail.cancelledStatus}</option>
                    <option value="NO_CLEANER_FOUND">{t.orderDetail.noCleaner}</option>
                    <option value="REFUND_PENDING">{t.orderDetail.refundPendingStatus}</option>
                    <option value="REFUNDED">{t.orderDetail.refundedStatus}</option>
                  </select>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="cleanerPayoutAmount">{t.orderDetail.cleanerPayoutLabel}</Label>
                  <Input
                    id="cleanerPayoutAmount"
                    name="cleanerPayoutAmount"
                    type="number"
                    step="0.01"
                    defaultValue={dec(booking.cleanerPayoutAmount)}
                  />
                </div>

                <div>
                  <Label htmlFor="platformMarginAmount">{t.orderDetail.platformMarginLabel}</Label>
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
                  {t.orderDetail.saveChanges}
                </button>
              </form>
            </CardContent>
          </Card>

          {latestPaymentRecord?.paymentState === "PAID" && (
            <Card className="border-red-200 bg-red-50/40">
              <CardHeader>
                <CardTitle>{t.orderDetail.refundControls}</CardTitle>
                <CardDescription>
                  {t.orderDetail.refundControlsDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isMockCapturedPayment ? (
                  <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {t.orderDetail.mockPaymentWarning}
                  </div>
                ) : null}
                <form action={createAdminRefundAction} className="space-y-4">
                  <input type="hidden" name="bookingId" value={booking.id} />

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="submit"
                      name="policyShortcut"
                      value="PROVIDER_NO_SHOW"
                      className="inline-flex h-9 w-full items-center justify-center rounded-md border border-red-300 bg-white px-4 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
                    >
                      {t.orderDetail.providerNoShow.replace("{amount}", capturedAmount.toFixed(2))}
                    </button>
                    <button
                      type="submit"
                      name="policyShortcut"
                      value="CUSTOMER_LATE_CANCEL"
                      className="inline-flex h-9 w-full items-center justify-center rounded-md border border-amber-300 bg-white px-4 text-sm font-medium text-amber-700 shadow-sm hover:bg-amber-50"
                    >
                      {t.orderDetail.customerLateCancel.replace("{amount}", lateCancelRefundAmount.toFixed(2))}
                    </button>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="refundType">{t.orderDetail.refundType}</Label>
                    <select
                      id="refundType"
                      name="refundType"
                      defaultValue="FULL"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="FULL">{t.orderDetail.fullRefund}</option>
                      <option value="PARTIAL">{t.orderDetail.partialRefund}</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="partialAmount">{t.orderDetail.partialRefundAmount}</Label>
                    <Input id="partialAmount" name="partialAmount" type="number" step="0.01" min="0" placeholder={t.orderDetail.partialRefundOnly} />
                  </div>

                  <div>
                    <Label htmlFor="reason">{t.orderDetail.stripeReason}</Label>
                    <select
                      id="reason"
                      name="reason"
                      defaultValue="requested_by_customer"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="requested_by_customer">{t.orderDetail.requestedByCustomer}</option>
                      <option value="duplicate">{t.orderDetail.duplicate}</option>
                      <option value="fraudulent">{t.orderDetail.fraudulent}</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="policyNote">{t.orderDetail.policyNote}</Label>
                    <textarea
                      id="policyNote"
                      name="policyNote"
                      rows={3}
                      className="flex min-h-[84px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder={t.orderDetail.policyNotePlaceholder}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmAmount">{t.orderDetail.confirmRefundAmount}</Label>
                    <Input id="confirmAmount" name="confirmAmount" type="number" step="0.01" min="0" placeholder={t.orderDetail.enterExactRefund} required />
                  </div>

                  <div>
                    <Label htmlFor="adminPassword">{t.orderDetail.adminPassword}</Label>
                    <Input id="adminPassword" name="adminPassword" type="password" autoComplete="current-password" required />
                  </div>

                  <label className="flex items-start gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-xs text-red-800">
                    <input type="checkbox" name="acknowledgeRefund" className="mt-0.5" required />
                    <span>{t.orderDetail.refundConfirmCheckbox}</span>
                  </label>

                  <button
                    type="submit"
                    className="inline-flex h-9 w-full items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white shadow hover:bg-red-700"
                  >
                    {t.orderDetail.createRefund}
                  </button>
                </form>
              </CardContent>
            </Card>
          )}

          {(booking.refundRecords.length > 0 || booking.invoiceRecords.length > 0 || refundAuditLogs.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>{t.orderDetail.refundHistory}</CardTitle>
                <CardDescription>{t.orderDetail.refundHistoryDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.refundRecords.map((refund) => (
                  <div key={refund.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <strong>&pound;{Number(refund.amount).toFixed(2)}</strong>
                      <Badge variant="outline">{refund.status}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{refund.refundReason || t.orderDetail.noRefundNote}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{refund.createdAt.toISOString().slice(0, 19).replace("T", " ")}</p>
                  </div>
                ))}

                {booking.invoiceRecords.map((invoice) => (
                  <div key={invoice.id} className="rounded-md border p-3 text-sm bg-muted/20">
                    <div className="flex items-center justify-between gap-3">
                      <strong>{invoice.number}</strong>
                      <span className="text-muted-foreground">{t.orderDetail.refundNote}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{t.common.amount}: &pound;{Number(invoice.totalAmount).toFixed(2)}</p>
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
              <CardDescription>{booking.bookingStatus === "PENDING_ASSIGNMENT" ? t.orderDetail.authorisedAmount : t.orderDetail.capturedAmount}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                &pound;{dec(booking.totalAmount).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t.orderDetail.paymentStatus}</dt>
                  <dd>
                    <Badge variant={getPaymentStatusVariant(paymentStatus)}>{getPaymentStatusLabel(paymentStatus)}</Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t.orderDetail.jobStatus}</dt>
                  <dd>
                    <Badge>{latestJob?.jobStatus || "CREATED"}</Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t.orderDetail.assignment}</dt>
                  <dd>
                    <Badge>{latestAssignment?.assignmentStatus || "UNASSIGNED"}</Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t.orderDetail.payoutStatus}</dt>
                  <dd>
                    <Badge variant="outline">{latestPayoutRecord?.status || "NONE"}</Badge>
                  </dd>
                </div>
              </dl>
              <Separator className="my-3" />
              <p className="text-xs text-muted-foreground">
                {t.orderDetail.stripeSession} {stripeSessionId}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.common.created}: {booking.createdAt.toISOString().slice(0, 19).replace("T", " ")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.common.updated}: {booking.updatedAt.toISOString().slice(0, 19).replace("T", " ")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
