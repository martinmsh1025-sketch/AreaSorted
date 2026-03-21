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

/* ---------- Types ---------- */

export type BookingSummary = {
  id: string;
  ref: string;
  customerName: string;
  serviceType: string;
  scheduledDate: string; // ISO date string
  totalAmount: number;
  cleanerPayout: number;
  platformMargin: number;
  bookingStatus: string;
  paymentStatus: string;
  providerName: string;
  createdAt: string;
};

/* ---------- Colour palettes ---------- */

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
  REFUND_PENDING: "#fb923c",
};

const SERVICE_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b",
  "#ef4444", "#f97316", "#ec4899", "#14b8a6", "#6366f1",
];

function formatCurrency(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatServiceLabel(value: string) {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/* ---------- Custom Tooltip ---------- */

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

/* ---------- Revenue Trend (Area) ---------- */

export function RevenueTrendChart({ bookings }: { bookings: BookingSummary[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { revenue: number; payout: number; platform: number }>();

    // Get date range — last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      map.set(key, { revenue: 0, payout: 0, platform: 0 });
    }

    for (const b of bookings) {
      const key = b.scheduledDate;
      if (map.has(key)) {
        const entry = map.get(key)!;
        entry.revenue += b.totalAmount;
        entry.payout += b.cleanerPayout;
        entry.platform += b.platformMargin;
      }
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: date.slice(5), // MM-DD
        revenue: Math.round(vals.revenue * 100) / 100,
        payout: Math.round(vals.payout * 100) / 100,
        platform: Math.round(vals.platform * 100) / 100,
      }));
  }, [bookings]);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Revenue trend (30 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="payoutGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `£${v}`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#revenueGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="payout" name="Provider payout" stroke="#22c55e" fill="url(#payoutGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="platform" name="Platform" stroke="#8b5cf6" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Status Distribution (Pie) ---------- */

export function StatusDistributionChart({ bookings }: { bookings: BookingSummary[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      map.set(b.bookingStatus, (map.get(b.bookingStatus) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [bookings]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Status distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
                label={(props: any) =>
                  `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
                style={{ fontSize: 10 }}
              >
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
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

/* ---------- Service Type Distribution (Bar) ---------- */

export function ServiceTypeChart({ bookings }: { bookings: BookingSummary[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const b of bookings) {
      const label = formatServiceLabel(b.serviceType);
      const entry = map.get(label) || { count: 0, revenue: 0 };
      entry.count += 1;
      entry.revenue += b.totalAmount;
      map.set(label, entry);
    }
    return Array.from(map.entries())
      .map(([name, vals]) => ({
        name: name.length > 14 ? name.slice(0, 12) + ".." : name,
        fullName: name,
        count: vals.count,
        revenue: Math.round(vals.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [bookings]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Revenue by service type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `£${v}`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
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

/* ---------- Daily Volume (Bar) ---------- */

export function DailyVolumeChart({ bookings }: { bookings: BookingSummary[] }) {
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
          Daily booking volume (30 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
              <Tooltip content={<CountTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="completed" name="Completed" fill="#22c55e" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="active" name="Active" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Provider Leaderboard ---------- */

export function ProviderLeaderboard({ bookings }: { bookings: BookingSummary[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { revenue: number; count: number; completed: number }>();
    for (const b of bookings) {
      if (b.providerName === "Unassigned") continue;
      const entry = map.get(b.providerName) || { revenue: 0, count: 0, completed: 0 };
      entry.count += 1;
      entry.revenue += b.totalAmount;
      if (b.bookingStatus === "COMPLETED") entry.completed += 1;
      map.set(b.providerName, entry);
    }
    return Array.from(map.entries())
      .map(([name, vals]) => ({
        name,
        revenue: Math.round(vals.revenue * 100) / 100,
        count: vals.count,
        completed: vals.completed,
        completionRate: vals.count > 0 ? Math.round((vals.completed / vals.count) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [bookings]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">No provider data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Top providers by revenue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((provider, i) => (
            <div key={provider.name} className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{provider.name}</span>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    {formatCurrency(provider.revenue)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${data[0] ? (provider.revenue / data[0].revenue) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {provider.count} orders / {provider.completionRate}% done
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Postcode Heatmap (simplified bar) ---------- */

export function PostcodeChart({ bookings }: { bookings: BookingSummary[] }) {
  // We don't have postcode in summary, but we can show provider distribution
  // This is a placeholder — in Power BI this would be a map
  return null;
}
