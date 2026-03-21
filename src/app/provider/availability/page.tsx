import { requireProviderPricingAccess } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { AvailabilityGrid } from "@/components/provider/availability-grid";
import {
  saveAllAvailabilityAction,
  saveDateOverrideAction,
  deleteDateOverrideAction,
} from "./actions";

// Default working hours: Mon-Fri 09:00-17:00, Sat-Sun off
const DEFAULT_SCHEDULE = [
  { dayOfWeek: 0, isAvailable: false, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 1, isAvailable: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 2, isAvailable: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 3, isAvailable: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 4, isAvailable: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 5, isAvailable: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 6, isAvailable: false, startTime: "09:00", endTime: "17:00" },
];

export default async function ProviderAvailabilityPage() {
  const session = await requireProviderPricingAccess();
  const providerCompanyId = session.providerCompany.id;
  const prisma = getPrisma();

  // Load existing rules
  let rules = await prisma.providerAvailability.findMany({
    where: { providerCompanyId },
    orderBy: { dayOfWeek: "asc" },
  });

  // Auto-create defaults on first visit
  if (rules.length === 0) {
    await Promise.all(
      DEFAULT_SCHEDULE.map((day) =>
        prisma.providerAvailability.create({
          data: {
            providerCompanyId,
            dayOfWeek: day.dayOfWeek,
            startTime: day.startTime,
            endTime: day.endTime,
            isAvailable: day.isAvailable,
          },
        })
      )
    );

    rules = await prisma.providerAvailability.findMany({
      where: { providerCompanyId },
      orderBy: { dayOfWeek: "asc" },
    });
  }

  // Ensure all 7 days exist (fill gaps if any)
  const schedule = Array.from({ length: 7 }, (_, i) => {
    const existing = rules.find((r) => r.dayOfWeek === i);
    if (existing) {
      return {
        dayOfWeek: existing.dayOfWeek,
        isAvailable: existing.isAvailable,
        startTime: existing.startTime,
        endTime: existing.endTime,
      };
    }
    return DEFAULT_SCHEDULE[i];
  });

  // Load date overrides
  const dateOverrides = await prisma.providerDateOverride.findMany({
    where: { providerCompanyId },
    orderBy: { date: "asc" },
  });

  const overridesForClient = dateOverrides.map((o) => ({
    id: o.id,
    date: o.date.toISOString().split("T")[0],
    isAvailable: o.isAvailable,
    startTime: o.startTime,
    endTime: o.endTime,
    note: o.note,
  }));

  const activeDays = schedule.filter((d) => d.isAvailable).length;
  const upcomingOverrides = dateOverrides.filter(
    (o) => o.date >= new Date(new Date().toDateString())
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Availability</h1>
          <p className="text-sm text-muted-foreground">
            Set your working hours, block dates, and control booking limits.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Badge variant={activeDays > 0 ? "default" : "outline"}>
            {activeDays} working day{activeDays !== 1 ? "s" : ""}
          </Badge>
          {upcomingOverrides > 0 && (
            <Badge variant="outline">
              {upcomingOverrides} override{upcomingOverrides !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Grid */}
      <AvailabilityGrid
        initialSchedule={schedule}
        initialOverrides={overridesForClient}
        saveAllAction={saveAllAvailabilityAction}
        saveDateOverrideAction={saveDateOverrideAction}
        deleteDateOverrideAction={deleteDateOverrideAction}
      />
    </div>
  );
}
