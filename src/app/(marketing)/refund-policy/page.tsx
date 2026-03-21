import { RawLegalPage } from "@/components/legal/raw-legal-page";
import { readRawLegalFile } from "@/lib/legal/raw-legal";

export default async function RefundPolicyPage() {
  const content = await readRawLegalFile("refund-policy.txt");
  return <RawLegalPage title="Cancellation & Refund Policy" content={content} />;
}
