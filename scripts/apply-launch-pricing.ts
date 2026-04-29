import { PrismaClient } from "@prisma/client";
import { jobTypeCatalog, type JobTypeDefinition } from "../src/lib/service-catalog";

const prisma = new PrismaClient();

const SERVICE_TO_CATEGORY = {
  cleaning: "CLEANING",
  "pest-control": "PEST_CONTROL",
  handyman: "HANDYMAN",
  "furniture-assembly": "FURNITURE_ASSEMBLY",
  "waste-removal": "WASTE_REMOVAL",
  "garden-maintenance": "GARDEN_MAINTENANCE",
} as const;

const PRIME_CENTRAL = ["WC1", "WC2", "EC1", "EC2", "EC3", "EC4", "W1", "SW1", "SE1", "NW1", "E1"];
const INNER_LONDON = [
  "W2", "W3", "W4", "W5", "W6", "W8", "W9", "W10", "W11", "W12", "W14",
  "SW2", "SW3", "SW4", "SW5", "SW6", "SW7", "SW8", "SW9", "SW10", "SW11", "SW12", "SW13", "SW15", "SW18",
  "N1", "N2", "N4", "N5", "N6", "N7", "N8", "N10", "NW3", "NW5", "NW6", "NW8",
  "E2", "E3", "E8", "E9", "E14", "SE5", "SE10", "SE11", "SE14", "SE15", "SE16", "SE17", "SE21", "SE22", "SE24",
];
const FRINGE_OUTER = [
  "BR1", "BR2", "BR3", "BR4", "BR5", "BR6", "BR7", "BR8",
  "CR0", "CR2", "CR3", "CR4", "CR5", "CR6", "CR7", "CR8",
  "DA1", "DA2", "DA5", "DA6", "DA7", "DA8", "DA14", "DA15", "DA16", "DA17", "DA18",
  "EN1", "EN2", "EN3", "EN4", "EN5", "EN8", "EN9", "EN10", "EN11",
  "HA0", "HA1", "HA2", "HA3", "HA4", "HA5", "HA6", "HA7", "HA8", "HA9",
  "IG1", "IG2", "IG3", "IG4", "IG5", "IG6", "IG7", "IG8", "IG9", "IG10", "IG11",
  "KT1", "KT2", "KT3", "KT4", "KT5", "KT6", "KT7", "KT8", "KT9", "KT10", "KT11", "KT12", "KT13", "KT14", "KT15", "KT16", "KT17", "KT18", "KT19", "KT20", "KT21", "KT22", "KT23", "KT24",
  "RM1", "RM2", "RM3", "RM5", "RM6", "RM7", "RM8", "RM9", "RM10", "RM11", "RM12", "RM13", "RM14", "RM15", "RM16", "RM17", "RM18", "RM19", "RM20",
  "SM1", "SM2", "SM3", "SM4", "SM5", "SM6", "SM7",
  "TW1", "TW2", "TW3", "TW4", "TW5", "TW6", "TW7", "TW8", "TW9", "TW10", "TW11", "TW12", "TW13", "TW14", "TW15", "TW16", "TW17", "TW18", "TW19", "TW20",
  "UB1", "UB2", "UB3", "UB4", "UB5", "UB6", "UB7", "UB8", "UB9", "UB10", "UB11",
];

const CATEGORY_SURCHARGE: Record<string, { prime: number; inner: number; fringe: number }> = {
  CLEANING: { prime: 8, inner: 4, fringe: 5 },
  PEST_CONTROL: { prime: 12, inner: 6, fringe: 6 },
  HANDYMAN: { prime: 10, inner: 5, fringe: 5 },
  FURNITURE_ASSEMBLY: { prime: 8, inner: 4, fringe: 4 },
  WASTE_REMOVAL: { prime: 18, inner: 10, fringe: 8 },
  GARDEN_MAINTENANCE: { prime: 9, inner: 5, fringe: 5 },
};

function inSet(value: string, values: string[]) {
  return values.includes(value);
}

function round(value: number) {
  return Math.round(value);
}

function buildCleaningRule(job: JobTypeDefinition) {
  const hourly: Record<string, number> = {
    "regular-home-cleaning": 19,
    "deep-cleaning": 21,
    "end-of-tenancy-cleaning": 22,
    "office-commercial-cleaning": 23,
    "airbnb-turnover-cleaning": 20,
    "after-builders-cleaning": 26,
    "carpet-upholstery-cleaning": 30,
    "sofa-upholstery-cleaning": 30,
    "oven-cleaning": 28,
    "fridge-cleaning": 22,
    "window-cleaning-interior": 20,
    "window-cleaning-exterior-ground-floor": 22,
    "bathroom-deep-clean": 21,
    "kitchen-deep-clean": 24,
  };

  const minimumHours = job.durationHours.small >= 2 ? Math.ceil(job.durationHours.small) : Math.max(1.5, job.durationHours.small);
  const hourlyPrice = hourly[job.value] ?? 21;
  return {
    pricingMode: "hourly",
    hourlyPrice,
    minimumCharge: round(hourlyPrice * minimumHours),
    sameDayUplift: 18,
    weekendUplift: 12,
  };
}

