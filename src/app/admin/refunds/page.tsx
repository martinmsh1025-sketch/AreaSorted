import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminTranslations } from "@/lib/i18n/server";

type AdminRefundsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminRefundsPage({ searchParams }: AdminRefundsPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");
  const t = await getAdminTranslations();

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
        <h1 className="text-2xl font-bold tracking-tight">{t.refundsPage.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t.refundsPage.subtitle}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {t.refundsPage.helpText} <Link href="/admin/payouts" className="text-primary hover:underline">{t.refundsPage.viewPayouts}</Link>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.refundsPage.recentActivity}</CardTitle>
          <CardDescription>{t.refundsPage.recentActivityDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {refunds.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{t.refundsPage.noRefundRecords}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                     <th className="px-4 py-3 text-left font-medium">{t.refundsPage.tableHeaders.booking}</th>
                     <th className="px-4 py-3 text-left font-medium">{t.refundsPage.tableHeaders.customer}</th>
                     <th className="px-4 py-3 text-left font-medium">{t.refundsPage.tableHeaders.status}</th>
                     <th className="px-4 py-3 text-right font-medium">{t.refundsPage.tableHeaders.refund}</th>
                     <th className="px-4 py-3 text-left font-medium">{t.refundsPage.tableHeaders.reason}</th>
                     <th className="px-4 py-3 text-left font-medium">{t.refundsPage.tableHeaders.refundNote}</th>
                     <th className="px-4 py-3 text-left font-medium">{t.refundsPage.tableHeaders.created}</th>
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
          <CardTitle className="text-base">{t.refundsPage.definitions}</CardTitle>
          <CardDescription>{t.refundsPage.definitionsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
          <div className="rounded-md border p-3"><div className="font-medium">{t.refundsPage.fullRefund}</div><p className="mt-1 text-muted-foreground">{t.refundsPage.fullRefundDesc}</p></div>
          <div className="rounded-md border p-3"><div className="font-medium">{t.refundsPage.partialRefund}</div><p className="mt-1 text-muted-foreground">{t.refundsPage.partialRefundDesc}</p></div>
          <div className="rounded-md border p-3"><div className="font-medium">{t.refundsPage.refundNote}</div><p className="mt-1 text-muted-foreground">{t.refundsPage.refundNoteDesc}</p></div>
          <div className="rounded-md border p-3"><div className="font-medium">{t.refundsPage.processed}</div><p className="mt-1 text-muted-foreground">{t.refundsPage.processedDesc}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
