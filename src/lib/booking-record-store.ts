import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type BookingRecord = {
  bookingReference: string;
  accessToken?: string;
  bookingStatus?: "draft" | "awaiting_payment" | "paid" | "confirmed" | "completed" | "cancelled";
  assignmentStatus?: "unassigned" | "offering" | "assigned" | "accepted" | "reassigned";
  jobStatus?: "pending" | "scheduled" | "in_progress" | "completed" | "no_show" | "cancelled";
  refundStatus?: "not_requested" | "pending" | "refunded" | "partial_refund" | "declined";
  cleanerId?: string;
  cleanerName?: string;
  cleanerEmail?: string;
  customerName: string;
  email: string;
  contactPhone: string;
  service: string;
  jobType?: string;
  postcode: string;
  jobSize?: string;
  urgency?: string;
  coverageZone?: string;
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
  cleanerPayoutAmount?: number;
  platformEarningsAmount?: number;
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

function randomBlock(length: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let index = 0; index < length; index += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

export function createAccessToken() {
  return `${randomBlock(8)}${randomBlock(8)}`;
}

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
    bookingStatus: input.bookingStatus || (input.stripePaymentStatus === "paid" ? "confirmed" : "awaiting_payment"),
    assignmentStatus: input.assignmentStatus || "unassigned",
    jobStatus: input.jobStatus || (input.stripePaymentStatus === "paid" ? "scheduled" : "pending"),
    refundStatus: input.refundStatus || "not_requested",
    cleanerPayoutAmount: input.cleanerPayoutAmount ?? Number((input.totalAmount * 0.7).toFixed(2)),
    platformEarningsAmount: input.platformEarningsAmount ?? Number((input.totalAmount * 0.3).toFixed(2)),
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
    bookingStatus: status === "paid" ? "confirmed" : store.bookings[existingIndex].bookingStatus,
    jobStatus: status === "paid" ? "scheduled" : store.bookings[existingIndex].jobStatus,
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

export async function listBookingRecords() {
  const store = await readStore();
  return store.bookings.sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1));
}

export async function getBookingDashboardSummary() {
  const bookings = await listBookingRecords();
  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((booking) => booking.createdAt.slice(0, 10) === today);

  return {
    totalTransactionAmount: todayBookings.reduce(
      (sum, booking) => sum + (booking.stripePaymentStatus === "paid" ? booking.totalAmount : 0),
      0,
    ),
    totalCancelledAmount: todayBookings.reduce(
      (sum, booking) => sum + (booking.jobStatus === "cancelled" ? booking.totalAmount : 0),
      0,
    ),
    totalRefundAmount: todayBookings.reduce(
      (sum, booking) =>
        sum + (booking.refundStatus === "refunded" || booking.refundStatus === "partial_refund" ? booking.totalAmount : 0),
      0,
    ),
  };
}

export async function updateBookingStatuses(
  bookingReference: string,
  updates: Partial<Pick<BookingRecord, "bookingStatus" | "assignmentStatus" | "jobStatus" | "refundStatus" | "stripePaymentStatus" | "cleanerId" | "cleanerName" | "cleanerEmail" | "cleanerPayoutAmount" | "platformEarningsAmount">>,
) {
  const store = await readStore();
  const index = store.bookings.findIndex((booking) => booking.bookingReference === bookingReference);

  if (index < 0) return null;

  store.bookings[index] = {
    ...store.bookings[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await writeStore(store);
  return store.bookings[index];
}

export async function listCleanerBookings(cleanerEmail: string) {
  const bookings = await listBookingRecords();
  return bookings.filter((booking) => (booking.cleanerEmail || "").toLowerCase() === cleanerEmail.toLowerCase());
}
