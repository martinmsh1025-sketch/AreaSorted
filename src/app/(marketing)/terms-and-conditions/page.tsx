import type { Metadata } from "next";
import { RawLegalPage } from "@/components/legal/raw-legal-page";
import { readRawLegalFile } from "@/lib/legal/raw-legal";

export const metadata: Metadata = {
  title: "Customer Terms & Conditions",
  description: "AreaSorted customer terms for booking, payment holds, cancellations, refunds, complaints, and use of the platform.",
  alternates: {
    canonical: "/terms-and-conditions",
  },
};

export default async function TermsPage() {
  const content = await readRawLegalFile("customer-terms.txt");
  return <RawLegalPage title="Customer Terms & Conditions" content={content} />;
}
