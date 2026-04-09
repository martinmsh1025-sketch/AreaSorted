import { NextRequest, NextResponse } from "next/server";
import { requireMobileProviderAccountSession } from "@/lib/provider-mobile-auth";
import { getPrisma } from "@/lib/db";
import { serializeMobileProviderSummary } from "@/lib/providers/mobile-serializers";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireMobileProviderAccountSession(request);
    const body = await request.json();

    const tradingName = String(body?.tradingName || "").trim();
    const phone = String(body?.phone || "").trim();
    const registeredAddress = String(body?.registeredAddress || "").trim();
    const vatNumber = String(body?.vatNumber || "").trim();
    const profileImageUrl = String(body?.profileImageUrl || "").trim();
    const profileImageType = String(body?.profileImageType || "logo").trim();
    const headline = String(body?.headline || "").trim();
    const bio = String(body?.bio || "").trim();
    const yearsExperienceRaw = String(body?.yearsExperience || "").trim();

    if (!tradingName) {
      return NextResponse.json({ error: "Trading name is required." }, { status: 400 });
    }
    if (headline.length > 80) {
      return NextResponse.json({ error: "Headline must be 80 characters or fewer." }, { status: 400 });
    }
    if (bio.length > 400) {
      return NextResponse.json({ error: "Short description must be 400 characters or fewer." }, { status: 400 });
    }

    const yearsExperience = yearsExperienceRaw ? Number(yearsExperienceRaw) : null;
    if (yearsExperienceRaw && (yearsExperience == null || !Number.isFinite(yearsExperience) || yearsExperience < 0 || yearsExperience > 80)) {
      return NextResponse.json({ error: "Years of experience must be between 0 and 80." }, { status: 400 });
    }

    const prisma = getPrisma();
    const provider = await prisma.providerCompany.update({
      where: { id: session.providerCompany.id },
      data: {
        tradingName,
        phone: phone || null,
        registeredAddress: registeredAddress || null,
        vatNumber: vatNumber || null,
        profileImageUrl: profileImageUrl || null,
        profileImageType: profileImageType || null,
        headline: headline || null,
        bio: bio || null,
        yearsExperience,
      },
      include: {
        serviceCategories: true,
        coverageAreas: true,
        pricingRules: true,
      },
    });

    return NextResponse.json({ ok: true, provider: serializeMobileProviderSummary(provider) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (code.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}
