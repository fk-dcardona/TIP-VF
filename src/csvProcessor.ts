import Papa from 'papaparse';
import type { CSVValidationResult } from '@/types';

// Legacy inventory data interface for CSV processing
interface LegacyInventoryData {
  k_sc_codigo_articulo: string;
  sc_detalle_articulo: string;
  sc_detalle_grupo: string;
  sc_detalle_subgrupo: string;
  period: string;
  n_saldo_anterior: number;
  n_entradas: number;
  n_salidas: number;
  n_saldo_actual: number;
  n_costo_promedio: number;
  n_ultimo_costo: number;
  sc_tipo_unidad: string;
}

// Legacy sales data interface for CSV processing
interface LegacySalesData {
  k_sc_codigo_fuente: string;
  n_numero_documento: number;
  ka_nl_movimiento: string;
  d_fecha_documento: string;
  sc_nombre: string;
  n_nit: number;
  sc_telefono_ppal: string;
  sc_telefono_alterno: string;
  sc_nombre_fuente: string;
  MARCA: string;
  k_sc_codigo_articulo: string;
  sc_detalle_articulo: string;
  n_cantidad: number;
  n_valor: number;
  v_bruta: number;
  'V. BRUTA': number;
  n_iva: number;
  n_descuento: number;
  DESCUENTO: number;
  v_neta: number;
  'V. NETA': number;
  sc_detalle_grupo: string;
  sc_signo_inventario: string;
  zona: string;
  ka_nl_tercero: string;
  nombre_vendedor: string;
}

const INVENTORY_REQUIRED_COLUMNS = [
  'k_sc_codigo_articulo',
  'sc_detalle_articulo',
  'sc_detalle_grupo',
  'n_saldo_actual',
  'n_costo_promedio'
];

const SALES_REQUIRED_COLUMNS = [
  'k_sc_codigo_articulo',
  'sc_detalle_articulo',
  'd_fecha_documento',
  'n_cantidad',
  'n_valor'
];

// Column aliases/mappings for flexibility
const SALES_COLUMN_ALIASES: Record<string, string[]> = {
  'n_cantidad': ['n_cantidad', 'CANTIDAD', 'cantidad', 'Cantidad'],
  'n_valor': ['n_valor', 'VALOR', 'valor', 'Valor'],
  'k_sc_codigo_articulo': ['k_sc_codigo_articulo', 'codigo_articulo', 'producto_codigo'],
  'sc_detalle_articulo': ['sc_detalle_articulo', 'detalle_articulo', 'producto_nombre'],
  'd_fecha_documento': ['d_fecha_documento', 'fecha_documento', 'fecha']
};

// Utility to normalize header keys
function normalizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

// Sales header mapping
const salesHeaderMap: Record<string, string> = {
  k_sc_codigo_fuente: 'k_sc_codigo_fuente',
  n_numero_documento: 'n_numero_documento',
  ka_nl_movimiento: 'ka_nl_movimiento',
  d_fecha_documento: 'd_fecha_documento',
  sc_nombre: 'sc_nombre',
  n_nit: 'n_nit',
  sc_telefono_ppal: 'sc_telefono_ppal',
  sc_telefono_alterno: 'sc_telefono_alterno',
  sc_nombre_fuente: 'sc_nombre_fuente',
  marca: 'marca',
  k_sc_codigo_articulo: 'k_sc_codigo_articulo',
  sc_detalle_articulo: 'sc_detalle_articulo',
  cantidad: 'n_cantidad',
  valor: 'n_valor',
  valorbruto: 'v_bruta',
  n_iva: 'n_iva',
  n_descuento: 'n_descuento',
  descuento: 'descuento',
  // Robust revenue field mapping
  v_neta: 'v_neta',
  vneto: 'v_neta',
  vnetaneta: 'v_neta',
  'v.neta': 'v_neta',
  'v neta': 'v_neta',
  'v. neta': 'v_neta',
  'V_NETA': 'v_neta',
  'V. NETA': 'v_neta',
  'V NETA': 'v_neta',
  sc_detalle_grupo: 'sc_detalle_grupo',
  sc_signo_inventario: 'sc_signo_inventario',
  sc_direccion: 'sc_direccion',
  zona: 'zona',
  ciudad: 'ciudad',
  ka_nl_tercero: 'ka_nl_tercero',
  nombre_vendedor: 'nombre_vendedor',
  clase: 'clase',
};

