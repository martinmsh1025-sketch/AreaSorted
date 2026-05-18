import type { Metadata } from "next";
import { RawLegalPage } from "@/components/legal/raw-legal-page";
import { readRawLegalFile } from "@/lib/legal/raw-legal";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description: "AreaSorted cancellation, payment hold, refund, rescheduling, no-show, and dispute rules for customer bookings.",
  alternates: {
    canonical: "/refund-policy",
  },
};

export default async function RefundPolicyPage() {
  const content = await readRawLegalFile("refund-policy.txt");
  return <RawLegalPage title="Cancellation & Refund Policy" content={content} />;
}
