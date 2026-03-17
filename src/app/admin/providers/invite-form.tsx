"use client";

import { useState } from "react";

type Category = {
  key: string;
  label: string;
  services: Array<{ key: string; label: string }>;
};

type InviteFormProps = {
  categories: Category[];
  action: (formData: FormData) => void;
};

export function InviteForm({ categories, action }: InviteFormProps) {
  const defaultCategory = categories[0]?.key || "";
  const [categoryKey, setCategoryKey] = useState(defaultCategory);

  return (
    <form action={action} className="admin-filter-grid" style={{ marginTop: "1rem" }}>
      <label className="quote-field-stack admin-filter-span-6">
        <span>Provider email</span>
        <input type="email" name="email" placeholder="provider@example.com" />
      </label>

      <label className="quote-field-stack admin-filter-span-3">
        <span>Approved category</span>
        <select name="approvedCategoryKey" value={categoryKey} onChange={(event) => setCategoryKey(event.target.value)}>
          {categories.map((category) => (
            <option key={category.key} value={category.key}>{category.label}</option>
          ))}
        </select>
      </label>

      <div className="quote-field-stack admin-filter-span-12">
        <span>Service setup</span>
        <div className="provider-soft-panel">
          <strong>{categories.find((category) => category.key === categoryKey)?.label || "Category"}</strong>
          <span>The provider will choose services inside this category during onboarding.</span>
        </div>
      </div>

      <div className="admin-filter-actions" style={{ marginTop: 0 }}>
        <button type="submit" className="button button-primary">Send invite</button>
      </div>
    </form>
  );
}
