import type { ProviderBusinessType } from "@/lib/providers/onboarding-profile";

export const providerDocumentDefinitions = [
  {
    key: "company_registration_proof",
    label: "Company registration proof",
    requiredFor: ["company"] as ProviderBusinessType[],
    helperText: "Required for limited companies only.",
  },
  {
    key: "representative_id_document",
    label: "ID document",
    requiredFor: ["company", "sole_trader"] as ProviderBusinessType[],
    helperText: "Required for the company signatory or sole trader.",
  },
  {
    key: "insurance_proof",
    label: "Insurance proof",
    requiredFor: ["company", "sole_trader"] as ProviderBusinessType[],
    helperText: "Required where your service category needs active insurance cover.",
  },
  {
    key: "dbs_certificate",
    label: "DBS certificate",
    requiredFor: [] as ProviderBusinessType[],
    helperText: "Optional, but providers with a DBS may be prioritised for some jobs.",
  },
  {
    key: "extra_supporting_document",
    label: "Extra supporting document",
    requiredFor: [] as ProviderBusinessType[],
    helperText: "Optional supporting evidence if the review team asks for more information.",
  },
] as const;

export const providerDocumentMaxFileSizeBytes = 10 * 1024 * 1024;
export const providerDocumentTotalMaxSizeBytes = 30 * 1024 * 1024;
export const providerDocumentAcceptedFormatsLabel = "PDF, JPG or PNG up to 10MB";
export const providerDocumentAcceptedFileTypes = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";
export const providerDocumentAcceptedMimeTypes = ["application/pdf", "image/jpeg", "image/png"] as const;

export function getProviderDocuments(businessType: ProviderBusinessType) {
  return providerDocumentDefinitions.filter(
    (item) => item.requiredFor.includes(businessType) || item.requiredFor.length === 0,
  );
}

export function getRequiredProviderDocuments(businessType: ProviderBusinessType) {
  return providerDocumentDefinitions.filter((item) => item.requiredFor.includes(businessType));
}
