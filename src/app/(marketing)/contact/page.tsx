"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Unable to send message.");
      }

      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unable to send message.");
    }
  }

  return (
    <main className="section">
      <div className="container grid-2">
        <div>
          <div className="eyebrow">Contact us</div>
          <h1 className="title" style={{ marginTop: "0.6rem" }}>Speak to the team before booking or applying.</h1>
          <p className="lead">Use this page for customer support, cleaner onboarding questions, and general business enquiries.</p>
        </div>
        <form className="panel mini-form" onSubmit={handleSubmit}>
          {status === "sent" ? (
            <div className="panel" style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <strong>Message sent!</strong>
              <p style={{ marginTop: "0.5rem" }}>We will get back to you as soon as possible.</p>
              <button type="button" className="button button-secondary" style={{ marginTop: "1rem" }} onClick={() => setStatus("idle")}>
                Send another message
              </button>
            </div>
          ) : (
            <>
              <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <textarea placeholder="How can we help?" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
              {errorMessage ? <p style={{ color: "var(--color-error)", fontSize: "0.9rem", margin: 0 }}>{errorMessage}</p> : null}
              <button type="submit" className="button button-primary" disabled={status === "sending"}>
                {status === "sending" ? "Sending..." : "Send message"}
              </button>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
