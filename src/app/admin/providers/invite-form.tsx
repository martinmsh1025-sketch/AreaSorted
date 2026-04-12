"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/context";

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
  const t = useT();
  const defaultCategory = categories[0]?.key || "";
  const [categoryKey, setCategoryKey] = useState(defaultCategory);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-12">
      <div className="sm:col-span-6">
        <Label htmlFor="inviteEmail">{t.providerInvite.providerEmail}</Label>
        <Input
          id="inviteEmail"
          type="email"
          name="email"
          placeholder={t.providerInvite.emailPlaceholder}
        />
      </div>

      <div className="sm:col-span-3">
        <Label htmlFor="inviteCategory">{t.providerInvite.approvedCategory}</Label>
        <select
          id="inviteCategory"
          name="approvedCategoryKey"
          value={categoryKey}
          onChange={(event) => setCategoryKey(event.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {categories.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-12">
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-sm font-medium">
            {categories.find((c) => c.key === categoryKey)?.label || t.providerInvite.categoryFallback}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.providerInvite.categoryHelp}
          </p>
        </div>
      </div>

      <div className="sm:col-span-12">
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          {t.providerInvite.sendInvite}
        </button>
      </div>
    </form>
  );
}
