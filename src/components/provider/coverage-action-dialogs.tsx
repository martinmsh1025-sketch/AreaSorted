"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, X } from "lucide-react";

/* ─── Remove Postcode Confirmation ─── */

export function RemovePostcodeButton({
  postcodePrefix,
  action,
}: {
  postcodePrefix: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    const fd = new FormData();
    fd.set("postcodePrefix", postcodePrefix);
    startTransition(async () => {
      await action(fd);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            className="rounded p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            title="Request removal"
          />
        }
      >
        <X className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {postcodePrefix}?</DialogTitle>
          <DialogDescription>
            This will submit a request to remove <strong>{postcodePrefix}</strong> from
            your coverage areas. The request requires admin approval. While pending, customers in
            this area can still book you.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Keep Area
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Request Removal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Cancel Coverage Request Confirmation ─── */

export function CancelCoverageRequestButton({
  requestId,
  postcodePrefix,
  requestType,
  action,
}: {
  requestId: string;
  postcodePrefix: string;
  requestType: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    const fd = new FormData();
    fd.set("requestId", requestId);
    startTransition(async () => {
      await action(fd);
      setOpen(false);
    });
  }

  const typeLabel = requestType === "ADD" ? "add" : "remove";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-red-600"
          />
        }
      >
        Cancel
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this request?</DialogTitle>
          <DialogDescription>
            This will cancel your pending request to {typeLabel}{" "}
            <strong>{postcodePrefix}</strong>. If you change your mind, you will
            need to submit a new request and wait for admin approval again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Keep Request
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Cancel Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
