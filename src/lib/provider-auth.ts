import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { canProviderAccessAccount, canProviderAccessDashboard, canProviderAccessOnboarding, canProviderAccessOrders, canProviderAccessPricing, canProviderAccessStripe, canProviderViewOrders } from "@/lib/providers/status";
import { getProviderDefaultRoute } from "@/lib/providers/portal-routing";
import { findProviderInviteByEmail, getLatestProviderInviteForCompany } from "@/lib/providers/repository";

export const PROVIDER_SESSION_COOKIE = "areasorted_provider_session";

export async function getProviderSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(PROVIDER_SESSION_COOKIE)?.value || null;
  if (!userId) return null;

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      providerCompany: {
        include: {
          stripeConnectedAccount: true,
          serviceCategories: true,
          coverageAreas: true,
          agreements: true,
          documents: true,
          pricingRules: true,
          invites: true,
        },
      },
    },
  });

  if (!user?.providerCompany) return null;
  const latestInvite = await getLatestProviderInviteForCompany(user.providerCompany.id)
    || await findProviderInviteByEmail(user.providerCompany.contactEmail || user.email);
  return {
    user,
    providerCompany: user.providerCompany,
    latestInvite,
  };
}

export async function getProviderSessionCompanyId() {
  const session = await getProviderSession();
  return session?.providerCompany.id || null;
}

export async function getProviderSessionUserId() {
  const session = await getProviderSession();
  return session?.user.id || null;
}

export async function isProviderAuthenticated() {
  return Boolean(await getProviderSession());
}

export async function requireProviderSession() {
  const session = await getProviderSession();
  if (!session) redirect("/provider/login");
  return session;
}

export async function redirectProviderToDefaultRoute() {
  const session = await requireProviderSession();
  redirect(getProviderDefaultRoute(session.providerCompany.status));
}

export async function requireProviderOnboardingAccess() {
  const session = await requireProviderSession();
  if (!canProviderAccessOnboarding(session.providerCompany.status)) {
    redirect(getProviderDefaultRoute(session.providerCompany.status));
  }
  return session;
}

export async function requireProviderStripeAccess() {
  const session = await requireProviderSession();
  if (!canProviderAccessStripe(session.providerCompany.status)) {
    redirect(getProviderDefaultRoute(session.providerCompany.status));
  }
  return session;
}

export async function requireProviderPricingAccess() {
  const session = await requireProviderSession();
  if (!canProviderAccessPricing(session.providerCompany.status)) {
    redirect(getProviderDefaultRoute(session.providerCompany.status));
  }
  return session;
}

export async function requireProviderDashboardAccess() {
  const session = await requireProviderSession();
  if (!canProviderAccessDashboard(session.providerCompany.status)) {
    redirect(getProviderDefaultRoute(session.providerCompany.status));
  }
  return session;
}

export async function requireProviderOrdersAccess() {
  const session = await requireProviderSession();
  if (!canProviderAccessOrders(session.providerCompany.status)) {
    redirect(getProviderDefaultRoute(session.providerCompany.status));
  }
  return session;
}

export async function requireProviderOrdersListAccess() {
  const session = await requireProviderSession();
  if (!canProviderViewOrders(session.providerCompany.status)) {
    redirect(getProviderDefaultRoute(session.providerCompany.status));
  }
  return session;
}

export async function requireProviderAccountAccess() {
  const session = await requireProviderSession();
  if (!canProviderAccessAccount(session.providerCompany.status)) {
    redirect(getProviderDefaultRoute(session.providerCompany.status));
  }
  return session;
}
