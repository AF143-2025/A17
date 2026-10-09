import db from './db';

const DEFAULT_USD_TO_IQD = 1500;

/**
 * Gets the current USD to IQD exchange rate from settings or returns fallback.
 */
export async function getExchangeRate(): Promise<number> {
  try {
    const setting = await db.setting.findUnique({
      where: { key: 'usd_to_iqd_rate' },
    });

    if (setting && setting.value) {
      const rate = parseFloat(setting.value);
      if (!isNaN(rate) && rate > 0) {
        return rate;
      }
    }
  } catch (error) {
    console.warn('[Currency] Failed to fetch exchange rate, using default 1500:', error);
  }

  return DEFAULT_USD_TO_IQD;
}

/**
 * Converts an IQD amount to USD based on the platform exchange rate.
 * Rounds to 4 decimal places to prevent floating point drift.
 */
export function convertIqdToUsd(iqdAmount: number, rate: number): number {
  if (rate <= 0) return 0;
  const usd = iqdAmount / rate;
  return Math.round(usd * 10000) / 10000;
}

/**
 * Converts a USD amount to IQD based on the platform exchange rate.
 * Rounds to the nearest 250 IQD (standard cash denomination in Iraq).
 */
export function convertUsdToIqd(usdAmount: number, rate: number): number {
  const iqd = usdAmount * rate;
  return Math.round(iqd);
}

/**
 * Formats a currency value cleanly
 */
export function formatCurrency(amount: number, currency: 'USD' | 'IQD' = 'USD'): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  }
  return `${amount.toLocaleString('en-US')} د.ع`;
}

/**
 * Formats SMM service prices cleanly matching provider standard (e.g. 1.750, 1.500, 0.250):
 * - Rates >= 1: 3 decimal places (e.g. 1.750, 1.500)
 * - Rates >= 0.01: 3 decimal places (e.g. 0.250, 0.084)
 * - Micro rates < 0.01: 4 decimal places (e.g. 0.0050, 0.0005)
 */
export function formatSmmPrice(price: number): string {
  if (price === 0 || isNaN(price)) return '0.000';
  if (price >= 1) {
    return price.toFixed(3);
  }
  if (price >= 0.01) {
    return price.toFixed(3);
  }
  return price.toFixed(4);
}

/**
 * Formats user and provider balance like SMM panels: 3 decimal places (e.g. 10.500, 0.000, 1.750)
 */
export function formatSmmBalance(balance: number): string {
  if (isNaN(balance)) return '0.000';
  return balance.toFixed(3);
}

