export type BookingDraftRecord = {
  bookingReference: string;
  createdAt: string;
  payload: unknown;
};

const STORAGE_KEY = "washhub-booking-draft";

function randomBlock(length: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let index = 0; index < length; index += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

export function createBookingReference() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `WH-${datePart}-${randomBlock(4)}`;
}

export function saveBookingDraft(payload: unknown, existingReference?: string) {
  const bookingReference = existingReference || createBookingReference();

  const record: BookingDraftRecord = {
    bookingReference,
    createdAt: new Date().toISOString(),
    payload,
  };

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  return record;
}

export function readBookingDraft<T>() {
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as BookingDraftRecord & { payload: T };
  } catch {
    return null;
  }
}
