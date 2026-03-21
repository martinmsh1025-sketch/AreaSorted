"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bookingStatusShortLabels, serviceTypeLabels, formatEnumLabel } from "@/lib/providers/service-catalog-mapping";

/* ---------- Types ---------- */

export type ProviderBookingSummary = {
  id: string;
  serviceType: string;
  scheduledDate: string; // YYYY-MM-DD
  totalAmount: number;
  payout: number;
  commission: number;
  bookingStatus: string;
  postcode: string;
};

/* ---------- Palettes ---------- */

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#22c55e",
  PAID: "#3b82f6",
  ASSIGNED: "#8b5cf6",
  IN_PROGRESS: "#f59e0b",
  PENDING_ASSIGNMENT: "#06b6d4",
  AWAITING_PAYMENT: "#94a3b8",
  CANCELLED: "#ef4444",
  REFUNDED: "#f97316",
  NO_CLEANER_FOUND: "#dc2626",
};

const SERVICE_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b",
  "#ef4444", "#f97316", "#ec4899", "#14b8a6", "#6366f1",
];

function formatCurrency(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatServiceLabel(value: string) {
  return serviceTypeLabels[value] || formatEnumLabel(value);
}

/* ---------- Custom Tooltips ---------- */

function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background/95 px-3 py-2 text-sm shadow-lg backdrop-blur">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {typeof entry.value === "number" ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

function CountTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background/95 px-3 py-2 text-sm shadow-lg backdrop-blur">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

/* ---------- Earnings Trend (Area Chart) ---------- */

export function ProviderEarningsTrend({ bookings }: { bookings: ProviderBookingSummary[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { payout: number; commission: number; revenue: number }>();

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      map.set(key, { payout: 0, commission: 0, revenue: 0 });
    }

    for (const b of bookings) {
      if (!["ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(b.bookingStatus)) continue;
      const key = b.scheduledDate;
      if (map.has(key)) {
        const entry = map.get(key)!;
        entry.payout += b.payout;
        entry.commission += b.commission;
        entry.revenue += b.totalAmount;
      }
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: date.slice(5),
        payout: Math.round(vals.payout * 100) / 100,
        commission: Math.round(vals.commission * 100) / 100,
        revenue: Math.round(vals.revenue * 100) / 100,
      }));
  }, [bookings]);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Earnings trend (30 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="payoutGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `£${v}`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="payout" name="Your payout" stroke="#22c55e" fill="url(#payoutGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="revenue" name="Booking value" stroke="#3b82f6" fill="url(#revenueGrad)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="commission" name="Platform fees" stroke="#f59e0b" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Status Distribution (Donut) ---------- */

export function ProviderStatusChart({ bookings }: { bookings: ProviderBookingSummary[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      map.set(b.bookingStatus, (map.get(b.bookingStatus) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([status, value]) => ({
        name: bookingStatusShortLabels[status] || formatEnumLabel(status),
        rawStatus: status,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [bookings]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Order status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                label={(props: any) =>
                  `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
                style={{ fontSize: 9 }}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.rawStatus] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [value, name]}
                contentStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Service Type Breakdown (Bar) ---------- */

export function ProviderServiceChart({ bookings }: { bookings: ProviderBookingSummary[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { count: number; payout: number }>();
    for (const b of bookings) {
      if (!["ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(b.bookingStatus)) continue;
      const label = formatServiceLabel(b.serviceType);
      const entry = map.get(label) || { count: 0, payout: 0 };
      entry.count += 1;
      entry.payout += b.payout;
      map.set(label, entry);
    }
    return Array.from(map.entries())
      .map(([name, vals]) => ({
        name: name.length > 14 ? name.slice(0, 12) + ".." : name,
        fullName: name,
        count: vals.count,
        payout: Math.round(vals.payout * 100) / 100,
      }))
      .sort((a, b) => b.payout - a.payout);
  }, [bookings]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Earnings by service type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" angle={-15} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `£${v}`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Bar dataKey="payout" name="Your payout" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Daily Volume (Stacked Bar) ---------- */

export function ProviderDailyVolumeChart({ bookings }: { bookings: ProviderBookingSummary[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { completed: number; active: number; cancelled: number }>();

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      map.set(key, { completed: 0, active: 0, cancelled: 0 });
    }

    for (const b of bookings) {
      const key = b.scheduledDate;
      if (!map.has(key)) continue;
      const entry = map.get(key)!;
      if (b.bookingStatus === "COMPLETED") {
        entry.completed += 1;
      } else if (b.bookingStatus === "CANCELLED" || b.bookingStatus === "REFUNDED") {
        entry.cancelled += 1;
      } else {
        entry.active += 1;
      }
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: date.slice(5),
        completed: vals.completed,
        active: vals.active,
        cancelled: vals.cancelled,
      }));
  }, [bookings]);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Daily order volume (30 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
              <Tooltip content={<CountTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="completed" name="Completed" fill="#22c55e" stackId="a" />
              <Bar dataKey="active" name="Active" fill="#3b82f6" stackId="a" />
              <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
