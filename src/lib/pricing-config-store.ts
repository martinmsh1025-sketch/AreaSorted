import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { jobTypeCatalog } from "@/lib/service-catalog";

export type PricingConfigRecord = {
  jobType: string;
  service: string;
  subcategory: string;
  label: string;
  providerBasePrice: number;
  markupPercent: number;
  markupFixed: number;
  bookingFee: number;
  adminOverridePrice?: number;
  active: boolean;
  updatedAt: string;
};

type PricingConfigStore = {
  pricing: PricingConfigRecord[];
};

const storeDir = path.join(process.cwd(), "data");
const storeFile = path.join(storeDir, "pricing-config.json");

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function buildDefaultStore(): PricingConfigStore {
  return {
    pricing: jobTypeCatalog.map((job) => ({
      jobType: job.value,
      service: job.service,
      subcategory: job.subcategory,
      label: job.label,
      providerBasePrice: roundMoney(Math.max(20, job.basePrice * 0.72)),
      markupPercent: 18,
      markupFixed: 8,
      bookingFee: job.bookingFee,
      adminOverridePrice: undefined,
      active: true,
      updatedAt: new Date().toISOString(),
    })),
  };
}

async function ensureStore() {
  await mkdir(storeDir, { recursive: true });
  try {
    await readFile(storeFile, "utf8");
  } catch {
    await writeFile(storeFile, JSON.stringify(buildDefaultStore(), null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(storeFile, "utf8");
  return JSON.parse(raw) as PricingConfigStore;
}

async function writeStore(store: PricingConfigStore) {
  await mkdir(storeDir, { recursive: true });
  await writeFile(storeFile, JSON.stringify(store, null, 2), "utf8");
}

export function calculatePricingPreview(record: PricingConfigRecord) {
  const computedSellPrice = roundMoney(record.providerBasePrice * (1 + record.markupPercent / 100) + record.markupFixed + record.bookingFee);
  const finalSellPrice = record.adminOverridePrice && record.adminOverridePrice > 0 ? record.adminOverridePrice : computedSellPrice;
  const margin = roundMoney(finalSellPrice - record.providerBasePrice);
  return { computedSellPrice, finalSellPrice, margin };
}

export async function listPricingConfigs() {
  const store = await readStore();
  return store.pricing.map((record) => ({ ...record, preview: calculatePricingPreview(record) }));
}

export async function upsertPricingConfig(input: {
  jobType: string;
  providerBasePrice: number;
  markupPercent: number;
  markupFixed: number;
  bookingFee: number;
  adminOverridePrice?: number;
  active: boolean;
}) {
  const store = await readStore();
  const existing = store.pricing.find((record) => record.jobType === input.jobType);
  if (!existing) throw new Error(`Pricing config not found for ${input.jobType}`);

  existing.providerBasePrice = roundMoney(input.providerBasePrice);
  existing.markupPercent = roundMoney(input.markupPercent);
  existing.markupFixed = roundMoney(input.markupFixed);
  existing.bookingFee = roundMoney(input.bookingFee);
  existing.adminOverridePrice = input.adminOverridePrice && input.adminOverridePrice > 0 ? roundMoney(input.adminOverridePrice) : undefined;
  existing.active = input.active;
  existing.updatedAt = new Date().toISOString();

  await writeStore(store);
  return { ...existing, preview: calculatePricingPreview(existing) };
}
