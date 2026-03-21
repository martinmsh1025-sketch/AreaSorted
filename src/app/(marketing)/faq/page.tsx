import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion, type FaqCategory } from "./faq-accordion";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description:
    "Answers to common questions about booking services, payments, cancellations, provider verification, and how AreaSorted works across London.",
  openGraph: {
    title: "FAQ — Frequently Asked Questions | AreaSorted",
    description:
      "Everything you need to know about booking services through AreaSorted — payments, cancellations, provider verification, and more.",
  },
};

const faqCategories: FaqCategory[] = [
  {
    title: "Booking & payments",
    items: [
      {
        question: "How do I book a service?",
        answer:
          "Enter your postcode on the homepage or quote page to check coverage. Then select your service, property details, and any add-ons. The pricing engine generates a transparent quote instantly. You can then continue booking and place a temporary card hold securely online.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept major credit and debit cards through Stripe. AreaSorted places a temporary card hold when you continue booking, and captures payment only after the matched provider confirms the job.",
      },
      {
        question: "Can I get a receipt for my booking?",
        answer:
          "Yes. Once payment has been captured for a confirmed booking, you can view and download your receipt from your account dashboard on the booking details page.",
      },
      {
        question: "What does the booking fee cover?",
        answer:
          "The booking fee covers the cost of running the platform — including provider matching, payment processing, customer support, and the managed booking flow. It is shown separately in your quote breakdown so there are no hidden charges.",
      },
      {
        question: "Are there any hidden fees?",
        answer:
          "No. Your quote includes the base service price, any add-ons you select, property type adjustments, and the booking fee. If a booking never reaches provider confirmation, any temporary card hold is released rather than captured.",
      },
    ],
  },
  {
    title: "Cancellations & rescheduling",
    items: [
      {
        question: "Can I cancel my booking?",
        answer:
          "Yes. You can cancel a booking from your account dashboard while the booking is awaiting provider confirmation or still upcoming. If the booking has not yet been confirmed, the card hold is released. If payment has already been captured, the cancellation and refund policy applies.",
      },
      {
        question: "Can I reschedule my booking?",
        answer:
          "Yes. You can reschedule from your booking details page. The new date must be at least one day in advance, and you can select a new time slot between 8:00 AM and 6:00 PM.",
      },
      {
        question: "What happens if my provider cancels?",
        answer:
          "If a confirmed provider cancels, AreaSorted may offer a replacement provider, reschedule the booking, issue a refund, issue a credit, or provide another reasonable resolution depending on the circumstances.",
      },
      {
        question: "How do refunds work?",
        answer:
          "Refunds are usually processed back to the original payment method. If a booking never reaches confirmation, a temporary card hold is released instead. Timing depends on your bank or card provider.",
      },
    ],
  },
  {
    title: "Service providers",
    items: [
      {
        question: "Who carries out the work?",
        answer:
          "All services are carried out by independent, self-employed professionals who have been vetted and onboarded through the AreaSorted platform. They are not employees of AreaSorted — the platform arranges the booking and handles payment on their behalf.",
      },
      {
        question: "How are providers verified?",
        answer:
          "Every provider goes through a structured onboarding process that includes email verification, identity document upload, right-to-work checks, capability assessment, coverage area setup, and admin review. Only approved providers can accept jobs.",
      },
      {
        question: "Can I choose my provider?",
        answer:
          "The platform automatically matches you with the best available provider for your postcode and service type. This ensures you get someone who covers your area and has the right capabilities for the job.",
      },
      {
        question: "Will I know who my provider is before the booking?",
        answer:
          "Provider details are shared after the booking has been confirmed and payment has been captured. Before that, your quote shows that the service will be carried out by a verified local provider.",
      },
      {
        question: "Do providers bring their own equipment?",
        answer:
          "This depends on the service and job type. For cleaning jobs, you can choose whether to provide supplies or have the provider bring their own (which may affect pricing). For other services like handyman or pest control, providers typically bring their own tools and materials.",
      },
    ],
  },
  {
    title: "Coverage & availability",
    items: [
      {
        question: "Which areas do you cover?",
        answer:
          "AreaSorted covers all 32 London boroughs. Enter your postcode on the homepage to check whether services are available in your specific area.",
      },
      {
        question: "What services are available?",
        answer:
          "We offer 57 job types across 6 categories: cleaning, pest control, handyman, furniture assembly, waste removal, and garden maintenance. Visit the services page for a full breakdown.",
      },
      {
        question: "Can I book for weekends or evenings?",
        answer:
          "Weekend slots are available for most services and may carry a surcharge shown in your quote. Availability depends on provider coverage and the service requested.",
      },
      {
        question: "How far in advance do I need to book?",
        answer:
          "You can usually book from the next day onward for planned work. Priority or urgent availability depends on the service, your postcode, and provider confirmation.",
      },
    ],
  },
  {
    title: "Account & support",
    items: [
      {
        question: "Do I need an account to book?",
        answer:
          "You can explore pricing first, but to continue booking you need an account so the booking request, payment status, and future updates are linked to your profile.",
      },
      {
        question: "How do I contact support?",
        answer:
          "You can reach us through the contact page. We handle customer support, booking queries, and general business enquiries.",
      },
      {
        question: "I want to become a service provider. How do I apply?",
        answer:
          "Visit the provider recruitment page to learn about the onboarding process and requirements. You will need to provide identity documents, proof of right to work, and go through a review process before being approved.",
      },
    ],
  },
];

export default function FaqPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqCategories.flatMap((category) =>
      category.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    ),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Hero */}
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">Help centre</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Frequently asked questions
          </h1>
          <p className="lead">
            Everything you need to know about booking services, payments, cancellations, and how AreaSorted works.
          </p>
        </div>
      </section>

      <FaqAccordion categories={faqCategories} />

      {/* CTA */}
      <section className="section muted-block">
        <div className="container" style={{ textAlign: "center", maxWidth: 660 }}>
          <h2 className="title">Still have questions?</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.6 }}>
            Get in touch with the team. We are happy to help with booking queries, provider questions, or general enquiries.
          </p>
          <div className="button-row" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/contact">Contact us</Link>
            <Link className="button button-secondary" href="/services">Browse services</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
