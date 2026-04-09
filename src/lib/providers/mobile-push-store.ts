import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredProviderPushToken = {
  providerCompanyId: string;
  expoPushToken: string;
  deviceName?: string | null;
  platform?: string | null;
  appVersion?: string | null;
  updatedAt: string;
};

const STORE_DIR = path.resolve(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "provider-mobile-push-tokens.json");

async function readStore() {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredProviderPushToken[]) : [];
  } catch {
    return [];
  }
}

async function writeStore(tokens: StoredProviderPushToken[]) {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_PATH, `${JSON.stringify(tokens, null, 2)}\n`, "utf8");
}

export async function upsertProviderPushToken(input: Omit<StoredProviderPushToken, "updatedAt">) {
  const tokens = await readStore();
  const next: StoredProviderPushToken = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  const existingIndex = tokens.findIndex(
    (item) => item.providerCompanyId === input.providerCompanyId && item.expoPushToken === input.expoPushToken,
  );

  if (existingIndex >= 0) {
    tokens[existingIndex] = next;
  } else {
    tokens.push(next);
  }

  await writeStore(tokens);
  return next;
}

export async function removeProviderPushToken(input: { providerCompanyId: string; expoPushToken: string }) {
  const tokens = await readStore();
  const filtered = tokens.filter(
    (item) => !(item.providerCompanyId === input.providerCompanyId && item.expoPushToken === input.expoPushToken),
  );
  await writeStore(filtered);
}
