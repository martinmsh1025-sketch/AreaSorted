"use server";

import { redirect } from "next/navigation";
import { getProviderSessionCompanyId } from "@/lib/provider-auth";
import { markProviderAgreementSigned, updateProviderCompanyProfile } from "@/lib/providers/repository";

function parseMultiValue(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function saveProviderProfileAction(formData: FormData) {
  const providerCompanyId = await getProviderSessionCompanyId();
  if (!providerCompanyId) redirect("/provider/login");

  await updateProviderCompanyProfile({
    providerCompanyId,
    legalName: String(formData.get("legalName") || ""),
    tradingName: String(formData.get("tradingName") || ""),
    companyNumber: String(formData.get("companyNumber") || ""),
    registeredAddress: String(formData.get("registeredAddress") || ""),
    contactEmail: String(formData.get("contactEmail") || ""),
    phone: String(formData.get("phone") || ""),
    vatNumber: String(formData.get("vatNumber") || ""),
    insuranceExpiry: formData.get("insuranceExpiry") ? new Date(String(formData.get("insuranceExpiry"))) : null,
    complianceNotes: String(formData.get("complianceNotes") || ""),
    categories: parseMultiValue(formData.get("categories")),
    postcodePrefixes: parseMultiValue(formData.get("postcodePrefixes")),
  });
}

export async function signProviderAgreementAction() {
  const providerCompanyId = await getProviderSessionCompanyId();
  if (!providerCompanyId) redirect("/provider/login");

  await markProviderAgreementSigned(providerCompanyId);
}
