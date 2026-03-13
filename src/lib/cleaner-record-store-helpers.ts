import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CleanerApplicationRecord } from "@/lib/cleaner-application-store";
import type { CleanerRecord } from "@/lib/cleaner-record-store";

type CleanerStore = { cleaners: CleanerRecord[] };
const storeDir = path.join(process.cwd(), "data");
const storeFile = path.join(storeDir, "cleaner-records.json");

async function ensureStore() {
  await mkdir(storeDir, { recursive: true });
  try {
    await readFile(storeFile, "utf8");
  } catch {
    await writeFile(storeFile, JSON.stringify({ cleaners: [] }, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(storeFile, "utf8");
  return JSON.parse(raw) as CleanerStore;
}

async function writeStore(store: CleanerStore) {
  await writeFile(storeFile, JSON.stringify(store, null, 2), "utf8");
}

function nextCleanerId(count: number) {
  return `CL-${String(1000 + count + 1)}`;
}

export async function upsertCleanerRecordFromApplication(application: CleanerApplicationRecord) {
  const store = await readStore();
  const index = store.cleaners.findIndex((cleaner) => cleaner.email.toLowerCase() === application.email.toLowerCase());

  const base: CleanerRecord = {
    cleanerId: index >= 0 ? store.cleaners[index].cleanerId : nextCleanerId(store.cleaners.length),
    password: application.password,
    fullName: application.fullName,
    email: application.email,
    phone: application.phone,
    region: application.region || "",
    boroughs: application.boroughs,
    postcodeAreas: application.postcodeAreas,
    transportModes: application.transportModes,
    serviceTypes: application.serviceTypes,
    hasOwnSupplies: application.ownSuppliesLevel !== "No",
    profilePhotoUrl: application.uploads.photoName || "",
    introVideoUrl: application.uploads.introVideoName || "",
    onboardingStatus: "approved",
    score: index >= 0 ? store.cleaners[index].score : 100,
    trustBadges: index >= 0 ? store.cleaners[index].trustBadges : ["Documents reviewed"],
    scoreLog: index >= 0 ? store.cleaners[index].scoreLog : [],
  };

  if (index >= 0) {
    store.cleaners[index] = {
      ...store.cleaners[index],
      ...base,
    };
  } else {
    store.cleaners.unshift(base);
  }

  await writeStore(store);
  return base;
}
