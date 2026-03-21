"use client";

import { useState } from "react";

type FaqItem = { question: string; answer: string };
export type FaqCategory = { title: string; items: FaqItem[] };

export function FaqAccordion({ categories }: { categories: FaqCategory[] }) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  function toggleItem(key: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <>
      {/* Quick nav */}
      <section className="section muted-block" style={{ paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {categories.map((cat) => (
              <a
                key={cat.title}
                href={`#${cat.title.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and")}`}
                style={{
                  display: "inline-block",
                  padding: "0.35rem 0.9rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  fontSize: "0.88rem",
                  color: "var(--color-text)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {cat.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ sections */}
      {categories.map((cat) => {
        const sectionId = cat.title.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and");
        return (
          <section key={cat.title} id={sectionId} className="section">
            <div className="container" style={{ maxWidth: 860 }}>
              <h2 className="title" style={{ marginBottom: "1.2rem", fontSize: "1.4rem" }}>{cat.title}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {cat.items.map((item) => {
                  const key = `${sectionId}-${item.question}`;
                  const isOpen = openItems.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleItem(key)}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "1rem 1.4rem",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--color-surface)",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                        <strong style={{ fontSize: "0.98rem" }}>{item.question}</strong>
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: "1.2rem",
                            color: "var(--color-text-muted)",
                            transition: "transform 0.2s",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            lineHeight: 1,
                          }}
                        >
                          ⌄
                        </span>
                      </div>
                      {isOpen && (
                        <p style={{ margin: "0.8rem 0 0", color: "var(--color-text-muted)", fontSize: "0.92rem", lineHeight: 1.65 }}>
                          {item.answer}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
