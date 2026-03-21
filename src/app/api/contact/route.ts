import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const prisma = getPrisma();

    // Store the enquiry in the database
    await prisma.contactEnquiry.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}
