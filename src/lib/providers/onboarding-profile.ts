import type { JsonValue } from "@prisma/client/runtime/library";

export type ProviderBusinessType = "company" | "sole_trader";

export type ProviderOnboardingMetadata = {
  businessType: ProviderBusinessType;
  companyCountry?: string;
  companyIncorporationDate?: string;
  companyType?: string;
  website?: string;
  authorisedSignatoryName?: string;
  authorisedSignatoryTitle?: string;
  authorisedSignatoryEmail?: string;
  authorisedSignatoryPhone?: string;
  authorisedSignatoryAuthority?: string;
  operationsContactName?: string;
  operationsContactRole?: string;
  operationsContactPhone?: string;
  operationsContactEmail?: string;
  emergencyContactName?: string;
  emergencyContactRole?: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;
  workerCount?: string;
  dateOfBirth?: string;
  nationality?: string;
  businessAddress?: string;
  nationalInsuranceNumber?: string;
  utrNumber?: string;
  hmrcStatus?: string;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function getProviderOnboardingMetadata(value: JsonValue | null | undefined): ProviderOnboardingMetadata {
  const record = asRecord(value);
  return {
    businessType: record?.businessType === "sole_trader" ? "sole_trader" : "company",
    companyCountry: typeof record?.companyCountry === "string" ? record.companyCountry : "",
    companyIncorporationDate: typeof record?.companyIncorporationDate === "string" ? record.companyIncorporationDate : "",
    companyType: typeof record?.companyType === "string" ? record.companyType : "",
    website: typeof record?.website === "string" ? record.website : "",
    authorisedSignatoryName: typeof record?.authorisedSignatoryName === "string" ? record.authorisedSignatoryName : "",
    authorisedSignatoryTitle: typeof record?.authorisedSignatoryTitle === "string" ? record.authorisedSignatoryTitle : "",
    authorisedSignatoryEmail: typeof record?.authorisedSignatoryEmail === "string" ? record.authorisedSignatoryEmail : "",
    authorisedSignatoryPhone: typeof record?.authorisedSignatoryPhone === "string" ? record.authorisedSignatoryPhone : "",
    authorisedSignatoryAuthority: typeof record?.authorisedSignatoryAuthority === "string" ? record.authorisedSignatoryAuthority : "",
    operationsContactName: typeof record?.operationsContactName === "string" ? record.operationsContactName : "",
    operationsContactRole: typeof record?.operationsContactRole === "string" ? record.operationsContactRole : "",
    operationsContactPhone: typeof record?.operationsContactPhone === "string" ? record.operationsContactPhone : "",
    operationsContactEmail: typeof record?.operationsContactEmail === "string" ? record.operationsContactEmail : "",
    emergencyContactName: typeof record?.emergencyContactName === "string" ? record.emergencyContactName : "",
    emergencyContactRole: typeof record?.emergencyContactRole === "string" ? record.emergencyContactRole : "",
    emergencyContactPhone: typeof record?.emergencyContactPhone === "string" ? record.emergencyContactPhone : "",
    emergencyContactEmail: typeof record?.emergencyContactEmail === "string" ? record.emergencyContactEmail : "",
    workerCount: typeof record?.workerCount === "string" ? record.workerCount : "",
    dateOfBirth: typeof record?.dateOfBirth === "string" ? record.dateOfBirth : "",
    nationality: typeof record?.nationality === "string" ? record.nationality : "",
    businessAddress: typeof record?.businessAddress === "string" ? record.businessAddress : "",
    nationalInsuranceNumber: typeof record?.nationalInsuranceNumber === "string" ? record.nationalInsuranceNumber : "",
    utrNumber: typeof record?.utrNumber === "string" ? record.utrNumber : "",
    hmrcStatus: typeof record?.hmrcStatus === "string" ? record.hmrcStatus : "",
  };
}

export function getProviderAgreementVersion(businessType: ProviderBusinessType) {
  return businessType === "sole_trader" ? "sole-trader-v1" : "company-provider-v1";
}
