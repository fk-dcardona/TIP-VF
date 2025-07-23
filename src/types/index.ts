// ============================================================================
// UNIFIED TYPE SYSTEM - Single Source of Truth for All Types
// ============================================================================

// Re-export all types for backward compatibility
export * from './api';
export * from './interfaces';
export * from './analytics-solid';
export * from './agent';

// ============================================================================
// CORE DATA TYPES
// ============================================================================

export interface InventoryData {
  code: string;
  name: string;
  group: string;
  currentStock: number;
  cost: number;
  [key: string]: any;
}

export interface SalesData {
  productCode: string;
  date: string;
  quantity: number;
  value: number;
  [key: string]: any;
}

export interface ProcessedProduct {
  code: string;
  name: string;
  group: string;
  currentStock: number;
  revenue: number;
  margin: number;
  turnoverRate: number;
  stockStatus: 'OK' | 'LOW' | 'OUT' | 'HIGH' | 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  [key: string]: any;
}

// ============================================================================
// ALERT SYSTEM
// ============================================================================

export interface Alert {
  id: string;
  type: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  productCode?: string;
  date: string;
  [key: string]: any;
}

// ============================================================================
// ANALYTICS & KPI TYPES
// ============================================================================

export interface KPIData {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  [key: string]: any;
}

export interface ProcurementRecommendation {
  productCode: string;
  recommendedQuantity: number;
  estimatedCost: number;
  urgency: 'low' | 'medium' | 'high';
  reason: string;
  [key: string]: any;
}

export interface StockEfficiencyData {
  productCode: string;
  turnoverRate: number;
  marginPercentage: number;
  revenue: number;
  stockValue: number;
  [key: string]: any;
}

// ============================================================================
// TIME & RANGE TYPES
// ============================================================================

export interface TimeRange {
  start: Date;
  end: Date;
  days?: number;
  value?: string;
  label?: string;
}

export interface ChartData {
  name: string;
  value: number;
  revenue?: number;
  margin?: number;
  date?: string;
  actual?: number;
  forecast?: number;
}

export interface TimeSeriesData {
  period: string;
  value: number;
  metric: string;
  group?: string;
  subgroup?: string;
}

// ============================================================================
// VALIDATION & UPLOAD TYPES
// ============================================================================

export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  columnCount: number;
  preview: Record<string, unknown>[];
}

// ============================================================================
// BUSINESS INTELLIGENCE TYPES
// ============================================================================

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

export interface OutletCoverageMetrics {
  totalCalls: number;
  effectivelyCoveredOutlets: number;
  coverageRate: number;
  callsPerDay: number;
  salespersonName: string;
  territory: string;
  period: string;
}

// ============================================================================
// EXECUTIVE & REPORTING TYPES
// ============================================================================

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

// ============================================================================
// HIGH VALUE INSIGHTS
// ============================================================================

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

// ============================================================================
// VALIDATION TYPES
// ============================================================================

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

// ============================================================================
// DISCONTINUED PRODUCTS
// ============================================================================

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

// ============================================================================
// STORAGE TYPES
// ============================================================================

export interface StoredData {
  inventory: InventoryData[];
  sales: SalesData[];
  historical: UploadedDataset[];
  minMaxSettings: Record<string, MinMaxConfig>;
  lastUpdated: string;
  version: string;
}

export interface UploadedDataset {
  id: string;
  name: string;
  type: 'inventory' | 'sales';
  filename: string;
  recordCount: number;
  uploadedAt: string;
  period?: string;
}

export interface MinMaxConfig {
  min: number;
  max: number;
  step?: number;
}

// ============================================================================
// UPLOAD & WIZARD TYPES
// ============================================================================

export interface UploadStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed';
  error?: string;
}