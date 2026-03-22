import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProviderOnboardingAccess } from "@/lib/provider-auth";
import { canProviderEditOnboarding } from "@/lib/providers/status";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { submitProviderForReviewAction } from "@/app/provider/onboarding/actions";
import { ProviderStatusBadge } from "@/components/providers/status-badge";
import { getProviderCategoryByKey } from "@/lib/providers/service-catalog-mapping";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, ChevronLeft, FileText, MapPin, Briefcase, Building2 } from "lucide-react";
import { groupPostcodePrefixes } from "@/lib/postcodes/group-prefixes";

type ProviderApplicationConfirmationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderApplicationConfirmationPage({ searchParams }: ProviderApplicationConfirmationPageProps) {
  const session = await requireProviderOnboardingAccess();
  const provider = session.providerCompany;
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : "";

  if (!canProviderEditOnboarding(provider.status)) {
    redirect("/provider/application-status");
  }

  const checklist = buildProviderChecklist(provider);
  const summaryItems = checklist.items.filter((item) =>
    ["profile", "categories", "coverage", "documents_uploaded", "agreement"].includes(item.key),
  );
  const missingBeforeSubmit = checklist.items.filter(
    (item) => ["email_verified", "password_set", "profile", "categories", "coverage", "documents_uploaded", "agreement"].includes(item.key) && !item.complete,
  );
  const lockedCategory = getProviderCategoryByKey(session.latestInvite?.approvedCategoryKey || provider.serviceCategories[0]?.categoryKey || "");
  const selectedServiceKeys =
    provider.stripeRequirementsJson &&
    typeof provider.stripeRequirementsJson === "object" &&
    !Array.isArray(provider.stripeRequirementsJson) &&
    Array.isArray(provider.stripeRequirementsJson.approvedServiceKeys)
      ? provider.stripeRequirementsJson.approvedServiceKeys.map((item) => String(item))
      : [];
  const selectedServices = lockedCategory?.services.filter((service) => selectedServiceKeys.includes(service.key)) || [];
  const coveragePostcodes = Array.from(new Set(provider.coverageAreas.map((item) => item.postcodePrefix))).sort();
  const groupedCoveragePostcodes = groupPostcodePrefixes(coveragePostcodes);
  const uploadedDocuments = provider.documents.filter((document) => ["PENDING", "APPROVED"].includes(document.status));

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Confirm your application</h1>
          <p className="text-sm text-muted-foreground">Review your details before submitting for review.</p>
        </div>
        <div className="flex items-center gap-2">
          <ProviderStatusBadge status={provider.status} />
          <Badge variant="secondary" className="text-xs">Next: admin review</Badge>
        </div>
      </div>

      {/* ─── Error / missing items ─── */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
          <AlertCircle className="size-4 shrink-0" />
          <div>
            <p className="font-medium">Cannot submit yet</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      {!error && missingBeforeSubmit.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
          <AlertCircle className="size-4 shrink-0" />
          <div>
            <p className="font-medium">Finish these before you submit</p>
            <p>{missingBeforeSubmit.map((item) => item.label).join(", ")}</p>
          </div>
        </div>
      )}

      {/* ─── Readiness checklist ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Submission checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {summaryItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`flex size-5 items-center justify-center rounded-full ${
                    item.complete
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {item.complete ? <Check className="size-3" /> : <span className="size-2 rounded-full bg-muted-foreground/40" />}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </div>
                <Badge variant={item.complete ? "default" : "outline"} className="text-xs">
                  {item.complete ? "Ready" : item.detail}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Summary cards ─── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Company details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-blue-600" />
              <CardTitle className="text-sm">Company details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Legal name</span><span className="font-medium">{provider.legalName || "Missing"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Company number</span><span className="font-medium">{provider.companyNumber || "Missing"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{provider.contactEmail || session.user.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{provider.phone || "Missing"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="max-w-[200px] text-right font-medium">{provider.registeredAddress || "Missing"}</span></div>
            <div className="pt-2">
              <Button variant="outline" size="sm" render={<Link href="/provider/onboarding?step=1" />}>
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-blue-600" />
              <CardTitle className="text-sm">Services</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">{lockedCategory?.label || "Missing"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Services</span><span className="font-medium">{selectedServices.length}</span></div>
            {selectedServices.length > 0 && (
              <p className="text-xs text-muted-foreground">{selectedServices.map((service) => service.label).join(", ")}</p>
            )}
            <div className="pt-2">
              <Button variant="outline" size="sm" render={<Link href="/provider/onboarding?step=2" />}>
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Coverage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-blue-600" />
              <CardTitle className="text-sm">Coverage</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Postcodes</span><span className="font-medium">{coveragePostcodes.length}</span></div>
            {coveragePostcodes.length > 0 ? (
              <div className="space-y-2">
                {groupedCoveragePostcodes.map((group) => (
                  <div key={group.areaKey} className="rounded-md border p-2">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{group.areaName}</div>
                    <div className="flex flex-wrap gap-1">
                      {group.prefixes.map((postcode) => (
                        <Badge key={postcode} variant="secondary" className="text-xs">{postcode}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No coverage selected yet.</p>
            )}
            <div className="pt-2">
              <Button variant="outline" size="sm" render={<Link href="/provider/onboarding?step=3" />}>
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-blue-600" />
              <CardTitle className="text-sm">Documents</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {uploadedDocuments.length > 0 ? (
              uploadedDocuments.map((document) => (
                <div key={document.id || document.documentKey} className="flex justify-between">
                  <span className="text-muted-foreground">{document.label || document.documentKey}</span>
                  <span className="max-w-[180px] truncate font-medium">{document.fileName}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
            )}
            <div className="pt-2">
              <Button variant="outline" size="sm" render={<Link href="/provider/onboarding?step=4" />}>
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Actions ─── */}
      <div className="flex items-center justify-between">
        <Button variant="outline" render={<Link href="/provider/onboarding?step=4" />}>
          <ChevronLeft className="size-4" />
          Back to onboarding
        </Button>
        <form action={submitProviderForReviewAction}>
          <FormSubmitButton
            label="Confirm and submit"
            pendingLabel="Submitting..."
            disabled={Boolean(missingBeforeSubmit.length)}
            className="bg-blue-600 hover:bg-blue-700 text-white inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent px-2.5 h-8 text-sm font-medium transition-all"
          />
        </form>
      </div>
    </div>
  );
}
