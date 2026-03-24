"use server";

import { revalidatePath } from "next/cache";
import { getProviderSession } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";
import { canProviderAccessPricing } from "@/lib/providers/status";

const VALID_DAYS = [0, 1, 2, 3, 4, 5, 6];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validateTime(value: string): boolean {
  return TIME_REGEX.test(value);
}

async function getAvailabilitySession(): Promise<
  | { ok: true; providerCompanyId: string }
  | { ok: false; error: string }
> {
  try {
    const session = await getProviderSession();
    if (!session) {
      return { ok: false, error: "Session expired. Please log in again." };
    }
    if (!canProviderAccessPricing(session.providerCompany.status)) {
      return { ok: false, error: "You cannot manage availability in your current account status." };
    }
    return { ok: true, providerCompanyId: session.providerCompany.id };
  } catch {
    return { ok: false, error: "Failed to verify session." };
  }
}

/**
 * Bulk save all 7 days at once.
 * Expects JSON-encoded array of { dayOfWeek, isAvailable, startTime, endTime }.
 */
export async function saveAllAvailabilityAction(formData: FormData) {
  const auth = await getAvailabilitySession();
  if (!auth.ok) throw new Error(auth.error);
  const providerCompanyId = auth.providerCompanyId;
  const prisma = getPrisma();

  const rawDays = formData.get("days");
  if (!rawDays) throw new Error("Missing days data");

  const days: Array<{
    dayOfWeek: number;
    isAvailable: boolean;
    startTime: string;
    endTime: string;
  }> = JSON.parse(String(rawDays));

  // Validate
  for (const day of days) {
    if (!VALID_DAYS.includes(day.dayOfWeek)) {
      throw new Error(`Invalid day: ${day.dayOfWeek}`);
    }
    if (!validateTime(day.startTime) || !validateTime(day.endTime)) {
      throw new Error(`Invalid time for day ${day.dayOfWeek}`);
    }
    if (day.isAvailable && day.startTime >= day.endTime) {
      throw new Error(`Start must be before end for day ${day.dayOfWeek}`);
    }
  }

  await Promise.all(
    days.map((day) =>
      prisma.providerAvailability.upsert({
        where: {
          providerCompanyId_dayOfWeek: {
            providerCompanyId,
            dayOfWeek: day.dayOfWeek,
          },
        },
        update: {
          isAvailable: day.isAvailable,
          startTime: day.startTime,
          endTime: day.endTime,
        },
        create: {
          providerCompanyId,
          dayOfWeek: day.dayOfWeek,
          isAvailable: day.isAvailable,
          startTime: day.startTime,
          endTime: day.endTime,
        },
      })
    )
  );

  revalidatePath("/provider/availability");
}

/**
 * Save settings: maxJobsPerDay and leadTimeHours.
 */
export async function saveAvailabilitySettingsAction(formData: FormData) {
  const auth = await getAvailabilitySession();
  if (!auth.ok) throw new Error(auth.error);
  const providerCompanyId = auth.providerCompanyId;
  const prisma = getPrisma();

  const maxJobsRaw = formData.get("maxJobsPerDay");
  const leadTimeRaw = formData.get("leadTimeHours");

  const maxJobsPerDay =
    maxJobsRaw != null && String(maxJobsRaw).trim() !== ""
      ? parseInt(String(maxJobsRaw), 10)
      : null;
  const leadTimeHours =
    leadTimeRaw != null && String(leadTimeRaw).trim() !== ""
      ? parseInt(String(leadTimeRaw), 10)
      : 24;

  await prisma.providerCompany.update({
    where: { id: providerCompanyId },
    data: {
      maxJobsPerDay: maxJobsPerDay != null && maxJobsPerDay > 0 ? maxJobsPerDay : null,
      leadTimeHours: leadTimeHours > 0 ? leadTimeHours : 24,
    },
  });

  revalidatePath("/provider/availability");
}

/**
 * Save a date-specific override (block a day off or set custom hours).
 */
export async function saveDateOverrideAction(formData: FormData) {
  try {
    const auth = await getAvailabilitySession();
    if (!auth.ok) {
      return { success: false as const, error: auth.error };
    }
    const providerCompanyId = auth.providerCompanyId;
    const prisma = getPrisma();

    const dateStr = String(formData.get("date") || "");
    const isAvailable = formData.get("isAvailable") === "true";
    const startTime = String(formData.get("startTime") || "09:00").trim();
    const endTime = String(formData.get("endTime") || "17:00").trim();
    const note = String(formData.get("note") || "").trim() || null;

    if (!dateStr) {
      return { success: false as const, error: "Missing date" };
    }

    const date = new Date(dateStr + "T00:00:00.000Z");

    if (isAvailable) {
      if (!validateTime(startTime) || !validateTime(endTime)) {
        return { success: false as const, error: "Invalid time format" };
      }
      if (startTime >= endTime) {
        return { success: false as const, error: "Start time must be before end time" };
      }
    }

    const saved = await prisma.providerDateOverride.upsert({
      where: {
        providerCompanyId_date: {
          providerCompanyId,
          date,
        },
      },
      update: {
        isAvailable,
        startTime: isAvailable ? startTime : null,
        endTime: isAvailable ? endTime : null,
        note,
      },
      create: {
        providerCompanyId,
        date,
        isAvailable,
        startTime: isAvailable ? startTime : null,
        endTime: isAvailable ? endTime : null,
        note,
      },
    });

    revalidatePath("/provider/availability");

    return {
      success: true as const,
      override: {
        id: saved.id,
        date: saved.date.toISOString().split("T")[0],
        isAvailable: saved.isAvailable,
        startTime: saved.startTime,
        endTime: saved.endTime,
        note: saved.note,
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to save override.",
    };
  }
}

/**
 * Delete a date override.
 */
export async function deleteDateOverrideAction(formData: FormData) {
  const auth = await getAvailabilitySession();
  if (!auth.ok) throw new Error(auth.error);
  const providerCompanyId = auth.providerCompanyId;
  const prisma = getPrisma();

  const overrideId = String(formData.get("overrideId") || "");
  if (!overrideId) throw new Error("Missing override ID");

  await prisma.providerDateOverride.deleteMany({
    where: {
      id: overrideId,
      providerCompanyId,
    },
  });

  revalidatePath("/provider/availability");
}