function buildPestRule(job: JobTypeDefinition) {
  let small = 99;
  let standard = 129;
  let large = 169;

  if (inSet(job.value, ["rat-mouse-treatment", "mice-treatment", "rat-treatment"])) {
    small = 139; standard = 154; large = 179;
  } else if (job.value === "cockroach-treatment") {
    small = 145; standard = 165; large = 189;
  } else if (job.value === "wasp-nest-removal") {
    small = 72; standard = 89; large = 109;
  } else if (job.value === "pest-survey-report") {
    small = 72; standard = 89; large = 109;
  } else if (job.value === "ant-treatment") {
    small = 86; standard = 99; large = 122;
  } else if (job.value === "flea-treatment") {
    small = 109; standard = 122; large = 145;
  } else if (job.value === "bed-bug-treatment") {
    small = 349; standard = 459; large = 589;
  } else if (inSet(job.value, ["moth-treatment", "silverfish-treatment"])) {
    small = 89; standard = 104; large = 129;
  } else if (inSet(job.value, ["pigeon-proofing-inspection", "proofing-sealing-entry-points"])) {
    small = 99; standard = 129; large = 169;
  } else if (job.value === "pest-follow-up-visit") {
    small = 59; standard = 79; large = 99;
  }

  return {
    pricingMode: "fixed_per_size",
    minimumCharge: small,
    pricingJson: { small, standard, large },
    sameDayUplift: 20,
    weekendUplift: 15,
  };
}

function buildHandymanRule(job: JobTypeDefinition) {
  let hourlyPrice = 50;
  if (inSet(job.value, ["mirror-picture-hanging", "sealant-resealing", "minor-wall-repair-filling", "furniture-moving-within-property"])) hourlyPrice = 48;
  if (inSet(job.value, ["tap-toilet-seat-replacement", "minor-plumbing-repair", "light-fitting-replacement"])) hourlyPrice = 52;
  if (job.value === "tv-mounting") hourlyPrice = 55;
  if (job.value === "smoke-alarm-installation" || job.value === "draft-excluder-sealing-work" || job.value === "flat-pack-adjustment") hourlyPrice = 45;

  const minHours = Math.max(1, Math.ceil(job.durationHours.small));
  return {
    pricingMode: "hourly",
    hourlyPrice,
    minimumCharge: round(hourlyPrice * minHours),
    sameDayUplift: 20,
    weekendUplift: 15,
  };
}

function buildFurnitureRule(job: JobTypeDefinition) {
  let pricingJson = { small: 63, standard: 89, large: 119 };

  if (inSet(job.value, ["wardrobe-bed-assembly", "wardrobe-assembly", "disassembly-reassembly", "multiple-item-assembly"])) {
    pricingJson = { small: 99, standard: 145, large: 189 };
  } else if (inSet(job.value, ["bed-assembly", "desk-storage-assembly", "nursery-furniture-assembly", "assembly-wall-fixing"])) {
    pricingJson = { small: 72, standard: 99, large: 135 };
  } else if (job.value === "chair-assembly") {
    pricingJson = { small: 45, standard: 63, large: 89 };
  } else if (job.value === "disassembly") {
    pricingJson = { small: 54, standard: 72, large: 99 };
  }

  return {
    pricingMode: "fixed_per_size",
    minimumCharge: pricingJson.small,
    pricingJson,
    sameDayUplift: 18,
    weekendUplift: 12,
  };
}

function buildWasteRule(job: JobTypeDefinition) {
  let pricingJson = { small: 54, standard: 99, large: 172 };

  if (inSet(job.value, ["bulky-item-removal", "furniture-disposal", "appliance-removal"])) {
    pricingJson = { small: 63, standard: 109, large: 181 };
  } else if (job.value === "mattress-removal") {
    pricingJson = { small: 45, standard: 72, large: 109 };
  } else if (inSet(job.value, ["property-clearance", "garage-shed-clearance", "office-clearance", "builders-waste-removal"])) {
    pricingJson = { small: 99, standard: 172, large: 299 };
  }

  return {
    pricingMode: "fixed_per_size",
    minimumCharge: pricingJson.small,
    pricingJson,
    sameDayUplift: 25,
    weekendUplift: 15,
  };
}

function buildGardenRule(job: JobTypeDefinition) {
  const hourly: Record<string, number> = {
    "lawn-mowing": 38,
    "hedge-trimming": 40,
    pruning: 40,
    "small-tree-trimming": 48,
    "garden-tidy-up": 40,
    weeding: 36,
    "leaf-clearance": 36,
    "garden-waste-bagging": 34,
    "seasonal-garden-maintenance": 42,
    "pressure-washing-patio-driveway": 48,
    "fence-painting": 44,
    "deck-cleaning": 42,
  };
  const hourlyPrice = hourly[job.value] ?? 40;
  return {
    pricingMode: "hourly",
    hourlyPrice,
    minimumCharge: round(hourlyPrice * 2),
    sameDayUplift: 20,
    weekendUplift: 12,
  };
}

