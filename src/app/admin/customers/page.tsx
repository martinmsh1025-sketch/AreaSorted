import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type AdminCustomersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");

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
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Central customer list for account history, booking activity, spend, and future promotion planning.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Total customers</CardDescription><CardTitle>{summary.totalCustomers}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Marketing opt-in</CardDescription><CardTitle>{summary.marketingOptIn}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>No bookings yet</CardDescription><CardTitle>{summary.noBookings}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Repeat customers</CardDescription><CardTitle>{summary.repeatCustomers}</CardTitle></CardHeader></Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card><CardHeader className="pb-2"><CardDescription>Total bookings</CardDescription><CardTitle>{summary.totalBookings}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Captured spend</CardDescription><CardTitle>{formatMoney(summary.totalCaptured)}</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search and segment customers</CardTitle>
          <CardDescription>Search by name, email, or phone and filter the list for promotion or analysis work.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-6" method="get">
            <Input name="q" defaultValue={q} placeholder="Search customers" />
            <select name="marketing" defaultValue={marketing} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
              <option value="all">All marketing states</option>
              <option value="opted_in">Marketing opt-in only</option>
            </select>
            <select name="segment" defaultValue={segment} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
              <option value="all">All segments</option>
              <option value="no_bookings">No bookings yet</option>
              <option value="repeat">Repeat customers</option>
              <option value="high_value">High value (£200+)</option>
            </select>
            <select name="latestStatus" defaultValue={latestStatus} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
              <option value="all">Any latest booking status</option>
              <option value="COMPLETED">Latest completed</option>
              <option value="CANCELLED">Latest cancelled</option>
              <option value="PENDING_ASSIGNMENT">Latest pending assignment</option>
              <option value="ASSIGNED">Latest assigned</option>
            </select>
            <Input name="postcode" defaultValue={postcode} placeholder="Latest booking postcode" />
            <select name="latestCategory" defaultValue={latestCategory} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
              <option value="all">Any latest service category</option>
              <option value="CLEANING">Cleaning</option>
              <option value="PEST_CONTROL">Pest control</option>
              <option value="HANDYMAN">Handyman</option>
              <option value="FURNITURE_ASSEMBLY">Furniture assembly</option>
              <option value="WASTE_REMOVAL">Waste removal</option>
              <option value="GARDEN_MAINTENANCE">Garden maintenance</option>
            </select>
            <button type="submit" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90 lg:col-span-6 lg:w-fit">
              Search
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer base</CardTitle>
          <CardDescription>Latest 200 customer accounts with booking and spend context.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No customers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium">Customer</th>
                    <th className="px-4 py-3 text-left font-medium">Contact</th>
                    <th className="px-4 py-3 text-left font-medium">Marketing</th>
                    <th className="px-4 py-3 text-right font-medium">Bookings</th>
                    <th className="px-4 py-3 text-right font-medium">Captured spend</th>
                    <th className="px-4 py-3 text-left font-medium">Latest booking</th>
                    <th className="px-4 py-3 text-left font-medium">Latest category</th>
                    <th className="px-4 py-3 text-left font-medium">Joined</th>
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
                          <div className="text-xs text-muted-foreground">ID: {customer.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div>{customer.email}</div>
                          <div>{customer.phone || "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={customer.marketingConsent ? "secondary" : "outline"}>
                            {customer.marketingConsent ? "Opted in" : "No consent"}
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
