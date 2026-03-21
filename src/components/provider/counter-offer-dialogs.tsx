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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import {
  createCounterOfferAction,
  withdrawCounterOfferAction,
} from "@/app/provider/orders/counter-offer-actions";

/* ── Types ─────────────────────────────────── */

interface CounterOffer {
  id: string;
  proposedPrice: number | null;
  proposedDate: string | null;
  proposedStartTime: string | null;
  message: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  respondedAt: string | null;
}

/* ── Status helpers ─────────────────────────── */

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { variant: "secondary", label: "Pending Review", icon: Clock },
  ACCEPTED: { variant: "default", label: "Accepted", icon: CheckCircle2 },
  REJECTED: { variant: "destructive", label: "Declined", icon: XCircle },
  WITHDRAWN: { variant: "outline", label: "Withdrawn", icon: XCircle },
  EXPIRED: { variant: "outline", label: "Expired", icon: Clock },
};

/* ── Counter Offer Dialog (create new) ─────── */

export function CounterOfferButton({
  bookingId,
  currentPrice,
  currentDate,
}: {
  bookingId: string;
  currentPrice: number;
  currentDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (!price && !date) {
      setError("Please propose a different price or date.");
      return;
    }

    const fd = new FormData();
    fd.set("bookingId", bookingId);
    if (price) fd.set("proposedPrice", price);
    if (date) fd.set("proposedDate", date);
    if (startTime) fd.set("proposedStartTime", startTime);
    if (message) fd.set("message", message);

    startTransition(async () => {
      const result = await createCounterOfferAction(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setPrice("");
        setDate("");
        setStartTime("");
        setMessage("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" />}
      >
        <MessageSquare className="mr-1.5 size-4" />
        Counter Offer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make a Counter Offer</DialogTitle>
          <DialogDescription>
            Propose a different price or date for this booking. The admin team will review your offer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current values */}
          <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Current price:</span>{" "}
              <span className="font-medium">
                {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(currentPrice)}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Current date:</span>{" "}
              <span className="font-medium">{currentDate}</span>
            </p>
          </div>

          {/* Proposed price */}
          <div className="space-y-2">
            <Label htmlFor="co-price">Proposed price (optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                £
              </span>
              <Input
                id="co-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 85.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* Proposed date */}
          <div className="space-y-2">
            <Label htmlFor="co-date">Proposed date (optional)</Label>
            <Input
              id="co-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Proposed start time */}
          <div className="space-y-2">
            <Label htmlFor="co-time">Proposed start time (optional)</Label>
            <Input
              id="co-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="co-message">Message (optional)</Label>
            <Textarea
              id="co-message"
              placeholder="Explain why you're proposing this change..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="size-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleSubmit}
            disabled={pending}
          >
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Submit Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Counter Offers display ───────────────── */

export function CounterOffersList({ offers }: { offers: CounterOffer[] }) {
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (offers.length === 0) return null;

  function handleWithdraw(offerId: string) {
    setConfirmWithdrawId(offerId);
  }

  function confirmWithdraw() {
    if (!confirmWithdrawId) return;
    setWithdrawingId(confirmWithdrawId);
    const fd = new FormData();
    fd.set("counterOfferId", confirmWithdrawId);
    startTransition(async () => {
      await withdrawCounterOfferAction(fd);
      setWithdrawingId(null);
      setConfirmWithdrawId(null);
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="size-4" />
        Counter Offers
      </h3>
      {offers.map((offer) => {
        const config = statusConfig[offer.status] || statusConfig.PENDING;
        const StatusIcon = config.icon;

        return (
          <div
            key={offer.id}
            className="rounded-lg border p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <Badge variant={config.variant} className="text-xs">
                <StatusIcon className="mr-1 size-3" />
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(offer.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-3">
              {offer.proposedPrice != null && (
                <div>
                  <span className="text-muted-foreground">Proposed price:</span>{" "}
                  <span className="font-medium">
                    {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(offer.proposedPrice)}
                  </span>
                </div>
              )}
              {offer.proposedDate && (
                <div>
                  <span className="text-muted-foreground">Proposed date:</span>{" "}
                  <span className="font-medium">
                    {new Date(offer.proposedDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {offer.proposedStartTime && (
                <div>
                  <span className="text-muted-foreground">Start time:</span>{" "}
                  <span className="font-medium">{offer.proposedStartTime}</span>
                </div>
              )}
            </div>

            {offer.message && (
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{offer.message}&rdquo;
              </p>
            )}

            {offer.adminNotes && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                <span className="font-medium">Admin response:</span> {offer.adminNotes}
              </div>
            )}

            {offer.status === "PENDING" && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleWithdraw(offer.id)}
                  disabled={pending && withdrawingId === offer.id}
                  className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                >
                  {pending && withdrawingId === offer.id ? "Withdrawing..." : "Withdraw offer"}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Withdraw Confirmation Dialog */}
      <Dialog
        open={confirmWithdrawId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmWithdrawId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw this counter offer?</DialogTitle>
            <DialogDescription>
              Once withdrawn, this counter offer cannot be reinstated. You would
              need to submit a new counter offer if you change your mind.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmWithdrawId(null)}
              disabled={pending}
            >
              Keep Offer
            </Button>
            <Button
              variant="destructive"
              onClick={confirmWithdraw}
              disabled={pending}
            >
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Withdraw Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
