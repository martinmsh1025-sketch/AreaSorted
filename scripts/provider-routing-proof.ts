import { getProviderDefaultRoute } from "@/lib/providers/portal-routing";

const cases = [
  { status: "INVITED", expected: "/provider/login" },
  { status: "EMAIL_VERIFICATION_PENDING", expected: "/provider/login" },
  { status: "PASSWORD_SETUP_PENDING", expected: "/provider/login" },
  { status: "ONBOARDING_IN_PROGRESS", expected: "/provider/onboarding" },
  { status: "SUBMITTED_FOR_REVIEW", expected: "/provider/application-status" },
  { status: "UNDER_REVIEW", expected: "/provider/application-status" },
  { status: "CHANGES_REQUESTED", expected: "/provider/application-status" },
  { status: "REJECTED", expected: "/provider/application-status" },
  { status: "APPROVED", expected: "/provider/dashboard" },
  { status: "STRIPE_PENDING", expected: "/provider/dashboard" },
  { status: "STRIPE_RESTRICTED", expected: "/provider/dashboard" },
  { status: "PRICING_PENDING", expected: "/provider/pricing" },
  { status: "ACTIVE", expected: "/provider" },
  { status: "SUSPENDED", expected: "/provider" },
];

const results = cases.map((item) => ({
  status: item.status,
  expected: item.expected,
  actual: getProviderDefaultRoute(item.status),
  pass: getProviderDefaultRoute(item.status) === item.expected,
}));

const failing = results.filter((item) => !item.pass);
if (failing.length) {
  console.error(JSON.stringify({ failing }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ checked: results.length, results }, null, 2));
