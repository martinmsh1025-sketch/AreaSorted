import { RawLegalPage } from "@/components/legal/raw-legal-page";
import { readRawLegalFile } from "@/lib/legal/raw-legal";

export const metadata = {
  title: "Dispute & Payout Policy",
  description: "How AreaSorted handles complaints, dispute windows, payout timing, evidence review, and provider deductions.",
  alternates: {
    canonical: "/dispute-policy",
  },
};

export default async function DisputePolicyPage() {
  const content = await readRawLegalFile("dispute-policy.txt");
  return <RawLegalPage title="Dispute & Payout Policy" content={content} />;
}
