import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AreaSorted collects, uses, shares, stores, and protects personal information for customers, providers, and website visitors.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

const sections = [
  {
    heading: "Who we are",
    paragraphs: [
      "AreaSorted is operated by Happy Mamaland Limited (company number 17215430), a company registered in England and Wales and trading as AreaSorted.",
      "Registered office: 8 Camden Row, Cuckoo Hill, Pinner, England, HA5 2AH.",
      "You can contact us about privacy matters at support@areasorted.com or through https://areasorted.com.",
    ],
  },
  {
    heading: "Who this policy covers",
    paragraphs: [
      "This Privacy Policy explains how AreaSorted collects, uses, stores, and shares personal information relating to customers, prospective customers, service providers, provider contacts, website visitors, and people who contact us.",
    ],
  },
  {
    heading: "What personal data we may collect",
    bullets: [
      "Name, address, email address, and phone number.",
      "Booking details, property details, access notes, service history, and communications.",
      "Payment-related information handled through payment processors.",
      "Account details, support queries, complaint information, and other records connected with platform use.",
      "Identity, insurance, and onboarding information where relevant for providers.",
    ],
  },
  {
    heading: "How we use personal data",
    bullets: [
      "To create and manage accounts.",
      "To process quote requests, booking requests, confirmed bookings, reschedules, cancellations, and customer support queries.",
      "To contact providers where necessary to arrange or perform a booking.",
      "To process payments, refunds, chargebacks, payouts, fraud checks, and security checks.",
      "To handle complaints, disputes, legal compliance, record-keeping, and service improvement.",
      "To send direct marketing where permitted by law or where consent has been given if required.",
    ],
  },
  {
    heading: "Lawful bases",
    bullets: [
      "We rely on lawful bases such as contract, steps requested before entering into a contract, legal obligation, legitimate interests, and consent where required.",
      "We identify and document at least one lawful basis for each relevant processing activity.",
    ],
  },
  {
    heading: "Who we may share data with",
    bullets: [
      "Service providers where necessary to fulfil a booking.",
      "Payment processors, IT and software providers, customer support providers, and identity verification providers.",
      "Insurers, legal advisers, accountants, and other professional advisers where necessary.",
      "Regulators, courts, law enforcement, or public authorities where required by law.",
    ],
  },
  {
    heading: "Retention and security",
    bullets: [
      "Personal data is not kept for longer than necessary.",
      "Retention periods should be reviewed periodically, and data that is no longer needed should be securely deleted or anonymised.",
      "We use technical and organisational measures such as access controls, password protection, role-based permissions, secure storage, audit logs, and incident response procedures.",
    ],
  },
  {
    heading: "Your rights",
    bullets: [
      "You may have rights relating to access, rectification, erasure, restriction, objection, portability where applicable, and complaints under data protection law.",
      "If you wish to exercise a privacy right or raise a concern, please contact us using the legal or privacy contact details shown on the website.",
    ],
  },
  {
    heading: "Updates",
    paragraphs: [
      "This Privacy Policy may be updated from time to time. The latest version will be made available on the website.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lead="This policy explains how AreaSorted handles personal information across bookings, accounts, customer support, payments, and provider operations."
      version="Version 1.0 | Effective Date: 18 May 2026 | Data controller: Happy Mamaland Limited trading as AreaSorted"
      sections={sections}
    />
  );
}
