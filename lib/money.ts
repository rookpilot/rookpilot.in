const WHOLE = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const CENTS = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

/** "$240", or "$6.50" when there are cents. */
export function formatMoney(amount: number): string {
  return Number.isInteger(amount) ? WHOLE.format(amount) : CENTS.format(amount);
}

/** Reads a typed amount like "240", "$1,200", or "6.5". Empty or invalid input is null. */
export function parseMoney(value: string): number | null {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : null;
}

/** The value to put back in a cost input. */
export function moneyInput(amount: number | null): string {
  return amount === null ? "" : String(amount);
}
