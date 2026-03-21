import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ reference: string }>;
};

export default async function AdminInvoicePage({ params }: Props) {
  const { reference } = await params;
  redirect(`/admin/orders/${reference}/invoice`);
}
