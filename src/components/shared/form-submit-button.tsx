"use client";

import { useFormStatus } from "react-dom";

export function FormSubmitButton({ label, pendingLabel, className = "button button-primary", disabled = false, form, formAction }: { label: string; pendingLabel?: string; className?: string; disabled?: boolean; form?: string; formAction?: string | ((formData: FormData) => void) | (() => void) }) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" form={form} formAction={formAction} disabled={disabled || pending}>
      {pending ? (
        <span className="button-spinner-wrap">
          <span className="button-spinner" />
          {pendingLabel || "Please wait..."}
        </span>
      ) : (
        label
      )}
    </button>
  );
}
