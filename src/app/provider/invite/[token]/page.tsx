import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderInviteByToken } from "@/lib/providers/repository";
import { getProviderCategoryByKey, providerServiceCatalog } from "@/lib/providers/service-catalog-mapping";
import { acceptProviderInviteAction } from "./actions";
import { FormSubmitButton } from "@/components/shared/form-submit-button";

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
    <main className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="panel mini-form">
          <div className="eyebrow">Provider onboarding</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Accept provider invite</h1>
          <p className="lead">This invite sets your provider category. You will choose your services during onboarding.</p>
          <div className="panel-soft" style={{ padding: "1rem", marginBottom: "1rem" }}>
            <div className="eyebrow">Approved setup</div>
            <div className="backoffice-data-list" style={{ marginTop: "0.75rem" }}>
              <div className="backoffice-data-row"><span>Category</span><strong>{approvedCategory?.label || "Not set"}</strong></div>
            </div>
            {missingCategoryFromUrl ? (
              <div style={{ marginTop: "1rem", display: "grid", gap: "0.65rem" }}>
                <p className="lead" style={{ margin: 0 }}>Base invite URL is not for providers. Send one category link instead:</p>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {providerServiceCatalog.map((category) => (
                    <div key={category.key} className="backoffice-data-row" style={{ alignItems: "flex-start", gap: "0.75rem", flexDirection: "column" }}>
                      <strong>{category.label}</strong>
                      <Link href={`/provider/invite/${demoInviteLinksByCategory[category.key] || token}`} className="button button-secondary" style={{ width: "fit-content" }}>
                        Open {category.label} link
                      </Link>
                      <code style={{ fontSize: "0.85rem", wordBreak: "break-all" }}>/provider/invite/{demoInviteLinksByCategory[category.key] || token}</code>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {approvedCategory ? (
            <form action={acceptProviderInviteAction} className="mini-form" style={{ padding: 0 }}>
              <input type="hidden" name="inviteToken" value={token} />
              <input name="contactEmail" placeholder="Contact email" type="email" defaultValue={invite.email} required />
              {hasError ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>{error === "Invite email does not match" ? "Use the invited email to continue." : error === "Invite expired" ? "This invite has expired. Ask admin to send a new one." : "This invite could not be accepted. Check the link or ask admin for a fresh invite."}</p> : null}
              <FormSubmitButton label="Continue with email verification" pendingLabel="Preparing verification" />
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}
