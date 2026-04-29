import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPrisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";
import { SupportForm } from "./support-form";
import { CaseStatusBadge } from "@/components/customer/case-status-badge";
import { getComplaintSlaMessage } from "@/lib/complaints/sla";

export const metadata: Metadata = {
  title: "Customer Support",
  description:
    "Get help with bookings, payment holds, provider confirmation, rescheduling, cancellations, and account access for AreaSorted services in London.",
};

const supportTopics = [
  "Booking confirmation delays",
  "Payment holds and charged amounts",
  "Reschedule and cancellation help",
  "Provider changes or counter offers",
  "Account access and password issues",
];

export default async function SupportPage() {
  const whatsappUrl = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL || "";
  const customer = await getCustomerSession();
  const prisma = getPrisma();
  const bookings = customer
    ? await prisma.booking.findMany({
        where: { customerId: customer.id },
        include: { quoteRequest: { select: { reference: true, serviceKey: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  const bookingOptions = bookings.map((booking) => ({
    value: booking.quoteRequest?.reference || booking.id,
    label: `${booking.quoteRequest?.serviceKey || booking.serviceType} - ${booking.servicePostcode} - ${booking.scheduledDate.toLocaleDateString("en-GB")}`,
    postcode: booking.servicePostcode,
  }));
  const recentCases = customer
    ? await prisma.complaint.findMany({
        where: { customerId: customer.id },
        include: { booking: { select: { id: true, servicePostcode: true }, }, },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  return (
    <main className="section">
      <div className="container grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="eyebrow">Customer support</div>
          <h1 className="title" style={{ marginTop: "0.6rem" }}>Help with an existing booking or payment question.</h1>
          <p className="lead">
            Use this page if you already have a quote, booking, account, or payment-related question. For general enquiries or provider applications, use the contact page instead.
          </p>

          <div className="marketing-mosaic-grid marketing-mosaic-grid-support" style={{ marginTop: "1.2rem" }}>
            <div className="marketing-crop-frame marketing-crop-frame-support-main">
              <Image src="/images/derived-board-tight/trust-book-minutes.png" alt="Fast, guided booking support" fill className="marketing-crop-image" sizes="(max-width: 720px) 100vw, 33vw" />
            </div>
            <div className="marketing-crop-frame marketing-crop-frame-support-mini">
              <Image src="/images/derived-board-tight/trust-secure-payments.png" alt="Secure payments support" fill className="marketing-crop-image" sizes="180px" />
            </div>
            <div className="marketing-crop-frame marketing-crop-frame-support-mini">
              <Image src="/images/derived-board-tight/trust-find-pros.png" alt="Trusted provider support" fill className="marketing-crop-image" sizes="120px" />
            </div>
          </div>

          <div className="panel card" style={{ marginTop: "1.2rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 0.7rem" }}>Best ways to reach support</h2>
            <div className="quote-summary-list">
              <div><span>Email</span><strong>support@areasorted.com</strong></div>
              <div><span>Hours</span><strong>Mon-Fri, 9am-6pm</strong></div>
              <div><span>Typical response</span><strong>Within 1 business day</strong></div>
            </div>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.65, marginTop: "0.8rem" }}>
              If your question relates to a specific booking, include your booking reference, postcode, and the change you need help with so the team can respond faster.
            </p>
            <p style={{ color: "var(--color-text-muted)", lineHeight: 1.65, marginTop: "0.8rem" }}>
              For complaint windows, evidence review, payout holds, and how service disputes are assessed, read our <Link href="/dispute-policy" style={{ color: "var(--color-brand)", fontWeight: 600 }}>Dispute &amp; Payout Policy</Link>.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <SupportForm bookings={bookingOptions} />

          {recentCases.length > 0 ? (
            <div className="panel mini-form">
              <strong style={{ display: "block", marginBottom: "0.8rem" }}>Recent case history</strong>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {recentCases.map((item) => (
                  <Link key={item.id} href={`/account/bookings/${item.booking.id}`} style={{ textDecoration: "none", color: "inherit", border: "1px solid var(--color-border)", borderRadius: "0.8rem", padding: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                      <div>
                        <strong style={{ display: "block" }}>{item.complaintType.replace(/_/g, " ")}</strong>
                        <div style={{ marginTop: "0.2rem", color: "var(--color-text-muted)", fontSize: "0.84rem" }}>
                          {item.booking.servicePostcode} · {item.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        <div style={{ marginTop: "0.45rem", color: "var(--color-text-muted)", fontSize: "0.84rem", lineHeight: 1.5 }}>
                          {getComplaintSlaMessage(item.status, item.createdAt)}
                        </div>
                      </div>
                      <CaseStatusBadge status={item.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="panel mini-form">
            <strong style={{ display: "block", marginBottom: "0.8rem" }}>Support topics we can help with</strong>
          <ul className="list-clean" style={{ color: "var(--color-text-muted)", marginBottom: "1rem" }}>
            {supportTopics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>

          <div className="button-row" style={{ marginTop: "1rem" }}>
            <a className="button button-primary" href="mailto:support@areasorted.com?subject=AreaSorted%20support%20request">
              Email support
            </a>
            {whatsappUrl ? (
              <a className="button button-secondary" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                WhatsApp support
              </a>
            ) : null}
            <Link className="button button-secondary" href="/account/bookings">
              View my bookings
            </Link>
          </div>

          <p style={{ color: "var(--color-text-muted)", lineHeight: 1.65, marginTop: "1rem" }}>
            Need general business or provider help instead? Visit <Link href="/contact" style={{ color: "var(--color-brand)", fontWeight: 600 }}>Contact us</Link>.
          </p>
          </div>
        </div>
      </div>
    </main>
  );
}
