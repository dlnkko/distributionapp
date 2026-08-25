export type CtaType = "book_call" | "pricing" | "visit_site";

export function parseCtaType(value: string | null | undefined): CtaType {
  if (value === "pricing" || value === "visit_site") return value;
  return "book_call";
}

export function defaultCtaLabel(type: CtaType) {
  if (type === "visit_site") return "Visit site";
  if (type === "pricing") return "See plans";
  return "Book a call";
}

export type PlanBilling = "one_time" | "period";
export type PlanInterval = "daily" | "weekly" | "monthly" | "yearly";

export type CurrencyRegion = "Americas" | "Europe" | "Asia & Pacific";

export type Currency = {
  code: string;
  symbol: string;
  name: string;
  region: CurrencyRegion;
};

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US dollar", region: "Americas" },
  { code: "CAD", symbol: "C$", name: "Canadian dollar", region: "Americas" },
  { code: "MXN", symbol: "MX$", name: "Mexican peso", region: "Americas" },
  { code: "ARS", symbol: "AR$", name: "Argentine peso", region: "Americas" },
  { code: "CLP", symbol: "CL$", name: "Chilean peso", region: "Americas" },
  { code: "COP", symbol: "CO$", name: "Colombian peso", region: "Americas" },
  { code: "PEN", symbol: "S/", name: "Sol", region: "Americas" },
  { code: "BRL", symbol: "R$", name: "Real", region: "Americas" },
  { code: "UYU", symbol: "$U", name: "Uruguayan peso", region: "Americas" },
  { code: "BOB", symbol: "Bs", name: "Boliviano", region: "Americas" },
  { code: "GTQ", symbol: "Q", name: "Quetzal", region: "Americas" },
  { code: "CRC", symbol: "₡", name: "Colón", region: "Americas" },
  { code: "DOP", symbol: "RD$", name: "Dominican peso", region: "Americas" },
  { code: "EUR", symbol: "€", name: "Euro", region: "Europe" },
  { code: "GBP", symbol: "£", name: "Pound sterling", region: "Europe" },
  { code: "CHF", symbol: "Fr", name: "Swiss franc", region: "Europe" },
  { code: "SEK", symbol: "kr", name: "Swedish krona", region: "Europe" },
  { code: "NOK", symbol: "kr", name: "Norwegian krone", region: "Europe" },
  { code: "DKK", symbol: "kr", name: "Danish krone", region: "Europe" },
  { code: "PLN", symbol: "zł", name: "Złoty", region: "Europe" },
  { code: "CZK", symbol: "Kč", name: "Koruna", region: "Europe" },
  { code: "JPY", symbol: "¥", name: "Yen", region: "Asia & Pacific" },
  { code: "CNY", symbol: "¥", name: "Yuan", region: "Asia & Pacific" },
  { code: "KRW", symbol: "₩", name: "Won", region: "Asia & Pacific" },
  { code: "INR", symbol: "₹", name: "Rupee", region: "Asia & Pacific" },
  { code: "AUD", symbol: "A$", name: "Australian dollar", region: "Asia & Pacific" },
];

const REGION_ORDER: CurrencyRegion[] = ["Americas", "Europe", "Asia & Pacific"];

export function currenciesByRegion() {
  return REGION_ORDER.map((label) => ({
    label,
    currencies: CURRENCIES.filter((item) => item.region === label),
  }));
}

export type PricingPlan = {
  name: string;
  price: string;
  currency: string;
  billing: PlanBilling;
  interval: PlanInterval;
  period: string;
  description: string;
  features: string[];
  ctaLabel: string;
};

export type ListingCta = {
  type: CtaType;
  url: string;
  label: string;
  plans: PricingPlan[];
};

export function currencyByCode(code: string) {
  return CURRENCIES.find((item) => item.code === code) ?? CURRENCIES[0];
}

export function emptyPlan(): PricingPlan {
  return {
    name: "",
    price: "",
    currency: "USD",
    billing: "period",
    interval: "monthly",
    period: formatPeriodLabel("period", "monthly"),
    description: "",
    features: [],
    ctaLabel: "Buy now",
  };
}

export function formatPeriodLabel(billing: PlanBilling, interval: PlanInterval) {
  if (billing === "one_time") return "one time";
  const map: Record<PlanInterval, string> = {
    daily: "/day",
    weekly: "/wk",
    monthly: "/mo",
    yearly: "/yr",
  };
  return map[interval];
}

export function formatPlanPrice(plan: PricingPlan) {
  const currency = currencyByCode(plan.currency);
  const amount = plan.price.trim() || "0";
  return `${currency.symbol}${amount}`;
}

export function sanitizePrice(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join("").slice(0, 2)}`;
}

function inferBilling(period: string | undefined): PlanBilling {
  const value = (period ?? "").toLowerCase();
  if (value.includes("one") || value.includes("once") || value === "") return "one_time";
  if (value === "one time") return "one_time";
  return "period";
}

function inferInterval(period: string | undefined): PlanInterval {
  const value = (period ?? "").toLowerCase();
  if (value.includes("day")) return "daily";
  if (value.includes("week") || value.includes("/wk")) return "weekly";
  if (value.includes("year") || value.includes("/yr")) return "yearly";
  return "monthly";
}

function inferCurrency(price: string, explicit?: string) {
  if (explicit && CURRENCIES.some((item) => item.code === explicit)) return explicit;
  if (price.includes("€")) return "EUR";
  if (price.includes("£")) return "GBP";
  if (price.includes("¥")) return "JPY";
  if (price.includes("S/")) return "PEN";
  if (price.includes("R$")) return "BRL";
  return "USD";
}

export function parsePlans(value: unknown): PricingPlan[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const plan = item as Partial<PricingPlan> & { price?: string };
    const billing = plan.billing ?? inferBilling(plan.period);
    const interval = plan.interval ?? inferInterval(plan.period);
    const currency = inferCurrency(plan.price ?? "", plan.currency);
    const price = sanitizePrice(plan.price ?? "");
    return {
      name: plan.name?.trim() ?? "",
      price,
      currency,
      billing,
      interval,
      period: formatPeriodLabel(billing, interval),
      description: plan.description?.trim() ?? "",
      features: Array.isArray(plan.features)
        ? plan.features.map((feature) => String(feature).trim()).filter(Boolean)
        : [],
      ctaLabel: plan.ctaLabel?.trim() || "Buy now",
    };
  });
}

export function destinationUrl(ctaUrl: string | null | undefined, websiteUrl: string | null | undefined) {
  return (ctaUrl?.trim() || websiteUrl?.trim() || "").trim();
}

export function faviconUrl(pageUrl: string, scrapedFavicon?: string | null) {
  if (scrapedFavicon?.trim()) return scrapedFavicon.trim();
  try {
    const host = new URL(
      /^https?:\/\//i.test(pageUrl) ? pageUrl : `https://${pageUrl}`,
    ).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  } catch {
    return "";
  }
}
