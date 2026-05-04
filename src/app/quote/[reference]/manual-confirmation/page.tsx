import { redirect } from "next/navigation";
import { QUOTE_ACCESS_PARAM } from "@/lib/quotes/access";

type ManualQuoteConfirmationPageProps = {
  params: Promise<{ reference: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ManualQuoteConfirmationPage({ params, searchParams }: ManualQuoteConfirmationPageProps) {
  const { reference } = await params;
  const query = (await searchParams) ?? {};
  const accessToken = typeof query[QUOTE_ACCESS_PARAM] === "string" ? query[QUOTE_ACCESS_PARAM] : "";
  redirect(`/quote/${reference}${accessToken ? `?${QUOTE_ACCESS_PARAM}=${encodeURIComponent(accessToken)}` : ""}`);
}
