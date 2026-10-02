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
