import type { BaseDataRecord, TimeSeriesPoint } from '../types';

// Supply Chain Specific Data Types
export interface InventoryRecord extends BaseDataRecord {
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

export interface SalesRecord extends BaseDataRecord {
  k_sc_codigo_fuente: string;
  n_numero_documento: number;
  ka_nl_movimiento: string;
  d_fecha_documento: string;
  sc_nombre: string;
  n_nit: number;
  sc_telefono_ppal: string;
  sc_telefono_alterno: string;
  sc_nombre_fuente: string;
  marca: string;
  k_sc_codigo_articulo: string;
  sc_detalle_articulo: string;
  n_cantidad: number;
  n_valor: number;
  v_bruta: number;
  n_iva: number;
  n_descuento: number;
  descuento: number;
  v_neta: number;
  sc_detalle_grupo: string;
  sc_signo_inventario: string;
  zona: string;
  ka_nl_tercero: string;
  nombre_vendedor: string;
}

// Processed Supply Chain Data
export interface ProcessedProduct {
  code: string;
  name: string;
  group: string;
  subgroup: string;
  period: string;
  currentStock: number;
  averageCost: number;
  lastCost: number;
  unit: string;
  monthlySales: number;
  revenue: number;
  margin: number;
  minimumLevel: number;
  maximumLevel: number;
  stockStatus: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  turnoverRate: number;
  leadTimeDays: number;
  daysOfSupply: number;
  rotationVelocity: number;
  clientValue: number;
  isDiscontinued: boolean;
  lastSeenPeriod: string;
  monthlyUsage?: number;
  monthlyReceipts?: number;
  averageInventory?: number;
  inventoryCarryingCost?: number;
}

// Supply Chain Specific Metrics
export interface SupplyChainMetrics {
  supplyChainHealthScore: number;
  totalRevenue: number;
  criticalAlerts: number;
  avgGrossMargin: number;
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  overStock: number;
  normalStock: number;
  inventoryTurnover: number;
  daysInInventory: number;
  inventoryCarryingCost: number;
}

// Supply Chain Alerts
export interface SupplyChainAlert {
  id: string;
  productCode: string;
  productName: string;
  type: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'OVERSTOCK' | 'DISCONTINUED' | 'SLOW_MOVING';
  urgency: 1 | 2 | 3;
  currentStock: number;
  minLevel: number;
  maxLevel: number;
  monthlySales: number;
  revenueImpact: number;
  daysLeft: number;
  message: string;
  actionRequired: string;
  timestamp: string;
  isAcknowledged: boolean;
}

// Procurement Recommendations
export interface ProcurementRecommendation {
  productCode: string;
  productName: string;
  action: 'immediate' | 'planned' | 'reduce';
  priority: 'high' | 'medium' | 'low';
  suggestedQuantity: number;
  reasoning: string;
  timeframe: string;
  cost: number;
}

// Stock Efficiency Analysis
export interface StockEfficiencyData {
  productCode: string;
  productName: string;
  turnoverRate: number;
  marginPercentage: number;
  revenue: number;
  stockValue: number;
  efficiency: 'high' | 'medium' | 'low';
}

// Time Series Data for Supply Chain
export interface SupplyChainTimeSeries extends TimeSeriesPoint {
  metric: 'revenue' | 'inventory_value' | 'turnover_rate' | 'margin' | 'stock_level';
  group?: string;
  subgroup?: string;
  productCode?: string;
}

// Configuration for Supply Chain Analytics
export interface SupplyChainConfig {
  // Lead time configuration by product group
  leadTimeConfig: Record<string, number>;
  
  // Safety stock multipliers
  safetyStockMultiplier: number;
  
  // Alert thresholds
  alertThresholds: {
    lowStockDays: number;
    overstockDays: number;
    discontinuedMonths: number;
  };
  
  // Calculation parameters
  calculationParams: {
    defaultTimeRange: number; // days
    marginThreshold: number;
    turnoverThreshold: number;
  };
}

// Supply Chain Data Sources
export interface SupplyChainDataSource {
  inventory: {
    id: string;
    name: string;
    schema: Record<keyof InventoryRecord, 'string' | 'number' | 'date'>;
    requiredFields: (keyof InventoryRecord)[];
  };
  sales: {
    id: string;
    name: string;
    schema: Record<keyof SalesRecord, 'string' | 'number' | 'date'>;
    requiredFields: (keyof SalesRecord)[];
  };
}

// Supply Chain Analytics Results
export interface SupplyChainAnalyticsResults {
  products: ProcessedProduct[];
  metrics: SupplyChainMetrics;
  alerts: SupplyChainAlert[];
  recommendations: ProcurementRecommendation[];
  efficiency: StockEfficiencyData[];
  timeSeries: SupplyChainTimeSeries[];
  metadata: {
    generatedAt: string;
    timeRange: string;
    productCount: number;
    alertCount: number;
  };
}

// Validation Results for Supply Chain Data
export interface SupplyChainValidationResult {
  inventory: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    rowCount: number;
    columnCount: number;
    preview: InventoryRecord[];
  };
  sales: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    rowCount: number;
    columnCount: number;
    preview: SalesRecord[];
  };
  overall: {
    isValid: boolean;
    issues: string[];
  };
}

// Export interfaces for external use
export interface SupplyChainAnalyticsModule {
  engine: any; // AnalyticsEngine from core types
  config: SupplyChainConfig;
  types: {
    InventoryRecord: InventoryRecord;
    SalesRecord: SalesRecord;
    ProcessedProduct: ProcessedProduct;
    SupplyChainMetrics: SupplyChainMetrics;
    SupplyChainAlert: SupplyChainAlert;
    ProcurementRecommendation: ProcurementRecommendation;
    StockEfficiencyData: StockEfficiencyData;
    SupplyChainTimeSeries: SupplyChainTimeSeries;
    SupplyChainConfig: SupplyChainConfig;
    SupplyChainAnalyticsResults: SupplyChainAnalyticsResults;
    SupplyChainValidationResult: SupplyChainValidationResult;
  };
} 