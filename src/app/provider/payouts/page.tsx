import { requireProviderOrdersAccess } from "@/lib/provider-auth";
import { getPrisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatStatus(status: string) {
  return status.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ProviderPayoutsPage() {
  const session = await requireProviderOrdersAccess();
  const prisma = getPrisma();

  const payoutRecords = await prisma.payoutRecord.findMany({
    where: { providerCompanyId: session.providerCompany.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      booking: {
        select: {
          id: true,
          bookingStatus: true,
          scheduledDate: true,
          quoteRequest: { select: { reference: true } },
        },
      },
    },
  });

  const onHoldTotal = payoutRecords.filter((p) => p.status === "ON_HOLD").reduce((sum, p) => sum + Number(p.amount), 0);
  const eligibleTotal = payoutRecords.filter((p) => p.status === "ELIGIBLE").reduce((sum, p) => sum + Number(p.amount), 0);
  const releasedTotal = payoutRecords.filter((p) => ["RELEASED", "PAID"].includes(p.status)).reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track which earnings are still on hold, which ones are ready for release, and which payouts have already been released.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardDescription>On hold</CardDescription><CardTitle>{formatMoney(onHoldTotal)}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">Still inside the review / hold period.</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Eligible</CardDescription><CardTitle>{formatMoney(eligibleTotal)}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">Ready for admin or automatic release.</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Released</CardDescription><CardTitle>{formatMoney(releasedTotal)}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">Already released or marked as paid out.</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent payout activity</CardTitle>
          <CardDescription>Hold periods and release decisions linked to your bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          {payoutRecords.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No payout records yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium">Booking</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Hold until</th>
                    <th className="px-4 py-3 text-left font-medium">Notes</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutRecords.map((record) => (
                    <tr key={record.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-medium">{record.booking?.quoteRequest?.reference || record.bookingId}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{formatStatus(record.status)}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{record.holdUntil ? new Date(record.holdUntil).toLocaleDateString("en-GB") : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{record.blockedReason || "—"}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{formatMoney(Number(record.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
