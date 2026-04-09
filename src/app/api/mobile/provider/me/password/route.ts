import { NextRequest, NextResponse } from "next/server";
import { requireMobileProviderAccountSession } from "@/lib/provider-mobile-auth";
import { verifyPassword, hashPassword } from "@/lib/security/password";
import { getPrisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await requireMobileProviderAccountSession(request);
    const body = await request.json();
    const currentPassword = String(body?.currentPassword || "");
    const newPassword = String(body?.newPassword || "");
    const confirmPassword = String(body?.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Please complete all password fields." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New password and confirmation do not match." }, { status: 400 });
    }

    const validCurrentPassword = await verifyPassword(currentPassword, session.user.passwordHash);
    if (!validCurrentPassword) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    const prisma = getPrisma();
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
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
    return NextResponse.json({ error: "Unable to update password." }, { status: 500 });
  }
}
