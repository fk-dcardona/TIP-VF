import type { DataProcessor, ValidationResult } from '../types';
import type { 
  InventoryRecord, 
  SalesRecord, 
  SupplyChainValidationResult 
} from './types';

/**
 * Inventory Data Processor - Implements SOLID principles
 * Single Responsibility: Process and validate inventory data only
 * Open/Closed: Extensible through configuration
 * Liskov Substitution: Follows DataProcessor interface
 * Interface Segregation: Focused on inventory processing
 * Dependency Inversion: Depends on abstractions
 */
export class InventoryDataProcessor implements DataProcessor<InventoryRecord> {
  private requiredFields: (keyof InventoryRecord)[] = [
    'k_sc_codigo_articulo',
    'sc_detalle_articulo',
    'sc_detalle_grupo',
    'n_saldo_actual',
    'n_costo_promedio'
  ];

  private schema: Record<string, 'string' | 'number' | 'date'> = {
    k_sc_codigo_articulo: 'string',
    sc_detalle_articulo: 'string',
    sc_detalle_grupo: 'string',
    sc_detalle_subgrupo: 'string',
    period: 'date',
    n_saldo_anterior: 'number',
    n_entradas: 'number',
    n_salidas: 'number',
    n_saldo_actual: 'number',
    n_costo_promedio: 'number',
    n_ultimo_costo: 'number',
    sc_tipo_unidad: 'string'
  };

  process(data: unknown[]): InventoryRecord[] {
    return data.map((row: any, index) => {
      try {
        return {
          k_sc_codigo_articulo: String(row.k_sc_codigo_articulo || '').trim(),
          sc_detalle_articulo: String(row.sc_detalle_articulo || '').trim(),
          sc_detalle_grupo: String(row.sc_detalle_grupo || '').trim(),
          sc_detalle_subgrupo: String(row.sc_detalle_subgrupo || '').trim(),
          period: this.parsePeriod(row.period),
          n_saldo_anterior: this.parseNumber(row.n_saldo_anterior),
          n_entradas: this.parseNumber(row.n_entradas),
          n_salidas: this.parseNumber(row.n_salidas),
          n_saldo_actual: this.parseNumber(row.n_saldo_actual),
          n_costo_promedio: this.parseNumber(row.n_costo_promedio),
          n_ultimo_costo: this.parseNumber(row.n_ultimo_costo),
          sc_tipo_unidad: String(row.sc_tipo_unidad || 'UNIDAD').trim()
        };
      } catch (error) {
        console.error(`Error processing inventory row ${index}:`, error);
        throw new Error(`Failed to process inventory row ${index}: ${error}`);
      }
    });
  }

