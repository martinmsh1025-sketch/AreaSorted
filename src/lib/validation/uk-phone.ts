export function normalizeUkPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("@")) return null;

  let compact = trimmed.replace(/[()\-\s]/g, "");
  if (compact.startsWith("00")) {
    compact = `+${compact.slice(2)}`;
  }

  let national = compact;
  if (compact.startsWith("+44")) {
    national = compact.slice(3);
  } else if (compact.startsWith("44")) {
    national = compact.slice(2);
  } else if (compact.startsWith("0")) {
    national = compact.slice(1);
  }

  if (!/^\d{10}$/.test(national)) return null;

  return `+44 ${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`;
}
