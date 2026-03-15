import { InstantQuoteForm } from "@/components/quote/instant-quote-form";

function splitAddressParts(address: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    line1: parts[0] ?? "",
    line2: parts[1] ?? "",
    city: parts[2] ?? "",
  };
}

type InstantQuotePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InstantQuotePage({ searchParams }: InstantQuotePageProps) {
  const params = (await searchParams) ?? {};
  const postcode = typeof params.postcode === "string" ? params.postcode : "";
  const address = typeof params.address === "string" ? params.address : "";
  const line1 = typeof params.line1 === "string" ? params.line1 : "";
  const line2 = typeof params.line2 === "string" ? params.line2 : "";
  const city = typeof params.city === "string" ? params.city : "";
  const service = typeof params.service === "string" ? params.service : "";
  const addressParts = line1 || line2 || city ? { line1, line2, city } : splitAddressParts(address);

  return (
    <InstantQuoteForm
      initialPostcode={postcode}
      initialAddressLine1={addressParts.line1}
      initialAddressLine2={addressParts.line2}
      initialCity={addressParts.city}
      initialService={service}
    />
  );
}
