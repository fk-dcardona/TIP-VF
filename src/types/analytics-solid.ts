/**
 * SOLID Analytics System - Type Definitions
 * Following SOLID principles for maintainable, extensible analytics
 */

// ==================== Interface Segregation Principle ====================
// Separate interfaces for different analytics concerns

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

export interface CrossReferenceData {
  document_compliance: number;
  inventory_accuracy: number;
  cost_variance: number;
  compromised_inventory: {
    total_items: number;
    compromised_count: number;
    compromised_percentage: number;
  };
  discrepancies: Array<{
    type: string;
    count: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  timestamp: string;
}

export interface SupplierData {
  suppliers: Array<{
    id: string;
    name: string;
    health_score: number;
    delivery_performance: number;
    quality_score: number;
    cost_efficiency: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
  }>;
  average_performance: {
    health_score: number;
    delivery_performance: number;
    quality_score: number;
    cost_efficiency: number;
  };
  timestamp: string;
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