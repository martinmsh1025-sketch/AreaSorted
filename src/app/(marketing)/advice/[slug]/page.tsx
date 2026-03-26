import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { advicePosts, getAdvicePost } from "@/lib/seo/advice-posts";

type AdviceArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return advicePosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: AdviceArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getAdvicePost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/advice/${post.slug}` },
    openGraph: {
      title: `${post.title} | AreaSorted`,
      description: post.description,
    },
  };
}

export default async function AdviceArticlePage({ params }: AdviceArticlePageProps) {
  const { slug } = await params;
  const post = getAdvicePost(slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: {
      "@type": "Organization",
      name: "AreaSorted",
    },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="eyebrow">{post.category}</div>
          <h1 className="display" style={{ marginTop: "0.8rem", fontSize: "clamp(2.2rem, 3.4vw, 3.6rem)" }}>
            {post.title}
          </h1>
          <p className="lead" style={{ maxWidth: 760 }}>
            {post.description}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "1rem" }}>
            <span>{post.readTime}</span>
            <span>{post.publishedAt}</span>
          </div>
        </div>
      </section>

      <section className="section muted-block">
        <div className="container" style={{ maxWidth: 860 }}>
          <article className="panel card" style={{ display: "grid", gap: "1.5rem" }}>
            <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: 1.8 }}>{post.intro}</p>
            {post.sections.map((section) => (
              <section key={section.title} style={{ display: "grid", gap: "0.75rem" }}>
                <h2 className="title" style={{ fontSize: "1.4rem" }}>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: 1.8 }}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul className="list-clean" style={{ color: "var(--color-text-muted)", lineHeight: 1.7 }}>
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                ) : null}
              </section>
            ))}
          </article>

          <div className="button-row" style={{ marginTop: "1.5rem" }}>
            <Link className="button button-primary" href="/quote">Get a quote</Link>
            <Link className="button button-secondary" href="/advice">More advice</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
