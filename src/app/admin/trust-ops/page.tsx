import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { markSupportEnquiryReadAction, updateComplaintStatusAction, updateDisputeStatusAction } from "./actions";
import { parseComplaintAttachmentPaths } from "@/lib/complaints/attachments";
import { parseSupportAttachmentPaths, stripSupportAttachmentMetadata } from "@/lib/support/attachments";

function supportTypeFromMessage(message: string) {
  if (message.startsWith("[Provider complaint response]")) return "Provider case response";
  if (message.startsWith("[Provider support]")) return "Provider support";
  if (message.startsWith("[Support request]")) return "Customer support";
  return "General enquiry";
}

function complaintTone(status: string) {
  if (status === "OPEN") return "destructive" as const;
  if (status === "UNDER_REVIEW") return "secondary" as const;
  return "outline" as const;
}

function ageLabel(date: Date) {
  const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h old`;
  const days = Math.floor(hours / 24);
  return `${days}d old`;
}

function ageTone(date: Date) {
  const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (hours >= 72) return "destructive" as const;
  if (hours >= 24) return "secondary" as const;
  return "outline" as const;
}

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminTrustOpsPage({ searchParams }: Props) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");
  const params = (await searchParams) ?? {};
  const queueFilter = typeof params.queue === "string" ? params.queue : "all";
  const unreadOnly = typeof params.unread === "string" ? params.unread === "1" : false;

  const prisma = getPrisma();
  const [complaints, disputes, supportEnquiries, pendingRefunds] = await Promise.all([
    prisma.complaint.findMany({
      include: {
        booking: { select: { id: true, servicePostcode: true, bookingStatus: true } },
        customer: { select: { firstName: true, lastName: true } },
      },
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.disputeRecord.findMany({
      include: {
        booking: { select: { id: true, servicePostcode: true, bookingStatus: true } },
        providerCompany: { select: { tradingName: true, legalName: true } },
      },
      where: { status: { in: ["OPEN", "NEEDS_EVIDENCE", "SUBMITTED"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.contactEnquiry.findMany({
      where: {
        OR: [
          { message: { startsWith: "[Support request]" } },
          { message: { startsWith: "[Provider support]" } },
        ],
      },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
      take: 20,
    }),
    prisma.refundRecord.findMany({
      include: { booking: { select: { id: true, servicePostcode: true, bookingStatus: true } } },
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const visibleComplaints = queueFilter === "all" || queueFilter === "complaints" ? complaints : [];
  const visibleDisputes = queueFilter === "all" || queueFilter === "disputes" ? disputes : [];
  const visibleSupport = (queueFilter === "all" || queueFilter === "support")
    ? supportEnquiries.filter((item) => !unreadOnly || !item.read)
    : [];
  const visibleRefunds = queueFilter === "all" || queueFilter === "refunds" ? pendingRefunds : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trust ops</h1>
        <p className="text-muted-foreground">
          Review complaints, disputes, support requests, and pending refund cases in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Open complaints" value={String(complaints.length)} hint="Customer-reported service issues" />
        <MetricCard title="Open disputes" value={String(disputes.length)} hint="Payment and chargeback cases" />
        <MetricCard title="Support queue" value={String(supportEnquiries.length)} hint="Customer and provider support requests" />
        <MetricCard title="Pending refunds" value={String(pendingRefunds.length)} hint="Refund decisions still awaiting action" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All queues"],
          ["complaints", "Complaints"],
          ["support", "Support"],
          ["disputes", "Disputes"],
          ["refunds", "Refunds"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/trust-ops?queue=${value}${unreadOnly ? "&unread=1" : ""}`}
            className={`inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium ${queueFilter === value ? "bg-primary text-white" : "hover:bg-muted"}`}
          >
            {label}
          </Link>
        ))}
        <Link
          href={`/admin/trust-ops?queue=${queueFilter}${unreadOnly ? "" : "&unread=1"}`}
          className={`inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium ${unreadOnly ? "bg-primary text-white" : "hover:bg-muted"}`}
        >
          Unread support only
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Complaints</CardTitle>
            <CardDescription>Open or under-review booking issues reported by customers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleComplaints.length === 0 ? <p className="text-sm text-muted-foreground">No open complaint cases.</p> : visibleComplaints.map((complaint) => (
              <div key={complaint.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{complaint.complaintType.replace(/_/g, " ")}</div>
                    <div className="text-sm text-muted-foreground">
                      {complaint.customer.firstName} {complaint.customer.lastName} - {complaint.booking.servicePostcode}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={complaintTone(complaint.status)}>{complaint.status.replace(/_/g, " ")}</Badge>
                    <Badge variant={ageTone(complaint.createdAt)}>{ageLabel(complaint.createdAt)}</Badge>
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{complaint.description}</p>
                {parseComplaintAttachmentPaths(complaint.attachmentPath).length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-3">
                    {parseComplaintAttachmentPaths(complaint.attachmentPath).map((_, index) => (
                      <a key={index} href={`/api/complaint-evidence/${complaint.id}?index=${index}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                        Evidence {index + 1}
                      </a>
                    ))}
                  </div>
                ) : null}
                <form action={updateComplaintStatusAction} className="mt-3 space-y-2">
                  <input type="hidden" name="complaintId" value={complaint.id} />
                  <select name="outcomePreset" defaultValue="" className="h-9 w-full rounded-md border px-3 text-sm">
                    <option value="">Outcome preset (optional)</option>
                    <option value="REVIEW_ONLY">Move to review only</option>
                    <option value="MINOR_CREDIT">Minor issue - small deduction</option>
                    <option value="PARTIAL_REFUND">Moderate issue - partial refund</option>
                    <option value="FULL_REFUND">Severe issue - full refund</option>
                    <option value="NO_SHOW_PROVIDER">Provider no-show</option>
                    <option value="DAMAGE_ESCALATION">Damage / safety escalation</option>
                    <option value="REJECT_COMPLAINT">Reject complaint</option>
                    <option value="RESOLVED_NO_PAYOUT_IMPACT">Resolve - no payout impact</option>
                  </select>
                  <div className="flex gap-2">
                    <select name="status" defaultValue={complaint.status} className="h-9 rounded-md border px-3 text-sm">
                      <option value="OPEN">Open</option>
                      <option value="UNDER_REVIEW">Under review</option>
                      <option value="UPHELD">Upheld</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                    <button type="submit" className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted">Update</button>
                  </div>
                  <textarea name="resolutionNotes" placeholder="Optional review note" className="min-h-20 w-full rounded-md border px-3 py-2 text-sm" />
                </form>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{complaint.createdAt.toLocaleString("en-GB")}</span>
                  <Link href={`/admin/orders/${complaint.bookingId}`} className="font-medium text-primary hover:underline">
                    Open booking
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support queue</CardTitle>
            <CardDescription>Messages currently arriving by inbox rather than structured case workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleSupport.length === 0 ? <p className="text-sm text-muted-foreground">No recent support requests.</p> : visibleSupport.map((enquiry) => (
              <div key={enquiry.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{supportTypeFromMessage(enquiry.message)}</div>
                    <div className="text-sm text-muted-foreground">{enquiry.name} - {enquiry.email}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={enquiry.read ? "outline" : "destructive"}>{enquiry.read ? "Read" : "Unread"}</Badge>
                    <Badge variant={ageTone(enquiry.createdAt)}>{ageLabel(enquiry.createdAt)}</Badge>
                  </div>
                </div>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground" style={{ fontFamily: "inherit" }}>
                  {stripSupportAttachmentMetadata(enquiry.message)}
                </pre>
                {parseSupportAttachmentPaths(enquiry.message).length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-3">
                    {parseSupportAttachmentPaths(enquiry.message).map((_, index) => (
                      <a key={index} href={`/api/provider-case-evidence/${enquiry.id}?index=${index}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                        Evidence {index + 1}
                      </a>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">{enquiry.createdAt.toLocaleString("en-GB")}</div>
                  <form action={markSupportEnquiryReadAction}>
                    <input type="hidden" name="enquiryId" value={enquiry.id} />
                    <input type="hidden" name="read" value={enquiry.read ? "false" : "true"} />
                    <button type="submit" className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted">
                      {enquiry.read ? "Mark unread" : "Mark read"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Disputes</CardTitle>
            <CardDescription>Open chargeback or payment dispute cases.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleDisputes.length === 0 ? <p className="text-sm text-muted-foreground">No open dispute cases.</p> : visibleDisputes.map((dispute) => (
              <div key={dispute.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{dispute.reason || "Dispute case"}</div>
                    <div className="text-sm text-muted-foreground">
                      {(dispute.providerCompany?.tradingName || dispute.providerCompany?.legalName || "Unassigned provider")} - {dispute.booking.servicePostcode}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={dispute.status === "OPEN" ? "destructive" : "secondary"}>{dispute.status.replace(/_/g, " ")}</Badge>
                    <Badge variant={ageTone(dispute.createdAt)}>{ageLabel(dispute.createdAt)}</Badge>
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">Amount: GBP {Number(dispute.amount).toFixed(2)}</div>
                <form action={updateDisputeStatusAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="disputeId" value={dispute.id} />
                  <select name="status" defaultValue={dispute.status} className="h-9 rounded-md border px-3 text-sm">
                    <option value="OPEN">Open</option>
                    <option value="NEEDS_EVIDENCE">Needs evidence</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <button type="submit" className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted">Update</button>
                </form>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{dispute.createdAt.toLocaleString("en-GB")}</span>
                  <Link href={`/admin/orders/${dispute.bookingId}`} className="font-medium text-primary hover:underline">
                    Open booking
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending refunds</CardTitle>
            <CardDescription>Refund records that still need resolution or confirmation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleRefunds.length === 0 ? <p className="text-sm text-muted-foreground">No pending refund cases.</p> : visibleRefunds.map((refund) => (
              <div key={refund.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">GBP {Number(refund.amount).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">{refund.booking.servicePostcode} - {refund.booking.bookingStatus.replace(/_/g, " ")}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline">{refund.liability}</Badge>
                    <Badge variant={ageTone(refund.createdAt)}>{ageLabel(refund.createdAt)}</Badge>
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{refund.refundReason || "No refund reason recorded."}</div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{refund.createdAt.toLocaleString("en-GB")}</span>
                  <Link href={`/admin/orders/${refund.bookingId}`} className="font-medium text-primary hover:underline">
                    Open booking
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