function buildRule(job: JobTypeDefinition) {
  const categoryKey = SERVICE_TO_CATEGORY[job.service];
  if (categoryKey === "CLEANING") return { categoryKey, ...buildCleaningRule(job) };
  if (categoryKey === "PEST_CONTROL") return { categoryKey, ...buildPestRule(job) };
  if (categoryKey === "HANDYMAN") return { categoryKey, ...buildHandymanRule(job) };
  if (categoryKey === "FURNITURE_ASSEMBLY") return { categoryKey, ...buildFurnitureRule(job) };
  if (categoryKey === "WASTE_REMOVAL") return { categoryKey, ...buildWasteRule(job) };
  return { categoryKey, ...buildGardenRule(job) };
}

async function upsertSettings() {
  const settings = [
    { key: "marketplace.booking_fee", valueJson: { value: 10 }, description: "Launch booking fee percentage" },
    { key: "marketplace.booking_fee_mode", valueJson: { value: "percent" }, description: "Launch booking fee mode" },
    { key: "marketplace.commission_percent", valueJson: { value: 10 }, description: "Launch provider commission percentage" },
  ];

  for (const setting of settings) {
    await prisma.adminSetting.upsert({
      where: { key: setting.key },
      update: { valueJson: setting.valueJson, description: setting.description },
      create: setting,
    });
  }
}

async function applyPricingRules(providerCompanyId: string, categoryKeys: string[]) {
  const jobs = jobTypeCatalog.filter((job) => categoryKeys.includes(SERVICE_TO_CATEGORY[job.service]));
  for (const job of jobs) {
    const rule = buildRule(job);
    await prisma.providerPricingRule.upsert({
      where: {
        providerCompanyId_categoryKey_serviceKey: {
          providerCompanyId,
          categoryKey: rule.categoryKey,
          serviceKey: job.value,
        },
      },
      update: {
        pricingMode: rule.pricingMode,
        flatPrice: null,
        hourlyPrice: "hourlyPrice" in rule ? rule.hourlyPrice : null,
        minimumCharge: rule.minimumCharge,
        travelFee: null,
        sameDayUplift: rule.sameDayUplift,
        weekendUplift: rule.weekendUplift,
        customQuoteRequired: false,
        pricingJson: "pricingJson" in rule ? rule.pricingJson : undefined,
        active: true,
      },
      create: {
        providerCompanyId,
        categoryKey: rule.categoryKey,
        serviceKey: job.value,
        pricingMode: rule.pricingMode,
        flatPrice: null,
        hourlyPrice: "hourlyPrice" in rule ? rule.hourlyPrice : null,
        minimumCharge: rule.minimumCharge,
        travelFee: null,
        sameDayUplift: rule.sameDayUplift,
        weekendUplift: rule.weekendUplift,
        customQuoteRequired: false,
        pricingJson: "pricingJson" in rule ? rule.pricingJson : undefined,
        active: true,
      },
    });
  }
}

async function applyAreaOverrides(providerCompanyId: string, categoryKeys: string[]) {
  const coverage = await prisma.providerCoverageArea.findMany({
    where: { providerCompanyId, active: true, categoryKey: { in: categoryKeys } },
    select: { postcodePrefix: true, categoryKey: true },
  });

  await prisma.pricingAreaOverride.deleteMany({
    where: { providerCompanyId, categoryKey: { in: categoryKeys } },
  });

  for (const categoryKey of categoryKeys) {
    const surcharges = CATEGORY_SURCHARGE[categoryKey];
    const prefixes = Array.from(
      new Set(
        coverage
          .filter((item) => item.categoryKey === categoryKey)
          .map((item) => item.postcodePrefix.toUpperCase()),
      ),
    );

    for (const prefix of prefixes) {
      let surchargeAmount = 0;
      if (PRIME_CENTRAL.includes(prefix)) surchargeAmount = surcharges.prime;
      else if (INNER_LONDON.includes(prefix)) surchargeAmount = surcharges.inner;
      else if (FRINGE_OUTER.includes(prefix)) surchargeAmount = surcharges.fringe;
      if (!surchargeAmount) continue;

      await prisma.pricingAreaOverride.create({
        data: {
          providerCompanyId,
          categoryKey,
          postcodePrefix: prefix,
          surchargeAmount,
          bookingFeeOverride: null,
          commissionPercentOverride: null,
          active: true,
        },
      });
    }
  }
}

async function main() {
  await upsertSettings();

  const activeProviders = await prisma.providerCompany.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      tradingName: true,
      contactEmail: true,
      serviceCategories: {
        where: { active: true },
        select: { categoryKey: true },
      },
    },
  });

  for (const provider of activeProviders) {
    const categoryKeys = provider.serviceCategories.map((item) => item.categoryKey);
    if (!categoryKeys.length) continue;
    await applyPricingRules(provider.id, categoryKeys);
    await applyAreaOverrides(provider.id, categoryKeys);
    console.log(`Updated launch pricing for ${provider.tradingName || provider.contactEmail} (${categoryKeys.join(", ")})`);
  }

  console.log("Launch pricing applied.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
