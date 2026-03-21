import Link from "next/link";
import { requireProviderOrdersListAccess } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Prisma } from "@prisma/client";
import { acceptBookingAction, rejectBookingAction } from "./actions";
import { AcceptOrderButton, DeclineOrderButton } from "@/components/provider/order-action-dialogs";
import { Clock, CheckCircle, TrendingUp, ShoppingCart } from "lucide-react";
import { serviceTypeLabels, formatEnumLabel } from "@/lib/providers/service-catalog-mapping";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
}

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
  PAID: "New — Accept?",
  PENDING_ASSIGNMENT: "Pending — Accept?",
  ASSIGNED: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_CLEANER_FOUND: "Declined",
  REFUND_PENDING: "Refund Pending",
  REFUNDED: "Refunded",
};

type ProviderOrdersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQuickPickRange(period: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "daily") return { gte: startOfToday };
  if (period === "weekly") {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return { gte: d };
  }
  if (period === "monthly") return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  return null;
}

export default async function ProviderOrdersPage({ searchParams }: ProviderOrdersPageProps) {
  const session = await requireProviderOrdersListAccess();
  const prisma = getPrisma();
  const params = (await searchParams) ?? {};

  const period = typeof params.period === "string" ? params.period : "all";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : "";
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : "";

  let dateFilter: Prisma.BookingWhereInput = {};
  if (period === "custom" && (dateFrom || dateTo)) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.gte = new Date(`${dateFrom}T00:00:00`);
    if (dateTo) createdAt.lte = new Date(`${dateTo}T23:59:59.999`);
    dateFilter = { createdAt };
  } else {
    const range = getQuickPickRange(period);
    if (range) dateFilter = { createdAt: range };
  }

  const statusFilterClause: Prisma.BookingWhereInput = statusFilter
    ? { bookingStatus: statusFilter as any }
    : {};

  const bookings = await prisma.booking.findMany({
    where: {
      providerCompanyId: session.providerCompany.id,
      ...dateFilter,
      ...statusFilterClause,
    },
    include: {
      customer: true,
      priceSnapshot: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const filteredBookings = bookings.filter((booking) => {
    if (!query) return true;
    return [
      booking.id,
      booking.servicePostcode,
      booking.bookingStatus,
      booking.serviceType,
      booking.customer?.firstName,
      booking.customer?.lastName,
      booking.customer?.email,
      booking.customer?.phone,
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });

  // KPIs
  const pendingAcceptance = filteredBookings.filter((b) =>
    ["PAID", "PENDING_ASSIGNMENT"].includes(b.bookingStatus),
  ).length;
  const accepted = filteredBookings.filter((b) => b.bookingStatus === "ASSIGNED").length;
  const inProgress = filteredBookings.filter((b) => b.bookingStatus === "IN_PROGRESS").length;
  const completed = filteredBookings.filter((b) => b.bookingStatus === "COMPLETED").length;

  // Earnings
  const earningBookings = filteredBookings.filter((b) =>
    ["ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(b.bookingStatus),
  );
  const totalRevenue = earningBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
  const totalPayout = earningBookings.reduce(
    (sum, b) => sum + Number(b.priceSnapshot?.providerExpectedPayout ?? b.cleanerPayoutAmount ?? b.totalAmount),
    0,
  );
  const totalCommission = earningBookings.reduce(
    (sum, b) => sum + Number(b.priceSnapshot?.platformCommissionAmount ?? b.platformMarginAmount ?? 0),
    0,
  );

  const periodLabels: Record<string, string> = {
    all: "All time",
    daily: "Today",
    weekly: "This week",
    monthly: "This month",
    custom: dateFrom || dateTo ? `${dateFrom || "..."} to ${dateTo || "..."}` : "Custom range",
  };
  const periodLabel = periodLabels[period] || "All time";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">My Orders</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your bookings. Accept new orders and track progress.
        </p>
      </div>

      {/* ─── KPI cards ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={pendingAcceptance > 0 ? "border-amber-200 dark:border-amber-800" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-4" />
              Needs Acceptance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pendingAcceptance > 0 ? "text-amber-600" : ""}`}>
              {pendingAcceptance}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle className="size-4" />
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShoppingCart className="size-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Earnings ─── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Earnings — {periodLabel}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Based on accepted, in-progress, and completed orders.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Booking value</p>
              <p className="text-lg font-bold">{formatMoney(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Platform fees</p>
              <p className="text-lg font-bold text-destructive">-{formatMoney(totalCommission)}</p>
            </div>
            <div className="rounded-md bg-green-50 px-3 py-2 dark:bg-green-950/20">
              <p className="text-xs text-green-700 dark:text-green-400">Your payout</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                {formatMoney(totalPayout)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Filters ─── */}
      <Card>
        <CardContent className="pt-6">
          <form method="get" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <select
                  id="period"
                  name="period"
                  defaultValue={period}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="all">All time</option>
                  <option value="daily">Today</option>
                  <option value="weekly">This week</option>
                  <option value="monthly">This month</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From</Label>
                <Input type="date" id="dateFrom" name="dateFrom" defaultValue={dateFrom} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To</Label>
                <Input type="date" id="dateTo" name="dateTo" defaultValue={dateTo} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={statusFilter}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">All statuses</option>
                  <option value="PAID">Needs Acceptance</option>
                  <option value="PENDING_ASSIGNMENT">Pending Assignment</option>
                  <option value="ASSIGNED">Accepted</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_CLEANER_FOUND">Declined</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="q">Search</Label>
                <Input id="q" name="q" defaultValue={query} placeholder="Name, postcode, email..." />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <Link
                href="/provider/orders"
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
              >
                Reset
              </Link>
              {filteredBookings.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {filteredBookings.length} order{filteredBookings.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ─── Table ─── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Your Payout</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length ? (
                  filteredBookings.map((booking) => {
                    const needsAcceptance = ["PAID", "PENDING_ASSIGNMENT"].includes(
                      booking.bookingStatus,
                    );
                    const payout =
                      booking.priceSnapshot?.providerExpectedPayout ??
                      booking.cleanerPayoutAmount ??
                      null;
                    return (
                      <TableRow
                        key={booking.id}
                        className={needsAcceptance ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}
                      >
                        <TableCell className="font-medium">
                          <Link
                            href={`/provider/orders/${booking.id}`}
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            #{booking.id.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {booking.customer
                              ? `${booking.customer.firstName} ${booking.customer.lastName}`
                              : "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {serviceTypeLabels[booking.serviceType] || formatEnumLabel(booking.serviceType)}
                        </TableCell>
                        <TableCell className="text-sm">{booking.servicePostcode}</TableCell>
                        <TableCell className="text-sm">
                          <div>
                            {new Date(booking.scheduledDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {booking.scheduledStartTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusVariant[booking.bookingStatus] || "outline"}
                            className="text-xs"
                          >
                            {statusLabel[booking.bookingStatus] || booking.bookingStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {payout != null ? (
                            <span className="font-medium text-green-700 dark:text-green-400">
                              {formatMoney(Number(payout))}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {needsAcceptance ? (
                            <div className="flex items-center justify-end gap-1">
                              <AcceptOrderButton
                                bookingId={booking.id}
                                action={acceptBookingAction}
                                compact
                              />
                              <DeclineOrderButton
                                bookingId={booking.id}
                                action={rejectBookingAction}
                                compact
                              />
                            </div>
                          ) : (
                            <Link
                              href={`/provider/orders/${booking.id}`}
                              className="inline-flex h-7 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                            >
                              View
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      {session.providerCompany.status === "PRICING_PENDING"
                        ? "Your orders page is ready. Orders will appear here once your account goes live."
                        : "No orders found for the selected filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
