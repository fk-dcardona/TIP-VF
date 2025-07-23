/**
 * SOLID Analytics System - Type Definitions
 * Following SOLID principles for maintainable, extensible analytics
 */

// ==================== Interface Segregation Principle ====================
// Separate interfaces for different analytics concerns

import type { CrossReferenceData } from './api';

export type { CrossReferenceData };

export interface IAnalyticsDataProvider {
  isAvailable(): Promise<boolean>;
  getProviderName(): string;
}

export interface ITriangleAnalytics {
  getTriangleScores(orgId: string): Promise<TriangleAnalyticsData>;
}

export interface ICrossReferenceAnalytics {
  getCrossReferenceData(orgId: string): Promise<CrossReferenceData>;
}

export interface ISupplierAnalytics {
  getSupplierPerformance(orgId: string): Promise<SupplierData>;
}

export interface IMarketAnalytics {
  getMarketIntelligence(orgId: string): Promise<MarketData>;
}

// ==================== Single Responsibility Principle ====================
// Each data type has a single, focused responsibility

export interface TriangleAnalyticsData {
  service_score: number;
  cost_score: number;
  capital_score: number;
  documents_score: number;
  overall_score: number;
  recommendations: string[];
  trends: {
    service: { trend: string; change: number };
    cost: { trend: string; change: number };
    capital: { trend: string; change: number };
    documents: { trend: string; change: number };
  };
  timestamp: string;
}

// CrossReferenceData interface is defined in api.ts to avoid duplication

export interface SupplierProduct {
  product_code: string;
  product_name: string;
  average_lead_time_days: number;
  last_delivery_date: string;
  on_time_delivery_rate: number;
  average_cost: number;
  total_supplied: number;
}

export interface SupplierData {
  supplier_id: string;
  supplier_name: string;
  health_score: number;
  delivery_performance: number;
  quality_score: number;
  cost_efficiency: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  products_supplied: SupplierProduct[];
  total_spend: number;
  average_lead_time: number;
  on_time_delivery_rate: number;
  quality_rating: number;
  last_order_date: string;
  next_expected_delivery: string;
  payment_terms: string;
  contact_info: {
    email: string;
    phone: string;
    address: string;
  };
  performance_metrics: {
    cost_variance: number;
    delivery_variance: number;
    quality_issues: number;
    communication_score: number;
  };
  risk_factors: {
    financial_stability: number;
    geographic_risk: number;
    capacity_constraints: number;
    dependency_level: number;
  };
}

export interface MarketData {
  market_segments: Array<{
    segment: string;
    revenue: number;
    growth: number;
  }>;
  competitor_analysis: Array<{
    competitor: string;
    market_share: number;
    strength: 'low' | 'medium' | 'high';
  }>;
  market_trends: {
    demand_growth: number;
    price_trends: string;
    technology_adoption: string;
  };
  timestamp: string;
}

// ==================== Enhanced Analytics Data Interfaces ====================

export interface InventoryData {
  total_items: number;
  low_stock_items: number;
  out_of_stock_items: number;
  high_value_items: number;
  average_stock_level: number;
  stock_turnover_rate: number;
  inventory_value: number;
  reorder_alerts: number;
  items_by_category: Array<{
    category: string;
    count: number;
    value: number;
  }>;
  stock_levels: Array<{
    product_code: string;
    product_name: string;
    current_stock: number;
    reorder_point: number;
    max_stock: number;
  }>;
  recent_movements: Array<{
    product_code: string;
    movement_type: 'in' | 'out';
    quantity: number;
    date: string;
  }>;
}

export interface SalesData {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  conversion_rate: number;
  top_selling_products: Array<{
    product_code: string;
    product_name: string;
    units_sold: number;
    revenue: number;
  }>;
  sales_by_category: Array<{
    category: string;
    revenue: number;
    units: number;
  }>;
  monthly_trends: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  customer_segments: Array<{
    segment: string;
    revenue: number;
    customers: number;
  }>;
}

export interface AnalyticsData {
  inventory: InventoryData;
  sales: SalesData;
  suppliers: SupplierData[];
  crossReference: CrossReferenceData;
  timestamp: string;
}

// ==================== Open/Closed Principle ====================
// Extensible analytics response structure

export interface AnalyticsResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  fallback_used: boolean;
  timestamp: string;
}

// ==================== Dependency Inversion Principle ====================
// Abstractions for different provider strategies

export interface IAnalyticsProviderStrategy extends IAnalyticsDataProvider {
  canHandle(dataType: AnalyticsDataType): boolean;
  fetchData<T>(orgId: string, dataType: AnalyticsDataType): Promise<AnalyticsResponse<T>>;
  getProviderPriority(): number;
}

export type AnalyticsDataType = 'triangle' | 'cross-reference' | 'supplier-performance' | 'market-intelligence';

export interface IAnalyticsHealthCheck {
  checkProviderHealth(provider: IAnalyticsProviderStrategy): Promise<boolean>;
  getHealthStatus(): Promise<AnalyticsHealthStatus>;
}

export interface AnalyticsHealthStatus {
  overall_health: 'healthy' | 'degraded' | 'critical';
  provider_status: Record<string, 'online' | 'offline' | 'degraded'>;
  fallback_active: boolean;
  last_check: string;
}

// ==================== Liskov Substitution Principle ====================
// All providers must be substitutable without breaking the system

export abstract class BaseAnalyticsProvider implements IAnalyticsDataProvider {
  abstract isAvailable(): Promise<boolean>;
  abstract getProviderName(): string;

  // Base implementation that all providers inherit
  protected async handleError(error: unknown, context: string): Promise<never> {
    console.error(`[${this.getProviderName()}] Error in ${context}:`, error);
    throw new Error(`Provider ${this.getProviderName()} failed: ${context}`);
  }

  protected createTimestamp(): string {
    return new Date().toISOString();
  }
}