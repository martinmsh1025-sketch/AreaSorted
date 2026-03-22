import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  getDisplayPaymentStatus,
  getPaymentStatusLabel,
  getPaymentStatusVariant,
} from "@/lib/payments/display-status";
import {
  RevenueTrendChart,
  StatusDistributionChart,
  ServiceTypeChart,
  DailyVolumeChart,
  ProviderLeaderboard,
  type BookingSummary,
} from "@/components/admin/bookings-dashboard-charts";

/* ---------- Helpers ---------- */

function formatService(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(value: Date | null) {
  if (!value) return "-";
  return value.toISOString().slice(0, 10);
}

function dec(value: Decimal | null | undefined): number {
  return value ? Number(value) : 0;
}

function bookingStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PAID":
    case "COMPLETED":
      return "default";
    case "CANCELLED":
    case "REFUNDED":
      return "destructive";
    case "IN_PROGRESS":
    case "ASSIGNED":
      return "secondary";
    default:
      return "outline";
  }
}

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
}

/* ---------- Page ---------- */

type AdminOrdersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const prisma = getPrisma();
  const params = (await searchParams) ?? {};
  const query =
    typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const bookingStatusFilter =
    typeof params.bookingStatus === "string" ? params.bookingStatus : "";
  const paymentFilter =
    typeof params.payment === "string" ? params.payment : "";
  const startDate =
    typeof params.startDate === "string" ? params.startDate : "";
  const endDate = typeof params.endDate === "string" ? params.endDate : "";
  const sortBy =
    typeof params.sortBy === "string" ? params.sortBy : "serviceDateDesc";
  const view = typeof params.view === "string" ? params.view : "dashboard";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStr = today.toISOString().slice(0, 10);

  // Periods for KPI comparison
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Build where clause for table
  const tableWhere: Prisma.BookingWhereInput = {};
  if (startDate || endDate) {
    tableWhere.scheduledDate = {};
    if (startDate) tableWhere.scheduledDate.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      tableWhere.scheduledDate.lte = end;
    }
  }
  if (bookingStatusFilter) {
    tableWhere.bookingStatus = bookingStatusFilter as any;
  }

  let orderBy: Prisma.BookingOrderByWithRelationInput;
  switch (sortBy) {
    case "serviceDateAsc":
      orderBy = { scheduledDate: "asc" };
      break;
    case "createdAtDesc":
      orderBy = { createdAt: "desc" };
      break;
    case "createdAtAsc":
      orderBy = { createdAt: "asc" };
      break;
    default:
      orderBy = { scheduledDate: "desc" };
  }

  const bookingInclude = {
    customer: true,
    marketplaceProviderCompany: {
      select: {
        id: true,
        tradingName: true,
        legalName: true,
        contactEmail: true,
      },
    },
    payments: {
      select: { paymentStatus: true, amount: true },
      orderBy: { createdAt: "desc" as const },
    },
      paymentRecords: {
      select: { paymentState: true, grossAmount: true, metadataJson: true },
      orderBy: { createdAt: "desc" as const },
    },
    jobs: {
      select: {
        jobStatus: true,
        assignedCleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" as const },
    },
    jobAssignments: {
      select: {
        assignmentStatus: true,
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" as const },
    },
    refunds: { select: { status: true, amount: true } },
    refundRecords: { select: { status: true, amount: true } },
    quoteRequest: { select: { reference: true } },
    priceSnapshot: {
      select: {
        providerExpectedPayout: true,
        platformBookingFee: true,
        platformCommissionAmount: true,
      },
    },
  } as const;

  // Fetch ALL bookings for dashboard (last 90 days for broader KPIs)
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const allBookings = await prisma.booking.findMany({
    where: {
      ...tableWhere,
      ...(view === "dashboard" && !startDate && !endDate
        ? { scheduledDate: { gte: ninetyDaysAgo } }
        : {}),
    },
    include: bookingInclude,
    orderBy,
  });

  // Also fetch recent bookings unconditionally for KPIs
  const kpiBookings =
    startDate || endDate || bookingStatusFilter
      ? await prisma.booking.findMany({
          where: { scheduledDate: { gte: ninetyDaysAgo } },
          include: bookingInclude,
          orderBy: { scheduledDate: "desc" },
        })
      : allBookings;

  // Text search filter
  const filteredBookings = allBookings.filter((booking) => {
    if (query) {
      const customerName =
        `${booking.customer.firstName} ${booking.customer.lastName}`.toLowerCase();
      const searchFields = [
        booking.id,
        booking.quoteRequest?.reference,
        customerName,
        booking.customer.email,
        booking.customer.phone,
        booking.servicePostcode,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      if (!searchFields.some((f) => f.includes(query))) return false;
    }
    if (paymentFilter) {
      const pr = booking.paymentRecords[0];
      const p = booking.payments[0];
      const paymentStatus = pr
        ? getDisplayPaymentStatus({
            paymentState: pr.paymentState,
            metadataJson: pr.metadataJson,
            bookingStatus: booking.bookingStatus,
          })
        : p
          ? p.paymentStatus
          : "PENDING";
      if (paymentStatus !== paymentFilter) return false;
    }
    return true;
  });

  // ---------- KPI calculations ----------

  function getProviderName(booking: (typeof allBookings)[0]) {
    const pc = booking.marketplaceProviderCompany;
    return pc
      ? pc.tradingName || pc.legalName || pc.contactEmail
      : "Unassigned";
  }

  function getPaymentStatus(booking: (typeof allBookings)[0]) {
    const pr = booking.paymentRecords[0];
    if (pr) {
      return getDisplayPaymentStatus({
        paymentState: pr.paymentState,
        metadataJson: pr.metadataJson,
        bookingStatus: booking.bookingStatus,
      });
    }
    const p = booking.payments[0];
    if (p) return p.paymentStatus;
    return getDisplayPaymentStatus({ bookingStatus: booking.bookingStatus });
  }

  function getJobStatus(booking: (typeof allBookings)[0]) {
    return booking.jobs[0]?.jobStatus || "CREATED";
  }

  function getBookingRef(booking: (typeof allBookings)[0]) {
    return (
      booking.quoteRequest?.reference || booking.id.slice(0, 12).toUpperCase()
    );
  }

  // Helper for KPI periods
  function periodStats(
    bookings: typeof kpiBookings,
    from: Date,
    to: Date
  ) {
    const inRange = bookings.filter(
      (b) => b.scheduledDate >= from && b.scheduledDate < to
    );
    const revenue = inRange.reduce(
      (s, b) =>
        s +
        (b.bookingStatus !== "AWAITING_PAYMENT" &&
        b.bookingStatus !== "CANCELLED"
          ? dec(b.totalAmount)
          : 0),
      0
    );
    const platformRevenue = inRange.reduce((s, b) => {
      if (b.priceSnapshot) {
        return (
          s +
          dec(b.priceSnapshot.platformBookingFee) +
          dec(b.priceSnapshot.platformCommissionAmount)
        );
      }
      return s + dec(b.platformMarginAmount);
    }, 0);
    const completed = inRange.filter(
      (b) => b.bookingStatus === "COMPLETED"
    ).length;
    const cancelled = inRange.filter(
      (b) =>
        b.bookingStatus === "CANCELLED" || b.bookingStatus === "REFUNDED"
    ).length;
    return {
      count: inRange.length,
      revenue,
      platformRevenue,
      completed,
      cancelled,
      avgOrderValue: inRange.length > 0 ? revenue / inRange.length : 0,
      completionRate:
        inRange.length > 0
          ? Math.round((completed / inRange.length) * 100)
          : 0,
    };
  }

  const thisWeek = periodStats(kpiBookings, weekAgo, tomorrow);
  const lastWeek = periodStats(kpiBookings, twoWeeksAgo, weekAgo);
  const thisMonth = periodStats(kpiBookings, monthAgo, tomorrow);
  const lastMonth = periodStats(kpiBookings, twoMonthsAgo, monthAgo);

  // Today stats
  const todaysJobs = kpiBookings
    .filter((b) => b.scheduledDate >= today && b.scheduledDate < tomorrow)
    .sort((a, b) => a.scheduledStartTime.localeCompare(b.scheduledStartTime));
  const todaysCompleted = todaysJobs.filter(
    (b) => b.bookingStatus === "COMPLETED"
  ).length;
  const todaysInProgress = todaysJobs.filter(
    (b) =>
      b.bookingStatus === "IN_PROGRESS" || b.bookingStatus === "ASSIGNED"
  ).length;
  const todaysRevenue = todaysJobs.reduce(
    (s, b) =>
      s +
      (b.bookingStatus !== "AWAITING_PAYMENT" ? dec(b.totalAmount) : 0),
    0
  );
  const todaysPending = todaysJobs.filter(
    (b) =>
      b.bookingStatus === "PAID" ||
      b.bookingStatus === "PENDING_ASSIGNMENT"
  ).length;

  // Chart data — last 30 days
  const chartBookings: BookingSummary[] = kpiBookings
    .filter((b) => b.scheduledDate >= thirtyDaysAgo)
    .map((b) => ({
      id: b.id,
      ref: getBookingRef(b),
      customerName: `${b.customer.firstName} ${b.customer.lastName}`,
      serviceType: b.serviceType,
      scheduledDate: b.scheduledDate.toISOString().slice(0, 10),
      totalAmount: dec(b.totalAmount),
      cleanerPayout: dec(b.cleanerPayoutAmount),
      platformMargin: dec(b.platformMarginAmount),
      bookingStatus: b.bookingStatus,
      paymentStatus: getPaymentStatus(b),
      providerName: getProviderName(b),
      createdAt: b.createdAt.toISOString().slice(0, 10),
    }));

  // Export params
  const exportParams = new URLSearchParams();
  if (startDate) exportParams.set("startDate", startDate);
  if (endDate) exportParams.set("endDate", endDate);
  if (paymentFilter) exportParams.set("payment", paymentFilter);
  if (bookingStatusFilter)
    exportParams.set("bookingStatus", bookingStatusFilter);

  const isDashboard = view === "dashboard";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Orders
          </h1>
          <p className="text-sm text-muted-foreground">
            Analytics, operations and booking management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/orders?view=dashboard`}
            className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${isDashboard ? "bg-primary text-primary-foreground shadow" : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"}`}
          >
            Dashboard
          </Link>
          <Link
            href={`/admin/orders?view=table`}
            className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${!isDashboard ? "bg-primary text-primary-foreground shadow" : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"}`}
          >
            Data table
          </Link>
          <Link
            href={`/admin/orders/export?${exportParams.toString()}`}
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Export CSV
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Today's Revenue */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Today&apos;s revenue
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              &pound;{todaysRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {todaysJobs.length} bookings
            </p>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              This week
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              &pound;{thisWeek.revenue.toFixed(2)}
            </p>
            <p className="text-xs mt-1">
              <span
                className={
                  thisWeek.revenue >= lastWeek.revenue
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {pctChange(thisWeek.revenue, lastWeek.revenue)}
              </span>
              <span className="text-muted-foreground"> vs last week</span>
            </p>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              This month
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              &pound;{thisMonth.revenue.toFixed(2)}
            </p>
            <p className="text-xs mt-1">
              <span
                className={
                  thisMonth.revenue >= lastMonth.revenue
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {pctChange(thisMonth.revenue, lastMonth.revenue)}
              </span>
              <span className="text-muted-foreground"> vs last month</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Orders (this week) */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Orders (week)
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {thisWeek.count}
            </p>
            <p className="text-xs mt-1">
              <span
                className={
                  thisWeek.count >= lastWeek.count
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {pctChange(thisWeek.count, lastWeek.count)}
              </span>
              <span className="text-muted-foreground"> vs last week</span>
            </p>
          </CardContent>
        </Card>

        {/* Platform Revenue */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Platform take
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              &pound;{thisMonth.platformRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fees + commission (month)
            </p>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Completion rate
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {thisMonth.completionRate}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {thisMonth.completed}/{thisMonth.count} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {isDashboard && (
        <>
          {/* Charts Row 1: Revenue Trend + Status Pie */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <RevenueTrendChart bookings={chartBookings} />
            <StatusDistributionChart bookings={chartBookings} />
          </div>

          {/* Charts Row 2: Daily Volume + Service Type + Provider Leaderboard */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <DailyVolumeChart bookings={chartBookings} />
            <ProviderLeaderboard bookings={chartBookings} />
          </div>

          {/* Charts Row 3: Service Type */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <ServiceTypeChart bookings={chartBookings} />
            {/* Avg order value card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Quick stats (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total bookings</p>
                    <p className="text-2xl font-bold tabular-nums">{chartBookings.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total revenue</p>
                    <p className="text-2xl font-bold tabular-nums">
                      &pound;{chartBookings.reduce((s, b) => s + b.totalAmount, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Avg order value</p>
                    <p className="text-2xl font-bold tabular-nums">
                      &pound;
                      {chartBookings.length > 0
                        ? (
                            chartBookings.reduce((s, b) => s + b.totalAmount, 0) /
                            chartBookings.length
                          ).toFixed(2)
                        : "0.00"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Unique providers</p>
                    <p className="text-2xl font-bold tabular-nums">
                      {new Set(chartBookings.filter((b) => b.providerName !== "Unassigned").map((b) => b.providerName)).size}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold tabular-nums text-green-600">
                      {chartBookings.filter((b) => b.bookingStatus === "COMPLETED").length}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Cancelled / refunded</p>
                    <p className="text-2xl font-bold tabular-nums text-red-600">
                      {chartBookings.filter((b) => b.bookingStatus === "CANCELLED" || b.bookingStatus === "REFUNDED").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Today's Live Monitor */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Today&apos;s operations &mdash; {todayStr}
              </CardTitle>
              <CardDescription className="mt-0.5">
                {todaysJobs.length} scheduled &middot;{" "}
                {todaysCompleted} completed &middot;{" "}
                {todaysInProgress} in progress &middot;{" "}
                {todaysPending} awaiting action
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {todaysPending > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {todaysPending} pending
                </Badge>
              )}
              {todaysInProgress > 0 && (
                <Badge variant="secondary">
                  {todaysInProgress} live
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        {todaysJobs.length > 0 && (
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Ref</TableHead>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Service</TableHead>
                    <TableHead className="text-xs">Provider</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysJobs.map((booking) => (
                    <TableRow key={`today-${booking.id}`}>
                      <TableCell className="font-semibold text-sm py-2">
                        {booking.scheduledStartTime}
                      </TableCell>
                      <TableCell className="py-2">
                        <Link
                          href={`/admin/orders/${booking.id}`}
                          className="text-primary underline-offset-4 hover:underline font-medium text-sm"
                        >
                          {getBookingRef(booking)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm py-2">
                        {booking.customer.firstName}{" "}
                        {booking.customer.lastName}
                      </TableCell>
                      <TableCell className="text-sm py-2">
                        {formatService(booking.serviceType)}
                      </TableCell>
                      <TableCell className="text-sm py-2">
                        {getProviderName(booking)}
                      </TableCell>
                      <TableCell className="text-sm py-2 text-right tabular-nums font-medium">
                        &pound;{dec(booking.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          variant={bookingStatusVariant(
                            booking.bookingStatus
                          )}
                          className="text-xs"
                        >
                          {booking.bookingStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          variant={getPaymentStatusVariant(getPaymentStatus(booking))}
                          className="text-xs"
                        >
                          {getPaymentStatusLabel(getPaymentStatus(booking))}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
        {todaysJobs.length === 0 && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground text-center py-6">
              No jobs scheduled for today.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Filters & Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            All orders ({filteredBookings.length})
          </CardTitle>
          <CardDescription>
            Search, filter and drill into individual bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid gap-3 sm:grid-cols-12 mb-4">
            <input type="hidden" name="view" value={view} />
            <div className="sm:col-span-4">
              <Label htmlFor="q" className="text-xs">
                Search
              </Label>
              <Input
                id="q"
                name="q"
                defaultValue={query}
                placeholder="Ref, customer, email, phone, postcode"
                className="h-8 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="startDate" className="text-xs">
                From
              </Label>
              <Input
                type="date"
                id="startDate"
                name="startDate"
                defaultValue={startDate}
                className="h-8 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="endDate" className="text-xs">
                To
              </Label>
              <Input
                type="date"
                id="endDate"
                name="endDate"
                defaultValue={endDate}
                className="h-8 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="bookingStatus" className="text-xs">
                Status
              </Label>
              <select
                id="bookingStatus"
                name="bookingStatus"
                defaultValue={bookingStatusFilter}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All</option>
                <option value="AWAITING_PAYMENT">Awaiting payment</option>
                <option value="PAID">Captured</option>
                <option value="PENDING_ASSIGNMENT">Authorised hold</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex items-end gap-1.5">
              <button
                type="submit"
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                Apply
              </button>
              <Link
                href={`/admin/orders?view=${view}`}
                className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
              >
                Reset
              </Link>
            </div>
          </form>

          <Separator className="mb-4" />

          <div className="space-y-3 md:hidden">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/admin/orders/${booking.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                        {getBookingRef(booking)}
                      </Link>
                      <div className="text-sm text-muted-foreground mt-1">
                        {booking.customer.firstName} {booking.customer.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">{booking.customer.email}</div>
                    </div>
                    <Badge variant={bookingStatusVariant(booking.bookingStatus)} className="text-xs">
                      {booking.bookingStatus}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Service</div>
                      <div className="mt-1 font-medium">{formatService(booking.serviceType)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Date</div>
                      <div className="mt-1 font-medium">{formatDate(booking.scheduledDate)} {booking.scheduledStartTime ? `· ${booking.scheduledStartTime}` : ""}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Amount</div>
                      <div className="mt-1 font-medium">&pound;{dec(booking.totalAmount).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Payment</div>
                      <div className="mt-1"><Badge variant={getPaymentStatusVariant(getPaymentStatus(booking))} className="text-xs">{getPaymentStatusLabel(getPaymentStatus(booking))}</Badge></div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Provider</div>
                      <div className="mt-1 font-medium">{getProviderName(booking)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Job</div>
                      <div className="mt-1"><Badge variant={bookingStatusVariant(getJobStatus(booking))} className="text-xs">{getJobStatus(booking)}</Badge></div>
                    </div>
                  </div>
                </div>
              ))
            ) : null}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Ref</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Service</TableHead>
                  <TableHead className="text-xs">Date / Time</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs">Provider</TableHead>
                  <TableHead className="text-xs text-right">Payout</TableHead>
                  <TableHead className="text-xs text-right">Platform</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Payment</TableHead>
                  <TableHead className="text-xs">Job</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium py-2">
                        <Link
                          href={`/admin/orders/${booking.id}`}
                          className="text-primary underline-offset-4 hover:underline text-sm"
                        >
                          {getBookingRef(booking)}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-sm font-medium">
                          {booking.customer.firstName}{" "}
                          {booking.customer.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {booking.customer.email}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-sm">
                          {formatService(booking.serviceType)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {booking.servicePostcode}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-sm">
                          {formatDate(booking.scheduledDate)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {booking.scheduledStartTime || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-sm py-2">
                        &pound;{dec(booking.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm py-2">
                        {getProviderName(booking)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm py-2">
                        &pound;{dec(booking.cleanerPayoutAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm py-2">
                        &pound;{dec(booking.platformMarginAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          variant={bookingStatusVariant(
                            booking.bookingStatus
                          )}
                          className="text-xs"
                        >
                          {booking.bookingStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          variant={getPaymentStatusVariant(getPaymentStatus(booking))}
                          className="text-xs"
                        >
                          {getPaymentStatusLabel(getPaymentStatus(booking))}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          variant={bookingStatusVariant(
                            getJobStatus(booking)
                          )}
                          className="text-xs"
                        >
                          {getJobStatus(booking)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-2">
                        {booking.createdAt.toISOString().slice(0, 10)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="text-center text-muted-foreground py-8"
                    >
                      No bookings found for the current filters.
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
