"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createProviderCompanyFromInvite } from "@/server/services/providers/onboarding";
import { buildProviderVerifyEmailUrl, createProviderOtp } from "@/lib/providers/email-verification";

const schema = z.object({
  inviteToken: z.string().min(1),
  contactEmail: z.string().email(),
});

export async function acceptProviderInviteAction(formData: FormData) {
  const parsed = schema.safeParse({
    inviteToken: String(formData.get("inviteToken") || ""),
    contactEmail: String(formData.get("contactEmail") || ""),
  });

  if (!parsed.success) {
    redirect(`/provider/invite/${String(formData.get("inviteToken") || "")}?error=invalid_fields`);
  }

  let provider;

  try {
    provider = await createProviderCompanyFromInvite({
      inviteToken: parsed.data.inviteToken,
      contactEmail: parsed.data.contactEmail,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_fields";
    redirect(`/provider/invite/${parsed.data.inviteToken}?error=${encodeURIComponent(message)}`);
  }

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
