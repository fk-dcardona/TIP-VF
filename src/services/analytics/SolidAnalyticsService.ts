/**
 * SOLID Analytics Service - Main Orchestrator
 * 
 * Open/Closed Principle: Extensible for new providers without modifying existing code
 * Dependency Inversion: Depends on abstractions, not concrete implementations
 * Single Responsibility: Orchestrates analytics requests through provider chains
 */

import { 
  AnalyticsData,
  InventoryData,
  SalesData,
  SupplierData,
  CrossReferenceData
} from '../../types/analytics-solid';
import { FallbackAnalyticsProvider } from './providers/FallbackAnalyticsProvider';
import { RealDataAnalyticsProvider } from './providers/RealDataAnalyticsProvider';
import { BackendAnalyticsProvider } from './providers/BackendAnalyticsProvider';
import { CSVAnalyticsProvider } from './providers/CSVAnalyticsProvider';

export class SolidAnalyticsService {
  private readonly providers: Array<CSVAnalyticsProvider | BackendAnalyticsProvider | RealDataAnalyticsProvider | FallbackAnalyticsProvider>;
  private readonly healthCheckInterval: number;
  private lastHealthCheck: Date;
  private csvProvider?: CSVAnalyticsProvider;

  constructor(orgId?: string, healthCheckInterval: number = 30000) {
    // Initialize CSV provider if orgId is provided
    if (orgId) {
      this.csvProvider = new CSVAnalyticsProvider(orgId);
    }

    this.providers = [
      ...(this.csvProvider ? [this.csvProvider] : []),
      new BackendAnalyticsProvider(),
      new RealDataAnalyticsProvider(),
      new FallbackAnalyticsProvider()
    ];
    this.healthCheckInterval = healthCheckInterval;
    this.lastHealthCheck = new Date();

    // Start periodic health checks
    this.startHealthChecking();
  }

  // ==================== Main Analytics Methods ====================

