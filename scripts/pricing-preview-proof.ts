import "dotenv/config";
import { previewProviderPricing } from "@/lib/pricing/prisma-pricing";
import { getPrisma } from "@/lib/db";

async function main() {
  const prisma = getPrisma();
  const provider = await prisma.providerCompany.findFirst({
    where: {
      OR: [
        { companyNumber: "AS-TEST-999" },
        { contactEmail: "test-provider@areasorted.test" },
        { companyNumber: "AS-DEMO-001" },
      ],
    },
  });
  if (!provider) {
    throw new Error("Seeded provider not found. Run `npm run prisma:seed` first.");
  }

  const preview = await previewProviderPricing({
    providerCompanyId: provider.id,
    categoryKey: "CLEANING",
    serviceKey: "regular-home-cleaning",
    postcodePrefix: "SW6",
    estimatedHours: 3,
    quantity: 1,
    sameDay: false,
    weekend: false,
  });

  console.log(JSON.stringify(preview, null, 2));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  const prisma = getPrisma();
  await prisma.$disconnect();
  process.exit(1);
});
