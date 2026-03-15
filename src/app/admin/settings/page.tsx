import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";

export default async function AdminSettingsPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const prisma = getPrisma();
  const settings = await prisma.adminSetting.findMany({ orderBy: { key: "asc" } });

  return (
    <main className="section">
      <div className="container">
        <div style={{ maxWidth: 900, marginBottom: "2rem" }}>
          <div className="eyebrow">Admin</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Marketplace settings</h1>
          <p className="lead">These settings are loaded from seeded Prisma data.</p>
        </div>

        <section className="panel card">
          <div className="quote-summary-list">
            {settings.map((setting) => (
              <div key={setting.key}><span>{setting.key}</span><strong>{JSON.stringify(setting.valueJson)}</strong></div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
