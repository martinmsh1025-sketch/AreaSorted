import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { boroughPages, getBoroughPage } from "@/lib/seo/borough-pages";

type Props = {
  params: Promise<{ borough: string }>;
};

export async function generateStaticParams() {
  return boroughPages.map((page) => ({ borough: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { borough } = await params;
  const page = getBoroughPage(borough);
  if (!page) {
    return {};
  }

  return {
    title: `${page.name} Local Services`,
    description: `${page.intro} Explore booking expectations, common jobs, and service coverage in ${page.name}, London.`,
    alternates: {
      canonical: `/london/${page.slug}`,
    },
  };
}

export default async function BoroughPage({ params }: Props) {
  const { borough } = await params;
  const page = getBoroughPage(borough);
  if (!page) notFound();

  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">London coverage</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Local services in {page.name}
          </h1>
          <p className="lead">{page.intro}</p>
          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Continue booking</Link>
            <Link className="button button-secondary" href="/services">Browse services</Link>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">Why this page matters</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Booking in {page.name}</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.7 }}>
              AreaSorted is built for London postcode matching. When you start a booking in {page.name}, we check
              local coverage, service suitability, timing, and pricing before you continue. We place a temporary card
              hold first, and only capture payment once the provider confirms the booking.
            </p>
          </div>
          <div className="panel card">
            <div className="eyebrow">Common booking traits</div>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              {page.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div className="panel card">
            <div className="eyebrow">Popular jobs</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>What customers often book in {page.name}</h2>
            <ul className="list-clean" style={{ marginTop: "0.9rem" }}>
              {page.commonJobs.map((job) => (
                <li key={job}>{job}</li>
              ))}
            </ul>
          </div>
          <div className="panel card">
            <div className="eyebrow">Nearby areas</div>
            <h2 className="title" style={{ marginTop: "0.6rem" }}>Neighbourhoods we also think about</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.7 }}>
              Customers searching in {page.name} often also compare options in nearby areas such as {page.nearbyAreas.join(", ")}. Coverage is always postcode-led, so the fastest next step is to continue booking and check your exact address.
            </p>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container" style={{ textAlign: "center", maxWidth: 700 }}>
          <h2 className="title">Ready to check coverage in {page.name}?</h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.6rem", lineHeight: 1.7 }}>
            Start with your postcode, review your service options, and continue booking when you are ready.
          </p>
          <div className="button-row" style={{ justifyContent: "center", marginTop: "1.4rem" }}>
            <Link className="button button-primary" href="/quote">Continue booking</Link>
            <Link className="button button-secondary" href="/pricing">See pricing</Link>
            <Link className="button button-secondary" href="/faq">Read FAQ</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
