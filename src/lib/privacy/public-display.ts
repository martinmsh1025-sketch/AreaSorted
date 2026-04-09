export function maskPostcode(postcode: string | null | undefined) {
  const value = (postcode || "").trim().toUpperCase();
  if (!value) return "Private address";
  const outward = value.split(" ")[0] || value;
  return `${outward} area`;
}

export function maskAddressSummary(input: {
  city?: string | null;
  postcode?: string | null;
}) {
  const city = (input.city || "").trim();
  const postcode = maskPostcode(input.postcode);
  return city ? `${city}, ${postcode}` : postcode;
}

export function redactReference(reference: string) {
  if (reference.length <= 4) return reference;
  return `${reference.slice(0, 3)}...${reference.slice(-3)}`;
}
