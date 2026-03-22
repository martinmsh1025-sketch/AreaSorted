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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

/* ─── Accept Dialog ─── */

export function AcceptOrderButton({
  bookingId,
  action,
  compact = false,
}: {
  bookingId: string;
  action: (formData: FormData) => Promise<void>;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    const fd = new FormData();
    fd.set("bookingId", bookingId);
    startTransition(async () => {
      try {
        await action(fd);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            className={
              compact
                ? "h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }
          />
        }
      >
        {compact ? "Accept" : "Accept Order"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accept this order?</DialogTitle>
          <DialogDescription>
            You are confirming that you will handle this job at the scheduled date and time.
            The customer will be notified.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Confirm Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Decline Dialog ─── */

export function DeclineOrderButton({
  bookingId,
  action,
  compact = false,
}: {
  bookingId: string;
  action: (formData: FormData) => Promise<void>;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    const fd = new FormData();
    fd.set("bookingId", bookingId);
    fd.set("reason", reason || "Provider declined via portal");
    startTransition(async () => {
      try {
        await action(fd);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="destructive"
            className={compact ? "h-7 px-3 text-xs" : ""}
          />
        }
      >
        {compact ? "Decline" : "Decline Order"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline this order?</DialogTitle>
          <DialogDescription>
            The system will attempt to reassign this booking to another provider.
            If no one is available, the customer will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="decline-reason">Reason (optional)</Label>
          <Textarea
            id="decline-reason"
            placeholder="e.g. Schedule conflict, too far away, not available on this date..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={1000}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Confirm Decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Start Job Dialog ─── */

export function StartJobButton({
  bookingId,
  action,
}: {
  bookingId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    const fd = new FormData();
    fd.set("bookingId", bookingId);
    startTransition(async () => {
      try {
        await action(fd);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700 text-white" />}>
        Start Job
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start this job?</DialogTitle>
          <DialogDescription>
            This marks the booking as in progress. You can mark it as completed once the work is done.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Confirm Start
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Complete Job Dialog ─── */

export function CompleteJobButton({
  bookingId,
  action,
}: {
  bookingId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    const fd = new FormData();
    fd.set("bookingId", bookingId);
    startTransition(async () => {
      try {
        await action(fd);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-green-600 hover:bg-green-700 text-white" />}>
        Mark Completed
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark this job as completed?</DialogTitle>
          <DialogDescription>
            This confirms the work is done. The customer will be notified and payment processing will begin.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Confirm Completed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
