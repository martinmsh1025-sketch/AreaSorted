import Link from "next/link";
import { redirectProviderToDefaultRoute, requireProviderSession } from "@/lib/provider-auth";
import { ProviderStatusBadge } from "@/components/providers/status-badge";
import { canProviderAccessDashboard, canProviderAccessOrders, canProviderAccessPricing, canProviderAccessStripe, canProviderEditOnboarding } from "@/lib/providers/status";
import { providerPortalStatusLabels } from "@/lib/providers/service-catalog-mapping";
import { getPrisma } from "@/lib/db";
import { buildProviderChecklist } from "@/server/services/providers/checklist";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(value);
}

export default async function ProviderHomePage() {
  const session = await requireProviderSession();
  const provider = session.providerCompany;

  if (!["ONBOARDING_IN_PROGRESS", "SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "CHANGES_REQUESTED", "REJECTED", "APPROVED", "STRIPE_PENDING", "STRIPE_RESTRICTED", "PRICING_PENDING", "ACTIVE", "SUSPENDED"].includes(provider.status)) {
    await redirectProviderToDefaultRoute();
  }

  const prisma = getPrisma();
  const displayName = provider.tradingName || provider.legalName || "Provider";
  const checklist = buildProviderChecklist(provider);
  const stripeReady = Boolean(provider.stripeConnectedAccount?.chargesEnabled && provider.stripeConnectedAccount?.payoutsEnabled);
  const pricingReady = Boolean(provider.pricingRules?.some((rule) => rule.active));
  const accountExists = Boolean(provider.stripeConnectedAccount?.stripeAccountId);
  const detailsSubmitted = Boolean(provider.stripeConnectedAccount?.detailsSubmitted);
  const [orderSummary, latestBookingSnapshot] = await Promise.all([
    prisma.booking.aggregate({ _count: { id: true }, _sum: { totalAmount: true }, where: { providerCompanyId: provider.id } }),
    prisma.bookingPriceSnapshot.findFirst({ where: { booking: { providerCompanyId: provider.id } }, orderBy: { createdAt: "desc" } }),
  ]);

  const payoutReady = stripeReady && pricingReady && canProviderAccessDashboard(provider.status);
  const nextAction = canProviderEditOnboarding(provider.status)
    ? { href: "/provider/onboarding", label: "Continue onboarding" }
    : !stripeReady
      ? { href: "/provider/dashboard", label: accountExists ? "Complete payment account" : "Create payment account" }
      : !pricingReady
        ? { href: "/provider/pricing", label: "Set your pricing" }
        : canProviderAccessDashboard(provider.status)
          ? { href: "/provider/orders", label: "Open live orders" }
          : { href: "/provider/application-status", label: "Check application status" };

  const criticalItems = checklist.items.filter((item) => !item.complete && ["profile", "documents_uploaded", "agreement", "approved", "stripe", "pricing"].includes(item.key));

  return (
    <main className="section">
      <div className="container">
        <section className="backoffice-hero-card" style={{ marginBottom: "1.5rem" }}>
          <div className="backoffice-hero-grid">
            <div>
              <div className="eyebrow">Provider business setup</div>
              <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2.3rem, 4vw, 3.6rem)" }}>{displayName}</h1>
              <p className="lead">Finish setup to go live.</p>
              <div className="backoffice-chip-row">
                <ProviderStatusBadge status={provider.status} />
                <span className="backoffice-chip">Stage: {providerPortalStatusLabels[provider.status] || provider.status}</span>
                <span className="backoffice-chip backoffice-chip-muted">Orders: {orderSummary._count.id || 0}</span>
              </div>
              <div className="button-row" style={{ marginTop: "1rem" }}>
                <Link href={nextAction.href} className="button button-primary">{nextAction.label}</Link>
                <Link href="/provider/application-status" className="button button-secondary">View approval status</Link>
              </div>
            </div>
            <div className="backoffice-hero-meta">
              <div className="backoffice-kpi-card">
                <span className="eyebrow">Revenue status</span>
                <strong>{payoutReady ? "Ready to trade" : "Setup still required"}</strong>
                <span className="lead" style={{ margin: 0 }}>Approval, payment account, and pricing must all be ready.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="backoffice-metric-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="panel card admin-stat-card">
            <div className="eyebrow">Payment account</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.2rem" }}>{stripeReady ? "Ready" : accountExists ? "Needs action" : "Not started"}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>{detailsSubmitted ? "Details submitted" : "Details incomplete"}</p>
          </div>
          <div className="panel card admin-stat-card">
            <div className="eyebrow">Pricing</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.2rem" }}>{pricingReady ? "Configured" : "Missing"}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Need at least one active rule</p>
          </div>
          <div className="panel card admin-stat-card">
            <div className="eyebrow">Payout readiness</div>
            <strong className="admin-stat-number" style={{ fontSize: "1.2rem" }}>{payoutReady ? "Eligible" : "Blocked"}</strong>
            <p className="lead" style={{ marginBottom: 0 }}>Blocked until setup is complete</p>
          </div>
        </section>

        <section className="panel card" style={{ marginBottom: "0.85rem" }}>
          <div className="backoffice-section-head">
            <div>
              <div className="eyebrow">Business-critical setup path</div>
              <p className="lead">Complete these in order.</p>
            </div>
          </div>
          <div className="backoffice-checklist-grid" style={{ marginTop: "1rem" }}>
            {checklist.items
              .filter((item) => ["email_verified", "password_set", "profile", "documents_uploaded", "agreement", "submitted", "approved", "stripe", "pricing"].includes(item.key))
              .map((item) => (
                <div key={item.key} className="backoffice-checklist-item">
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.complete ? "Completed" : item.detail}</p>
                  </div>
                  <span className={`status-badge ${item.complete ? "status-badge-active" : "status-badge-wip"}`}>{item.complete ? "Done" : "Open"}</span>
                </div>
              ))}
          </div>
        </section>

        <section className="backoffice-grid-2">
          <div className="backoffice-stack">
            <section className="panel card">
              <div className="backoffice-section-head">
                <div>
                  <div className="eyebrow">Revenue snapshot</div>
                  <p className="lead">Latest commercial numbers.</p>
                </div>
              </div>
              <div className="backoffice-data-list" style={{ marginTop: "1rem" }}>
                <div className="backoffice-data-row"><span>Total provider orders</span><strong>{orderSummary._count.id || 0}</strong></div>
                <div className="backoffice-data-row"><span>Booked value</span><strong>{formatMoney(Number(orderSummary._sum.totalAmount || 0))}</strong></div>
                <div className="backoffice-data-row"><span>Latest expected provider payout</span><strong>{latestBookingSnapshot ? formatMoney(Number(latestBookingSnapshot.providerExpectedPayout)) : "No payout data yet"}</strong></div>
              </div>
            </section>
          </div>

          <div className="backoffice-stack">
            <section className="panel card" style={{ background: "#f8fafc", borderColor: payoutReady ? "#86efac" : "#fcd34d" }}>
              <div className="backoffice-section-head">
                <div>
                  <div className="eyebrow" style={{ color: payoutReady ? "#166534" : "#b45309" }}>Commercial readiness</div>
                  <h2 style={{ fontSize: "1.4rem", margin: "0.5rem 0" }}>{payoutReady ? "Your setup supports trading" : "There is still a revenue blocker"}</h2>
                </div>
              </div>
              <div className="backoffice-note-list">
                <div><strong>Payment account</strong><p>{stripeReady ? "Charges and payouts are enabled." : "Stripe Connect is not yet fully enabled for both charges and payouts."}</p></div>
                <div><strong>Pricing</strong><p>{pricingReady ? "A provider price exists for at least one service." : "No active provider pricing rule is live yet."}</p></div>
                <div><strong>Orders</strong><p>{canProviderAccessOrders(provider.status) ? "Open" : "Locked until live"}</p></div>
              </div>
              <div className="button-row" style={{ marginTop: "1rem" }}>
                <Link href="/provider/dashboard" className="button button-secondary">Payment account</Link>
                <Link href="/provider/pricing" className="button button-secondary">Pricing</Link>
              </div>
            </section>

            {criticalItems.length > 0 ? (
              <section className="panel card">
                <div className="backoffice-section-head">
                  <div>
                    <div className="eyebrow">Current blockers</div>
                    <p className="lead">Items still blocking go-live.</p>
                  </div>
                </div>
                <div className="backoffice-data-list" style={{ marginTop: "1rem" }}>
                  {criticalItems.map((item) => (
                    <div key={item.key} className="backoffice-data-row"><span>{item.label}</span><strong>{item.detail}</strong></div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
