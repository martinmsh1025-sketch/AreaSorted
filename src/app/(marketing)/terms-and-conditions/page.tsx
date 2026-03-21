import { RawLegalPage } from "@/components/legal/raw-legal-page";
import { readRawLegalFile } from "@/lib/legal/raw-legal";

export default async function TermsPage() {
  const content = await readRawLegalFile("customer-terms.txt");
  return <RawLegalPage title="Customer Terms & Conditions" content={content} />;
}
