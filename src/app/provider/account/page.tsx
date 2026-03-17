import { requireProviderAccountAccess } from "@/lib/provider-auth";
import { providerLogoutAction } from "@/app/provider/login/actions";
import Link from "next/link";

export default async function ProviderAccountPage() {
  const session = await requireProviderAccountAccess();
  const provider = session.providerCompany;
  const displayName = provider.tradingName || provider.legalName || "Provider account";

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <section className="panel card">
          <div className="backoffice-section-head">
            <div>
              <div className="eyebrow">Account details</div>
              <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{displayName}</h1>
              <p className="lead">Review the company identity behind your provider account and manage access-related settings.</p>
            </div>
          </div>
          <div className="backoffice-data-list" style={{ marginTop: "1rem" }}>
            <div className="backoffice-data-row"><span>Trading / legal name</span><strong>{displayName}</strong></div>
            <div className="backoffice-data-row"><span>Email</span><strong>{provider.contactEmail}</strong></div>
            <div className="backoffice-data-row"><span>Phone</span><strong>{provider.phone || "Not set"}</strong></div>
            <div className="backoffice-data-row"><span>Registered address</span><strong>{provider.registeredAddress || "Not set"}</strong></div>
            <div className="backoffice-data-row"><span>Company number</span><strong>{provider.companyNumber || "Not set"}</strong></div>
            <div className="backoffice-data-row"><span>VAT number</span><strong>{provider.vatNumber || "Not set"}</strong></div>
          </div>
          <div className="button-row" style={{ marginTop: "1rem" }}>
            <Link href="/provider/forgot-password" className="button button-secondary">Change password</Link>
            <Link href="/provider/dashboard" className="button button-secondary">Payment account</Link>
            <form action={providerLogoutAction}>
              <button type="submit" className="button button-secondary">Logout</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
