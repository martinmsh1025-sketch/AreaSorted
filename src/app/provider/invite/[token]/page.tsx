import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderInviteByToken } from "@/lib/providers/repository";
import { getProviderCategoryByKey, providerServiceCatalog } from "@/lib/providers/service-catalog-mapping";
import { acceptProviderInviteAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Briefcase, HandshakeIcon } from "lucide-react";

const demoInviteLinksByCategory: Record<string, string> = {
  CLEANING: "demo-provider-invite-cleaning",
  PEST_CONTROL: "demo-provider-invite-pest-control",
  HANDYMAN: "demo-provider-invite-handyman",
  FURNITURE_ASSEMBLY: "demo-provider-invite-furniture-assembly",
  WASTE_REMOVAL: "demo-provider-invite-waste-removal",
  GARDEN_MAINTENANCE: "demo-provider-invite-garden-maintenance",
};

type ProviderInvitePageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderInvitePage({ params, searchParams }: ProviderInvitePageProps) {
  const { token } = await params;
  const query = (await searchParams) ?? {};

  const invite = await getProviderInviteByToken(token);
  if (!invite) notFound();
  const approvedCategory = getProviderCategoryByKey(invite.approvedCategoryKey || "");
  const error = typeof query.error === "string" ? decodeURIComponent(query.error) : "";
  const hasError = error.length > 0;
  const missingCategoryFromUrl = !approvedCategory;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <HandshakeIcon className="size-5" />
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">Accept your invite</h1>
          <p className="text-sm text-muted-foreground">
            This invite sets your provider category. You will choose services during onboarding.
          </p>
        </div>

        {/* Approved category */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Approved setup</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Category</span>
              <Badge variant="secondary">{approvedCategory?.label || "Not set"}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Missing category — show category links */}
        {missingCategoryFromUrl && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-sm">No category set on this invite</CardTitle>
              <p className="text-xs text-muted-foreground">Use one of the category-specific links below:</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {providerServiceCatalog.map((category) => (
                <div key={category.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{category.label}</span>
                  <Button variant="outline" size="sm" render={<Link href={`/provider/invite/${demoInviteLinksByCategory[category.key] || token}`} />}>
                    Open link
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Accept form */}
        {approvedCategory && (
          <Card>
            <CardContent className="pt-6">
              <form action={acceptProviderInviteAction} className="space-y-4">
                <input type="hidden" name="inviteToken" value={token} />
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    placeholder="you@company.com"
                    defaultValue={invite.email}
                    required
                  />
                </div>

                {hasError && (
                  <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>
                      {error === "Invite email does not match"
                        ? "Use the invited email to continue."
                        : error === "Invite expired"
                          ? "This invite has expired. Ask admin to send a new one."
                          : "This invite could not be accepted. Check the link or ask admin for a fresh invite."}
                    </span>
                  </div>
                )}

                <FormSubmitButton
                  label="Continue with email verification"
                  pendingLabel="Preparing verification..."
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center rounded-lg h-9 px-4 text-sm font-medium transition-colors"
                />
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
