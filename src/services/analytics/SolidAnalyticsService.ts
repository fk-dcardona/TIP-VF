/**
 * SOLID Analytics Service - Main Orchestrator
 * 
 * Open/Closed Principle: Extensible for new providers without modifying existing code
 * Dependency Inversion: Depends on abstractions, not concrete implementations
 * Single Responsibility: Orchestrates analytics requests through provider chains
 */

import { 
  IAnalyticsProviderStrategy,
  IAnalyticsHealthCheck,
  AnalyticsResponse,
  AnalyticsDataType,
  AnalyticsHealthStatus,
  TriangleAnalyticsData,
  CrossReferenceData,
  SupplierData,
  MarketData
} from '../../types/analytics-solid';

export class SolidAnalyticsService implements IAnalyticsHealthCheck {
  private readonly providers: IAnalyticsProviderStrategy[];
  private readonly healthCheckInterval: number;
  private healthStatus: AnalyticsHealthStatus;
  private lastHealthCheck: Date;

  constructor(providers: IAnalyticsProviderStrategy[], healthCheckInterval: number = 30000) {
    this.providers = providers.sort((a, b) => a.getProviderPriority() - b.getProviderPriority());
    this.healthCheckInterval = healthCheckInterval;
    this.lastHealthCheck = new Date();
    this.healthStatus = {
      overall_health: 'healthy',
      provider_status: {},
      fallback_active: false,
      last_check: this.lastHealthCheck.toISOString()
    };

    // Start periodic health checks
    this.startHealthChecking();
  }

  // ==================== Open/Closed Principle ====================
  // Service is open for extension (new providers) but closed for modification

  /**
   * Add a new provider without modifying existing code
   */
  addProvider(provider: IAnalyticsProviderStrategy): void {
    this.providers.push(provider);
    this.providers.sort((a, b) => a.getProviderPriority() - b.getProviderPriority());
  }

  /**
   * Remove a provider by name
   */
  removeProvider(providerName: string): boolean {
    const index = this.providers.findIndex(p => p.getProviderName() === providerName);
    if (index >= 0) {
      this.providers.splice(index, 1);
      return true;
    }
    return false;
  }

  // ==================== Main Analytics Methods ====================

  async getTriangleAnalytics(orgId: string): Promise<AnalyticsResponse<TriangleAnalyticsData>> {
    return this.fetchWithFallback<TriangleAnalyticsData>(orgId, 'triangle');
  }

  async getCrossReferenceAnalytics(orgId: string): Promise<AnalyticsResponse<CrossReferenceData>> {
    return this.fetchWithFallback<CrossReferenceData>(orgId, 'cross-reference');
  }

  async getSupplierAnalytics(orgId: string): Promise<AnalyticsResponse<SupplierData>> {
    return this.fetchWithFallback<SupplierData>(orgId, 'supplier-performance');
  }

  async getMarketAnalytics(orgId: string): Promise<AnalyticsResponse<MarketData>> {
    return this.fetchWithFallback<MarketData>(orgId, 'market-intelligence');
  }

  // ==================== Self-Healing Architecture ====================

  private async fetchWithFallback<T>(orgId: string, dataType: AnalyticsDataType): Promise<AnalyticsResponse<T>> {
    const capableProviders = this.providers.filter(provider => provider.canHandle(dataType));
    
    if (capableProviders.length === 0) {
      return {
        success: false,
        error: `No providers available for data type: ${dataType}`,
        provider: 'SolidAnalyticsService',
        fallback_used: false,
        timestamp: new Date().toISOString()
      };
    }

    // Try providers in priority order
    for (const provider of capableProviders) {
      try {
        const result = await provider.fetchData<T>(orgId, dataType);
        
        if (result.success) {
          // Update health status - primary provider working
          this.updateProviderHealth(provider.getProviderName(), 'online');
          return result;
        }
        
        // Provider returned failure, mark as degraded and try next
        this.updateProviderHealth(provider.getProviderName(), 'degraded');
        console.warn(`[SolidAnalyticsService] Provider ${provider.getProviderName()} returned failure, trying next provider`);
        
      } catch (error) {
        // Provider threw error, mark as offline and try next
        this.updateProviderHealth(provider.getProviderName(), 'offline');
        console.error(`[SolidAnalyticsService] Provider ${provider.getProviderName()} threw error:`, error);
      }
    }

    // All providers failed
    return {
      success: false,
      error: `All providers failed for data type: ${dataType}`,
      provider: 'SolidAnalyticsService',
      fallback_used: false,
      timestamp: new Date().toISOString()
    };
  }

