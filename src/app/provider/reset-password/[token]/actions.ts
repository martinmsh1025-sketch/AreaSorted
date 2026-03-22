"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PROVIDER_SESSION_COOKIE } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";
import { getProviderAuthToken, consumeProviderAuthToken } from "@/lib/providers/auth-tokens";
import { getProviderDefaultRoute } from "@/lib/providers/portal-routing";
import { setProviderPasswordSet } from "@/lib/providers/repository";
import { hashPassword } from "@/lib/security/password";
import { signSessionValue } from "@/lib/security/session";

export async function setProviderPasswordAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const mode = String(formData.get("mode") || "setup").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  const purpose = mode === "reset" ? "PASSWORD_RESET" : "PASSWORD_SETUP";

  // H-20 FIX: Consume token atomically BEFORE performing validation/mutations
  // to eliminate TOCTOU window where token is validated at line N but consumed later.
  const record = await getProviderAuthToken({ rawToken: token, purpose });

  if (!record) {
    redirect(`/provider/login?error=invalid_${mode}_token`);
  }

  if (password.length < 8) {
    redirect(`/provider/reset-password/${token}?mode=${mode}&error=password_too_short`);
  }

  if (password !== confirmPassword) {
    redirect(`/provider/reset-password/${token}?mode=${mode}&error=password_mismatch`);
  }

  // H-20 FIX: Consume token immediately after validation, before any DB mutations.
  // This prevents a race where two concurrent requests both pass getProviderAuthToken
  // but only one should be allowed to reset the password.
  await consumeProviderAuthToken({ rawToken: token, purpose });

  const prisma = getPrisma();
  const passwordHash = await hashPassword(password);

  let userId = record.userId;
  if (!userId) {
    const existingUser = await prisma.user.findUnique({
      where: { email: record.email },
    });

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash,
            isActive: true,
          },
        })
      : await prisma.user.create({
          data: {
            email: record.email,
            passwordHash,
            isActive: true,
          },
        });

    userId = user.id;
    const providerRole = await prisma.role.findUnique({ where: { key: "PROVIDER" } });
    if (providerRole) {
      await prisma.userRoleAssignment.upsert({
        where: {
          userId_roleId: {
            userId,
            roleId: providerRole.id,
          },
        },
        update: {},
        create: {
          userId,
          roleId: providerRole.id,
        },
      });
    }

    if (record.providerCompanyId) {
      const providerCompany = await prisma.providerCompany.findUnique({
        where: { id: record.providerCompanyId },
      });

      if (providerCompany && providerCompany.userId !== userId) {
        const companyForUser = await prisma.providerCompany.findUnique({
          where: { userId },
        });

        if (companyForUser && companyForUser.id !== providerCompany.id) {
          userId = companyForUser.userId;
        } else {
          await prisma.providerCompany.update({
            where: { id: record.providerCompanyId },
            data: { userId },
          });
        }
      }
    }
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  // H-20 FIX: Token already consumed above (before mutations)

  if (record.providerCompanyId) {
    await setProviderPasswordSet(record.providerCompanyId);
  }

  if (!userId) {
    throw new Error("Provider user setup failed");
  }

  const cookieStore = await cookies();
  cookieStore.set(PROVIDER_SESSION_COOKIE, signSessionValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  const provider = record.providerCompanyId
    ? await prisma.providerCompany.findUnique({ where: { id: record.providerCompanyId } })
    : null;

  redirect(getProviderDefaultRoute(provider?.status || "ONBOARDING_IN_PROGRESS"));
}
