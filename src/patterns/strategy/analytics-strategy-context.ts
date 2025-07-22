/**
 * Analytics Strategy Context - Strategy Pattern Implementation
 * Manages and executes different analytics strategies
 * Follows Open/Closed Principle - new strategies can be added without modifying existing code
 */

import { 
  AnalyticsStrategy, 
  AnalyticsResult,
  SalesAnalyticsStrategy,
  FinancialAnalyticsStrategy,
  SupplyChainAnalyticsStrategy,
  DocumentIntelligenceStrategy
} from './analytics-strategy';

export interface StrategyContextConfig {
  defaultStrategy?: string;
  enableCaching?: boolean;
  cacheTimeout?: number;
  enableParallelProcessing?: boolean;
}

export class AnalyticsStrategyContext {
  private strategies: Map<string, AnalyticsStrategy> = new Map();
  private currentStrategy: AnalyticsStrategy | null = null;
  private config: StrategyContextConfig;
  private cache: Map<string, { result: AnalyticsResult; timestamp: number }> = new Map();

  constructor(config: StrategyContextConfig = {}) {
    this.config = {
      defaultStrategy: 'sales-analytics',
      enableCaching: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      enableParallelProcessing: false,
      ...config
    };
    
    this.initializeDefaultStrategies();
  }

  /**
   * Initialize default strategies
   */
  private initializeDefaultStrategies(): void {
    this.registerStrategy(new SalesAnalyticsStrategy());
    this.registerStrategy(new FinancialAnalyticsStrategy());
    this.registerStrategy(new SupplyChainAnalyticsStrategy());
    this.registerStrategy(new DocumentIntelligenceStrategy());
    
    // Set default strategy
    if (this.config.defaultStrategy) {
      this.setStrategy(this.config.defaultStrategy);
    }
  }

  /**
   * Register a new strategy
   */
  registerStrategy(strategy: AnalyticsStrategy): void {
    this.strategies.set(strategy.id, strategy);
    console.log(`Strategy registered: ${strategy.name} (${strategy.id})`);
  }

  /**
   * Set the current strategy
   */
  setStrategy(strategyId: string): boolean {
    const strategy = this.strategies.get(strategyId);
    if (strategy) {
      this.currentStrategy = strategy;
      console.log(`Strategy set to: ${strategy.name}`);
      return true;
    }
    console.warn(`Strategy not found: ${strategyId}`);
    return false;
  }

  /**
   * Get the current strategy
   */
  getCurrentStrategy(): AnalyticsStrategy | null {
    return this.currentStrategy;
  }

  /**
   * Get all available strategies
   */
  getAvailableStrategies(): AnalyticsStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get strategy by ID
   */
  getStrategy(strategyId: string): AnalyticsStrategy | undefined {
    return this.strategies.get(strategyId);
  }

  /**
   * Execute analysis with current strategy
   */
  async executeAnalysis(data: any): Promise<AnalyticsResult> {
    if (!this.currentStrategy) {
      throw new Error('No strategy set. Use setStrategy() first.');
    }

    // Check cache if enabled
    if (this.config.enableCaching) {
      const cacheKey = this.generateCacheKey(data);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout!) {
        console.log('Returning cached analysis result');
        return cached.result;
      }
    }

    // Execute analysis
    console.log(`Executing analysis with strategy: ${this.currentStrategy.name}`);
    const result = await this.currentStrategy.analyze(data);

    // Cache result if enabled
    if (this.config.enableCaching) {
      const cacheKey = this.generateCacheKey(data);
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
    }

    return result;
  }

  /**
   * Execute analysis with specific strategy
   */
  async executeAnalysisWithStrategy(strategyId: string, data: any): Promise<AnalyticsResult> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }

    console.log(`Executing analysis with strategy: ${strategy.name}`);
    return await strategy.analyze(data);
  }

  /**
   * Execute analysis with multiple strategies in parallel
   */
  async executeMultiStrategyAnalysis(data: any, strategyIds: string[]): Promise<Record<string, AnalyticsResult>> {
    if (!this.config.enableParallelProcessing) {
      // Sequential execution
      const results: Record<string, AnalyticsResult> = {};
      for (const strategyId of strategyIds) {
        results[strategyId] = await this.executeAnalysisWithStrategy(strategyId, data);
      }
      return results;
    } else {
      // Parallel execution
      const promises = strategyIds.map(strategyId => 
        this.executeAnalysisWithStrategy(strategyId, data)
          .then(result => ({ strategyId, result }))
      );

      const results = await Promise.all(promises);
      return results.reduce((acc, { strategyId, result }) => {
        acc[strategyId] = result;
        return acc;
      }, {} as Record<string, AnalyticsResult>);
    }
  }

  /**
   * Execute comprehensive analysis with all strategies
   */
  async executeComprehensiveAnalysis(data: any): Promise<Record<string, AnalyticsResult>> {
    const strategyIds = Array.from(this.strategies.keys());
    return await this.executeMultiStrategyAnalysis(data, strategyIds);
  }

  /**
   * Get strategy recommendations based on data
   */
  getRecommendedStrategies(data: any): AnalyticsStrategy[] {
    const recommendations: AnalyticsStrategy[] = [];
    
    for (const strategy of this.strategies.values()) {
      const supportedMetrics = strategy.getSupportedMetrics();
      const dataKeys = Object.keys(data);
      
      // Check if strategy supports the available data
      const hasRelevantData = supportedMetrics.some(metric => 
        dataKeys.some(key => key.toLowerCase().includes(metric.toLowerCase()))
      );
      
      if (hasRelevantData) {
        recommendations.push(strategy);
      }
    }
    
    return recommendations.sort((a, b) => {
      // Sort by relevance (number of supported metrics found in data)
      const aRelevance = a.getSupportedMetrics().filter(metric => 
        Object.keys(data).some(key => key.toLowerCase().includes(metric.toLowerCase()))
      ).length;
      
      const bRelevance = b.getSupportedMetrics().filter(metric => 
        Object.keys(data).some(key => key.toLowerCase().includes(metric.toLowerCase()))
      ).length;
      
      return bRelevance - aRelevance;
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Analysis cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    const size = this.cache.size;
    // Note: In a real implementation, you'd track cache hits/misses
    const hitRate = 0.8; // Placeholder
    return { size, hitRate };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<StrategyContextConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Strategy context configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): StrategyContextConfig {
    return { ...this.config };
  }

  /**
   * Generate cache key for data
   */
  private generateCacheKey(data: any): string {
    // Simple hash of data structure
    const dataString = JSON.stringify(data);
    return `${this.currentStrategy?.id}-${this.hashCode(dataString)}`;
  }

  /**
   * Simple hash function
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Remove strategy
   */
  removeStrategy(strategyId: string): boolean {
    if (this.currentStrategy?.id === strategyId) {
      this.currentStrategy = null;
    }
    return this.strategies.delete(strategyId);
  }

  /**
   * Get strategy statistics
   */
  getStrategyStats(): Record<string, { name: string; supportedMetrics: string[] }> {
    const stats: Record<string, { name: string; supportedMetrics: string[] }> = {};
    
    for (const [id, strategy] of this.strategies) {
      stats[id] = {
        name: strategy.name,
        supportedMetrics: strategy.getSupportedMetrics()
      };
    }
    
    return stats;
  }
}

// Export singleton instance for global use
export const analyticsStrategyContext = new AnalyticsStrategyContext(); 