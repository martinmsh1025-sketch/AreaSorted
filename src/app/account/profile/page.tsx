import { requireCustomerSession } from "@/lib/customer-auth";
import { EditProfileSection } from "../edit-profile-section";

export default async function AccountProfilePage() {
  const customer = await requireCustomerSession();

  return (
    <div className="space-y-6">
      <div className="panel card account-hero-card">
        <div className="eyebrow">Profile</div>
        <h1 className="title" style={{ marginTop: "0.3rem", fontSize: "1.5rem" }}>Your details</h1>
        <p className="lead" style={{ fontSize: "0.95rem" }}>
          Keep your contact details current so booking updates and provider confirmations reach you quickly.
        </p>
      </div>

      <div className="panel card">
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.9rem" }}>Personal information</h2>
        <EditProfileSection
          customer={{
            id: customer.id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone,
          }}
        />
      </div>
    </div>
  );
}
