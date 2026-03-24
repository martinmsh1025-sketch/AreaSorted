import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AdminRefundsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminRefundsPage({ searchParams }: AdminRefundsPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const prisma = getPrisma();
  const params = (await searchParams) ?? {};
  const typeFilter = typeof params.type === "string" ? params.type : "";

  const refunds = await prisma.refundRecord.findMany({
    where: typeFilter === "FULL"
      ? { amount: { gt: 0 } }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      booking: {
        select: {
          id: true,
          bookingStatus: true,
          quoteRequest: { select: { reference: true } },
          customer: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  });

  const refundNotes = await prisma.invoiceRecord.findMany({
    where: { strategy: "REFUND_ADJUSTMENT_NOTE" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, bookingId: true, number: true, totalAmount: true, metadataJson: true, createdAt: true },
  });

  const noteMap = new Map(refundNotes.map((note) => [note.bookingId ?? note.id, note]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Refunds</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Audit trail and reconciliation view for full and partial refunds.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Use this page to review refund history, credit notes, and policy outcomes. Need payout controls as well? <Link href="/admin/payouts" className="text-primary hover:underline">View payouts</Link>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent refund activity</CardTitle>
          <CardDescription>Latest 200 refund records across customer bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          {refunds.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No refund records yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium">Booking</th>
                    <th className="px-4 py-3 text-left font-medium">Customer</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Refund</th>
                    <th className="px-4 py-3 text-left font-medium">Reason</th>
                    <th className="px-4 py-3 text-left font-medium">Refund note</th>
                    <th className="px-4 py-3 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((refund) => {
                    const bookingRef = refund.booking?.quoteRequest?.reference || refund.bookingId;
                    const customerName = refund.booking?.customer
                      ? `${refund.booking.customer.firstName} ${refund.booking.customer.lastName}`
                      : "—";
                    const note = noteMap.get(refund.bookingId);
                    return (
                      <tr key={refund.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${refund.bookingId}`} className="font-medium text-primary hover:underline">
                            {bookingRef}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{customerName}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{refund.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{formatMoney(Number(refund.amount))}</td>
                        <td className="px-4 py-3 text-muted-foreground">{refund.refundReason || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{note?.number || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{refund.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Refund definitions</CardTitle>
          <CardDescription>Use these labels when reviewing refunds, credit notes, and payout consequences.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
          <div className="rounded-md border p-3"><div className="font-medium">Full refund</div><p className="mt-1 text-muted-foreground">The entire captured amount is returned to the customer.</p></div>
          <div className="rounded-md border p-3"><div className="font-medium">Partial refund</div><p className="mt-1 text-muted-foreground">Only part of the captured amount is returned, usually after applying a policy rule.</p></div>
          <div className="rounded-md border p-3"><div className="font-medium">Refund note</div><p className="mt-1 text-muted-foreground">A reconciliation / credit-note style record created so finance can track the refund decision.</p></div>
          <div className="rounded-md border p-3"><div className="font-medium">Processed</div><p className="mt-1 text-muted-foreground">Refund completed. If payout was not yet released, provider funds should stay blocked or cancelled.</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
