import { RawLegalPage } from "@/components/legal/raw-legal-page";
import { readRawLegalFile } from "@/lib/legal/raw-legal";

export default async function GdprPolicyPage() {
  const content = await readRawLegalFile("gdpr-policy.txt");
  return <RawLegalPage title="GDPR Policy" content={content} />;
}
