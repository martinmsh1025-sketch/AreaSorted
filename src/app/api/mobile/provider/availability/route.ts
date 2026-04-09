import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireMobileProviderPricingSession } from "@/lib/provider-mobile-auth";
import { serializeMobileAvailability, serializeMobileOverride } from "@/lib/providers/mobile-serializers";

const VALID_DAYS = new Set([0, 1, 2, 3, 4, 5, 6]);
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validTime(value: string) {
  return TIME_REGEX.test(value);
}

export async function GET(request: Request) {
  try {
    const session = await requireMobileProviderPricingSession(request);
    const prisma = getPrisma();
    const [schedule, overrides] = await Promise.all([
      prisma.providerAvailability.findMany({
        where: { providerCompanyId: session.providerCompany.id },
        orderBy: { dayOfWeek: "asc" },
      }),
      prisma.providerDateOverride.findMany({
        where: { providerCompanyId: session.providerCompany.id },
        orderBy: { date: "asc" },
      }),
    ]);

    return NextResponse.json({
      schedule: schedule.map((item) => serializeMobileAvailability(item)),
      overrides: overrides.map((item) => serializeMobileOverride(item)),
      settings: {
        maxJobsPerDay: session.providerCompany.maxJobsPerDay,
        leadTimeHours: session.providerCompany.leadTimeHours,
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (code.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to load availability." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireMobileProviderPricingSession(request);
    const prisma = getPrisma();
    const body = await request.json();

    const schedule = Array.isArray(body?.schedule) ? body.schedule : [];
    const settings = body?.settings ?? {};

    for (const item of schedule) {
      const dayOfWeek = Number(item?.dayOfWeek);
      const isAvailable = Boolean(item?.isAvailable);
      const startTime = String(item?.startTime || "09:00");
      const endTime = String(item?.endTime || "17:00");

      if (!VALID_DAYS.has(dayOfWeek)) {
        return NextResponse.json({ error: "Invalid day of week." }, { status: 400 });
      }
      if (!validTime(startTime) || !validTime(endTime)) {
        return NextResponse.json({ error: "Invalid time format." }, { status: 400 });
      }
      if (isAvailable && startTime >= endTime) {
        return NextResponse.json({ error: "Start time must be before end time." }, { status: 400 });
      }
    }

    await Promise.all(schedule.map((item: { dayOfWeek: number; isAvailable: boolean; startTime: string; endTime: string }) =>
      prisma.providerAvailability.upsert({
        where: {
          providerCompanyId_dayOfWeek: {
            providerCompanyId: session.providerCompany.id,
            dayOfWeek: Number(item.dayOfWeek),
          },
        },
        update: {
          isAvailable: Boolean(item.isAvailable),
          startTime: String(item.startTime),
          endTime: String(item.endTime),
        },
        create: {
          providerCompanyId: session.providerCompany.id,
          dayOfWeek: Number(item.dayOfWeek),
          isAvailable: Boolean(item.isAvailable),
          startTime: String(item.startTime),
          endTime: String(item.endTime),
        },
      }),
    ));

    await prisma.providerCompany.update({
      where: { id: session.providerCompany.id },
      data: {
        maxJobsPerDay: typeof settings.maxJobsPerDay === "number" && settings.maxJobsPerDay > 0 ? settings.maxJobsPerDay : null,
        leadTimeHours: typeof settings.leadTimeHours === "number" && settings.leadTimeHours > 0 ? settings.leadTimeHours : session.providerCompany.leadTimeHours,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (code.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to save availability." }, { status: 500 });
  }
}
