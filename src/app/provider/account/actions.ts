"use server";

import { revalidatePath } from "next/cache";
import { requireProviderAccountAccess } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";

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
