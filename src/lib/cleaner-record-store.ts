import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type CleanerScoreLog = {
  date: string;
  delta: number;
  reason: string;
};

export type CleanerRecord = {
  cleanerId: string;
  password?: string;
  fullName: string;
  email: string;
  phone: string;
  region: string;
  boroughs: string[];
  postcodeAreas: string[];
  transportModes: string[];
  serviceTypes: string[];
  hasOwnSupplies: boolean;
  profilePhotoUrl?: string;
  introVideoUrl?: string;
  onboardingStatus: "new" | "under_review" | "approved" | "active" | "suspended" | "rejected";
  score: number;
  trustBadges: string[];
  scoreLog: CleanerScoreLog[];
};

type CleanerRecordStore = {
  cleaners: CleanerRecord[];
};

const storeDir = path.join(process.cwd(), "data");
const storeFile = path.join(storeDir, "cleaner-records.json");

async function ensureStore() {
  await mkdir(storeDir, { recursive: true });
  try {
    await readFile(storeFile, "utf8");
  } catch {
    const initial: CleanerRecordStore = { cleaners: [] };
    await writeFile(storeFile, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(storeFile, "utf8");
  return JSON.parse(raw) as CleanerRecordStore;
}

export async function listCleanerRecords() {
  const store = await readStore();
  return store.cleaners;
}

export async function getCleanerRecordByEmail(email: string) {
  const cleaners = await listCleanerRecords();
  return cleaners.find((cleaner) => cleaner.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getCleanerRecordById(cleanerId: string) {
  const cleaners = await listCleanerRecords();
  return cleaners.find((cleaner) => cleaner.cleanerId === cleanerId) ?? null;
}

export async function cleanerRecordEmailExists(email: string) {
  const cleaners = await listCleanerRecords();
  return cleaners.some((cleaner) => cleaner.email.toLowerCase() === email.toLowerCase());
}
