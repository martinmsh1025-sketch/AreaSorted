import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type BookingRecord = {
  bookingReference: string;
  customerName: string;
  email: string;
  contactPhone: string;
  service: string;
  postcode: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  propertyType?: string;
  bedrooms?: string;
  bathrooms?: string;
  kitchens?: string;
  estimatedHours?: number;
  preferredDate: string;
  preferredTime: string;
  frequency?: string;
  supplies?: string;
  pets?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingPostcode?: string;
  additionalRequests?: string;
  entryNotes?: string;
  parkingNotes?: string;
  addOns?: string[];
  totalAmount: number;
  stripeSessionId?: string;
  stripePaymentStatus: "pending" | "paid" | "cancelled" | "failed";
  createdAt: string;
  updatedAt: string;
};

type BookingRecordStore = {
  bookings: BookingRecord[];
};

const storeDir = path.join(process.cwd(), "data");
const storeFile = path.join(storeDir, "booking-records.json");

async function ensureStore() {
  await mkdir(storeDir, { recursive: true });

  try {
    await readFile(storeFile, "utf8");
  } catch {
    const initial: BookingRecordStore = { bookings: [] };
    await writeFile(storeFile, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(storeFile, "utf8");
  return JSON.parse(raw) as BookingRecordStore;
}

async function writeStore(store: BookingRecordStore) {
  await writeFile(storeFile, JSON.stringify(store, null, 2), "utf8");
}

export async function upsertBookingRecord(input: Omit<BookingRecord, "createdAt" | "updatedAt">) {
  const store = await readStore();
  const existingIndex = store.bookings.findIndex((booking) => booking.bookingReference === input.bookingReference);
  const timestamp = new Date().toISOString();

  const nextRecord: BookingRecord = {
    ...input,
    createdAt: existingIndex >= 0 ? store.bookings[existingIndex].createdAt : timestamp,
    updatedAt: timestamp,
  };

  if (existingIndex >= 0) {
    store.bookings[existingIndex] = nextRecord;
  } else {
    store.bookings.unshift(nextRecord);
  }

  await writeStore(store);
  return nextRecord;
}

export async function markBookingPaymentStatusBySessionId(sessionId: string, status: BookingRecord["stripePaymentStatus"]) {
  const store = await readStore();
  const existingIndex = store.bookings.findIndex((booking) => booking.stripeSessionId === sessionId);

  if (existingIndex < 0) return null;

  store.bookings[existingIndex] = {
    ...store.bookings[existingIndex],
    stripePaymentStatus: status,
    updatedAt: new Date().toISOString(),
  };

  await writeStore(store);
  return store.bookings[existingIndex];
}

export async function getBookingRecordBySessionId(sessionId: string) {
  const store = await readStore();
  return store.bookings.find((booking) => booking.stripeSessionId === sessionId) ?? null;
}

export async function getBookingRecordByReference(bookingReference: string) {
  const store = await readStore();
  return store.bookings.find((booking) => booking.bookingReference === bookingReference) ?? null;
}