// Inventory header mapping for new structure
const inventoryHeaderMap: Record<string, string> = {
  k_sc_codigo_articulo: 'k_sc_codigo_articulo',
  sc_detalle_articulo: 'sc_detalle_articulo',
  sc_detalle_grupo: 'sc_detalle_grupo',
  sc_detalle_subgrupo: 'sc_detalle_subgrupo',
  period: 'period',
  n_saldo_anterior: 'n_saldo_anterior',
  n_entradas: 'n_entradas',
  n_salidas: 'n_salidas',
  n_saldo_actual: 'n_saldo_actual',
  n_costo_promedio: 'n_costo_promedio',
  n_ultimo_costo: 'n_ultimo_costo',
  sc_tipo_unidad: 'sc_tipo_unidad',
};

// Main mapping function for headers only
export function mapCsvHeaders(headers: string[], type: 'sales' | 'inventory'): string[] {
  const map = type === 'sales' ? salesHeaderMap : inventoryHeaderMap;
  const normalizedMap: Record<string, string> = {};
  Object.keys(map).forEach(key => {
    normalizedMap[normalizeKey(key)] = map[key];
  });

  const mapped: string[] = [];
  const warnings: string[] = [];

  headers.forEach(header => {
    const norm = normalizeKey(header);
    if (normalizedMap[norm]) {
      mapped.push(normalizedMap[norm]);
    } else {
      mapped.push(header); // fallback to original
      warnings.push(`Unmapped header: '${header}'`);
    }
  });

  if (warnings.length) {
    console.warn('CSV Header Mapping Warnings:', warnings);
  }

  return mapped;
}

export const validateInventoryCSV = (data: Record<string, unknown>[]): CSVValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('Validating inventory CSV with', data.length, 'rows');
  
  if (!data || data.length === 0) {
    return {
      isValid: false,
      errors: ['CSV file is empty'],
      warnings: [],
      rowCount: 0,
      columnCount: 0,
      preview: []
    };
  }

  // Safety check: ensure first row exists and is an object
  if (!data[0] || typeof data[0] !== 'object') {
    return {
      isValid: false,
      errors: ['CSV file format is invalid - no readable data found'],
      warnings: [],
      rowCount: data.length,
      columnCount: 0,
      preview: []
    };
  }

  // Debug: Log the first row to see what headers we actually have
  console.log('CSV Headers found:', Object.keys(data[0]));
  console.log('Required headers:', INVENTORY_REQUIRED_COLUMNS);

  const headers = Object.keys(data[0]).map(h => String(h).trim());
  const missingColumns = INVENTORY_REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  if (!headers.includes('period')) {
    missingColumns.push('period');
  }

  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  // numeric validator now delegates to locale parser
  const cleanNumericValue = (value: unknown): { isValid: boolean; cleanValue: number } => {
    const num = parseLocaleNumber(value);
    return { isValid: true, cleanValue: num };
  };

  // Validate data types (sample first 100 rows for performance)
  const sampleSize = Math.min(100, data.length);
  let errorCount = 0;
  const maxErrors = 50; // Limit error messages to prevent overwhelming UI

  data.slice(0, sampleSize).forEach((row, index) => {
    if (errorCount >= maxErrors) return;
    
    if (row.k_sc_codigo_articulo && typeof row.k_sc_codigo_articulo !== 'string') {
      warnings.push(`Row ${index + 1}: Product code should be text`);
    }
    
    if (row.n_saldo_actual) {
      const { isValid } = cleanNumericValue(row.n_saldo_actual);
      if (!isValid) {
        errors.push(`Row ${index + 1}: Current stock must be a number (found: "${row.n_saldo_actual}")`);
        errorCount++;
      }
    }
    
    if (row.n_costo_promedio) {
      const { isValid } = cleanNumericValue(row.n_costo_promedio);
      if (!isValid) {
        errors.push(`Row ${index + 1}: Average cost must be a number (found: "${row.n_costo_promedio}")`);
        errorCount++;
      }
    }

    // Period validation
    if (!row.period || !toISODate(row.period)) {
      errors.push(`Row ${index + 1}: Invalid or missing period date (found: "${row.period}")`);
      errorCount++;
    }
  });

  // If we found errors in sample, check if there are more in the full dataset
  if (errorCount >= maxErrors && data.length > sampleSize) {
    errors.push(`... Additional validation errors may exist in remaining ${data.length - sampleSize} rows`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    rowCount: data.length,
    columnCount: headers.length,
    preview: data.slice(0, 5)
  };
};

