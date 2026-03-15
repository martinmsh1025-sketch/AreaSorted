import { notFound } from "next/navigation";
import { getProviderInviteByToken } from "@/lib/providers/repository";
import { acceptProviderInviteAction } from "./actions";

type ProviderInvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function ProviderInvitePage({ params }: ProviderInvitePageProps) {
  const { token } = await params;
  const invite = await getProviderInviteByToken(token);
  if (!invite) notFound();

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="panel mini-form">
          <div className="eyebrow">Provider onboarding</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Join AreaSorted as a provider company</h1>
          <p className="lead">Complete company details, accept the provider agreement, and continue to Stripe onboarding.</p>

          <form action={acceptProviderInviteAction} className="mini-form" style={{ padding: 0 }}>
            <input type="hidden" name="inviteToken" value={token} />
            <input name="legalName" placeholder="Legal company name" required />
            <input name="tradingName" placeholder="Trading name" />
            <input name="companyNumber" placeholder="Company number" required />
            <input name="registeredAddress" placeholder="Registered address" required />
            <input name="contactEmail" placeholder="Contact email" type="email" defaultValue={invite.email} required />
            <input name="phone" placeholder="Phone" required />
            <input name="vatNumber" placeholder="VAT number (optional)" />
            <label className="quote-check-item">
              <input type="checkbox" name="agreementAccepted" required />
              <span>I accept the AreaSorted provider agreement.</span>
            </label>
            <button className="button button-primary" type="submit">Save company profile</button>
          </form>
        </div>
      </div>
    </main>
  );
}
