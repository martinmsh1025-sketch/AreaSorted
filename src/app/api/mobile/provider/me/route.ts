import { NextResponse } from "next/server";
import { requireMobileProviderAccountSession } from "@/lib/provider-mobile-auth";
import { serializeMobileProviderSummary } from "@/lib/providers/mobile-serializers";

export async function GET(request: Request) {
  try {
    const session = await requireMobileProviderAccountSession(request);
    return NextResponse.json({
      provider: serializeMobileProviderSummary(session.providerCompany),
      user: {
        id: session.user.id,
        email: session.user.email,
        isActive: session.user.isActive,
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
    return NextResponse.json({ error: "Unable to load provider account." }, { status: 500 });
  }
}
