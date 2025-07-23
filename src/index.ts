// ============================================================================
// LEGACY EXPORTS - DEPRECATED - Use @/types instead
// ============================================================================
// This file is maintained for backward compatibility only
// All new code should import from @/types

// Re-export from unified type system
export * from './types';

// Legacy inventory data interface (deprecated - use @/types)
export interface InventoryData {
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

// Legacy sales data interface (deprecated - use @/types)
export interface SalesData {
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
  'V. BRUTA': number;
  n_iva: number;
  n_descuento: number;
  DESCUENTO: number;
  'V. NETA': number;
  sc_detalle_grupo: string;
  sc_signo_inventario: string;
  zona: string;
  ka_nl_tercero: string;
  nombre_vendedor: string;
}

// Legacy processed product interface (deprecated - use @/types)
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

// Legacy alert interface (deprecated - use @/types)
export interface Alert {
  id: string;
  productCode: string;
  productName: string;
  type: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'OVERSTOCK';
  urgency: 1 | 2 | 3;
  currentStock: number;
  minLevel: number;
  maxLevel: number;
  monthlySales: number;
  revenueImpact: number;
  daysLeft: number;
  message: string;
  actionRequired: string;
}

// Legacy KPI data interface (deprecated - use @/types)
export interface KPIData {
  supplyChainHealthScore: number;
  totalRevenue: number;
  criticalAlerts: number;
  avgGrossMargin: number;
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  overStock: number;
  normalStock: number;
}

// Legacy chart data interface (deprecated - use @/types)
export interface ChartData {
  name: string;
  value: number;
  revenue?: number;
  margin?: number;
  date?: string;
  actual?: number;
  forecast?: number;
}

// Legacy uploaded dataset interface (deprecated - use @/types)
export interface UploadedDataset {
  id: string;
  type: 'inventory' | 'sales';
  filename: string;
  uploadDate: string;
  recordCount: number;
  data: InventoryData[] | SalesData[];
}

// Legacy min-max config interface (deprecated - use @/types)
export interface MinMaxConfig {
  productCode: string;
  customMinimum?: number;
  customMaximum?: number;
  leadTimeDays: number;
  safetyStockMultiplier: number;
}

// Legacy stored data interface (deprecated - use @/types)
export interface StoredData {
  historical: UploadedDataset[];
  minMaxSettings: Record<string, MinMaxConfig>;
  lastUpdated: string;
}

// Legacy time range interface (deprecated - use @/types)
export interface TimeRange {
  label: string;
  days: number;
  value: '7d' | '30d' | '90d' | '6m' | '1y';
}

// Legacy upload step interface (deprecated - use @/types)
export interface UploadStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed';
  error?: string;
}

// Legacy CSV validation result interface (deprecated - use @/types)
export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  columnCount: number;
  preview: Record<string, unknown>[];
}

// Legacy procurement recommendation interface (deprecated - use @/types)
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

// Legacy stock efficiency data interface (deprecated - use @/types)
export interface StockEfficiencyData {
  productCode: string;
  productName: string;
  turnoverRate: number;
  marginPercentage: number;
  revenue: number;
  stockValue: number;
  efficiency: 'high' | 'medium' | 'low';
}

// Legacy filter options interface (deprecated - use @/types)
export interface FilterOptions {
  timeRange: TimeRange;
  productGroups: string[];
  stockStatus: string[];
  alertTypes: string[];
}

// Legacy discontinued product alert interface (deprecated - use @/types)
export interface DiscontinuedProductAlert {
  productCode: string;
  productName: string;
  lastSeenPeriod: string;
  monthsMissing: number;
  previousRevenue: number;
  previousMargin: number;
  recommendation: 'ELIMINATE' | 'KEEP' | 'REVIEW';
  reasoning: string;
}

// Legacy high value insight interface (deprecated - use @/types)
export interface HighValueInsight {
  type: 'PRODUCT' | 'CLIENT' | 'GROUP';
  identifier: string;
  name: string;
  revenue: number;
  margin: number;
  rotationVelocity: number;
  clientValue?: number;
  score: number;
  insights: string[];
  recommendations: string[];
}

// Legacy time series data interface (deprecated - use @/types)
export interface TimeSeriesData {
  period: string;
  value: number;
  metric: string;
  group?: string;
  subgroup?: string;
}

// Legacy sales KPIs interface (deprecated - use @/types)
export interface SalesKPIs {
  // Financial KPIs
  totalRevenue: number;
  grossMargin: number;
  netMargin: number;
  cashConversionCycle: number;
  inventoryTurnover: number;
  customerROI: number;
  
