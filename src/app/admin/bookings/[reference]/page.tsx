import { redirect } from "next/navigation";

type AdminBookingDetailPageProps = {
  params: Promise<{ reference: string }>;
};

export default async function AdminBookingDetailPage({ params }: AdminBookingDetailPageProps) {
  const { reference } = await params;
  redirect(`/admin/orders/${reference}`);
}