  // ==================== Health Checking Implementation ====================

  async checkProviderHealth(provider: IAnalyticsProviderStrategy): Promise<boolean> {
    try {
      return await provider.isAvailable();
    } catch (error) {
      console.error(`[SolidAnalyticsService] Health check failed for ${provider.getProviderName()}:`, error);
      return false;
    }
  }

  async getHealthStatus(): Promise<AnalyticsHealthStatus> {
    // Refresh health status if stale
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - this.lastHealthCheck.getTime();
    
    if (timeSinceLastCheck > this.healthCheckInterval) {
      await this.performHealthCheck();
    }
    
    return { ...this.healthStatus };
  }

  private async performHealthCheck(): Promise<void> {
    const healthResults: Record<string, 'online' | 'offline' | 'degraded'> = {};
    let healthyCount = 0;
    
    for (const provider of this.providers) {
      try {
        const isHealthy = await this.checkProviderHealth(provider);
        healthResults[provider.getProviderName()] = isHealthy ? 'online' : 'offline';
        if (isHealthy) healthyCount++;
      } catch (error) {
        healthResults[provider.getProviderName()] = 'offline';
        console.error(`Health check error for ${provider.getProviderName()}:`, error);
      }
    }

    // Determine overall health
    const totalProviders = this.providers.length;
    const healthPercentage = totalProviders > 0 ? (healthyCount / totalProviders) : 0;
    
    let overallHealth: 'healthy' | 'degraded' | 'critical';
    if (healthPercentage >= 0.8) {
      overallHealth = 'healthy';
    } else if (healthPercentage >= 0.4) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'critical';
    }

    // Check if fallback is active (primary provider is offline)
    const primaryProvider = this.providers[0];
    const fallbackActive = primaryProvider ? healthResults[primaryProvider.getProviderName()] !== 'online' : false;

    this.healthStatus = {
      overall_health: overallHealth,
      provider_status: healthResults,
      fallback_active: fallbackActive,
      last_check: new Date().toISOString()
    };
    
    this.lastHealthCheck = new Date();
  }

  private updateProviderHealth(providerName: string, status: 'online' | 'offline' | 'degraded'): void {
    this.healthStatus.provider_status[providerName] = status;
    
    // Update fallback status
    const primaryProvider = this.providers[0];
    if (primaryProvider && primaryProvider.getProviderName() === providerName) {
      this.healthStatus.fallback_active = status !== 'online';
    }
  }

  private startHealthChecking(): void {
    // Perform initial health check
    this.performHealthCheck();
    
    // Set up periodic health checks
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.performHealthCheck();
      }, this.healthCheckInterval);
    }
  }

  // ==================== Utility Methods ====================

  getProviderCount(): number {
    return this.providers.length;
  }

  getProviderNames(): string[] {
    return this.providers.map(p => p.getProviderName());
  }

  getProviderByName(name: string): IAnalyticsProviderStrategy | undefined {
    return this.providers.find(p => p.getProviderName() === name);
  }

  /**
   * Get analytics summary across all data types
   */
  async getAnalyticsSummary(orgId: string): Promise<{
    triangle: AnalyticsResponse<TriangleAnalyticsData>;
    crossReference: AnalyticsResponse<CrossReferenceData>;
    supplier: AnalyticsResponse<SupplierData>;
    market: AnalyticsResponse<MarketData>;
    systemHealth: AnalyticsHealthStatus;
  }> {
    const [triangle, crossReference, supplier, market, systemHealth] = await Promise.all([
      this.getTriangleAnalytics(orgId),
      this.getCrossReferenceAnalytics(orgId),
      this.getSupplierAnalytics(orgId),
      this.getMarketAnalytics(orgId),
      this.getHealthStatus()
    ]);

    return {
      triangle,
      crossReference,
      supplier,
      market,
      systemHealth
    };
  }
}