  // Operational KPIs
  onTimeDeliveryRate: number;
  outOfStockRate: number;
  productPenetrationRate: number;
  averageTimeToSell: number;
  supplyChainCosts: number;
  
  // Sales Performance KPIs
  monthlyRevenueGrowth: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  averageOrderValue: number;
  repeatPurchaseRate: number;
}

// Legacy outlet coverage metrics interface (deprecated - use @/types)
export interface OutletCoverageMetrics {
  totalCalls: number;
  effectivelyCoveredOutlets: number;
  coverageRate: number;
  callsPerDay: number;
  salespersonName: string;
  territory: string;
  period: string;
}

// Legacy product line performance interface (deprecated - use @/types)
export interface ProductLinePerformance {
  productCode: string;
  productName: string;
  linesPerCall: number;
  crossSellingSuccess: number;
  categoryPenetration: number;
  skuVelocity: number;
  skuMargin: number;
  brand: string;
  category: string;
}

// Legacy customer analytics interface (deprecated - use @/types)
export interface CustomerAnalytics {
  customerId: string;
  customerName: string;
  averageBasketSize: number;
  customerSegment: 'B2B_DISTRIBUTOR' | 'RETAILER' | 'WHOLESALER' | 'END_CONSUMER';
  geographicZone: string;
  city: string;
  paymentTerms: 'CASH' | 'CREDIT_30' | 'CREDIT_60' | 'CREDIT_90';
  profitability: number;
  purchaseFrequency: number;
  totalRevenue: number;
  lastPurchaseDate: string;
  riskScore: number;
}

// Legacy sales performance data interface (deprecated - use @/types)
export interface SalesPerformanceData {
  monthlyRevenue: TimeSeriesData[];
  grossMarginTrend: TimeSeriesData[];
  salesVelocity: TimeSeriesData[];
  customerSegmentation: Record<string, number>;
  topProducts: ProductLinePerformance[];
  topCustomers: CustomerAnalytics[];
  outletCoverage: OutletCoverageMetrics[];
  territoryPerformance: Record<string, number>;
}

// Legacy business intelligence alert interface (deprecated - use @/types)
export interface BusinessIntelligenceAlert {
  id: string;
  type: 'REVENUE_VARIANCE' | 'CUSTOMER_CHURN' | 'INVENTORY_COST' | 'MARGIN_COMPRESSION' | 'OPERATIONAL' | 'STOCKOUT' | 'SLOW_MOVING' | 'PAYMENT_DELAY' | 'TERRITORY_PERFORMANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  affectedEntity: string;
  currentValue: number;
  thresholdValue: number;
  variance: number;
  recommendation: string;
  timestamp: string;
  isAcknowledged: boolean;
  actionRequired: string;
}

// Legacy sales validation result interface (deprecated - use @/types)
export interface SalesValidationResult {
  // Prueba de escritorio validation
  accountingReconciliation: {
    totalRevenue: number;
    accountingTotal: number;
    variance: number;
    isReconciled: boolean;
  };
  dataIntegrity: {
    missingRecords: number;
    duplicateRecords: number;
    invalidDates: number;
    isIntegrityValid: boolean;
  };
  calculationLogic: {
    revenueCalculations: boolean;
    marginCalculations: boolean;
    kpiCalculations: boolean;
    isLogicValid: boolean;
  };
  overallValidation: boolean;
  validationDate: string;
  validatedBy: string;
}

// Legacy sales dashboard filters interface (deprecated - use @/types)
export interface SalesDashboardFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  productGroups: string[];
  customerSegments: string[];
  territories: string[];
  salespeople: string[];
  brands: string[];
  categories: string[];
}

// Legacy executive summary interface (deprecated - use @/types)
export interface ExecutiveSummary {
  period: string;
  revenueTrend: {
    current: number;
    previous: number;
    growth: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
  };
  marginTrend: {
    current: number;
    previous: number;
    change: number;
  };
  topProducts: Array<{
    productCode: string;
    productName: string;
    revenue: number;
    margin: number;
    growth: number;
  }>;
  criticalAlerts: BusinessIntelligenceAlert[];
  keyTrends: Array<{
    metric: string;
    value: number;
    change: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
  }>;
}

// Legacy sales report interface (deprecated - use @/types)
export interface SalesReport {
  id: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'CUSTOM';
  period: string;
  generatedAt: string;
  data: {
    summary: ExecutiveSummary;
    kpis: SalesKPIs;
    performance: SalesPerformanceData;
    alerts: BusinessIntelligenceAlert[];
  };
  filters: SalesDashboardFilters;
  exportFormat: 'PDF' | 'EXCEL' | 'CSV';
}