export const validateSalesCSV = (data: Record<string, unknown>[]): CSVValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('Validating sales CSV with', data.length, 'rows');

  if (!data || data.length === 0) {
    return {
      isValid: false,
      errors: ['CSV file is empty'],
      warnings: [],
      rowCount: 0,
      columnCount: 0,
      preview: []
    };
  }

  // Safety check: ensure first row exists and is an object
  if (!data[0] || typeof data[0] !== 'object') {
    return {
      isValid: false,
      errors: ['CSV file format is invalid - no readable data found'],
      warnings: [],
      rowCount: data.length,
      columnCount: 0,
      preview: []
    };
  }

  // Debug: Log the headers we found vs what we need
  console.log('Sales CSV Headers found:', Object.keys(data[0]));
  console.log('Required headers for sales:', SALES_REQUIRED_COLUMNS);

  const headers = Object.keys(data[0]).map(h => String(h).trim());
  
  // Create a mapping of required columns to actual columns found
  const columnMapping: { [key: string]: string | null } = {};
  const missingColumns: string[] = [];
  
  SALES_REQUIRED_COLUMNS.forEach(requiredCol => {
    const aliases = SALES_COLUMN_ALIASES[requiredCol] || [requiredCol];
    const foundColumn = aliases.find((alias: string) => headers.includes(alias));
    
    if (foundColumn) {
      columnMapping[requiredCol] = foundColumn;
      console.log(`✅ Mapped '${requiredCol}' to '${foundColumn}'`);
    } else {
      columnMapping[requiredCol] = null;
      missingColumns.push(requiredCol);
      console.log(`❌ Could not find column for '${requiredCol}'. Tried: ${aliases.join(', ')}`);
    }
  });

  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  // Use shared numeric parser
  const parseNumericValue = parseLocaleNumber;
  const isValidNumber = (val: unknown): boolean => !isNaN(parseLocaleNumber(val));

  // Helper function to get revenue value robustly
  const getRevenue = (row: Record<string, unknown>): number => {
    return (
      parseNumericValue(row['v_neta']) ||
      parseNumericValue(row['V_NETA']) ||
      parseNumericValue(row['V. NETA']) ||
      parseNumericValue(row['V NETA']) ||
      parseNumericValue(row['v.neta']) ||
      0
    );
  };

  // Helper function to get value from row using column aliases
  const getColumnValue = (row: Record<string, unknown>, columnKey: string): unknown => {
    const aliases = SALES_COLUMN_ALIASES[columnKey] || [columnKey];
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(row, alias)) {
        return row[alias];
      }
    }
    return '';
  };

  // Validate data types and date format (sample first 100 rows for performance)
  const sampleSize = Math.min(100, data.length);
  let errorCount = 0;
  const maxErrors = 50; // Limit error messages to prevent overwhelming UI

  data.slice(0, sampleSize).forEach((row, index) => {
    if (errorCount >= maxErrors) return;
    
    // Use mapped column names for validation
    const fechaCol = columnMapping['d_fecha_documento'];
    const cantidadCol = columnMapping['n_cantidad'];
    const valorCol = columnMapping['n_valor'];
    
    if (fechaCol && row[fechaCol]) {
      const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
      const dateValue = String(row[fechaCol]).trim();
      if (!datePattern.test(dateValue)) {
        warnings.push(`Row ${index + 1}: Date format should be M/D/YYYY (found: "${dateValue}")`);
      }
    }
    
    if (cantidadCol && row[cantidadCol] && !isValidNumber(row[cantidadCol])) {
      errors.push(`Row ${index + 1}: Quantity must be a number (found: "${row[cantidadCol]}")`);
      errorCount++;
    }
    
    if (valorCol && row[valorCol] && !isValidNumber(row[valorCol])) {
      errors.push(`Row ${index + 1}: Value must be a number (found: "${row[valorCol]}")`);
      errorCount++;
    }
  });

  // If we found errors in sample, check if there are more in the full dataset
  if (errorCount >= maxErrors && data.length > sampleSize) {
    errors.push(`... Additional validation errors may exist in remaining ${data.length - sampleSize} rows`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    rowCount: data.length,
    columnCount: headers.length,
    preview: data.slice(0, 5)
  };
};

