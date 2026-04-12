import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getAdminTranslations } from "@/lib/i18n/server";

type AdminCustomersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");
  const t = await getAdminTranslations();

  const prisma = getPrisma();
  const params = (await searchParams) ?? {};
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const marketing = typeof params.marketing === "string" ? params.marketing : "all";
  const segment = typeof params.segment === "string" ? params.segment : "all";
  const latestStatus = typeof params.latestStatus === "string" ? params.latestStatus : "all";
  const postcode = typeof params.postcode === "string" ? params.postcode.trim().toUpperCase() : "";
  const latestCategory = typeof params.latestCategory === "string" ? params.latestCategory : "all";

  const where = {
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(marketing === "opted_in" ? { marketingConsent: true } : {}),
  };

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          bookingStatus: true,
          createdAt: true,
          totalAmount: true,
          servicePostcode: true,
          serviceType: true,
          quoteRequest: { select: { reference: true } },
        },
      },
      payments: {
        select: { amount: true, paymentStatus: true },
      },
    },
  });

  const summary = {
    totalCustomers: customers.length,
    marketingOptIn: customers.filter((customer) => customer.marketingConsent).length,
    totalBookings: customers.reduce((sum, customer) => sum + customer.bookings.length, 0),
    totalCaptured: customers.reduce(
      (sum, customer) =>
        sum + customer.payments.filter((payment) => payment.paymentStatus === "PAID").reduce((inner, payment) => inner + Number(payment.amount), 0),
      0,
    ),
    noBookings: customers.filter((customer) => customer.bookings.length === 0).length,
    repeatCustomers: customers.filter((customer) => customer.bookings.length >= 2).length,
  };

  const filteredCustomers = customers.filter((customer) => {
    const latestBooking = customer.bookings[0] || null;
    if (segment === "no_bookings" && customer.bookings.length > 0) return false;
    if (segment === "repeat" && customer.bookings.length < 2) return false;
    if (segment === "high_value") {
      const capturedSpend = customer.payments
        .filter((payment) => payment.paymentStatus === "PAID")
        .reduce((sum, payment) => sum + Number(payment.amount), 0);
      if (capturedSpend < 200) return false;
    }
    if (latestStatus !== "all" && latestBooking?.bookingStatus !== latestStatus) return false;
    if (postcode && !(latestBooking?.servicePostcode || "").toUpperCase().includes(postcode)) return false;
    if (latestCategory !== "all" && latestBooking?.serviceType !== latestCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.customers.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t.customers.subtitle}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>{t.customers.totalCustomers}</CardDescription><CardTitle>{summary.totalCustomers}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{t.customers.marketingOptIn}</CardDescription><CardTitle>{summary.marketingOptIn}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{t.customers.noBookingsYet}</CardDescription><CardTitle>{summary.noBookings}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{t.customers.repeatCustomers}</CardDescription><CardTitle>{summary.repeatCustomers}</CardTitle></CardHeader></Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card><CardHeader className="pb-2"><CardDescription>{t.customers.totalBookings}</CardDescription><CardTitle>{summary.totalBookings}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>{t.customers.capturedSpend}</CardDescription><CardTitle>{formatMoney(summary.totalCaptured)}</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.customers.searchSegment}</CardTitle>
          <CardDescription>{t.customers.searchSegmentDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-6" method="get">
            <Input name="q" defaultValue={q} placeholder={t.customers.searchPlaceholder} />
            <select name="marketing" defaultValue={marketing} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
              <option value="all">{t.customers.allMarketingStates}</option>
              <option value="opted_in">{t.customers.marketingOptInOnly}</option>
            </select>
            <select name="segment" defaultValue={segment} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
              <option value="all">{t.customers.allSegments}</option>
              <option value="no_bookings">{t.customers.noBookingsYet}</option>
              <option value="repeat">{t.customers.repeatCustomersFilter}</option>
              <option value="high_value">{t.customers.highValue}</option>
            </select>
            <select name="latestStatus" defaultValue={latestStatus} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
              <option value="all">{t.customers.anyLatestStatus}</option>
              <option value="COMPLETED">{t.customers.latestCompleted}</option>
              <option value="CANCELLED">{t.customers.latestCancelled}</option>
              <option value="PENDING_ASSIGNMENT">{t.customers.latestPendingAssignment}</option>
              <option value="ASSIGNED">{t.customers.latestAssigned}</option>
            </select>
            <Input name="postcode" defaultValue={postcode} placeholder={t.customers.latestBookingPostcode} />
            <select name="latestCategory" defaultValue={latestCategory} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
              <option value="all">{t.customers.anyLatestService}</option>
              <option value="CLEANING">{t.customers.cleaning}</option>
              <option value="PEST_CONTROL">{t.customers.pestControl}</option>
              <option value="HANDYMAN">{t.customers.handyman}</option>
              <option value="FURNITURE_ASSEMBLY">{t.customers.furnitureAssembly}</option>
              <option value="WASTE_REMOVAL">{t.customers.wasteRemoval}</option>
              <option value="GARDEN_MAINTENANCE">{t.customers.gardenMaintenance}</option>
            </select>
            <button type="submit" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90 lg:col-span-6 lg:w-fit">
              Search
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.customers.customerBase}</CardTitle>
          <CardDescription>{t.customers.customerBaseDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{t.customers.noCustomersFound}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium">{t.customers.tableHeaders.customer}</th>
                    <th className="px-4 py-3 text-left font-medium">{t.customers.tableHeaders.contact}</th>
                    <th className="px-4 py-3 text-left font-medium">{t.customers.tableHeaders.marketing}</th>
                    <th className="px-4 py-3 text-right font-medium">{t.customers.tableHeaders.bookings}</th>
                    <th className="px-4 py-3 text-right font-medium">{t.customers.tableHeaders.capturedSpend}</th>
                    <th className="px-4 py-3 text-left font-medium">{t.customers.tableHeaders.latestBooking}</th>
                    <th className="px-4 py-3 text-left font-medium">{t.customers.tableHeaders.latestCategory}</th>
                    <th className="px-4 py-3 text-left font-medium">{t.customers.tableHeaders.joined}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const latestBooking = customer.bookings[0] || null;
                    const capturedSpend = customer.payments
                      .filter((payment) => payment.paymentStatus === "PAID")
                      .reduce((sum, payment) => sum + Number(payment.amount), 0);
                    return (
                      <tr key={customer.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                          <div className="text-xs text-muted-foreground">{t.customers.idPrefix} {customer.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div>{customer.email}</div>
                          <div>{customer.phone || "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={customer.marketingConsent ? "secondary" : "outline"}>
                            {customer.marketingConsent ? t.customers.optedIn : t.customers.noConsent}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{customer.bookings.length}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{formatMoney(capturedSpend)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {latestBooking ? (
                            <div>
                              <div className="font-medium text-foreground">
                                <Link href={`/admin/orders/${latestBooking.id}`} className="hover:underline text-primary">
                                  {latestBooking.quoteRequest?.reference || latestBooking.id.slice(0, 8)}
                                </Link>
                              </div>
                              <div className="text-xs">{latestBooking.bookingStatus} · {latestBooking.servicePostcode}</div>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{latestBooking?.serviceType || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{customer.createdAt.toLocaleDateString("en-GB")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
