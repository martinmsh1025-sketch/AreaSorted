type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalPageProps = {
  eyebrow?: string;
  title: string;
  lead: string;
  version?: string;
  sections: LegalSection[];
};

export function LegalPage({ eyebrow = "Legal", title, lead, version, sections }: LegalPageProps) {
  return (
    <main className="section">
      <div className="container max-w-4xl">
        <div className="panel card space-y-6">
          <div className="space-y-3">
            <div className="eyebrow">{eyebrow}</div>
            <h1 className="title">{title}</h1>
            <p className="lead">{lead}</p>
            {version ? <p className="text-sm text-[var(--color-text-muted)]">{version}</p> : null}
          </div>

          <div className="space-y-6 text-sm leading-7 text-[var(--color-text)]">
            {sections.map((section) => (
              <section key={section.heading} className="space-y-3 border-t border-[var(--color-border)] pt-5 first:border-t-0 first:pt-0">
                <h2 className="text-lg font-semibold">{section.heading}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets?.length ? (
                  <ul className="list-clean space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>- {bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
