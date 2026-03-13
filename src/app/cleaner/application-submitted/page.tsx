type CleanerApplicationSubmittedPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CleanerApplicationSubmittedPage({ searchParams }: CleanerApplicationSubmittedPageProps) {
  const params = (await searchParams) ?? {};
  const applicationId = typeof params.applicationId === "string" ? params.applicationId : "";

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="panel card">
          <div className="eyebrow">Application submitted</div>
          <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Your cleaner application is now under review.</h1>
          <p className="lead">WashHub has received the onboarding form. Admin will review your details, documents, and coverage before any approval decision is made.</p>
          {applicationId ? <p style={{ fontWeight: 700 }}>Application reference: {applicationId}</p> : null}
          <div className="quote-summary-list" style={{ marginTop: "1rem" }}>
            <div><span>Status</span><strong>Submitted</strong></div>
            <div><span>Next step</span><strong>Admin review</strong></div>
            <div><span>If more info is needed</span><strong>You will see it after login</strong></div>
          </div>
          <div className="button-row" style={{ marginTop: "1rem" }}>
            <a className="button button-primary" href="/cleaner/login">Cleaner login</a>
            <a className="button button-secondary" href="/become-a-cleaner">Back to cleaner page</a>
          </div>
        </div>
      </div>
    </main>
  );
}
