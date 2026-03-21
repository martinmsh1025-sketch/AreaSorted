"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function FormSubmitButton({
  label,
  pendingLabel,
  variant = "default",
  disabled = false,
  form,
  formAction,
  className,
}: {
  label: string;
  pendingLabel?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  disabled?: boolean;
  form?: string;
  formAction?: string | ((formData: FormData) => void) | (() => void);
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      form={form}
      formAction={formAction}
      disabled={disabled || pending}
      className={className}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingLabel || "Please wait..."}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
