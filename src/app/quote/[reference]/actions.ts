"use server";

import { redirect } from "next/navigation";
import { createInstantBookingFromQuote, submitManualQuoteRequest } from "@/server/services/public/quote-flow";

export async function startInstantBookingAction(formData: FormData) {
  const reference = String(formData.get("reference") || "");
  const result = await createInstantBookingFromQuote(reference);
  redirect(result.sessionUrl || `/booking/status/${result.bookingReference}`);
}

export async function submitManualQuoteAction(formData: FormData) {
  const reference = String(formData.get("reference") || "");
  await submitManualQuoteRequest(reference);
  redirect(`/quote/${reference}/manual-confirmation`);
}
