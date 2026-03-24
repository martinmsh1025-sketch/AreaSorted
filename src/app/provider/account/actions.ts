"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProviderAccountAccess } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/security/password";

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
