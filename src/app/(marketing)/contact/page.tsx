import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the AreaSorted team for customer support, booking queries, provider onboarding questions, or general business enquiries.",
};

export default function ContactPage() {
  return (
    <main className="section">
      <div className="container grid-2">
        <div>
          <div className="eyebrow">Contact us</div>
          <h1 className="title" style={{ marginTop: "0.6rem" }}>Speak to the team before booking or applying.</h1>
          <p className="lead">Use this page for customer support, provider onboarding questions, and general business enquiries.</p>
        </div>
        <ContactForm />
      </div>
    </main>
  );
}
