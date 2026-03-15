"use server";

import { redirect } from "next/navigation";
import { createProviderCompanyFromInvite } from "@/server/services/providers/onboarding";
import { markProviderAgreementSigned } from "@/lib/providers/repository";

export async function acceptProviderInviteAction(formData: FormData) {
  const inviteToken = String(formData.get("inviteToken") || "");
  const provider = await createProviderCompanyFromInvite({
    inviteToken,
    legalName: String(formData.get("legalName") || ""),
    tradingName: String(formData.get("tradingName") || ""),
    companyNumber: String(formData.get("companyNumber") || ""),
    registeredAddress: String(formData.get("registeredAddress") || ""),
    contactEmail: String(formData.get("contactEmail") || ""),
    phone: String(formData.get("phone") || ""),
    vatNumber: String(formData.get("vatNumber") || ""),
  });

  if (formData.get("agreementAccepted") === "on") {
    await markProviderAgreementSigned(provider.id);
  }

  redirect("/provider/login");
}
