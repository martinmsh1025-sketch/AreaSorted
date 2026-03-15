import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { upsertCleanerRecordFromApplication } from "@/lib/cleaner-record-store-helpers";

export type CleanerApplicationStatus = "submitted" | "under_review" | "more_info_required" | "approved" | "rejected";

export type CleanerApplicationRecord = {
  applicationId: string;
  password: string;
  acceptSelfEmployed?: string;
  confirmAccuracy?: string;
  acceptTerms?: string;
  status: CleanerApplicationStatus;
  submittedAt: string;
  updatedAt: string;
  internalReason?: string;
  externalMessage?: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  postcode: string;
  nationality: string;
  rightToWork: string;
  visaStatus?: string;
  visaExpiry?: string;
  region?: string;
  boroughs: string[];
  postcodeAreas: string[];
  transportModes: string[];
  serviceTypes: string[];
  maxTravelMiles?: string;
  ownSuppliesLevel?: string;
  supplyItems: string[];
  availability: Record<string, { available: boolean; start: string; end: string }>;
  uploads: {
    idDocumentName?: string;
    photoName?: string;
    cvName?: string;
    visaDocumentName?: string;
    addressProofName?: string;
    introVideoName?: string;
  };
};

type CleanerApplicationStore = {
  applications: CleanerApplicationRecord[];
};

const storeDir = path.join(process.cwd(), "data");
const storeFile = path.join(storeDir, "cleaner-applications.json");

function createId() {
  return `APP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

async function ensureStore() {
  await mkdir(storeDir, { recursive: true });
  try {
    await readFile(storeFile, "utf8");
  } catch {
    const initial: CleanerApplicationStore = { applications: [] };
    await writeFile(storeFile, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(storeFile, "utf8");
  return JSON.parse(raw) as CleanerApplicationStore;
}

async function writeStore(store: CleanerApplicationStore) {
  await writeFile(storeFile, JSON.stringify(store, null, 2), "utf8");
}

export async function createCleanerApplication(input: Omit<CleanerApplicationRecord, "applicationId" | "status" | "submittedAt" | "updatedAt">) {
  const store = await readStore();
  const timestamp = new Date().toISOString();
  const record: CleanerApplicationRecord = {
    ...input,
    applicationId: createId(),
    status: "submitted",
    submittedAt: timestamp,
    updatedAt: timestamp,
  };
  store.applications.unshift(record);
  await writeStore(store);
  return record;
}

export async function cleanerApplicationEmailExists(email: string) {
  const store = await readStore();
  return store.applications.some((application) => application.email.toLowerCase() === email.toLowerCase());
}

export async function listCleanerApplications() {
  const store = await readStore();
  return store.applications.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

export async function getCleanerApplicationById(applicationId: string) {
  const store = await readStore();
  return store.applications.find((application) => application.applicationId === applicationId) ?? null;
}

export async function getCleanerApplicationByEmail(email: string) {
  const store = await readStore();
  return store.applications.find((application) => application.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function updateCleanerApplicationReview(
  applicationId: string,
  updates: {
    status: CleanerApplicationStatus;
    internalReason: string;
    externalMessage?: string;
  },
) {
  const store = await readStore();
  const index = store.applications.findIndex((application) => application.applicationId === applicationId);
  if (index < 0) return null;

  store.applications[index] = {
    ...store.applications[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const record = store.applications[index];
  await writeStore(store);

  if (updates.status === "approved") {
    await upsertCleanerRecordFromApplication(record);
  }

  return record;
}
