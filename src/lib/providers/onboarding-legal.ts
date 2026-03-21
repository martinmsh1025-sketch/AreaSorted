import type { ProviderBusinessType } from "@/lib/providers/onboarding-profile";

type AgreementContent = {
  title: string;
  version: string;
  intro: string;
  sections: Array<{ heading: string; points: string[] }>;
};

export const onboardingBusinessTypeOptions = [
  { value: "company", label: "Limited company" },
  { value: "sole_trader", label: "Sole trader" },
] as const;

const soleTraderAgreement: AgreementContent = {
  title: "Provider Terms for Sole Traders",
  version: "sole-trader-v1",
  intro:
    "These terms govern the relationship between the platform and an independent self-employed provider. By accepting, the provider confirms they operate as an independent business and agree to the platform's booking, payment, compliance, and conduct rules.",
  sections: [
    {
      heading: "Independent status",
      points: [
        "You join as an independent sole trader, not an employee, worker, partner, or agent of the platform.",
        "You decide your availability and whether to accept booking opportunities unless a separate written arrangement says otherwise.",
        "The relationship is non-exclusive and there is no guarantee of minimum jobs or earnings.",
      ],
    },
    {
      heading: "Bookings and payments",
      points: [
        "The platform may send booking opportunities with limited job details before confirmation and fuller customer details after confirmation where needed.",
        "The platform may place a pre-authorisation or payment hold on the customer's card before confirmation and capture payment after provider confirmation.",
        "Payouts are subject to fees, commission, complaints, refunds, chargebacks, and any other permitted deductions.",
      ],
    },
    {
      heading: "Tax and business responsibility",
      points: [
        "You are responsible for your own income tax, National Insurance, VAT, record-keeping, and business filings.",
        "You must keep onboarding information accurate and notify the platform if material details change.",
        "You are responsible for your own equipment, materials, business costs, and operating expenses unless agreed otherwise in writing.",
      ],
    },
    {
      heading: "Data, conduct, and standards",
      points: [
        "Customer data may only be used for platform bookings and must be kept confidential and secure.",
        "You must comply with platform standards, safety requirements, cancellation rules, and any required legal or compliance checks.",
        "You must not divert customers off-platform where the provider terms prohibit non-circumvention.",
      ],
    },
  ],
};

const companyAgreement: AgreementContent = {
  title: "Company Provider Terms",
  version: "company-provider-v1",
  intro:
    "These terms govern the relationship between the platform and a company provider. By accepting, the authorised signatory confirms they have authority to bind the company and that the company agrees to the platform's operational, payment, compliance, and conduct requirements.",
  sections: [
    {
      heading: "Independent business status",
      points: [
        "The provider joins as an independent business and nothing creates employment between the platform and the company or its personnel.",
        "The company decides availability and whether to accept booking opportunities unless a separate written arrangement says otherwise.",
        "The relationship is non-exclusive and there is no guarantee of minimum work or revenue.",
      ],
    },
    {
      heading: "Bookings and payments",
      points: [
        "The platform may send booking opportunities, manage customer communication, and control the payment process.",
        "The platform may place payment holds or pre-authorisations before confirmation and capture payment once the provider confirms.",
        "Provider payouts remain subject to fees, commission, complaints, refunds, chargebacks, investigations, and any other permitted deductions.",
      ],
    },
    {
      heading: "Company obligations",
      points: [
        "The company is responsible for its personnel, taxes, PAYE, VAT, insurance, supervision, and regulatory compliance.",
        "Any signatory accepting these terms must have full authority to bind the company.",
        "The company must keep onboarding, ownership, insurance, and contact information accurate and up to date.",
      ],
    },
    {
      heading: "Data, conduct, and non-circumvention",
      points: [
        "Customer data may only be used for platform bookings and must be protected by the company and its personnel.",
        "The company and its personnel must comply with platform standards, safety rules, cancellation requirements, and lawful conduct expectations.",
        "The company must not divert platform customers off-platform where the provider terms prohibit non-circumvention.",
      ],
    },
  ],
};

export function getAgreementContent(businessType: ProviderBusinessType): AgreementContent {
  return businessType === "sole_trader" ? soleTraderAgreement : companyAgreement;
}
