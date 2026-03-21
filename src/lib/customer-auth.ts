import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";

export const CUSTOMER_SESSION_COOKIE = "areasorted_customer_session";

export async function getCustomerSession() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value || null;
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
