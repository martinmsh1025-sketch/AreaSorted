/**
 * Shared formatting utilities.
 *
 * L-K FIX: Centralised formatMoney() replaces 11 local copies scattered across the codebase.
 */

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
});

/**
 * Format a monetary value as GBP (e.g. "£12.50").
 *
 * - `number` → formatted string
 * - `null | undefined` → `"—"` (em-dash placeholder)
 * - `unknown` → coerced via `Number(value || 0)`
 */
export function formatMoney(value: number): string;
export function formatMoney(value: number | null | undefined): string;
export function formatMoney(value: unknown): string;
export function formatMoney(value: unknown): string {
  if (value == null) return "—";
  const n = typeof value === "number" ? value : Number(value || 0);
  return gbpFormatter.format(n);
}
