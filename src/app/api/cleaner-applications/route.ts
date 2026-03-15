import { NextRequest, NextResponse } from "next/server";
import { createCleanerApplication } from "@/lib/cleaner-application-store";

function parseJsonField<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function fileName(value: FormDataEntryValue | null) {
  return value instanceof File && value.name ? value.name : "";
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const application = await createCleanerApplication({
    fullName: String(formData.get("fullName") || ""),
    password: String(formData.get("password") || ""),
    acceptSelfEmployed: String(formData.get("acceptSelfEmployed") || "false"),
    confirmAccuracy: String(formData.get("confirmAccuracy") || "false"),
    acceptTerms: String(formData.get("acceptTerms") || "false"),
    dateOfBirth: String(formData.get("dateOfBirth") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    addressLine1: String(formData.get("addressLine1") || ""),
    city: String(formData.get("city") || ""),
    postcode: String(formData.get("postcode") || ""),
    nationality: String(formData.get("nationality") || ""),
    rightToWork: String(formData.get("rightToWork") || ""),
    visaStatus: String(formData.get("visaStatus") || ""),
    visaExpiry: String(formData.get("visaExpiry") || ""),
    region: String(formData.get("region") || ""),
    boroughs: parseJsonField(formData.get("boroughs"), [] as string[]),
    postcodeAreas: parseJsonField(formData.get("postcodeAreas"), [] as string[]),
    transportModes: parseJsonField(formData.get("transportModes"), [] as string[]),
    serviceTypes: parseJsonField(formData.get("serviceTypes"), [] as string[]),
    maxTravelMiles: String(formData.get("maxTravelMiles") || ""),
    ownSuppliesLevel: String(formData.get("ownSuppliesLevel") || ""),
    supplyItems: parseJsonField(formData.get("supplyItems"), [] as string[]),
    availability: parseJsonField(formData.get("availability"), {} as Record<string, { available: boolean; start: string; end: string }>),
    uploads: {
      idDocumentName: fileName(formData.get("idDocument")),
      photoName: fileName(formData.get("photo")),
      cvName: fileName(formData.get("cv")),
      visaDocumentName: fileName(formData.get("visaDocument")),
      addressProofName: fileName(formData.get("addressProof")),
      introVideoName: fileName(formData.get("introVideo")),
    },
  });

  return NextResponse.json({ ok: true, applicationId: application.applicationId });
}
