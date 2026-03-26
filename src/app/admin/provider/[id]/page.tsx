import { redirect } from "next/navigation";
import Link from "next/link";
import path from "node:path";
import { stat } from "node:fs/promises";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getProviderCompanyById } from "@/lib/providers/repository";
import { providerStatusLabels } from "@/lib/providers/service-catalog-mapping";
import { buildProviderChecklist } from "@/server/services/providers/checklist";
import { listProviderPricingRules } from "@/lib/pricing/prisma-pricing";
import {
  deleteCoverageAreaAction,
  reviewProviderDocumentAction,
  providerSavePricingConfigAction,
  providerDisablePricingConfigAction,
  providerDeletePricingConfigAction,
  providerSaveAreaOverrideAction,
} from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { ReviewDecisionForm } from "./review-decision-form";
import { ProviderPricingSection } from "./provider-pricing-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { groupPostcodePrefixes } from "@/lib/postcodes/group-prefixes";

function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
      return "default";
    case "SUSPENDED":
    case "REJECTED":
      return "destructive";
    case "INVITED":
      return "outline";
    default:
      return "secondary";
  }
}

function docStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "APPROVED":
      return "default";
    case "REJECTED":
    case "NEEDS_RESUBMISSION":
      return "destructive";
    case "PENDING":
      return "outline";
    default:
      return "secondary";
  }
}

function buildProviderDocumentUrl(providerCompanyId: string, storagePath: string) {
  if (!storagePath) {
    return "#";
  }

  if (storagePath.startsWith("/mock/documents/")) {
    return storagePath;
  }

  const markers = [
    `.data/provider-documents/${providerCompanyId}/`,
    `/uploads/provider-documents/${providerCompanyId}/`,
  ];

  const matchedMarker = markers.find((marker) => storagePath.startsWith(marker));
  const fileName = matchedMarker ? storagePath.slice(matchedMarker.length) : storagePath.split("/").pop() || storagePath;
  return `/api/provider-documents/${providerCompanyId}/${fileName}`;
}

function getProviderDocumentCandidates(providerCompanyId: string, storagePath: string, storedFileName: string) {
  const fileName = storedFileName || storagePath.split("/").pop() || "";
  return [
    path.join(process.cwd(), ".data", "provider-documents", providerCompanyId, fileName),
    path.join(process.cwd(), "uploads", "provider-documents", providerCompanyId, fileName),
    path.join(process.cwd(), "public", "mock", "documents", path.basename(storagePath)),
  ];
}

async function fileExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

type AdminProviderDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProviderDetailPage({ params, searchParams }: AdminProviderDetailPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const { id } = await params;
  const provider = await getProviderCompanyById(id);
  if (!provider) redirect("/admin/providers");

  const query = (await searchParams) ?? {};
  const status = typeof query.status === "string" ? query.status : "";
  const error = typeof query.error === "string" ? decodeURIComponent(query.error) : "";
  const checklist = buildProviderChecklist(provider);
  const completedCount = checklist.items.filter((item) => item.complete).length;
  const approvalBlockers = checklist.items.filter((item) =>
    ["email_verified", "password_set", "profile", "categories", "coverage", "documents_uploaded", "documents_approved", "agreement"].includes(item.key) && !item.complete,
  );
  const stripeReady =
    provider.stripeConnectedAccount?.chargesEnabled &&
    provider.stripeConnectedAccount?.payoutsEnabled;

  // Fetch pricing rules for this provider
  const pricingRules = await listProviderPricingRules(id);
  const pricingRulesData = pricingRules.map((r) => ({
    id: r.id,
    categoryKey: r.categoryKey,
    serviceKey: r.serviceKey,
    pricingMode: r.pricingMode,
    flatPrice: r.flatPrice,
    hourlyPrice: r.hourlyPrice,
    minimumCharge: r.minimumCharge,
    travelFee: r.travelFee,
    sameDayUplift: r.sameDayUplift,
    weekendUplift: r.weekendUplift,
    customQuoteRequired: r.customQuoteRequired,
    active: r.active,
    pricingJson: (r.pricingJson as Record<string, number> | null) ?? null,
  }));
  const groupedCoverageAreas = groupPostcodePrefixes(provider.coverageAreas.map((area) => area.postcodePrefix));
  const documentAvailability = new Map<string, boolean>();
  await Promise.all(
    provider.documents.map(async (document) => {
      const candidates = getProviderDocumentCandidates(provider.id, document.storagePath, document.storedFileName);
      const exists = (await Promise.all(candidates.map(fileExists))).some(Boolean);
      documentAvailability.set(document.id, exists);
    }),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/providers"
          className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          &larr; Back
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {provider.tradingName || provider.legalName || provider.contactEmail}
          </h1>
          <p className="text-muted-foreground">
            Review, approve, or request changes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusBadgeVariant(provider.status)}>
            {providerStatusLabels[provider.status] || provider.status}
          </Badge>
          <Badge variant="outline">
            {completedCount}/{checklist.items.length} checklist
          </Badge>
        </div>
      </div>

      {status && (
        <p className="text-sm text-green-600">
          {status.replace(/_/g, " ")}.
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">Approval not saved</p>
          <p>{error}</p>
        </div>
      )}

      {approvalBlockers.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Still blocking approval</p>
          <p>{approvalBlockers.map((item) => `${item.label}: ${item.detail}`).join(" | ")}</p>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Provider state</CardDescription>
            <CardTitle className="text-lg">
              {providerStatusLabels[provider.status] || provider.status}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Review submitted</CardDescription>
            <CardTitle className="text-lg">
              {provider.onboardingSubmittedAt
                ? new Date(provider.onboardingSubmittedAt).toLocaleDateString()
                : "Not yet"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Stripe</CardDescription>
            <CardTitle className={`text-lg ${stripeReady ? "text-green-600" : "text-destructive"}`}>
              {stripeReady ? "Ready" : "Locked / pending"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Approval checklist</CardTitle>
              <CardDescription>Approval blockers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklist.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.complete ? "Completed" : item.detail}
                      </p>
                    </div>
                    <Badge variant={item.complete ? "default" : "outline"}>
                      {item.complete ? "Done" : "Open"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Provider details */}
          <Card>
            <CardHeader>
              <CardTitle>Company details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Legal name</dt>
                  <dd className="font-medium">{provider.legalName || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Trading name</dt>
                  <dd className="font-medium">{provider.tradingName || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Company number</dt>
                  <dd className="font-medium">{provider.companyNumber || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Registered address</dt>
                  <dd className="font-medium">{provider.registeredAddress || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Contact email</dt>
                  <dd className="font-medium">{provider.contactEmail}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{provider.phone || "-"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted-foreground mb-2">Coverage areas</dt>
                  <dd>
                    {provider.coverageAreas.length > 0 ? (
                      <div className="space-y-3">
                        {groupedCoverageAreas.map((group) => (
                          <div key={group.areaKey} className="rounded-lg border p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div>
                                <strong className="text-sm">{group.areaName}</strong>
                                <p className="text-xs text-muted-foreground">{group.prefixes.length} postcode prefixes</p>
                              </div>
                              <Badge variant="outline" className="text-xs">{group.areaKey}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group.prefixes.map((prefix) => {
                                const area = provider.coverageAreas.find((coverageArea) => coverageArea.postcodePrefix === prefix);
                                if (!area) return null;
                                return (
                                  <div key={prefix} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
                                    <span className="font-medium">{prefix}</span>
                                    {!area.active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                                    <form action={deleteCoverageAreaAction}>
                                      <input type="hidden" name="providerCompanyId" value={provider.id} />
                                      <input type="hidden" name="coverageAreaId" value={area.id} />
                                      <FormSubmitButton
                                        label="×"
                                        pendingLabel="..."
                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-white shadow-sm hover:bg-destructive/90 disabled:opacity-50"
                                      />
                                    </form>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No coverage areas</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Categories</dt>
                  <dd className="font-medium">
                    {provider.serviceCategories.map((c) => c.categoryKey).join(", ") || "-"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Document review */}
          <Card>
            <CardHeader>
              <CardTitle>Document review</CardTitle>
              <CardDescription>Review uploaded files</CardDescription>
            </CardHeader>
            <CardContent>
              {provider.documents.length > 0 ? (
                <div className="space-y-4">
                  {provider.documents.map((document) => (
                    <div key={document.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{document.label}</p>
                          <a
                            href={documentAvailability.get(document.id) ? buildProviderDocumentUrl(provider.id, document.storagePath) : undefined}
                            target={documentAvailability.get(document.id) ? "_blank" : undefined}
                            rel={documentAvailability.get(document.id) ? "noopener noreferrer" : undefined}
                            className={`text-xs underline-offset-4 ${documentAvailability.get(document.id) ? "text-primary hover:underline" : "text-muted-foreground cursor-not-allowed no-underline"}`}
                          >
                            {document.fileName}
                          </a>
                          {!documentAvailability.get(document.id) ? (
                            <p className="text-[11px] text-red-600 mt-1">File missing from storage. Ask the provider to re-upload this document.</p>
                          ) : null}
                        </div>
                        <Badge variant={docStatusBadgeVariant(document.status)}>
                          {document.status}
                        </Badge>
                      </div>
                      <form action={reviewProviderDocumentAction} className="grid gap-3 sm:grid-cols-12">
                        <input type="hidden" name="providerCompanyId" value={provider.id} />
                        <input type="hidden" name="documentId" value={document.id} />
                        <div className="sm:col-span-4">
                          <Label htmlFor={`docStatus-${document.id}`}>Status</Label>
                          <select
                            id={`docStatus-${document.id}`}
                            name="documentStatus"
                            defaultValue={document.status}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="NEEDS_RESUBMISSION">Needs resubmission</option>
                          </select>
                        </div>
                        <div className="sm:col-span-6">
                          <Label htmlFor={`docNotes-${document.id}`}>Notes</Label>
                          <Input
                            id={`docNotes-${document.id}`}
                            name="reviewNotes"
                            defaultValue={document.reviewNotes || ""}
                          />
                        </div>
                        <div className="sm:col-span-2 flex items-end">
                          <FormSubmitButton
                            label="Save"
                            pendingLabel="..."
                            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                          />
                        </div>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No documents uploaded yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Provider decision */}
          <Card>
            <CardHeader>
              <CardTitle>Review decision</CardTitle>
              <CardDescription>Set the review outcome for this provider</CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewDecisionForm
                providerCompanyId={provider.id}
                currentStatus={provider.status}
                currentNotes={provider.reviewNotes || ""}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pricing rules — full width */}
      <ProviderPricingSection
        providerCompanyId={provider.id}
        providerName={provider.tradingName || provider.legalName || provider.contactEmail}
        rules={pricingRulesData}
        savePricingConfigAction={providerSavePricingConfigAction}
        disablePricingConfigAction={providerDisablePricingConfigAction}
        deletePricingConfigAction={providerDeletePricingConfigAction}
        saveAreaOverrideAction={providerSaveAreaOverrideAction}
      />
    </div>
  );
}
