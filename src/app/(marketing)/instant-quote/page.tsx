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
  const service = typeof params.service === "string" ? params.service : "";
  const addressParts = splitAddressParts(address);

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
