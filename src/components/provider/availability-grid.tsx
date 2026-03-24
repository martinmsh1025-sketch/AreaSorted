"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Save,
  Loader2,
  Check,
  AlertCircle,
  Plus,
  X,
  Calendar,
  Clock,
  CalendarOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ─── Types ─── */

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DaySchedule = {
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
};

type DateOverride = {
  id: string;
  date: string; // ISO date string
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
};

type AvailabilityGridProps = {
  initialSchedule: DaySchedule[];
  initialOverrides: DateOverride[];
  saveAllAction: (formData: FormData) => Promise<void>;
  saveDateOverrideAction: (formData: FormData) => Promise<
    | { success: true; override: DateOverride }
    | { success: false; error: string }
  >;
  deleteDateOverrideAction: (formData: FormData) => Promise<void>;
};

/* ─── Main Component ─── */

export function AvailabilityGrid({
  initialSchedule,
  initialOverrides,
  saveAllAction,
  saveDateOverrideAction,
  deleteDateOverrideAction,
}: AvailabilityGridProps) {
  const [schedule, setSchedule] = useState<DaySchedule[]>(initialSchedule);
  const [overrides, setOverrides] = useState<DateOverride[]>(initialOverrides);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Date override form
  const [showAddOverride, setShowAddOverride] = useState(false);
  const [newOverrideDate, setNewOverrideDate] = useState("");
  const [newOverrideAvailable, setNewOverrideAvailable] = useState(false);
  const [newOverrideStart, setNewOverrideStart] = useState("09:00");
  const [newOverrideEnd, setNewOverrideEnd] = useState("17:00");
  const [newOverrideNote, setNewOverrideNote] = useState("");

  // Delete override confirmation
  const [deleteOverrideId, setDeleteOverrideId] = useState<string | null>(null);
  const deleteOverride = overrides.find((o) => o.id === deleteOverrideId);

  function updateDay(dayOfWeek: number, updates: Partial<DaySchedule>) {
    setSaved(false);
    setDirty(true);
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...updates } : d))
    );
  }

  function handleSave() {
    setError(null);

    for (const day of schedule) {
      if (day.isAvailable && day.startTime >= day.endTime) {
        setError(
          `${DAY_LABELS[day.dayOfWeek]}: start time must be before end time.`
        );
        return;
      }
    }

    const formData = new FormData();
    formData.set("days", JSON.stringify(schedule));

    startTransition(async () => {
      try {
        await saveAllAction(formData);
        setSaved(true);
        setDirty(false);
        setTimeout(() => setSaved(false), 4000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  function handleAddOverride() {
    if (!newOverrideDate) return;
    setError(null);

    const fd = new FormData();
    fd.set("date", newOverrideDate);
    fd.set("isAvailable", newOverrideAvailable ? "true" : "false");
    fd.set("startTime", newOverrideStart);
    fd.set("endTime", newOverrideEnd);
    fd.set("note", newOverrideNote);

    startTransition(async () => {
      try {
        const result = await saveDateOverrideAction(fd);
        if (result && typeof result === "object" && "success" in result && !result.success) {
          setError(result.error);
          return;
        }

        const savedOverride =
          result && typeof result === "object" && "success" in result && result.success
            ? result.override
            : {
                id: `local-${newOverrideDate}`,
                date: newOverrideDate,
                isAvailable: newOverrideAvailable,
                startTime: newOverrideAvailable ? newOverrideStart : null,
                endTime: newOverrideAvailable ? newOverrideEnd : null,
                note: newOverrideNote.trim() || null,
              };

        setOverrides((prev) => {
          const next = prev.some((override) => override.id === savedOverride.id || override.date === savedOverride.date)
            ? prev.map((override) =>
                override.id === savedOverride.id || override.date === savedOverride.date
                  ? savedOverride
                  : override
              )
            : [...prev, savedOverride];

          return next.sort((a, b) => a.date.localeCompare(b.date));
        });
        setShowAddOverride(false);
        setNewOverrideDate("");
        setNewOverrideAvailable(false);
        setNewOverrideStart("09:00");
        setNewOverrideEnd("17:00");
        setNewOverrideNote("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save override.");
      }
    });
  }

  function handleDeleteOverride(overrideId: string) {
    setDeleteOverrideId(overrideId);
  }

  function confirmDeleteOverride() {
    if (!deleteOverrideId) return;
    const fd = new FormData();
    fd.set("overrideId", deleteOverrideId);

    startTransition(async () => {
      try {
        await deleteDateOverrideAction(fd);
        setOverrides((prev) => prev.filter((o) => o.id !== deleteOverrideId));
        setDeleteOverrideId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete override.");
        setDeleteOverrideId(null);
      }
    });
  }

  // Weekly stats
  const totalHours = schedule.reduce((sum, day) => {
    if (!day.isAvailable) return sum;
    const [sh, sm] = day.startTime.split(":").map(Number);
    const [eh, em] = day.endTime.split(":").map(Number);
    return sum + (eh + em / 60 - (sh + sm / 60));
  }, 0);

  const activeDays = schedule.filter((d) => d.isAvailable).length;

  // Sort overrides by date
  const sortedOverrides = useMemo(
    () => [...overrides].sort((a, b) => a.date.localeCompare(b.date)),
    [overrides]
  );

  const futureOverrides = sortedOverrides.filter(
    (o) => new Date(o.date) >= new Date(new Date().toDateString())
  );

  return (
    <div className="space-y-6">
      {/* ── Weekly Schedule Section ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold">Weekly Schedule</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{activeDays}</span> days
              </span>
              <span className="text-border">|</span>
              <span>
                <span className="font-medium text-foreground">{totalHours.toFixed(1)}</span> hrs/week
              </span>
            </div>
            {dirty && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="size-3" />
                Unsaved
              </span>
            )}
            {saved && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Check className="size-3" />
                Saved
              </span>
            )}
          </div>
        </div>

        {/* Schedule grid */}
        <div className="rounded-lg border divide-y">
          {schedule.map((day) => (
            <div
              key={day.dayOfWeek}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                day.isAvailable ? "bg-card" : "bg-muted/40"
              }`}
            >
              {/* Toggle */}
              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                <input
                  type="checkbox"
                  checked={day.isAvailable}
                  onChange={(e) =>
                    updateDay(day.dayOfWeek, { isAvailable: e.target.checked })
                  }
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full dark:bg-gray-600 dark:peer-checked:bg-blue-500" />
              </label>

              {/* Day name */}
              <span
                className={`w-24 text-sm font-medium ${
                  day.isAvailable ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="hidden sm:inline">{DAY_LABELS[day.dayOfWeek]}</span>
                <span className="sm:hidden">{DAY_SHORT[day.dayOfWeek]}</span>
              </span>

              {/* Time inputs */}
              {day.isAvailable ? (
                <div className="ml-auto flex items-center gap-2">
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(e) =>
                      updateDay(day.dayOfWeek, { startTime: e.target.value })
                    }
                    className="rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(e) =>
                      updateDay(day.dayOfWeek, { endTime: e.target.value })
                    }
                    className="rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <span className="ml-auto text-sm text-muted-foreground italic">
                  Day off
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Save schedule button */}
        <div className="flex justify-end">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            onClick={handleSave}
            disabled={isPending || !dirty}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            {isPending ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </div>

      {/* ── Date Overrides Section ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarOff className="size-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold">Date Overrides</h2>
            <span className="text-xs text-muted-foreground">
              Block specific dates or set custom hours
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setShowAddOverride(!showAddOverride)}
          >
            {showAddOverride ? (
              <X className="size-3.5" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {showAddOverride ? "Cancel" : "Add Override"}
          </Button>
        </div>

        {/* Add override form */}
        {showAddOverride && (
          <div className="rounded-lg border bg-blue-50/40 dark:bg-blue-950/10 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Date
                </label>
                <input
                  type="date"
                  value={newOverrideDate}
                  onChange={(e) => setNewOverrideDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Type
                </label>
                <div className="inline-flex items-center gap-0.5 rounded-md bg-muted/60 p-0.5 w-full">
                  <button
                    type="button"
                    onClick={() => setNewOverrideAvailable(false)}
                    className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                      !newOverrideAvailable
                        ? "bg-red-600 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Day Off
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewOverrideAvailable(true)}
                    className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                      newOverrideAvailable
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Custom Hours
                  </button>
                </div>
              </div>
            </div>

            {newOverrideAvailable && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Start time
                  </label>
                  <input
                    type="time"
                    value={newOverrideStart}
                    onChange={(e) => setNewOverrideStart(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    End time
                  </label>
                  <input
                    type="time"
                    value={newOverrideEnd}
                    onChange={(e) => setNewOverrideEnd(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Note (optional)
              </label>
              <input
                type="text"
                value={newOverrideNote}
                onChange={(e) => setNewOverrideNote(e.target.value)}
                placeholder="e.g. Bank holiday, Personal day..."
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                onClick={handleAddOverride}
                disabled={isPending || !newOverrideDate}
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                Add Override
              </Button>
            </div>
          </div>
        )}

        {/* Overrides list */}
        {futureOverrides.length > 0 ? (
          <div className="rounded-lg border divide-y">
            {futureOverrides.map((override) => {
              const d = new Date(override.date);
              const dayName = DAY_LABELS[d.getUTCDay()];
              const dateLabel = d.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              });

              return (
                <div
                  key={override.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    override.isAvailable ? "bg-card" : "bg-red-50/50 dark:bg-red-950/10"
                  }`}
                >
                  <Calendar className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {dayName}, {dateLabel}
                      </span>
                      {override.isAvailable ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {override.startTime} – {override.endTime}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Day off
                        </span>
                      )}
                    </div>
                    {override.note && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {override.note}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteOverride(override.id)}
                    disabled={isPending}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                    title="Remove override"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/20 px-4 py-6 text-center">
            <CalendarOff className="size-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No date overrides set. Add one to block a specific date or set custom hours.
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Info note */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-[11px] text-muted-foreground space-y-1">
        <p>
          <strong>Weekly schedule</strong> sets your default working hours.
          Customers can only book within these windows.
        </p>
        <p>
          <strong>Date overrides</strong> let you block specific dates (e.g. holidays)
          or set different hours for a particular day.
        </p>
      </div>

      {/* ── Delete Override Confirmation Dialog ─── */}
      <Dialog
        open={deleteOverrideId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteOverrideId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove date override?</DialogTitle>
            <DialogDescription>
              {deleteOverride ? (
                <>
                  This will remove the override for{" "}
                  <strong>
                    {new Date(deleteOverride.date + "T00:00:00").toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </strong>
                  {deleteOverride.isAvailable
                    ? " (custom hours)"
                    : " (day off)"}
                  . Your regular weekly schedule will apply to this date instead.
                </>
              ) : (
                "Your regular weekly schedule will apply to this date instead."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOverrideId(null)}
              disabled={isPending}
            >
              Keep Override
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteOverride}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Remove Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
