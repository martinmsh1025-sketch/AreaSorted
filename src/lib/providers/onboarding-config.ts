export const providerRequiredDocuments = [
  { key: "company_registration_proof", label: "Company registration proof", required: true },
  { key: "insurance_proof", label: "Insurance proof", required: false },
  { key: "representative_id_document", label: "Representative ID document", required: false },
  { key: "extra_supporting_document", label: "Extra supporting document", required: false },
] as const;

export const providerDocumentMaxFileSizeBytes = 10 * 1024 * 1024;
export const providerDocumentTotalMaxSizeBytes = 30 * 1024 * 1024;
export const providerDocumentAcceptedFormatsLabel = "PDF, JPG or PNG up to 10MB";
export const providerDocumentAcceptedFileTypes = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";
export const providerDocumentAcceptedMimeTypes = ["application/pdf", "image/jpeg", "image/png"] as const;

export function getRequiredProviderDocuments() {
  return providerRequiredDocuments.filter((item) => item.required);
}