export const processInventoryData = (rawData: Record<string, unknown>[]): LegacyInventoryData[] => {
  // Use new helpers
  const parseNumericValue = parseLocaleNumber;

  const parsePeriod = (value: unknown): string => {
    if (!value) {
      // Default to current month end if no period provided
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return endOfMonth.toISOString().split('T')[0];
    }

    const str = String(value).trim();
    if (!str) {
      // Default to current month end if empty
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return endOfMonth.toISOString().split('T')[0];
    }

    try {
      // Handle M/D/YYYY format (common in CSV files)
      if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0]) - 1; // Month is 0-indexed
          const day = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          
          // Always use end of month for consistency
          const endOfMonth = new Date(year, month + 1, 0);
          return endOfMonth.toISOString().split('T')[0];
        }
      }
      
      // Handle YYYY-MM-DD format or other ISO formats
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        // Convert to end of the month for consistency
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return endOfMonth.toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('Failed to parse period:', str, error);
    }

    // If all parsing fails, generate a period based on current date
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return endOfMonth.toISOString().split('T')[0];
  };

  // Deduplicate by (k_sc_codigo_articulo, period)
  const seen = new Set<string>();
  const deduped: LegacyInventoryData[] = [];

  for (const row of rawData) {
    const productCode = String(row.k_sc_codigo_articulo || '').trim();
    const period = parsePeriod(row.period);
    const key = `${productCode}__${period}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      k_sc_codigo_articulo: productCode,
      sc_detalle_articulo: String(row.sc_detalle_articulo || '').trim(),
      sc_detalle_grupo: String(row.sc_detalle_grupo || '').trim(),
      sc_detalle_subgrupo: String(row.sc_detalle_subgrupo || '').trim(),
      period,
      n_saldo_anterior: parseNumericValue(row.n_saldo_anterior),
      n_entradas: parseNumericValue(row.n_entradas),
      n_salidas: parseNumericValue(row.n_salidas),
      n_saldo_actual: parseNumericValue(row.n_saldo_actual),
      n_costo_promedio: parseNumericValue(row.n_costo_promedio),
      n_ultimo_costo: parseNumericValue(row.n_ultimo_costo),
      sc_tipo_unidad: String(row.sc_tipo_unidad || 'UNIDAD').trim()
    });
  }

  return deduped;
};

export const processSalesData = (rawData: Record<string, unknown>[]): LegacySalesData[] => {
  // Use shared numeric parser
  const parseNumericValue = parseLocaleNumber;

  // Helper function to get revenue value robustly
  const getRevenue = (row: Record<string, unknown>): number => {
    return (
      parseNumericValue(row['v_neta']) ||
      parseNumericValue(row['V_NETA']) ||
      parseNumericValue(row['V. NETA']) ||
      parseNumericValue(row['V NETA']) ||
      parseNumericValue(row['v.neta']) ||
      0
    );
  };

  // Helper function to get value from row using column aliases
  const getColumnValue = (row: Record<string, unknown>, columnKey: string): unknown => {
    const aliases = SALES_COLUMN_ALIASES[columnKey] || [columnKey];
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(row, alias)) {
        return row[alias];
      }
    }
    return '';
  };

  return rawData.map(row => {
    const revenue = getRevenue(row);
    const gross = parseNumericValue(row['v_bruta']) || parseNumericValue(row['V_BRUTA']) || parseNumericValue(row['V. BRUTA']) || parseNumericValue(row['V BRUTA']) || parseNumericValue(row['v.bruta']) || 0;
    return {
      k_sc_codigo_fuente: String(row.k_sc_codigo_fuente || '').trim(),
      n_numero_documento: parseNumericValue(row.n_numero_documento),
      ka_nl_movimiento: String(row.ka_nl_movimiento || '').trim(),
      d_fecha_documento: String(getColumnValue(row, 'd_fecha_documento') || '').trim(),
      sc_nombre: String(row.sc_nombre || '').trim(),
      n_nit: parseNumericValue(row.n_nit),
      sc_telefono_ppal: String(row.sc_telefono_ppal || '').trim(),
      sc_telefono_alterno: String(row.sc_telefono_alterno || '').trim(),
      sc_nombre_fuente: String(row.sc_nombre_fuente || '').trim(),
      MARCA: String(row.MARCA || '').trim(),
      k_sc_codigo_articulo: String(getColumnValue(row, 'k_sc_codigo_articulo') || '').trim(),
      sc_detalle_articulo: String(getColumnValue(row, 'sc_detalle_articulo') || '').trim(),
      n_cantidad: parseNumericValue(getColumnValue(row, 'n_cantidad')),
      n_valor: parseNumericValue(getColumnValue(row, 'n_valor')),
      v_bruta: gross,
      'V. BRUTA': gross,
      n_iva: parseNumericValue(row.n_iva),
      n_descuento: parseNumericValue(row.n_descuento),
      DESCUENTO: parseNumericValue(row.DESCUENTO),
      v_neta: revenue,
      'V. NETA': revenue,
      sc_detalle_grupo: String(row.sc_detalle_grupo || '').trim(),
      sc_signo_inventario: String(row.sc_signo_inventario || '').trim(),
      zona: String(row.zona || '').trim(),
      ka_nl_tercero: String(row.ka_nl_tercero || '').trim(),
      nombre_vendedor: String(row.nombre_vendedor || '').trim()
    };
  });
};

export const parseCSVFile = (file: File): Promise<Record<string, unknown>[]> => {
  return new Promise((resolve, reject) => {
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => String(header || '').trim(),
        complete: (results) => {
          try {
            if (results.errors.length > 0) {
              const errorMessage = results.errors[0].message || 'Unknown parsing error';
              console.error('CSV parsing error:', errorMessage);
              reject(new Error(`CSV parsing failed: ${errorMessage}`));
            } else if (!results.data || !Array.isArray(results.data)) {
              reject(new Error('CSV parsing failed: No valid data found'));
            } else {
              console.log('CSV parsing successful, rows:', results.data.length);
              resolve(results.data as Record<string, unknown>[]);
            }
          } catch (error) {
            console.error('Error processing CSV results:', error);
            reject(new Error('Failed to process CSV data'));
          }
        },
        error: (error) => {
          console.error('Papa Parse error:', error);
          reject(new Error(`CSV parsing error: ${error.message || 'Unknown error'}`));
        }
      });
    } catch (error) {
      console.error('Error initiating CSV parse:', error);
      reject(new Error('Failed to start CSV parsing'));
    }
  });
};

export const generateCSVFromData = (data: Record<string, unknown>[], filename: string): void => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getDataFormattingGuidance = (): { title: string; suggestions: string[] } => {
  return {
    title: "Data Formatting Tips",
    suggestions: [
      "Numeric columns should contain only numbers (e.g., 123.45, not $123.45 or 123,45)",
      "Remove currency symbols ($, €, etc.) and use plain numbers",
      "Use commas only as thousand separators (1,234.56) or remove them entirely",
      "For negative numbers, use minus sign (-123) or parentheses (123)",
      "Empty cells will be treated as zero for numeric columns", 
      "Dates should be in M/D/YYYY format (e.g., 1/15/2024 or 12/31/2024)",
      "Text fields can contain any characters and will be automatically trimmed",
      "Ensure your CSV file uses UTF-8 encoding for special characters"
    ]
  };
};

export const getSampleDataFormat = (): { inventory: Record<string, unknown>; sales: Record<string, unknown> } => {
  return {
    inventory: {
      k_sc_codigo_articulo: "PROD001",
      sc_detalle_articulo: "Sample Product Name",
      sc_detalle_grupo: "Electronics",
      n_saldo_actual: "150",
      n_costo_promedio: "25.50"
    },
    sales: {
      k_sc_codigo_articulo: "PROD001", 
      d_fecha_documento: "1/15/2024",
      n_cantidad: "5",
      n_valor: "127.50"
    }
  };
};

// Helper: robust locale-aware numeric parsing (supports "1.234,56" or "1,234.56")
const parseLocaleNumber = (raw: unknown): number => {
  if (raw === null || raw === undefined || raw === '') return 0;
  let str = String(raw).trim();

  // Remove currency symbols and spaces
  str = str.replace(/[$€£¥₱\s]/g, '');

  // Decide decimal delimiter if both present
  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    // Determine which symbol is decimal by its last appearance
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // European format: '.' thousands, ',' decimal
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: ',' thousands, '.' decimal
      str = str.replace(/,/g, '');
    }
  } else if (hasComma && !hasDot) {
    // Assume comma is decimal
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    // Only dots or none – remove thousand commas if any
    str = str.replace(/,/g, '');
  }

  const num = Number(str);
  return isNaN(num) ? 0 : num;
};

// Helper: canonicalise date to ISO (YYYY-MM-DD). Returns null if invalid.
const toISODate = (value: unknown): string | null => {
  if (!value) return null;
  const raw = String(value).trim();

  // If CSV uses M/D/YYYY, convert
  const mdYMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdYMatch) {
    const [_, m, d, y] = mdYMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  }

  // Attempt direct Date parse (supports ISO already)
  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
};