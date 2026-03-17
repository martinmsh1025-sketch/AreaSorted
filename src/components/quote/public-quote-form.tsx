"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listPublicCategories, listJobTypesForCategory } from "@/lib/public-quote/service-mapping";

type PublicCategoryKey = ReturnType<typeof listPublicCategories>[number]["key"];

export function PublicQuoteForm() {
  const router = useRouter();
  const categories = listPublicCategories();
  const [categoryKey, setCategoryKey] = useState<PublicCategoryKey>((categories[0]?.key || "CLEANING") as PublicCategoryKey);
  const options = useMemo(() => listJobTypesForCategory(categoryKey), [categoryKey]);
  const [serviceKey, setServiceKey] = useState(options[0]?.value || "");
  const [form, setForm] = useState({
    customerName: "Demo Customer",
    customerEmail: "customer@example.com",
    customerPhone: "07123456789",
    postcode: "SW6 2NT",
    addressLine1: "10 Demo Street",
    addressLine2: "",
    city: "London",
    quantity: "1",
    estimatedHours: "3",
    scheduledDate: "2026-03-20",
    scheduledTimeLabel: "10:00",
    sameDay: false,
    weekend: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/public-quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        categoryKey,
        serviceKey,
        quantity: Number(form.quantity),
        estimatedHours: Number(form.estimatedHours),
      }),
    });

    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Unable to create quote");
      return;
    }

    router.push(data.redirectUrl);
  }

  return (
    <form className="panel mini-form" onSubmit={handleSubmit}>
      <div className="eyebrow">Customer quote</div>
      <h1 className="title" style={{ marginTop: "0.6rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Get a real quote</h1>
      <div className="quote-two-col-fields">
        <label className="quote-field-stack"><span>Name</span><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></label>
        <label className="quote-field-stack"><span>Email</span><input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} /></label>
        <label className="quote-field-stack"><span>Phone</span><input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /></label>
        <label className="quote-field-stack"><span>Postcode</span><input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value.toUpperCase() })} /></label>
        <label className="quote-field-stack"><span>Address line 1</span><input value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} /></label>
        <label className="quote-field-stack"><span>Address line 2</span><input value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} /></label>
        <label className="quote-field-stack"><span>City</span><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
        <label className="quote-field-stack"><span>Category</span><select value={categoryKey} onChange={(e) => { const nextCategory = e.target.value as PublicCategoryKey; setCategoryKey(nextCategory); const nextOptions = listJobTypesForCategory(nextCategory); setServiceKey(nextOptions[0]?.value || ""); }}>{categories.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}</select></label>
        <label className="quote-field-stack"><span>Service</span><select value={serviceKey} onChange={(e) => setServiceKey(e.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="quote-field-stack"><span>Quantity</span><input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
        <label className="quote-field-stack"><span>Hours</span><input type="number" min="1" step="0.5" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} /></label>
        <label className="quote-field-stack"><span>Date</span><input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} /></label>
        <label className="quote-field-stack"><span>Time</span><input type="time" value={form.scheduledTimeLabel} onChange={(e) => setForm({ ...form, scheduledTimeLabel: e.target.value })} /></label>
        <label className="quote-check-item"><input type="checkbox" checked={form.sameDay} onChange={(e) => setForm({ ...form, sameDay: e.target.checked })} /><span>Same-day</span></label>
        <label className="quote-check-item"><input type="checkbox" checked={form.weekend} onChange={(e) => setForm({ ...form, weekend: e.target.checked })} /><span>Weekend</span></label>
      </div>
      {error ? <p style={{ color: "var(--color-error)", lineHeight: 1.6 }}>{error}</p> : null}
      <button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "Creating quote..." : "Get quote"}</button>
    </form>
  );
}