  validate(data: unknown[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

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

    // Check first row for headers
    const firstRow = data[0] as Record<string, unknown>;
    if (!firstRow || typeof firstRow !== 'object') {
      return {
        isValid: false,
        errors: ['CSV file format is invalid - no readable data found'],
        warnings: [],
        rowCount: data.length,
        columnCount: 0,
        preview: []
      };
    }

    const headers = Object.keys(firstRow).map(h => String(h).trim());
    
    // Check required fields
    const missingFields = this.requiredFields.filter(field => !headers.includes(field));
    if (missingFields.length > 0) {
      errors.push(`Missing required columns: ${missingFields.join(', ')}`);
    }

    // Validate data types (sample first 100 rows for performance)
    const sampleSize = Math.min(100, data.length);
    let errorCount = 0;
    const maxErrors = 50;

    data.slice(0, sampleSize).forEach((row: any, index) => {
      if (errorCount >= maxErrors) return;

      // Validate product code
      if (row.k_sc_codigo_articulo && typeof row.k_sc_codigo_articulo !== 'string') {
        warnings.push(`Row ${index + 1}: Product code should be text`);
      }

      // Validate numeric fields
      if (row.n_saldo_actual && isNaN(this.parseNumber(row.n_saldo_actual))) {
        errors.push(`Row ${index + 1}: Current stock must be a number (found: "${row.n_saldo_actual}")`);
        errorCount++;
      }

      if (row.n_costo_promedio && isNaN(this.parseNumber(row.n_costo_promedio))) {
        errors.push(`Row ${index + 1}: Average cost must be a number (found: "${row.n_costo_promedio}")`);
        errorCount++;
      }

      // Validate period
      if (!row.period || !this.parsePeriod(row.period)) {
        errors.push(`Row ${index + 1}: Invalid or missing period date (found: "${row.period}")`);
        errorCount++;
      }
    });

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
  }

  transform(data: InventoryRecord[]): unknown[] {
    // Remove duplicates by (k_sc_codigo_articulo, period)
    const seen = new Set<string>();
    const deduped: InventoryRecord[] = [];

    for (const record of data) {
      const key = `${record.k_sc_codigo_articulo}__${record.period}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(record);
      }
    }

    return deduped;
  }

  private parseNumber(value: unknown): number {
    if (value === null || value === undefined || value === '') return 0;
    let str = String(value).trim();

    // Remove currency symbols and spaces
    str = str.replace(/[$€£¥₱\s]/g, '');

    // Handle locale-specific number formats
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
  }

  private parsePeriod(value: unknown): string {
    if (!value) {
      // Default to current month end if no period provided
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return endOfMonth.toISOString().split('T')[0];
    }

    const str = String(value).trim();
    if (!str) {
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
  }
}

/**
 * Sales Data Processor - Implements SOLID principles
 * Single Responsibility: Process and validate sales data only
 * Open/Closed: Extensible through configuration
 * Liskov Substitution: Follows DataProcessor interface
 * Interface Segregation: Focused on sales processing
 * Dependency Inversion: Depends on abstractions
 */
export class SalesDataProcessor implements DataProcessor<SalesRecord> {
  private requiredFields: (keyof SalesRecord)[] = [
    'k_sc_codigo_articulo',
    'sc_detalle_articulo',
    'd_fecha_documento',
    'n_cantidad',
    'n_valor'
  ];

  private columnAliases: Record<string, string[]> = {
    'n_cantidad': ['n_cantidad', 'CANTIDAD', 'cantidad', 'Cantidad'],
    'n_valor': ['n_valor', 'VALOR', 'valor', 'Valor'],
    'k_sc_codigo_articulo': ['k_sc_codigo_articulo', 'codigo_articulo', 'producto_codigo'],
    'sc_detalle_articulo': ['sc_detalle_articulo', 'detalle_articulo', 'producto_nombre'],
    'd_fecha_documento': ['d_fecha_documento', 'fecha_documento', 'fecha']
  };

  process(data: unknown[]): SalesRecord[] {
    return data.map((row: any, index) => {
      try {
        const revenue = this.getRevenueValue(row);
        const gross = this.getGrossValue(row);

        return {
          k_sc_codigo_fuente: String(row.k_sc_codigo_fuente || '').trim(),
          n_numero_documento: this.parseNumber(row.n_numero_documento),
          ka_nl_movimiento: String(row.ka_nl_movimiento || '').trim(),
          d_fecha_documento: String(this.getColumnValue(row, 'd_fecha_documento') || '').trim(),
          sc_nombre: String(row.sc_nombre || '').trim(),
          n_nit: this.parseNumber(row.n_nit),
          sc_telefono_ppal: String(row.sc_telefono_ppal || '').trim(),
          sc_telefono_alterno: String(row.sc_telefono_alterno || '').trim(),
          sc_nombre_fuente: String(row.sc_nombre_fuente || '').trim(),
          marca: String(row.MARCA || '').trim(),
          k_sc_codigo_articulo: String(this.getColumnValue(row, 'k_sc_codigo_articulo') || '').trim(),
          sc_detalle_articulo: String(this.getColumnValue(row, 'sc_detalle_articulo') || '').trim(),
          n_cantidad: this.parseNumber(this.getColumnValue(row, 'n_cantidad')),
          n_valor: this.parseNumber(this.getColumnValue(row, 'n_valor')),
          v_bruta: gross,
          n_iva: this.parseNumber(row.n_iva),
          n_descuento: this.parseNumber(row.n_descuento),
          descuento: this.parseNumber(row.DESCUENTO),
          v_neta: revenue,
          sc_detalle_grupo: String(row.sc_detalle_grupo || '').trim(),
          sc_signo_inventario: String(row.sc_signo_inventario || '').trim(),
          zona: String(row.zona || '').trim(),
          ka_nl_tercero: String(row.ka_nl_tercero || '').trim(),
          nombre_vendedor: String(row.nombre_vendedor || '').trim()
        };
      } catch (error) {
        console.error(`Error processing sales row ${index}:`, error);
        throw new Error(`Failed to process sales row ${index}: ${error}`);
      }
    });
  }

  validate(data: unknown[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

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

    const firstRow = data[0] as Record<string, unknown>;
    if (!firstRow || typeof firstRow !== 'object') {
      return {
        isValid: false,
        errors: ['CSV file format is invalid - no readable data found'],
        warnings: [],
        rowCount: data.length,
        columnCount: 0,
        preview: []
      };
    }

    const headers = Object.keys(firstRow).map(h => String(h).trim());
    
    // Create mapping of required columns to actual columns found
    const columnMapping: { [key: string]: string | null } = {};
    const missingColumns: string[] = [];
    
    this.requiredFields.forEach(requiredCol => {
      const aliases = this.columnAliases[requiredCol] || [requiredCol];
      const foundColumn = aliases.find((alias: string) => headers.includes(alias));
      
      if (foundColumn) {
        columnMapping[requiredCol] = foundColumn;
      } else {
        columnMapping[requiredCol] = null;
        missingColumns.push(requiredCol);
      }
    });

    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Validate data types (sample first 100 rows for performance)
    const sampleSize = Math.min(100, data.length);
    let errorCount = 0;
    const maxErrors = 50;

    data.slice(0, sampleSize).forEach((row: any, index) => {
      if (errorCount >= maxErrors) return;

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
      
      if (cantidadCol && row[cantidadCol] && isNaN(this.parseNumber(row[cantidadCol]))) {
        errors.push(`Row ${index + 1}: Quantity must be a number (found: "${row[cantidadCol]}")`);
        errorCount++;
      }
      
      if (valorCol && row[valorCol] && isNaN(this.parseNumber(row[valorCol]))) {
        errors.push(`Row ${index + 1}: Value must be a number (found: "${row[valorCol]}")`);
        errorCount++;
      }
    });

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
  }

  transform(data: SalesRecord[]): unknown[] {
    // Remove any invalid records
    return data.filter(record => 
      record.k_sc_codigo_articulo && 
      record.d_fecha_documento && 
      record.n_cantidad > 0
    );
  }

  private getColumnValue(row: Record<string, unknown>, columnKey: string): unknown {
    const aliases = this.columnAliases[columnKey] || [columnKey];
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(row, alias)) {
        return row[alias];
      }
    }
    return '';
  }

  private getRevenueValue(row: Record<string, unknown>): number {
    return (
      this.parseNumber(row['v_neta']) ||
      this.parseNumber(row['V_NETA']) ||
      this.parseNumber(row['V. NETA']) ||
      this.parseNumber(row['V NETA']) ||
      this.parseNumber(row['v.neta']) ||
      0
    );
  }

  private getGrossValue(row: Record<string, unknown>): number {
    return (
      this.parseNumber(row['v_bruta']) ||
      this.parseNumber(row['V_BRUTA']) ||
      this.parseNumber(row['V. BRUTA']) ||
      this.parseNumber(row['V BRUTA']) ||
      this.parseNumber(row['v.bruta']) ||
      0
    );
  }

  private parseNumber(value: unknown): number {
    if (value === null || value === undefined || value === '') return 0;
    let str = String(value).trim();

    // Remove currency symbols and spaces
    str = str.replace(/[$€£¥₱\s]/g, '');

    // Handle locale-specific number formats
    const hasComma = str.includes(',');
    const hasDot = str.includes('.');

    if (hasComma && hasDot) {
      if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
        str = str.replace(/\./g, '').replace(',', '.');
      } else {
        str = str.replace(/,/g, '');
      }
    } else if (hasComma && !hasDot) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }

    const num = Number(str);
    return isNaN(num) ? 0 : num;
  }
} 