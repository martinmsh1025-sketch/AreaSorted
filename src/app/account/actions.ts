"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import { requireCustomerSession } from "@/lib/customer-auth";

export async function updateCustomerProfileAction(formData: FormData) {
  const customer = await requireCustomerSession();

  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!firstName || !lastName || !phone) {
    return { error: "All fields are required." };
  }

  const prisma = getPrisma();

  await prisma.customer.update({
    where: { id: customer.id },
    data: { firstName, lastName, phone },
  });

  revalidatePath("/account");
  return { success: true };
}
