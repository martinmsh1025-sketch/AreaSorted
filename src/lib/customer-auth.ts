import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { verifySessionValue } from "@/lib/security/session";

export const CUSTOMER_SESSION_COOKIE = "areasorted_customer_session";

export async function getCustomerSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value || null;
  if (!raw) return null;

  const customerId = verifySessionValue(raw);
  if (!customerId) return null;

  const prisma = getPrisma();
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      addresses: true,
    },
  });

  if (!customer || customer.status !== "ACTIVE") return null;

  return customer;
}

export async function isCustomerAuthenticated() {
  const session = await getCustomerSession();
  return Boolean(session);
}

export async function requireCustomerSession() {
  const session = await getCustomerSession();
  if (!session) redirect("/customer/login");
  return session;
}
