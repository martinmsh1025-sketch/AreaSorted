import { RawLegalPage } from "@/components/legal/raw-legal-page";
import { readRawLegalFile } from "@/lib/legal/raw-legal";

export default async function CookiePolicyPage() {
  const content = await readRawLegalFile("cookie-policy.txt");
  return <RawLegalPage title="Cookie Policy" content={content} />;
}
