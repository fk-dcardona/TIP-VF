/**
 * 💰 Currency Utilities
 * SuperClaude Optimized for Colombian Market
 * 
 * Features:
 * - COP formatting (no decimals)
 * - USD formatting (2 decimals)
 * - Exchange rate conversion
 * - Locale-aware formatting
 */

// Colombian peso formatter
export function formatCOP(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return 'COP 0';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return 'COP 0';
  
  // Format with Colombian locale (uses . for thousands separator)
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

// US dollar formatter
export function formatUSD(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return 'USD 0.00';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return 'USD 0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

// Generic currency formatter
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale?: string
): string {
  const currencyConfig: Record<string, { locale: string; decimals: number }> = {
    COP: { locale: 'es-CO', decimals: 0 },
    USD: { locale: 'en-US', decimals: 2 },
    EUR: { locale: 'de-DE', decimals: 2 },
    CNY: { locale: 'zh-CN', decimals: 2 },
    MXN: { locale: 'es-MX', decimals: 2 },
  };
  
  const config = currencyConfig[currency] || { locale: 'en-US', decimals: 2 };
  
  return new Intl.NumberFormat(locale || config.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
}

// Convert between currencies
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // If converting from USD to another currency
  if (fromCurrency === 'USD') {
    return amount * exchangeRate;
  }
  
  // If converting to USD from another currency
  if (toCurrency === 'USD') {
    return amount / exchangeRate;
  }
  
  // For other conversions, would need cross rates
  throw new Error(`Direct conversion from ${fromCurrency} to ${toCurrency} not supported`);
}

// Parse currency string to number
export function parseCurrencyString(currencyString: string): number {
  // Remove currency symbols and separators
  const cleanString = currencyString
    .replace(/[^0-9,.-]/g, '')
    .replace(/\./g, '') // Remove thousand separators
    .replace(',', '.'); // Convert decimal comma to dot
  
  return parseFloat(cleanString) || 0;
}

// Format percentage
export function formatPercentage(
  value: number,
  decimals: number = 1,
  includeSign: boolean = true
): string {
  const formatted = value.toFixed(decimals);
  return includeSign ? `${formatted}%` : formatted;
}

// Format import factor
export function formatImportFactor(factor: number): string {
  return `${factor.toFixed(2)}x`;
}

// Calculate import factor
export function calculateImportFactor(
  totalCost: number,
  fobValue: number
): number {
  if (fobValue === 0) return 1;
  return totalCost / fobValue;
}

// Format large numbers with abbreviations
export function formatCompactNumber(
  value: number,
  locale: string = 'es-CO'
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}

// Exchange rate helpers
export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: Date;
  source: string;
}

export function formatExchangeRate(rate: ExchangeRate): string {
  return `1 ${rate.fromCurrency} = ${formatCurrency(rate.rate, rate.toCurrency)}`;
}

// Colombian specific utilities
export function formatNIT(nit: string): string {
  // Format NIT as 999.999.999-9
  const cleaned = nit.replace(/[^0-9]/g, '');
  if (cleaned.length !== 10) return nit;
  
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
}

export function validateNIT(nit: string): boolean {
  const cleaned = nit.replace(/[^0-9]/g, '');
  if (cleaned.length !== 10) return false;
  
  // Implement NIT validation algorithm
  const digits = cleaned.slice(0, 9).split('').map(Number);
  const checkDigit = Number(cleaned[9]);
  
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41];
  const sum = digits.reduce((acc, digit, i) => acc + digit * weights[i], 0);
  const calculatedCheck = (11 - (sum % 11)) % 11;
  
  return calculatedCheck === checkDigit;
}

// TRM (Tasa Representativa del Mercado) helpers
export interface TRM {
  value: number;
  date: Date;
  variation: number;
  previousValue: number;
}

export function formatTRM(trm: TRM): string {
  const variation = trm.variation > 0 ? '+' : '';
  return `${formatCOP(trm.value)} (${variation}${formatPercentage(trm.variation)})`;
}

// Import cost breakdown helpers
export interface ImportCosts {
  fob: number;
  freight: number;
  insurance: number;
  customs: number;
  localFreight: number;
  otherCosts: number;
}

export function calculateTotalCost(costs: ImportCosts): number {
  return Object.values(costs).reduce((sum, cost) => sum + cost, 0);
}

export function calculateCostBreakdown(costs: ImportCosts): Array<{
  category: string;
  amount: number;
  percentage: number;
}> {
  const total = calculateTotalCost(costs);
  
  return [
    { category: 'FOB', amount: costs.fob, percentage: (costs.fob / total) * 100 },
    { category: 'Flete Internacional', amount: costs.freight, percentage: (costs.freight / total) * 100 },
    { category: 'Seguro', amount: costs.insurance, percentage: (costs.insurance / total) * 100 },
    { category: 'Nacionalización', amount: costs.customs, percentage: (costs.customs / total) * 100 },
    { category: 'Transporte Local', amount: costs.localFreight, percentage: (costs.localFreight / total) * 100 },
    { category: 'Otros', amount: costs.otherCosts, percentage: (costs.otherCosts / total) * 100 },
  ].filter(item => item.amount > 0);
}