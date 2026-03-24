"use client";

import { useState } from "react";

export function ContactForm() {
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
    <form className="panel mini-form" onSubmit={handleSubmit}>
      {status === "sent" ? (
        <div className="panel" style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <strong>Message sent!</strong>
          <p style={{ marginTop: "0.5rem" }}>We will get back to you as soon as possible. For existing booking issues, customer support is available at support@areasorted.com.</p>
          <button type="button" className="button button-secondary" style={{ marginTop: "1rem" }} onClick={() => setStatus("idle")}>
            Send another message
          </button>
        </div>
      ) : (
        <>
          <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} />
          <textarea placeholder="Tell us about your enquiry, provider question, or business request." rows={6} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} />
          {errorMessage ? <p style={{ color: "var(--color-error)", fontSize: "0.9rem", margin: 0 }}>{errorMessage}</p> : null}
          <button type="submit" className="button button-primary" disabled={status === "sending"}>
            {status === "sending" ? "Sending..." : "Send message"}
          </button>
        </>
      )}
    </form>
  );
}
