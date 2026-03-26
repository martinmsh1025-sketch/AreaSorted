"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createProviderCompanyFromPublicApplication } from "@/server/services/providers/onboarding";
import { buildProviderVerifyEmailUrl, createProviderOtp } from "@/lib/providers/email-verification";

const schema = z.object({
  contactEmail: z.string().email(),
});

export async function startPublicProviderApplicationAction(formData: FormData) {
  const parsed = schema.safeParse({
    contactEmail: String(formData.get("contactEmail") || ""),
  });

  if (!parsed.success) {
    redirect("/provider/apply?error=invalid_email");
  }

  const provider = await createProviderCompanyFromPublicApplication({
    contactEmail: parsed.data.contactEmail,
  });

  const otp = await createProviderOtp({
    providerCompanyId: provider.id,
    email: parsed.data.contactEmail,
    purpose: "INVITE",
  });

  redirect(
    buildProviderVerifyEmailUrl({
      email: parsed.data.contactEmail,
      code: otp.code,
      deliveryMethod: otp.deliveryMethod,
      deliveryReason: otp.deliveryReason,
    }),
  );
}
