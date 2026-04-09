import { requireProviderAccountAccess } from "@/lib/provider-auth";
import { ProviderPublicProfileCard } from "@/components/provider/public-profile-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { parseProviderPublicProfileMetadata } from "@/lib/providers/public-profile-metadata";
import { Eye, LayoutTemplate } from "lucide-react";

export default async function ProviderPreviewPage() {
  const session = await requireProviderAccountAccess();
  const provider = session.providerCompany;
  const publicProfileMetadata = parseProviderPublicProfileMetadata(provider.specialtiesText);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Eye className="size-5 text-[#c62828]" />
          Profile preview
        </h1>
        <p className="text-muted-foreground text-sm mt-1">This is how your card can look when customers compare provider options.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <LayoutTemplate className="size-4 text-[#c62828]" />
            Customer-facing card
          </CardTitle>
          <CardDescription>This preview uses the same public profile card component shown to customers during provider selection.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border p-4 max-w-xl">
            <ProviderPublicProfileCard
              profile={{
                providerName: provider.tradingName || provider.legalName || "Provider",
                profileImageUrl: provider.profileImageUrl,
                headline: provider.headline,
                bio: provider.bio,
                yearsExperience: provider.yearsExperience,
                hasDbs: false,
                hasInsurance: false,
                supportedContactChannels: publicProfileMetadata.supportedContactChannels,
                responseTimeLabel: publicProfileMetadata.responseTimeLabel,
                serviceCommitments: publicProfileMetadata.serviceCommitments,
                languagesSpoken: publicProfileMetadata.languagesSpoken,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
