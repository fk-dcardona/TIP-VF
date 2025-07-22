// Re-export all types for backward compatibility
export * from './api';
export * from './interfaces';
export * from './analytics-solid';
export * from './agent';

// Additional types for calculations and analytics
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

export interface Alert {
  id: string;
  type: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  productCode?: string;
  date: string;
  [key: string]: any;
}

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

export interface TimeRange {
  start: Date;
  end: Date;
  days?: number;
}