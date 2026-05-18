import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";

import { RawLegalPage } from "@/components/legal/raw-legal-page";

export const metadata: Metadata = {
  title: "Provider Terms",
  description: "AreaSorted provider terms for company providers and sole trader providers working through the platform.",
  alternates: {
    canonical: "/cleaner-terms",
  },
};

async function readProviderAgreement(fileName: string) {
  return readFile(path.join(process.cwd(), "public/provider-agreements", fileName), "utf8");
}

export default async function CleanerTermsPage() {
  const [companyProviderTerms, soleTraderTerms] = await Promise.all([
    readProviderAgreement("company-provider-v1.txt"),
    readProviderAgreement("sole-trader-v1.txt"),
  ]);

  const content = [
    "AREASORTED PROVIDER TERMS",
    "Effective Date: 18 May 2026",
    "This page contains the current AreaSorted provider terms for company providers and sole trader providers.",
    "",
    "Company operator: Happy Mamaland Limited (company number 17215430), registered in England and Wales and trading as AreaSorted.",
    "Registered office: 8 Camden Row, Cuckoo Hill, Pinner, England, HA5 2AH",
    "Contact: support@areasorted.com",
    "",
    "==== COMPANY PROVIDER TERMS ====",
    companyProviderTerms,
    "",
    "==== SOLE TRADER PROVIDER TERMS ====",
    soleTraderTerms,
  ].join("\n");

  return <RawLegalPage title="Provider Terms" content={content} />;
}
