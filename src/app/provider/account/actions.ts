"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProviderAccountAccess } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { providerContactChannelOptions, providerCommitmentOptions, providerLanguageOptions, providerResponseTimeOptions, stringifyProviderPublicProfileMetadata } from "@/lib/providers/public-profile-metadata";
import { validateProviderContactDetail } from "@/lib/providers/contact-detail-validation";

/**
 * Update editable provider company profile fields.
 */
export async function updateProviderProfileAction(formData: FormData) {
  const session = await requireProviderAccountAccess();
  const providerCompanyId = session.providerCompany.id;
  const prisma = getPrisma();

  const tradingName = String(formData.get("tradingName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const registeredAddress = String(formData.get("registeredAddress") || "").trim();
  const vatNumber = String(formData.get("vatNumber") || "").trim();
  const profileImageUrl = String(formData.get("profileImageUrl") || "").trim();
  const profileImageType = String(formData.get("profileImageType") || "logo").trim();
  const headline = String(formData.get("headline") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const yearsExperience = String(formData.get("yearsExperience") || "").trim();
  const supportedContactChannels = formData.getAll("supportedContactChannels").map((item) => String(item)).filter((item) => providerContactChannelOptions.includes(item as never));
  const responseTimeLabel = String(formData.get("responseTimeLabel") || "").trim();
  const serviceCommitments = formData.getAll("serviceCommitments").map((item) => String(item)).filter((item) => providerCommitmentOptions.includes(item as never));
  const languagesSpoken = formData.getAll("languagesSpoken").map((item) => String(item)).filter((item) => providerLanguageOptions.includes(item as never));
  const whatsappContact = String(formData.get("whatsappContact") || "").trim();
  const smsContact = String(formData.get("smsContact") || "").trim();
  const phoneContact = String(formData.get("phoneContact") || "").trim();
  const telegramContact = String(formData.get("telegramContact") || "").trim();
  const emailContact = String(formData.get("emailContact") || "").trim();
  const normalizedContactDetails: Partial<Record<"WhatsApp" | "SMS" | "Phone" | "Telegram" | "Email", string>> = {};

  if (headline.length > 80) {
    throw new Error("Headline must be 80 characters or fewer");
  }

  if (bio.length > 400) {
    throw new Error("Short description must be 400 characters or fewer");
  }

  if (responseTimeLabel && !providerResponseTimeOptions.includes(responseTimeLabel as never)) {
    throw new Error("Please choose a valid response time option");
  }
  if (supportedContactChannels.includes("WhatsApp") && !whatsappContact) {
    throw new Error("WhatsApp contact is required when WhatsApp is enabled");
  }
  if (supportedContactChannels.includes("SMS") && !smsContact) {
    throw new Error("SMS contact is required when SMS is enabled");
  }
  if (supportedContactChannels.includes("Phone") && !phoneContact) {
    throw new Error("Phone contact is required when Phone is enabled");
  }
  if (supportedContactChannels.includes("Telegram") && !telegramContact) {
    throw new Error("Telegram contact is required when Telegram is enabled");
  }
  if (supportedContactChannels.includes("Email") && !emailContact) {
    throw new Error("Email contact is required when Email is enabled");
  }

  for (const [channel, rawValue] of [["WhatsApp", whatsappContact], ["SMS", smsContact], ["Phone", phoneContact], ["Telegram", telegramContact], ["Email", emailContact]] as const) {
    if (!supportedContactChannels.includes(channel)) continue;
    const validated = validateProviderContactDetail(channel, rawValue);
    if (!validated.ok) {
      throw new Error(validated.error);
    }
    normalizedContactDetails[channel] = validated.normalized;
  }

  if (!tradingName) {
    throw new Error("Trading name is required");
  }

  await prisma.providerCompany.update({
    where: { id: providerCompanyId },
    data: {
      tradingName,
      phone: phone || null,
      registeredAddress: registeredAddress || null,
      vatNumber: vatNumber || null,
      profileImageUrl: profileImageUrl || null,
      profileImageType: profileImageType || null,
      headline: headline || null,
      bio: bio || null,
      yearsExperience: yearsExperience ? Number(yearsExperience) : null,
      specialtiesText: stringifyProviderPublicProfileMetadata({
        supportedContactChannels,
        contactDetails: normalizedContactDetails,
        responseTimeLabel,
        serviceCommitments,
        languagesSpoken,
      }),
    },
  });

  revalidatePath("/provider/account");
}

export async function updateProviderPasswordAction(formData: FormData) {
  const session = await requireProviderAccountAccess();
  const prisma = getPrisma();

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect("/provider/account?passwordError=Please complete all password fields.");
  }

  if (newPassword.length < 8) {
    redirect("/provider/account?passwordError=New password must be at least 8 characters.");
  }

  if (newPassword !== confirmPassword) {
    redirect("/provider/account?passwordError=New password and confirmation do not match.");
  }

  const validCurrentPassword = await verifyPassword(currentPassword, session.user.passwordHash);
  if (!validCurrentPassword) {
    redirect("/provider/account?passwordError=Current password is incorrect.");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  revalidatePath("/provider/account");
  redirect("/provider/account?passwordStatus=Password updated successfully.");
}
