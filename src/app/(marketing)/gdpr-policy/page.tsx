import type { Metadata } from "next";
import { RawLegalPage } from "@/components/legal/raw-legal-page";
import { readRawLegalFile } from "@/lib/legal/raw-legal";

export const metadata: Metadata = {
  title: "GDPR Policy",
  description: "AreaSorted internal data protection policy covering lawful bases, privacy rights, data handling, retention, and incidents.",
  alternates: {
    canonical: "/gdpr-policy",
  },
};

export default async function GdprPolicyPage() {
  const content = await readRawLegalFile("gdpr-policy.txt");
  return <RawLegalPage title="GDPR Policy" content={content} />;
}
