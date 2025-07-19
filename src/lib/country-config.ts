/**
 * 🌎 Country Configuration
 * SuperClaude Optimized for Multi-Country Support
 * 
 * Features:
 * - Country-specific settings
 * - Tax calculations
 * - Currency formatting
 * - Regulatory requirements
 */

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: {
    code: string;
    symbol: string;
    decimals: number;
    thousandSeparator: string;
    decimalSeparator: string;
  };
  taxId: {
    name: string;
    format: string;
    regex: RegExp;
    placeholder: string;
    validationFn: (taxId: string) => boolean;
  };
  cities: string[];
  ports: string[];
  taxes: {
    vat: number;
    importDuty: number; // Average
    withholding?: number;
  };
  customs: {
    agency: string;
    website: string;
    avgProcessingDays: number;
  };
  holidays: Array<{
    date: string;
    name: string;
  }>;
  business: {
    workingDays: string[];
    businessHours: string;
    dateFormat: string;
    phoneFormat: string;
  };
}

// Colombian configuration
export const COLOMBIA_CONFIG: CountryConfig = {
  code: 'CO',
  name: 'Colombia',
  flag: '🇨🇴',
  currency: {
    code: 'COP',
    symbol: '$',
    decimals: 0,
    thousandSeparator: '.',
    decimalSeparator: ',',
  },
  taxId: {
    name: 'NIT',
    format: '999.999.999-9',
    regex: /^\d{9}-\d{1}$/,
    placeholder: '900.123.456-7',
    validationFn: (nit: string) => {
      const cleaned = nit.replace(/[^0-9]/g, '');
      if (cleaned.length !== 10) return false;
      
      const digits = cleaned.slice(0, 9).split('').map(Number);
      const checkDigit = Number(cleaned[9]);
      
      const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41];
      const sum = digits.reduce((acc, digit, i) => acc + digit * weights[i], 0);
      const calculatedCheck = (11 - (sum % 11)) % 11;
      
      return calculatedCheck === checkDigit;
    },
  },
  cities: [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
    'Bucaramanga', 'Pereira', 'Manizales', 'Santa Marta', 'Villavicencio',
  ],
  ports: ['Buenaventura', 'Cartagena', 'Barranquilla', 'Santa Marta'],
  taxes: {
    vat: 19,
    importDuty: 15, // Average
    withholding: 3.5,
  },
  customs: {
    agency: 'DIAN',
    website: 'https://www.dian.gov.co',
    avgProcessingDays: 5,
  },
  holidays: [
    { date: '2024-01-01', name: 'Año Nuevo' },
    { date: '2024-03-25', name: 'Día de San José' },
    { date: '2024-05-01', name: 'Día del Trabajo' },
    { date: '2024-07-20', name: 'Día de la Independencia' },
    { date: '2024-08-07', name: 'Batalla de Boyacá' },
    { date: '2024-12-25', name: 'Navidad' },
  ],
  business: {
    workingDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    businessHours: '8:00 AM - 6:00 PM',
    dateFormat: 'DD/MM/YYYY',
    phoneFormat: '+57 3XX XXX XXXX',
  },
};

// Mexican configuration
export const MEXICO_CONFIG: CountryConfig = {
  code: 'MX',
  name: 'México',
  flag: '🇲🇽',
  currency: {
    code: 'MXN',
    symbol: '$',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  taxId: {
    name: 'RFC',
    format: 'AAA999999XXX',
    regex: /^[A-Z]{3,4}\d{6}[A-Z0-9]{3}$/,
    placeholder: 'ABC123456789',
    validationFn: (rfc: string) => {
      const cleaned = rfc.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Basic RFC validation
      if (cleaned.length === 12) {
        // Persona moral (company)
        return /^[A-Z]{3}\d{6}[A-Z0-9]{3}$/.test(cleaned);
      } else if (cleaned.length === 13) {
        // Persona física (individual)
        return /^[A-Z]{4}\d{6}[A-Z0-9]{3}$/.test(cleaned);
      }
      
      return false;
    },
  },
  cities: [
    'Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana',
    'León', 'Juárez', 'Zapopan', 'Mérida', 'Querétaro',
  ],
  ports: ['Veracruz', 'Manzanillo', 'Lázaro Cárdenas', 'Altamira', 'Ensenada'],
  taxes: {
    vat: 16,
    importDuty: 20, // Average
  },
  customs: {
    agency: 'SAT',
    website: 'https://www.sat.gob.mx',
    avgProcessingDays: 3,
  },
  holidays: [
    { date: '2024-01-01', name: 'Año Nuevo' },
    { date: '2024-02-05', name: 'Día de la Constitución' },
    { date: '2024-03-18', name: 'Natalicio de Benito Juárez' },
    { date: '2024-05-01', name: 'Día del Trabajo' },
    { date: '2024-09-16', name: 'Día de la Independencia' },
    { date: '2024-11-18', name: 'Revolución Mexicana' },
    { date: '2024-12-25', name: 'Navidad' },
  ],
  business: {
    workingDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    businessHours: '9:00 AM - 6:00 PM',
    dateFormat: 'DD/MM/YYYY',
    phoneFormat: '+52 XX XXXX XXXX',
  },
};

// Country map
export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  CO: COLOMBIA_CONFIG,
  MX: MEXICO_CONFIG,
};

