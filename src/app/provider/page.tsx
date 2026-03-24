import Link from "next/link";
import { requireProviderSession, redirectProviderToDefaultRoute } from "@/lib/provider-auth";
import { ProviderStatusBadge } from "@/components/providers/status-badge";
import {
  canProviderAccessDashboard,
  canProviderAccessOrders,
  canProviderAccessPricing,
  canProviderAccessStripe,
  canProviderEditOnboarding,
} from "@/lib/providers/status";
import { providerPortalStatusLabels, serviceTypeLabels, formatEnumLabel } from "@/lib/providers/service-catalog-mapping";
import { getPrisma } from "@/lib/db";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Prisma } from "@prisma/client";
import {
  ArrowRight,
  Check,
  CreditCard,
  PoundSterling,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Circle,
  Zap,
  Clock,
  TrendingUp,
  CalendarClock,
  MapPin,
  Rocket,
  Lock,
} from "lucide-react";
import {
  ProviderEarningsTrend,
  ProviderStatusChart,
  ProviderServiceChart,
  ProviderDailyVolumeChart,
  type ProviderBookingSummary,
} from "@/components/provider/dashboard-charts";
import { formatMoney } from "@/lib/format";

/** Compute earnings summary for a set of bookings */
function computeEarnings(
  bookings: Array<{
    bookingStatus: string;
    totalAmount: Prisma.Decimal | number;
    cleanerPayoutAmount: Prisma.Decimal | number | null;
    platformMarginAmount: Prisma.Decimal | number | null;
    priceSnapshot: {
      providerExpectedPayout: Prisma.Decimal | number;
      platformCommissionAmount: Prisma.Decimal | number;
    } | null;
  }>,
) {
  const earning = bookings.filter((b) =>
    ["ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(b.bookingStatus),
  );
  const completedOnly = bookings.filter((b) => b.bookingStatus === "COMPLETED");

  const totalRevenue = earning.reduce((s, b) => s + Number(b.totalAmount), 0);
  const totalPayout = earning.reduce(
    (s, b) =>
      s + Number(b.priceSnapshot?.providerExpectedPayout ?? b.cleanerPayoutAmount ?? b.totalAmount),
    0,
  );
  const totalCommission = earning.reduce(
    (s, b) => s + Number(b.priceSnapshot?.platformCommissionAmount ?? b.platformMarginAmount ?? 0),
    0,
  );
  const completedPayout = completedOnly.reduce(
    (s, b) =>
      s + Number(b.priceSnapshot?.providerExpectedPayout ?? b.cleanerPayoutAmount ?? b.totalAmount),
    0,
  );

  return {
    orderCount: earning.length,
    completedCount: completedOnly.length,
    totalRevenue,
    totalPayout,
    totalCommission,
    completedPayout,
  };
}

export default async function ProviderHomePage() {
  const session = await requireProviderSession();
  const provider = session.providerCompany;

  // Redirect very early statuses away
  if (
    !["ONBOARDING_IN_PROGRESS", "SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "CHANGES_REQUESTED",
      "REJECTED", "APPROVED", "STRIPE_PENDING", "STRIPE_RESTRICTED", "PRICING_PENDING",
      "ACTIVE", "SUSPENDED",
    ].includes(provider.status)
  ) {
    await redirectProviderToDefaultRoute();
  }

  const prisma = getPrisma();
  const displayName = provider.tradingName || provider.legalName || "Provider";
  const checklist = buildProviderChecklist(provider);
  const stripeReady = Boolean(
    provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled,
  );
  const pricingReady = Boolean(provider.pricingRules?.some((rule) => rule.active));
  const accountExists = Boolean(provider.stripeConnectedAccount?.stripeAccountId);
  const detailsSubmitted = Boolean(provider.stripeConnectedAccount?.detailsSubmitted);
  const fullDashboard = canProviderAccessDashboard(provider.status);
  const payoutReady =
    stripeReady && pricingReady && fullDashboard;

  // ─── Next action CTA ───
  const nextAction = canProviderEditOnboarding(provider.status)
    ? { href: "/provider/onboarding", label: "Continue onboarding" }
    : !stripeReady && canProviderAccessStripe(provider.status)
      ? { href: "/provider/payment", label: accountExists ? "Complete payment setup" : "Create payment account" }
      : !pricingReady && canProviderAccessPricing(provider.status)
        ? { href: "/provider/pricing", label: "Set your pricing" }
        : fullDashboard
          ? { href: "/provider/orders", label: "View orders" }
          : { href: "/provider/application-status", label: "Check application" };

  // ─── Booking data ───
  const [allBookings, availabilityRulesCount] = await Promise.all([
    fullDashboard
      ? prisma.booking.findMany({
          where: { providerCompanyId: provider.id },
          include: { priceSnapshot: true },
          orderBy: { createdAt: "desc" },
          take: 1000,
        })
      : Promise.resolve([]),
    !fullDashboard
      ? prisma.providerAvailability.count({
          where: { providerCompanyId: provider.id },
        })
      : Promise.resolve(0),
  ]);

  // ─── Dashboard-mode data ───
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayBookings = allBookings.filter((b) => b.createdAt >= startOfToday);
  const weekBookings = allBookings.filter((b) => b.createdAt >= startOfWeek);
  const monthBookings = allBookings.filter((b) => b.createdAt >= startOfMonth);

  const todayEarnings = computeEarnings(todayBookings);
  const weekEarnings = computeEarnings(weekBookings);
  const monthEarnings = computeEarnings(monthBookings);
  const allTimeEarnings = computeEarnings(allBookings);

  const pendingAcceptance = allBookings.filter((b) => b.bookingStatus === "PENDING_ASSIGNMENT").length;
  const inProgress = allBookings.filter((b) => b.bookingStatus === "IN_PROGRESS").length;

  const recentCompleted = allBookings
    .filter((b) => b.bookingStatus === "COMPLETED")
    .slice(0, 5);

  const chartBookings: ProviderBookingSummary[] = allBookings.map((b) => ({
    id: b.id,
    serviceType: b.serviceType,
    scheduledDate: b.scheduledDate.toISOString().slice(0, 10),
    totalAmount: Number(b.totalAmount),
    payout: Number(b.priceSnapshot?.providerExpectedPayout ?? b.cleanerPayoutAmount ?? b.totalAmount),
    commission: Number(b.priceSnapshot?.platformCommissionAmount ?? b.platformMarginAmount ?? 0),
    bookingStatus: b.bookingStatus,
    postcode: b.servicePostcode,
  }));

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {fullDashboard ? `Welcome back, ${displayName}` : displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {providerPortalStatusLabels[provider.status] || provider.status}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProviderStatusBadge status={provider.status} />
          <Button
            size="sm"
            render={<Link href={nextAction.href} />}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {nextAction.label}
            <ArrowRight className="ml-1.5 size-3.5" />
          </Button>
        </div>
      </div>

      {/* ═══════ ACTIVE MODE: Full dashboard ═══════ */}
      {fullDashboard && (
        <>
          {/* Pending action banner */}
          {(pendingAcceptance > 0 || inProgress > 0) && (
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/10">
              <CardContent className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-4 text-sm">
                  {pendingAcceptance > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-4 text-amber-600" />
                      <strong>{pendingAcceptance}</strong> awaiting confirmation
                    </span>
                  )}
                  {inProgress > 0 && (
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="size-4 text-blue-600" />
                      <strong>{inProgress}</strong> in progress
                    </span>
                  )}
                </div>
                <Link
                  href="/provider/orders?status=PENDING_ASSIGNMENT"
                  className="inline-flex h-8 items-center justify-center rounded-md bg-blue-600 px-3 text-xs font-medium text-white shadow hover:bg-blue-700"
                >
                  View orders
                  <ArrowRight className="ml-1 size-3" />
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Earnings KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <EarningsCard label="Today" earnings={todayEarnings} />
            <EarningsCard label="This week" earnings={weekEarnings} />
            <EarningsCard label="This month" earnings={monthEarnings} />
            <EarningsCard label="All time" earnings={allTimeEarnings} highlight />
          </div>

          {/* Charts */}
          {chartBookings.length > 0 && (
            <>
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                <ProviderEarningsTrend bookings={chartBookings} />
                <ProviderStatusChart bookings={chartBookings} />
              </div>
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                <ProviderDailyVolumeChart bookings={chartBookings} />
                <ProviderServiceChart bookings={chartBookings} />
              </div>
            </>
          )}

          {/* Recent completed + Payout summary */}
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Recent completed orders</CardTitle>
                    <Link
                      href="/provider/orders?status=COMPLETED"
                      className="text-xs text-primary hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentCompleted.length > 0 ? (
                    <div className="space-y-2">
                      {recentCompleted.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50"
                        >
                          <div>
                            <Link
                              href={`/provider/orders/${booking.id}`}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {booking.id.slice(0, 8)}...
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {serviceTypeLabels[booking.serviceType] || formatEnumLabel(booking.serviceType)} — {booking.servicePostcode}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                              {formatMoney(
                                Number(
                                  booking.priceSnapshot?.providerExpectedPayout ??
                                    booking.cleanerPayoutAmount ??
                                    booking.totalAmount,
                                ),
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(booking.createdAt).toLocaleDateString("en-GB")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No completed orders yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Payout summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Payout summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Row label="Total orders (all time)" value={String(allTimeEarnings.orderCount)} />
                  <Row label="Completed" value={String(allTimeEarnings.completedCount)} />
                  <Row label="Completed payout" value={formatMoney(allTimeEarnings.completedPayout)} />
                  <Separator />
                  <Row label="Total booking value" value={formatMoney(allTimeEarnings.totalRevenue)} />
                  <Row
                    label="Platform fees deducted"
                    value={`-${formatMoney(allTimeEarnings.totalCommission)}`}
                  />
                  <div className="flex items-baseline justify-between gap-4 rounded-md bg-green-50 px-3 py-2 dark:bg-green-950/20">
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Total expected payout
                    </span>
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">
                      {formatMoney(allTimeEarnings.totalPayout)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column: account status */}
            <div className="lg:col-span-2 space-y-6">
              <Card className={payoutReady ? "border-green-200 dark:border-green-800" : "border-amber-200 dark:border-amber-800"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {payoutReady ? (
                      <Zap className="size-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="size-4 text-amber-600" />
                    )}
                    Account status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ReadinessRow
                    label="Payments"
                    ok={stripeReady}
                    detail={stripeReady ? "Charges and payouts enabled" : "Stripe Connect not fully set up"}
                  />
                  <ReadinessRow
                    label="Pricing"
                    ok={pricingReady}
                    detail={pricingReady ? "At least one active rule" : "No active pricing rule"}
                  />
                  <ReadinessRow
                    label="Orders"
                    ok={canProviderAccessOrders(provider.status)}
                    detail={canProviderAccessOrders(provider.status) ? "Accepting orders" : "Locked until live"}
                  />
                  {payoutReady && (
                    <div className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400 pt-1">
                      <CheckCircle className="size-3.5" />
                      <span>Your account is ready to trade</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick links</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" render={<Link href="/provider/orders" />}>
                    My Orders
                  </Button>
                  <Button variant="outline" size="sm" render={<Link href="/provider/pricing" />}>
                    Pricing
                  </Button>
                  <Button variant="outline" size="sm" render={<Link href="/provider/availability" />}>
                    Availability
                  </Button>
                  <Button variant="outline" size="sm" render={<Link href="/provider/coverage" />}>
                    Service Areas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* ═══════ SETUP MODE: Guided wizard for pre-active providers ═══════ */}
      {!fullDashboard && (
        <SetupWizard
          provider={provider}
          checklist={checklist}
          stripeReady={stripeReady}
          pricingReady={pricingReady}
          accountExists={accountExists}
          detailsSubmitted={detailsSubmitted}
          coverageCount={provider.coverageAreas?.filter((a: any) => a.active).length || 0}
          availabilityCount={availabilityRulesCount}
        />
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function EarningsCard({
  label,
  earnings,
  highlight,
}: {
  label: string;
  earnings: ReturnType<typeof computeEarnings>;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-blue-200 dark:border-blue-800" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <PoundSterling className="size-3.5" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-xl font-bold ${highlight ? "text-blue-700 dark:text-blue-400" : ""}`}>
          {formatMoney(earnings.totalPayout)}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShoppingCart className="size-3" />
            {earnings.orderCount} orders
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="size-3" />
            {earnings.completedCount} done
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function ReadinessRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-start gap-2.5">
      {ok ? (
        <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-600" />
      ) : (
        <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
      )}
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 * SetupWizard — Guided post-approval setup experience
 * ═══════════════════════════════════════════════════════ */

type WizardStep = {
  key: string;
  number: number;
  title: string;
  description: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "completed" | "current" | "locked";
  href: string | null;
  ctaLabel: string;
};

function SetupWizard({
  provider,
  checklist,
  stripeReady,
  pricingReady,
  accountExists,
  detailsSubmitted,
  coverageCount,
  availabilityCount,
}: {
  provider: any;
  checklist: ReturnType<typeof buildProviderChecklist>;
  stripeReady: boolean;
  pricingReady: boolean;
  accountExists: boolean;
  detailsSubmitted: boolean;
  coverageCount: number;
  availabilityCount: number;
}) {
  const isPreApproval =
    canProviderEditOnboarding(provider.status) ||
    ["SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "CHANGES_REQUESTED", "REJECTED"].includes(
      provider.status,
    );

  // ─── Define wizard steps ───
  const steps: WizardStep[] = [];

  // Step 1: Application Review (pre-approval statuses)
  const applicationApproved = Boolean(provider.approvedAt);
  if (isPreApproval) {
    const isEditable = canProviderEditOnboarding(provider.status);
    steps.push({
      key: "application",
      number: 1,
      title: "Application Review",
      description: isEditable
        ? "Complete and submit your application for admin review."
        : provider.status === "REJECTED"
          ? "Your application was not approved. Please check admin feedback."
          : "Your application is being reviewed by our team.",
      detail: isEditable
        ? "Fill in company details, upload documents, and submit"
        : provider.status === "CHANGES_REQUESTED"
          ? "Changes requested — please update and resubmit"
          : "Typically takes 1–2 business days",
      icon: Clock,
      status: "current",
      href: isEditable ? "/provider/onboarding" : "/provider/application-status",
      ctaLabel: isEditable ? "Continue Application" : "Check Status",
    });
  } else {
    steps.push({
      key: "application",
      number: 1,
      title: "Application Approved",
      description: "Your application has been reviewed and approved.",
      detail: provider.approvedAt
        ? `Approved on ${new Date(provider.approvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
        : "Approved",
      icon: CheckCircle,
      status: "completed",
      href: null,
      ctaLabel: "",
    });
  }

  // Step 2: Payment Setup (Stripe Connect)
  const canAccessStripe = canProviderAccessStripe(provider.status);
  const stripeStatus: WizardStep["status"] = stripeReady
    ? "completed"
    : canAccessStripe
      ? "current"
      : "locked";

  steps.push({
    key: "payments",
    number: 2,
    title: "Connect Payment Account",
    description: stripeReady
      ? "Your Stripe account is connected and ready to receive payouts."
      : accountExists
        ? "Your Stripe account needs additional information to enable payouts."
        : "Connect your bank account through Stripe to receive customer payments.",
    detail: stripeReady
      ? "Charges and payouts enabled"
      : accountExists && detailsSubmitted
        ? "Details submitted — waiting for Stripe verification"
        : accountExists
          ? "Stripe account created — complete the setup"
          : "Takes about 5 minutes",
    icon: CreditCard,
    status: stripeStatus,
    href: canAccessStripe ? "/provider/payment" : null,
    ctaLabel: stripeReady
      ? ""
      : accountExists
        ? "Complete Payment Setup"
        : "Set Up Payments",
  });

  // Step 3: Pricing
  const canAccessPricing = canProviderAccessPricing(provider.status);
  const pricingStatus: WizardStep["status"] = pricingReady
    ? "completed"
    : canAccessPricing
      ? "current"
      : "locked";

  steps.push({
    key: "pricing",
    number: 3,
    title: "Set Your Pricing",
    description: pricingReady
      ? "Your pricing rules are configured and active."
      : "Configure your hourly rates and service pricing. Default rates are pre-filled — review and adjust to your preference.",
    detail: pricingReady
      ? `${provider.pricingRules?.filter((r: any) => r.active).length || 0} active rule(s)`
      : "Review pre-filled rates and save to activate",
    icon: PoundSterling,
    status: pricingStatus,
    href: canAccessPricing ? "/provider/pricing" : null,
    ctaLabel: pricingReady ? "" : "Configure Pricing",
  });

  // Step 4: Availability (optional but recommended)
  const hasAvailability = availabilityCount > 0;
  steps.push({
    key: "availability",
    number: 4,
    title: "Set Availability",
    description: hasAvailability
      ? "Your weekly schedule is configured."
      : "Set your working hours so customers can only book when you are available. Default hours (Mon–Fri 9–5) apply if not set.",
    detail: hasAvailability
      ? `${availabilityCount} day(s) configured`
      : "Recommended — prevents unwanted bookings",
    icon: CalendarClock,
    status: hasAvailability
      ? "completed"
      : canAccessPricing
        ? "current"
        : "locked",
    href: canAccessPricing ? "/provider/availability" : null,
    ctaLabel: hasAvailability ? "" : "Set Hours",
  });

  // Compute progress
  const requiredSteps = steps.filter((s) => s.key !== "availability");
  const completedRequired = requiredSteps.filter((s) => s.status === "completed").length;
  const totalRequired = requiredSteps.length;
  const progressPercent = Math.round((completedRequired / totalRequired) * 100);

  // Find current active step (first non-completed step)
  const currentStep = steps.find((s) => s.status === "current") || null;

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_38%),linear-gradient(135deg,rgba(239,246,255,0.96),rgba(255,255,255,0.98))] shadow-sm dark:border-blue-900/60 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_36%),linear-gradient(135deg,rgba(2,6,23,0.96),rgba(15,23,42,0.98))]">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(96,165,250,0.16),_transparent_62%)] lg:block" />
        <div className="relative space-y-6 px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 shadow-sm backdrop-blur dark:border-blue-800 dark:bg-slate-950/50 dark:text-blue-300">
              <Rocket className="size-3.5" />
              Provider Launch Setup
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
                  {provider.status === "APPROVED" && !accountExists
                    ? "You are approved. Let’s get you live."
                    : currentStep
                      ? `Next: ${currentStep.title}`
                      : "Everything is set for launch."}
                </h2>
                <Badge className="border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {completedRequired}/{totalRequired} complete
                </Badge>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {provider.status === "APPROVED" && !accountExists
                  ? "Your application is approved. Complete the remaining setup below to start receiving bookings and payouts."
                  : currentStep
                    ? `${currentStep.description} Finish this step first, then the next one unlocks automatically.`
                    : "Your required setup is complete. We will unlock orders as soon as your account state finishes syncing."}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                <span>Launch progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-blue-100/80 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    progressPercent === 100
                      ? "bg-gradient-to-r from-emerald-500 via-emerald-500 to-green-400"
                      : "bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {progressPercent === 100 && (
                <div className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle className="size-3.5" />
                  <span>All required steps are complete. Your account will be activated shortly.</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-50">Launch readiness</div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">These are the key items that decide whether your account can go live.</p>
                </div>
                <Badge className="border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-300">
                  Priority
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm ring-1 ring-blue-100/80 backdrop-blur dark:border-blue-900/70 dark:bg-slate-950/80 dark:ring-blue-950/60">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    <CreditCard className="size-3.5 text-blue-600 dark:text-blue-400" />
                    Payments
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-2xl font-semibold text-slate-950 dark:text-slate-50">
                      {stripeReady ? "Ready" : accountExists ? "In progress" : "Not started"}
                    </div>
                    <Badge className={stripeReady ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}>
                      {stripeReady ? "Complete" : "Action needed"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-700 dark:text-slate-300">
                    {stripeReady
                      ? "Charges and payouts are enabled."
                      : accountExists
                        ? "Stripe account exists but still needs completion."
                        : "Create your Stripe Express account."}
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm ring-1 ring-blue-100/80 backdrop-blur dark:border-blue-900/70 dark:bg-slate-950/80 dark:ring-blue-950/60">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    <PoundSterling className="size-3.5 text-blue-600 dark:text-blue-400" />
                    Pricing
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-2xl font-semibold text-slate-950 dark:text-slate-50">
                      {pricingReady ? "Configured" : "Pending"}
                    </div>
                    <Badge className={pricingReady ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}>
                      {pricingReady ? "Complete" : "Action needed"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-700 dark:text-slate-300">
                    {pricingReady
                      ? "At least one active rule is ready."
                      : "Review the pre-filled pricing and save it."}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm ring-1 ring-amber-100/80 backdrop-blur dark:border-amber-900/70 dark:bg-slate-950/80 dark:ring-amber-950/60">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    <ShoppingCart className="size-3.5 text-blue-600 dark:text-blue-400" />
                    Orders
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-2xl font-semibold text-slate-950 dark:text-slate-50">
                      {canProviderAccessOrders(provider.status) ? "Open" : "Locked"}
                    </div>
                    <Badge className={canProviderAccessOrders(provider.status) ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}>
                      {canProviderAccessOrders(provider.status) ? "Ready" : "Waiting"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-700 dark:text-slate-300">
                    {canProviderAccessOrders(provider.status)
                      ? "You can now receive and manage bookings."
                      : "Orders unlock after payment and pricing are ready."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-50">Business setup</div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Operational details that help your account run smoothly once orders open.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-4 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2.5 mb-2">
                    <MapPin className="size-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium">Coverage Areas</span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight">{coverageCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {coverageCount > 0 ? "Postcode areas from your application" : "No coverage areas yet"}
                  </p>
                  {canAccessPricing && (
                    <Link
                      href="/provider/coverage"
                      className="mt-2 inline-flex items-center text-xs text-primary hover:underline"
                    >
                      Manage areas
                      <ArrowRight className="ml-1 size-3" />
                    </Link>
                  )}
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-4 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2.5 mb-2">
                    <CalendarClock className="size-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium">Availability</span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight">{availabilityCount > 0 ? `${availabilityCount} days` : "Default"}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {availabilityCount > 0 ? "Custom schedule configured" : "Mon-Fri 9am-5pm (default)"}
                  </p>
                  {canAccessPricing && (
                    <Link
                      href="/provider/availability"
                      className="mt-2 inline-flex items-center text-xs text-primary hover:underline"
                    >
                      {availabilityCount > 0 ? "Edit schedule" : "Customise hours"}
                      <ArrowRight className="ml-1 size-3" />
                    </Link>
                  )}
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2.5 mb-2">
                    <ShoppingCart className="size-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium">Orders</span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight">{canProviderAccessOrders(provider.status) ? "Open" : "Locked"}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {canProviderAccessOrders(provider.status)
                      ? "You can receive and manage bookings"
                      : "Complete setup to start receiving bookings"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_380px]">
        <div className="space-y-4">
          {currentStep && currentStep.href && (
            <Card className="overflow-hidden border-blue-300 bg-gradient-to-r from-blue-600 via-blue-600 to-sky-500 text-white shadow-sm dark:border-blue-900">
              <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                    Current action
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{currentStep.title}</h3>
                  <p className="mt-1 text-sm text-blue-50/90">{currentStep.detail}</p>
                </div>
                <Button
                  size="sm"
                  render={<Link href={currentStep.href} />}
                  className="bg-white text-blue-700 hover:bg-blue-50"
                >
                  {currentStep.ctaLabel}
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
          {steps.map((step, idx) => {
            const isOptional = step.key === "availability";
            const isCurrent = step.status === "current";
            const isCompleted = step.status === "completed";
            const isLocked = step.status === "locked";
            const StepIcon = step.icon;

            return (
              <Card
                key={step.key}
                className={
                  isCurrent
                    ? "border-blue-300 bg-gradient-to-r from-blue-50 to-white ring-1 ring-blue-200 dark:border-blue-700 dark:bg-gradient-to-r dark:from-blue-950/20 dark:to-slate-950 dark:ring-blue-800"
                    : isCompleted
                      ? "border-emerald-200 bg-white dark:border-emerald-900/50 dark:bg-slate-950/70"
                      : "border-dashed border-slate-300/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40"
                }
              >
                <CardContent className="py-4 sm:py-5">
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      {idx < steps.length - 1 && (
                        <span className="absolute left-1/2 top-10 hidden h-[calc(100%+1rem)] w-px -translate-x-1/2 bg-gradient-to-b from-blue-200 via-slate-200 to-transparent dark:from-blue-800 dark:via-slate-800 sm:block" />
                      )}
                      {isCompleted ? (
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-100 shadow-sm dark:bg-emerald-900/40">
                          <Check className="size-4.5 text-green-700 dark:text-green-400" />
                        </div>
                      ) : isCurrent ? (
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm ring-4 ring-blue-100 dark:ring-blue-950/60">
                          <span className="text-sm font-bold">{step.number}</span>
                        </div>
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-white/70 dark:bg-slate-950/40">
                          <Lock className="size-3.5 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-sm font-semibold ${isLocked ? "text-muted-foreground" : ""}`}>
                          {step.title}
                        </h3>
                        {isOptional && (
                          <Badge variant="outline" className="text-[10px]">
                            Optional
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px]">
                            Complete
                          </Badge>
                        )}
                        {isCurrent && <Badge className="bg-blue-600 text-white text-[10px]">Now</Badge>}
                      </div>
                      <p className={`mt-1 text-sm ${isLocked ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                        {step.description}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/70">{step.detail}</p>
                    </div>

                    <div className="shrink-0 self-center">
                      {isCurrent && step.href && (
                        <Button
                          size="sm"
                          render={<Link href={step.href} />}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {step.ctaLabel}
                          <ArrowRight className="ml-1.5 size-3.5" />
                        </Button>
                      )}
                      {isCompleted && (
                        <StepIcon className="size-5 text-emerald-600/60 dark:text-emerald-400/40" />
                      )}
                      {isLocked && <Lock className="size-4 text-muted-foreground/30" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="border-blue-200/80 bg-white shadow-sm ring-1 ring-blue-100/70 dark:border-blue-900/60 dark:bg-slate-950/80 dark:ring-blue-950/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Launch notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-900/80">
                Payment setup unlocks pricing.
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-900/80">
                Pricing must be active before orders can open.
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-900/80">
                Availability is optional, but strongly recommended.
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs text-muted-foreground dark:border-slate-800 dark:bg-slate-950/50">
        <p>
          <strong>Need help?</strong> Finish the highlighted step first. The next required step unlocks automatically, and orders open once payments and pricing are ready.
        </p>
      </div>
    </>
  );
}
