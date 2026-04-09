import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireMobileProviderPricingSession } from "@/lib/provider-mobile-auth";
import { serializeMobileOverride } from "@/lib/providers/mobile-serializers";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validTime(value: string) {
  return TIME_REGEX.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireMobileProviderPricingSession(request);
    const prisma = getPrisma();
    const body = await request.json();
    const date = String(body?.date || "");
    const isAvailable = Boolean(body?.isAvailable);
    const startTime = String(body?.startTime || "09:00");
    const endTime = String(body?.endTime || "17:00");
    const note = String(body?.note || "").trim() || null;

    if (!date) {
      return NextResponse.json({ error: "Date is required." }, { status: 400 });
    }
    if (isAvailable && (!validTime(startTime) || !validTime(endTime) || startTime >= endTime)) {
      return NextResponse.json({ error: "Invalid override hours." }, { status: 400 });
    }

    const dateValue = new Date(`${date}T00:00:00.000Z`);
    const saved = await prisma.providerDateOverride.upsert({
      where: {
        providerCompanyId_date: {
          providerCompanyId: session.providerCompany.id,
          date: dateValue,
        },
      },
      update: {
        isAvailable,
        startTime: isAvailable ? startTime : null,
        endTime: isAvailable ? endTime : null,
        note,
      },
      create: {
        providerCompanyId: session.providerCompany.id,
        date: dateValue,
        isAvailable,
        startTime: isAvailable ? startTime : null,
        endTime: isAvailable ? endTime : null,
        note,
      },
    });

    return NextResponse.json({ ok: true, override: serializeMobileOverride(saved) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (code.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to save override." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireMobileProviderPricingSession(request);
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const overrideId = String(searchParams.get("id") || "");
    if (!overrideId) {
      return NextResponse.json({ error: "Override ID is required." }, { status: 400 });
    }

    await prisma.providerDateOverride.deleteMany({
      where: {
        id: overrideId,
        providerCompanyId: session.providerCompany.id,
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
    return NextResponse.json({ error: "Unable to delete override." }, { status: 500 });
  }
}