// Get country config
export function getCountryConfig(countryCode: string): CountryConfig {
  return COUNTRY_CONFIGS[countryCode] || COLOMBIA_CONFIG;
}

// Format currency by country
export function formatCountryCurrency(
  amount: number,
  countryCode: string
): string {
  const config = getCountryConfig(countryCode);
  
  const formatter = new Intl.NumberFormat(
    countryCode === 'CO' ? 'es-CO' : 'es-MX',
    {
      style: 'currency',
      currency: config.currency.code,
      minimumFractionDigits: config.currency.decimals,
      maximumFractionDigits: config.currency.decimals,
    }
  );
  
  return formatter.format(amount);
}

// Validate tax ID by country
export function validateTaxId(taxId: string, countryCode: string): boolean {
  const config = getCountryConfig(countryCode);
  return config.taxId.validationFn(taxId);
}

// Format tax ID by country
export function formatTaxId(taxId: string, countryCode: string): string {
  const cleaned = taxId.replace(/[^A-Z0-9]/gi, '');
  
  if (countryCode === 'CO' && cleaned.length === 10) {
    // Format NIT as 999.999.999-9
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
  } else if (countryCode === 'MX') {
    // RFC is already in correct format when cleaned
    return cleaned.toUpperCase();
  }
  
  return taxId;
}

// Get business hours message
export function getBusinessHoursMessage(countryCode: string): string {
  const config = getCountryConfig(countryCode);
  const days = config.business.workingDays.join(' a ');
  
  return `Horario de atención: ${days}, ${config.business.businessHours}`;
}

// Calculate import costs by country
export function calculateImportCosts(
  fobValue: number,
  countryCode: string,
  options: {
    freight?: number;
    insurance?: number;
    customsAgentFee?: number;
  } = {}
): {
  subtotal: number;
  vat: number;
  importDuty: number;
  total: number;
  importFactor: number;
} {
  const config = getCountryConfig(countryCode);
  
  // Base costs
  const freight = options.freight || fobValue * 0.12;
  const insurance = options.insurance || fobValue * 0.015;
  const customsAgentFee = options.customsAgentFee || 500; // USD
  
  // Calculate duties and taxes
  const cif = fobValue + freight + insurance;
  const importDuty = cif * (config.taxes.importDuty / 100);
  const dutiableValue = cif + importDuty;
  const vat = dutiableValue * (config.taxes.vat / 100);
  
  // Total costs
  const subtotal = fobValue + freight + insurance + customsAgentFee;
  const total = subtotal + importDuty + vat;
  const importFactor = total / fobValue;
  
  return {
    subtotal,
    vat,
    importDuty,
    total,
    importFactor,
  };
}

// Get exchange rate message
export function getExchangeRateMessage(
  countryCode: string,
  rate: number
): string {
  const config = getCountryConfig(countryCode);
  
  if (countryCode === 'CO') {
    return `TRM: ${formatCountryCurrency(rate, 'CO')} por USD`;
  } else if (countryCode === 'MX') {
    return `Tipo de cambio: ${rate.toFixed(2)} MXN por USD`;
  }
  
  return `Exchange rate: ${rate}`;
}