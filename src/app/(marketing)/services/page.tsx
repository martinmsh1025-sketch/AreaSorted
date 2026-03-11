const services = [
  "Regular Cleaning",
  "Deep Cleaning",
  "Office Cleaning",
  "Airbnb Turnover",
  "End of Tenancy Enquiry",
];

export default function ServicesPage() {
  return (
    <main className="section">
      <div className="container">
        <div className="eyebrow">Services</div>
        <h1 className="title" style={{ marginTop: "0.6rem" }}>Cleaning services designed for London homes first.</h1>
        <div className="grid-3" style={{ marginTop: "2rem" }}>
          {services.map((service) => (
            <div key={service} className="panel card">
              <strong>{service}</strong>
              <p style={{ color: "var(--color-text-muted)" }}>Content placeholder for the service page and SEO section.</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
