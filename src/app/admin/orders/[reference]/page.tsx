import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import { updateBookingStatusAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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
};

export default async function AdminBookingDetailPage({ params }: AdminBookingDetailPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const { reference } = await params;
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
    ? latestPaymentRecord.paymentState
    : latestPayment
      ? latestPayment.paymentStatus
      : booking.bookingStatus === "PAID" || booking.bookingStatus === "COMPLETED"
        ? "PAID"
        : "PENDING";

  const stripeSessionId = latestPaymentRecord?.stripeCheckoutSessionId || "-";

  const bookingRef = booking.quoteRequest?.reference || booking.id.slice(0, 12).toUpperCase();

  const showInvoice = ["PAID", "PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(booking.bookingStatus);

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
                    <option value="PAID">Paid</option>
                    <option value="PENDING_ASSIGNMENT">Pending assignment</option>
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

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total amount</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                &pound;{dec(booking.totalAmount).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Payment status</dt>
                  <dd>
                    <Badge>{paymentStatus}</Badge>
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