  /**
   * Get comprehensive analytics data from the best available provider
   */
  async getAnalytics(orgId?: string): Promise<AnalyticsData> {
    // Try providers in order of preference
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          return await provider.getAnalytics(orgId);
        }
      } catch (error) {
        console.warn(`[SolidAnalyticsService] Provider failed:`, error);
        continue;
      }
    }

    // If all providers fail, throw error
    throw new Error('No analytics providers available');
  }

  /**
   * Get inventory analytics
   */
  async getInventoryData(orgId?: string): Promise<InventoryData> {
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          if ('getInventoryData' in provider) {
            return await provider.getInventoryData(orgId);
          }
          // Fallback: get full analytics and extract inventory
          const analytics = await provider.getAnalytics(orgId);
          return analytics.inventory;
        }
      } catch (error) {
        console.warn(`[SolidAnalyticsService] Provider failed for inventory:`, error);
        continue;
      }
    }
    throw new Error('No inventory data available');
  }

  /**
   * Get sales analytics
   */
  async getSalesData(orgId?: string): Promise<SalesData> {
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          if ('getSalesData' in provider) {
            return await provider.getSalesData(orgId);
          }
          // Fallback: get full analytics and extract sales
          const analytics = await provider.getAnalytics(orgId);
          return analytics.sales;
        }
      } catch (error) {
        console.warn(`[SolidAnalyticsService] Provider failed for sales:`, error);
        continue;
      }
    }
    throw new Error('No sales data available');
  }

  /**
   * Get supplier analytics with product relationships
   */
  async getSupplierData(orgId?: string): Promise<SupplierData[]> {
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          if ('getSupplierData' in provider) {
            return await provider.getSupplierData(orgId);
          }
          // Fallback: get full analytics and extract suppliers
          const analytics = await provider.getAnalytics(orgId);
          return analytics.suppliers;
        }
      } catch (error) {
        console.warn(`[SolidAnalyticsService] Provider failed for suppliers:`, error);
        continue;
      }
    }
    throw new Error('No supplier data available');
  }

  /**
   * Get cross-reference analytics
   */
  async getCrossReferenceData(orgId?: string): Promise<CrossReferenceData> {
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          if ('getCrossReferenceData' in provider) {
            return await provider.getCrossReferenceData(orgId);
          }
          // Fallback: get full analytics and extract cross-reference
          const analytics = await provider.getAnalytics(orgId);
          return analytics.crossReference;
        }
      } catch (error) {
        console.warn(`[SolidAnalyticsService] Provider failed for cross-reference:`, error);
        continue;
      }
    }
    throw new Error('No cross-reference data available');
  }

  /**
   * Upload CSV data for processing
   */
  async uploadData(csvContent: string, orgId?: string): Promise<{ success: boolean; message: string }> {
    // Try RealDataAnalyticsProvider first for data upload
    const realDataProvider = this.providers.find(p => p instanceof RealDataAnalyticsProvider) as RealDataAnalyticsProvider;
    
    if (realDataProvider) {
      try {
        return await realDataProvider.uploadCSVData(orgId || 'default', csvContent);
      } catch (error) {
        console.error('[SolidAnalyticsService] Failed to upload to RealDataProvider:', error);
      }
    }

    // Fallback to BackendAnalyticsProvider
    const backendProvider = this.providers.find(p => p instanceof BackendAnalyticsProvider) as BackendAnalyticsProvider;
    
    if (backendProvider) {
      try {
        return await backendProvider.uploadData({ csvContent }, orgId);
      } catch (error) {
        console.error('[SolidAnalyticsService] Failed to upload to BackendProvider:', error);
      }
    }

    return {
      success: false,
      message: 'No upload providers available'
    };
  }

  // ==================== CSV Upload Methods ====================

  /**
   * Upload CSV files for analytics processing
   */
  async uploadCSVFiles(files: { inventory?: File; sales?: File }): Promise<{ success: boolean; message: string }> {
    if (!this.csvProvider) {
      throw new Error('CSV provider not initialized. Provide orgId in constructor.');
    }

    try {
      return await this.csvProvider.uploadCSVFiles(files);
    } catch (error) {
      console.error('[SolidAnalyticsService] CSV upload failed:', error);
      throw error;
    }
  }

  /**
   * Validate CSV file before upload
   */
  async validateCSV(file: File, csvType?: 'inventory' | 'sales' | 'auto'): Promise<{
    success: boolean;
    csv_type: string;
    validation: any;
    preview: any[];
  }> {
    if (!this.csvProvider) {
      throw new Error('CSV provider not initialized. Provide orgId in constructor.');
    }

    try {
      return await this.csvProvider.validateCSV(file, csvType);
    } catch (error) {
      console.error('[SolidAnalyticsService] CSV validation failed:', error);
      throw error;
    }
  }

  /**
   * Check if CSV provider is available and has data
   */
  async getCSVStatus(): Promise<{
    available: boolean;
    hasData: boolean;
    status: string;
  }> {
    if (!this.csvProvider) {
      return {
        available: false,
        hasData: false,
        status: 'CSV provider not initialized'
      };
    }

    try {
      const healthStatus = await this.csvProvider.getHealthStatus();
      return {
        available: healthStatus.status !== 'offline',
        hasData: healthStatus.org_data_available,
        status: healthStatus.status
      };
    } catch (error) {
      return {
        available: false,
        hasData: false,
        status: 'Error checking CSV status'
      };
    }
  }

  // ==================== Health Check Methods ====================

  /**
   * Check if any provider is available
   */
  async isAvailable(): Promise<boolean> {
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          return true;
        }
      } catch (error) {
        console.warn(`[SolidAnalyticsService] Health check failed for provider:`, error);
      }
    }
    return false;
  }

  /**
   * Get health status of all providers
   */
  async getHealthStatus(): Promise<{
    overall_health: 'healthy' | 'degraded' | 'critical';
    provider_status: Record<string, 'online' | 'offline' | 'degraded'>;
    fallback_active: boolean;
    last_check: string;
  }> {
    const providerStatus: Record<string, 'online' | 'offline' | 'degraded'> = {};
    let availableProviders = 0;
    let totalProviders = this.providers.length;

    for (const provider of this.providers) {
      const providerName = provider.constructor.name;
      try {
        const isAvailable = await provider.isAvailable();
        providerStatus[providerName] = isAvailable ? 'online' : 'offline';
        if (isAvailable) availableProviders++;
      } catch (error) {
        providerStatus[providerName] = 'degraded';
      }
    }

    let overallHealth: 'healthy' | 'degraded' | 'critical';
    if (availableProviders === totalProviders) {
      overallHealth = 'healthy';
    } else if (availableProviders > 0) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'critical';
    }

    this.lastHealthCheck = new Date();

    return {
      overall_health: overallHealth,
      provider_status: providerStatus,
      fallback_active: availableProviders < totalProviders,
      last_check: this.lastHealthCheck.toISOString()
    };
  }

  // ==================== Utility Methods ====================

  /**
   * Get provider count
   */
  getProviderCount(): number {
    return this.providers.length;
  }

  /**
   * Get provider names
   */
  getProviderNames(): string[] {
    return this.providers.map(p => p.constructor.name);
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(orgId?: string): Promise<{
    inventory: InventoryData;
    sales: SalesData;
    suppliers: SupplierData[];
    crossReference: CrossReferenceData;
    systemHealth: any;
  }> {
    const [analytics, healthStatus] = await Promise.all([
      this.getAnalytics(orgId),
      this.getHealthStatus()
    ]);

    return {
      inventory: analytics.inventory,
      sales: analytics.sales,
      suppliers: analytics.suppliers,
      crossReference: analytics.crossReference,
      systemHealth: healthStatus
    };
  }

  // ==================== Private Methods ====================

  private startHealthChecking(): void {
    setInterval(async () => {
      try {
        await this.getHealthStatus();
      } catch (error) {
        console.error('[SolidAnalyticsService] Health check failed:', error);
      }
    }, this.healthCheckInterval);
  }
}