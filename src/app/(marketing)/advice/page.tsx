import type { Metadata } from "next";
import Link from "next/link";
import { advicePosts } from "@/lib/seo/advice-posts";

export const metadata: Metadata = {
  title: "Advice Hub",
  description:
    "Practical advice on booking cleaning, handyman, pest control, waste removal, and other local services in London.",
  alternates: {
    canonical: "/advice",
  },
};

export default function AdviceHubPage() {
  const sortedPosts = [...advicePosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: sortedPosts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `/advice/${post.slug}`,
      name: post.title,
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">Advice hub</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.4rem, 3.8vw, 4rem)" }}>
            Practical booking advice for local services in London.
          </h1>
          <p className="lead">
            Use these guides to understand pricing, prepare for bookings, and avoid common problems before you move into checkout.
          </p>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container" style={{ display: "grid", gap: "1rem" }}>
          {sortedPosts.map((post) => (
            <article key={post.slug} className="panel card">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
                <span className="eyebrow" style={{ margin: 0 }}>{post.category}</span>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{post.readTime}</span>
              </div>
              <h2 style={{ margin: "0.55rem 0 0", fontSize: "1.45rem" }}>
                <Link href={`/advice/${post.slug}`}>{post.title}</Link>
              </h2>
              <p style={{ margin: "0.7rem 0 0", color: "var(--color-text-muted)", lineHeight: 1.7 }}>
                {post.description}
              </p>
              <div style={{ marginTop: "1rem" }}>
                <Link href={`/advice/${post.slug}`} style={{ color: "var(--color-brand)", fontWeight: 700 }}>
                  Read article
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
