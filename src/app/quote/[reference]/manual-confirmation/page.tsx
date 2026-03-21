import { redirect } from "next/navigation";

type ManualQuoteConfirmationPageProps = {
  params: Promise<{ reference: string }>;
};

export default async function ManualQuoteConfirmationPage({ params }: ManualQuoteConfirmationPageProps) {
  const { reference } = await params;
  redirect(`/quote/${reference}`);
}
