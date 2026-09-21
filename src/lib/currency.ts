export type CurrencyCode = "SAR" | "USD" | "AED" | "EUR";

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  symbolNative: string;
  flag: string;
  rateToUsd: number; // How many units of this currency per 1 USD
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  SAR: {
    code: "SAR",
    name: "Saudi Riyal",
    symbol: "SAR",
    symbolNative: "﷼",
    flag: "🇸🇦",
    rateToUsd: 3.75,
  },
  USD: {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    symbolNative: "$",
    flag: "🇺🇸",
    rateToUsd: 1.0,
  },
  AED: {
    code: "AED",
    name: "UAE Dirham",
    symbol: "AED",
    symbolNative: "د.إ",
    flag: "🇦🇪",
    rateToUsd: 3.6725,
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    symbolNative: "€",
    flag: "🇪🇺",
    rateToUsd: 0.92,
  },
};

/**
 * Convert any amount from one currency to another using standard institutional rates.
 */
export function convertCurrency(
  amount: number | null | undefined,
  from: string = "SAR",
  to: string = "SAR"
): number {
  if (amount === null || amount === undefined || isNaN(amount)) return 0;
  if (from === to) return amount;

  const fromCode = (from.toUpperCase() as CurrencyCode) in CURRENCIES ? (from.toUpperCase() as CurrencyCode) : "SAR";
  const toCode = (to.toUpperCase() as CurrencyCode) in CURRENCIES ? (to.toUpperCase() as CurrencyCode) : "SAR";

  if (fromCode === toCode) return amount;

  // Convert from source currency to USD first
  const amountInUsd = amount / CURRENCIES[fromCode].rateToUsd;
  // Convert from USD to target currency
  const targetAmount = amountInUsd * CURRENCIES[toCode].rateToUsd;

  return Math.round(targetAmount * 100) / 100;
}

/**
 * Format currency with international commas or compact notation (e.g. $150K or SAR 1.5M).
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "SAR",
  options?: {
    compact?: boolean;
    decimals?: number;
    useNativeSymbol?: boolean;
  }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currency} 0`;
  }

  const code = (currency.toUpperCase() as CurrencyCode) in CURRENCIES ? (currency.toUpperCase() as CurrencyCode) : "SAR";
  const config = CURRENCIES[code];
  const symbol = options?.useNativeSymbol ? config.symbolNative : config.symbol;

  if (options?.compact && Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `${symbol} ${millions.toFixed(options.decimals ?? 1)}M`;
  }

  if (options?.compact && Math.abs(amount) >= 1_000) {
    const thousands = amount / 1_000;
    return `${symbol} ${thousands.toFixed(options.decimals ?? 0)}K`;
  }

  const formattedNum = Math.round(amount).toLocaleString("en-US");
  return `${symbol} ${formattedNum}`;
}

export function getCurrencySymbol(currency: string = "SAR"): string {
  const code = (currency.toUpperCase() as CurrencyCode) in CURRENCIES ? (currency.toUpperCase() as CurrencyCode) : "SAR";
  return CURRENCIES[code].symbol;
}

