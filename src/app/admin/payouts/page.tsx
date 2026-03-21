import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
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

function dec(value: Decimal | null | undefined): number {
  return value ? Number(value) : 0;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
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

type AdminPayoutsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPayoutsPage({
  searchParams,
}: AdminPayoutsPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const prisma = getPrisma();
  const params = (await searchParams) ?? {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Date filters — default to last 30 days
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startDate =
    typeof params.startDate === "string" ? params.startDate : "";
  const endDate = typeof params.endDate === "string" ? params.endDate : "";
  const providerFilter =
    typeof params.provider === "string" ? params.provider : "";

  const dateFrom = startDate ? new Date(startDate) : thirtyDaysAgo;
  const dateTo = endDate ? (() => { const d = new Date(endDate); d.setDate(d.getDate() + 1); return d; })() : new Date(today.getTime() + 86400000);

  // Fetch bookings with price snapshots for the date range
  // Only include bookings that would generate a payout (paid/completed/assigned/in-progress)
  const payoutStatuses = [
    "PAID",
    "PENDING_ASSIGNMENT",
    "ASSIGNED",
    "IN_PROGRESS",
    "COMPLETED",
  ];

  const bookings = await prisma.booking.findMany({
    where: {
      scheduledDate: {
        gte: dateFrom,
        lt: dateTo,
      },
      bookingStatus: { in: payoutStatuses as any },
      providerCompanyId: providerFilter ? providerFilter : undefined,
    },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      marketplaceProviderCompany: {
        select: {
          id: true,
          tradingName: true,
          legalName: true,
          contactEmail: true,
          phone: true,
        },
      },
      priceSnapshot: {
        select: {
          providerExpectedPayout: true,
          platformBookingFee: true,
          platformCommissionAmount: true,
          providerServiceAmount: true,
        },
      },
      quoteRequest: { select: { reference: true } },
    },
    orderBy: { scheduledDate: "desc" },
  });

  // Fetch all providers for the filter dropdown
  const allProviders = await prisma.providerCompany.findMany({
    where: { status: { in: ["ACTIVE", "APPROVED"] } },
    select: {
      id: true,
      tradingName: true,
      legalName: true,
      contactEmail: true,
      phone: true,
    },
    orderBy: { tradingName: "asc" },
  });

  // Group by date → provider
  type ProviderPayout = {
    providerId: string;
    providerName: string;
    providerPhone: string | null;
    providerEmail: string;
    totalPayout: number;
    totalPlatformFee: number;
    totalCommission: number;
    bookingCount: number;
    completedCount: number;
    bookings: {
      id: string;
      ref: string;
      customerName: string;
      serviceDate: string;
      payout: number;
      platformFee: number;
      commission: number;
      status: string;
    }[];
  };

  type DayGroup = {
    date: string;
    providers: ProviderPayout[];
    totalPayout: number;
    totalPlatformRevenue: number;
    bookingCount: number;
  };

  const dayMap = new Map<string, Map<string, ProviderPayout>>();

  for (const booking of bookings) {
    const dateStr = booking.scheduledDate.toISOString().slice(0, 10);
    const provider = booking.marketplaceProviderCompany;
    if (!provider) continue;

    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, new Map());
    }
    const providerMap = dayMap.get(dateStr)!;

    if (!providerMap.has(provider.id)) {
      providerMap.set(provider.id, {
        providerId: provider.id,
        providerName: provider.tradingName || provider.legalName || provider.contactEmail,
        providerPhone: provider.phone,
        providerEmail: provider.contactEmail,
        totalPayout: 0,
        totalPlatformFee: 0,
        totalCommission: 0,
        bookingCount: 0,
        completedCount: 0,
        bookings: [],
      });
    }

    const entry = providerMap.get(provider.id)!;
    const payout = dec(booking.priceSnapshot?.providerExpectedPayout);
    const platformFee = dec(booking.priceSnapshot?.platformBookingFee);
    const commission = dec(booking.priceSnapshot?.platformCommissionAmount);

    entry.totalPayout += payout;
    entry.totalPlatformFee += platformFee;
    entry.totalCommission += commission;
    entry.bookingCount += 1;
    if (booking.bookingStatus === "COMPLETED") entry.completedCount += 1;

    const ref = booking.quoteRequest?.reference || booking.id.slice(0, 12).toUpperCase();

    entry.bookings.push({
      id: booking.id,
      ref,
      customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
      serviceDate: dateStr,
      payout,
      platformFee,
      commission,
      status: booking.bookingStatus,
    });
  }

  // Convert to sorted array
  const dayGroups: DayGroup[] = Array.from(dayMap.entries())
    .map(([date, providerMap]) => {
      const providers = Array.from(providerMap.values()).sort(
        (a, b) => b.totalPayout - a.totalPayout
      );
      return {
        date,
        providers,
        totalPayout: providers.reduce((s, p) => s + p.totalPayout, 0),
        totalPlatformRevenue: providers.reduce(
          (s, p) => s + p.totalPlatformFee + p.totalCommission,
          0
        ),
        bookingCount: providers.reduce((s, p) => s + p.bookingCount, 0),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // Summary KPIs
  const totalPayouts = dayGroups.reduce((s, d) => s + d.totalPayout, 0);
  const totalPlatformRevenue = dayGroups.reduce(
    (s, d) => s + d.totalPlatformRevenue,
    0
  );
  const totalBookings = dayGroups.reduce((s, d) => s + d.bookingCount, 0);
  const uniqueProviders = new Set(
    bookings
      .filter((b) => b.marketplaceProviderCompany)
      .map((b) => b.marketplaceProviderCompany!.id)
  ).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Payouts</h1>
        <p className="text-sm text-muted-foreground">
          Daily reconciliation — what each provider is owed
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total provider payouts
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {formatMoney(totalPayouts)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalBookings} bookings
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Platform revenue
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {formatMoney(totalPlatformRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fees + commission
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Bookings in range
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {totalBookings}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {dayGroups.length} days with activity
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Active providers
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {uniqueProviders}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              With bookings in range
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form method="GET" className="grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <Label htmlFor="startDate" className="text-xs">
                From
              </Label>
              <Input
                type="date"
                id="startDate"
                name="startDate"
                defaultValue={startDate || thirtyDaysAgo.toISOString().slice(0, 10)}
                className="h-8 text-sm"
              />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="endDate" className="text-xs">
                To
              </Label>
              <Input
                type="date"
                id="endDate"
                name="endDate"
                defaultValue={endDate || today.toISOString().slice(0, 10)}
                className="h-8 text-sm"
              />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="provider" className="text-xs">
                Provider
              </Label>
              <select
                id="provider"
                name="provider"
                defaultValue={providerFilter}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All providers</option>
                {allProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.tradingName || p.legalName || p.contactEmail}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3 flex items-end gap-1.5">
              <button
                type="submit"
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-white shadow hover:bg-primary/90"
              >
                Apply
              </button>
              <Link
                href="/admin/payouts"
                className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
              >
                Reset
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Day groups */}
      {dayGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No payouts found for the selected date range.
          </CardContent>
        </Card>
      ) : (
        dayGroups.map((day) => (
          <Card key={day.date}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{day.date}</CardTitle>
                  <CardDescription>
                    {day.bookingCount} booking{day.bookingCount !== 1 ? "s" : ""} &middot;{" "}
                    {day.providers.length} provider{day.providers.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Provider payouts</p>
                    <p className="font-bold tabular-nums">{formatMoney(day.totalPayout)}</p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Platform revenue</p>
                    <p className="font-bold tabular-nums text-emerald-600">
                      {formatMoney(day.totalPlatformRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {day.providers.map((provider) => (
                  <div
                    key={provider.providerId}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <Link
                            href={`/admin/provider/${provider.providerId}`}
                            className="font-medium text-sm text-primary hover:underline underline-offset-4"
                          >
                            {provider.providerName}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            {provider.providerPhone && (
                              <span className="text-xs text-muted-foreground">
                                {provider.providerPhone}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {provider.providerEmail}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums">
                          {formatMoney(provider.totalPayout)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {provider.bookingCount} booking{provider.bookingCount !== 1 ? "s" : ""}
                          {provider.completedCount > 0 && (
                            <span className="text-green-600">
                              {" "}· {provider.completedCount} completed
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Booking breakdown */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Ref</TableHead>
                            <TableHead className="text-xs">Customer</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs text-right">Payout</TableHead>
                            <TableHead className="text-xs text-right">Fee</TableHead>
                            <TableHead className="text-xs text-right">Commission</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {provider.bookings.map((b) => (
                            <TableRow key={b.id}>
                              <TableCell className="py-1.5">
                                <Link
                                  href={`/admin/orders/${b.id}`}
                                  className="text-primary underline-offset-4 hover:underline text-sm font-medium"
                                >
                                  {b.ref}
                                </Link>
                              </TableCell>
                              <TableCell className="text-sm py-1.5">
                                {b.customerName}
                              </TableCell>
                              <TableCell className="py-1.5">
                                <Badge
                                  variant={bookingStatusVariant(b.status)}
                                  className="text-xs"
                                >
                                  {b.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm font-medium py-1.5">
                                {formatMoney(b.payout)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm text-muted-foreground py-1.5">
                                {formatMoney(b.platformFee)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm text-muted-foreground py-1.5">
                                {formatMoney(b.commission)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
