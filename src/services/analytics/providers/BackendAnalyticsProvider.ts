/**
 * Backend Analytics Provider
 * Single Responsibility: Handle backend API communication for analytics data
 */

import { 
  BaseAnalyticsProvider, 
  IAnalyticsProviderStrategy,
  AnalyticsResponse,
  AnalyticsDataType,
  TriangleAnalyticsData,
  CrossReferenceData,
  SupplierData,
  MarketData
} from '../../../types/analytics-solid';

export class BackendAnalyticsProvider extends BaseAnalyticsProvider implements IAnalyticsProviderStrategy {
  private readonly baseUrl: string;
  private readonly timeout: number;
  
  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'https://tip-vf-production.up.railway.app', timeout: number = 10000) {
    super();
    this.baseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
    this.timeout = timeout;
  }

  getProviderName(): string {
    return 'BackendAPI';
  }

  getProviderPriority(): number {
    return 1; // Highest priority - preferred provider
  }

  canHandle(dataType: AnalyticsDataType): boolean {
    // Backend can handle all analytics data types
    return ['triangle', 'cross-reference', 'supplier-performance', 'market-intelligence'].includes(dataType);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout)
      });
      
      return response.ok;
    } catch (error) {
      console.warn(`[${this.getProviderName()}] Health check failed:`, error);
      return false;
    }
  }


  async fetchData<T>(orgId: string, dataType: AnalyticsDataType): Promise<AnalyticsResponse<T>> {
    const endpoint = this.getEndpointForDataType(dataType);
    const url = `${this.baseUrl}${endpoint}/${orgId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // Check if response has expected structure
      if (responseData.status === 'success' && responseData.data) {
        return {
          success: true,
          data: responseData.data as T,
          provider: this.getProviderName(),
          fallback_used: false,
          timestamp: this.createTimestamp()
        };
      }

      throw new Error('Invalid response format from backend');
      
    } catch (error) {
      console.error(`[${this.getProviderName()}] Failed to fetch ${dataType} for org ${orgId}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.getProviderName(),
        fallback_used: false,
        timestamp: this.createTimestamp()
      };
    }
  }

  private getEndpointForDataType(dataType: AnalyticsDataType): string {
    const endpoints = {
      'triangle': '/api/analytics/triangle',
      'cross-reference': '/api/analytics/cross-reference', 
      'supplier-performance': '/api/analytics/supplier-performance',
      'market-intelligence': '/api/analytics/market-intelligence'
    };
    
    return endpoints[dataType];
  }

  // Specific methods for each analytics type (Single Responsibility)
  private async fetchTriangleAnalytics(orgId: string): Promise<TriangleAnalyticsData> {
    const response = await this.fetchData<TriangleAnalyticsData>(orgId, 'triangle');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch triangle analytics');
  }

  private async fetchCrossReferenceAnalytics(orgId: string): Promise<CrossReferenceData> {
    const response = await this.fetchData<CrossReferenceData>(orgId, 'cross-reference');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch cross-reference analytics');
  }

  private async fetchSupplierAnalytics(orgId: string): Promise<SupplierData> {
    const response = await this.fetchData<SupplierData>(orgId, 'supplier-performance');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch supplier analytics');
  }

  private async fetchMarketAnalytics(orgId: string): Promise<MarketData> {
    const response = await this.fetchData<MarketData>(orgId, 'market-intelligence');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch market analytics');
  }
}