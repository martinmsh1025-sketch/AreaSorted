import type { Metadata } from "next";
import { RawLegalPage } from "@/components/legal/raw-legal-page";
import { readRawLegalFile } from "@/lib/legal/raw-legal";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How AreaSorted uses essential, analytics, support, security, and preference cookies on the website.",
  alternates: {
    canonical: "/cookie-policy",
  },
};

export default async function CookiePolicyPage() {
  const content = await readRawLegalFile("cookie-policy.txt");
  return <RawLegalPage title="Cookie Policy" content={content} />;
}
