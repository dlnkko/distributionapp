export const CLICK_COST_USD = 0.5;
export const MIN_CREDIT_PURCHASE_USD = 20;
export const MAX_CREDIT_PURCHASE_USD = 999_999;

export function clicksRemaining(balance: number) {
  return Math.floor(Math.max(0, balance) / CLICK_COST_USD);
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatClickTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
