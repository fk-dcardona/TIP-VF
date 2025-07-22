/**
 * Example Usage: Integrating Modular Analytics Engine with Dashboard
 * 
 * This example shows how to replace the existing analytics logic with the new
 * modular engine while maintaining the same functionality.
 */

import { useState, useCallback } from 'react';
import { SupplyChainAnalyticsFactory } from './index';
import type { 
  InventoryRecord, 
  SalesRecord, 
  ProcessedProduct,
  SupplyChainAnalyticsModule 
} from './supply-chain/types';

// Example 1: Basic Integration with Existing Dashboard
export class DashboardAnalyticsIntegration {
  private analytics: SupplyChainAnalyticsModule;

  constructor() {
    // Create analytics module with default configuration
    this.analytics = SupplyChainAnalyticsFactory.createSupplyChainAnalytics();
  }

  // Getter for accessing analytics engine
  get analyticsEngine() {
    return this.analytics.engine;
  }

  /**
   * Process uploaded CSV files and return processed data
   */
  async processUploadedData(
    inventoryFile: File,
    salesFile: File
  ): Promise<{
    inventory: InventoryRecord[];
    sales: SalesRecord[];
    validation: any;
  }> {
    // Parse CSV files (using existing logic or PapaParse)
    const inventoryData = await this.parseCSVFile(inventoryFile);
    const salesData = await this.parseCSVFile(salesFile);

    // Validate data using the analytics engine
    const inventoryValidation = this.analytics.engine.validateData('inventory', inventoryData);
    const salesValidation = this.analytics.engine.validateData('sales', salesData);

    if (!inventoryValidation.isValid || !salesValidation.isValid) {
      throw new Error(`Validation failed: ${inventoryValidation.errors.join(', ')} ${salesValidation.errors.join(', ')}`);
    }

    // Process data using the analytics engine
    const processedInventory = await this.analytics.engine.processData('inventory', inventoryData);
    const processedSales = await this.analytics.engine.processData('sales', salesData);

    return {
      inventory: processedInventory.records as InventoryRecord[],
      sales: processedSales.records as SalesRecord[],
      validation: {
        inventory: inventoryValidation,
        sales: salesValidation
      }
    };
  }

  /**
   * Calculate all KPIs and metrics
   */
  async calculateKPIs(processedData: any) {
    const calculationConfigs = [
      { id: 'supply-chain-health', name: 'Health Score', type: 'kpi' as const, formula: '', inputs: [], outputs: [] },
      { id: 'total-revenue', name: 'Total Revenue', type: 'metric' as const, formula: '', inputs: [], outputs: [] },
      { id: 'critical-alerts', name: 'Critical Alerts', type: 'metric' as const, formula: '', inputs: [], outputs: [] },
      { id: 'avg-gross-margin', name: 'Average Gross Margin', type: 'metric' as const, formula: '', inputs: [], outputs: [] },
      { id: 'inventory-turnover', name: 'Inventory Turnover', type: 'metric' as const, formula: '', inputs: [], outputs: [] },
      { id: 'days-in-inventory', name: 'Days in Inventory', type: 'metric' as const, formula: '', inputs: [], outputs: [] },
      { id: 'inventory-carrying-cost', name: 'Carrying Cost', type: 'metric' as const, formula: '', inputs: [], outputs: [] },
      { id: 'stock-status-distribution', name: 'Stock Distribution', type: 'metric' as const, formula: '', inputs: [], outputs: [] },
      { id: 'product-performance', name: 'Product Performance', type: 'metric' as const, formula: '', inputs: [], outputs: [] },
      { id: 'cash-flow-impact', name: 'Cash Flow Impact', type: 'metric' as const, formula: '', inputs: [], outputs: [] }
    ];

    return await this.analytics.engine.calculateMetrics(processedData, calculationConfigs);
  }

  /**
   * Generate all alerts
   */
  async generateAlerts(processedData: any) {
    const alertConfigs = [
      { id: 'out-of-stock', name: 'Out of Stock', type: 'threshold' as const, condition: '', severity: 'critical' as const, message: '' },
      { id: 'low-stock', name: 'Low Stock', type: 'threshold' as const, condition: '', severity: 'high' as const, message: '' },
      { id: 'overstock', name: 'Overstock', type: 'threshold' as const, condition: '', severity: 'medium' as const, message: '' },
      { id: 'slow-moving', name: 'Slow Moving', type: 'threshold' as const, condition: '', severity: 'low' as const, message: '', value: 2 },
      { id: 'margin-compression', name: 'Margin Compression', type: 'threshold' as const, condition: '', severity: 'medium' as const, message: '', value: 10 },
      { id: 'discontinued', name: 'Discontinued', type: 'threshold' as const, condition: '', severity: 'medium' as const, message: '', value: 3 },
      { id: 'high-value', name: 'High Value', type: 'threshold' as const, condition: '', severity: 'medium' as const, message: '', value: 10000 },
      { id: 'lead-time-risk', name: 'Lead Time Risk', type: 'threshold' as const, condition: '', severity: 'high' as const, message: '' },
      { id: 'seasonal-demand', name: 'Seasonal Demand', type: 'threshold' as const, condition: '', severity: 'high' as const, message: '' },
      { id: 'supplier-risk', name: 'Supplier Risk', type: 'threshold' as const, condition: '', severity: 'medium' as const, message: '' },
      { id: 'cash-flow-impact', name: 'Cash Flow Impact', type: 'threshold' as const, condition: '', severity: 'medium' as const, message: '', value: 5000 }
    ];

    return await this.analytics.engine.generateAlerts(processedData, alertConfigs);
  }

  /**
   * Create time series data for charts
   */
  createTimeSeriesData(processedData: any, timeField: string, valueField: string) {
    return this.analytics.engine.createTimeSeries(processedData, timeField, valueField);
  }

  /**
   * Export results in various formats
   */
  async exportResults(results: any, format: 'json' | 'csv' | 'excel') {
    return await this.analytics.engine.exportResults(results, format);
  }

  private async parseCSVFile(file: File): Promise<any[]> {
    // This would use your existing CSV parsing logic
    // For now, returning a placeholder
    return [];
  }
}

// Example 2: React Hook Integration
export function useModularAnalytics() {
  const [analytics] = useState(() => new DashboardAnalyticsIntegration());
  const [data, setData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processData = useCallback(async (inventoryFile: File, salesFile: File) => {
    setLoading(true);
    setError(null);

    try {
      // Process uploaded files
      const processedData = await analytics.processUploadedData(inventoryFile, salesFile);
      setData(processedData);

      // Calculate KPIs
      const kpis = await analytics.calculateKPIs(processedData);
      setMetrics(kpis);

      // Generate alerts
      const generatedAlerts = await analytics.generateAlerts(processedData);
      setAlerts(generatedAlerts);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [analytics]);

  const exportData = useCallback(async (format: 'json' | 'csv' | 'excel') => {
    if (!data || !metrics || !alerts) return;

    const results = {
      metrics,
      alerts,
      timeSeries: analytics.createTimeSeriesData(data, 'period', 'value'),
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSource: 'uploaded_files',
        timeRange: '30d'
      }
    };

    return await analytics.exportResults(results, format);
  }, [analytics, data, metrics, alerts]);

  return {
    data,
    metrics,
    alerts,
    loading,
    error,
    processData,
    exportData
  };
}

// Example 3: Custom Configuration for Different Use Cases
export class CustomAnalyticsSetup {
  /**
   * Setup for e-commerce analytics
   */
  static createEcommerceAnalytics() {
    return SupplyChainAnalyticsFactory.createCustomSupplyChainAnalytics({
      processors: ['inventory', 'sales'],
      calculators: [
        'supply-chain-health',
        'total-revenue',
        'inventory-turnover',
        'product-performance'
      ],
      alerters: [
        'out-of-stock',
        'low-stock',
        'high-value',
        'cash-flow-impact'
      ],
      config: {
        safetyStockMultiplier: 0.3, // Lower for e-commerce
        alertThresholds: {
          lowStockDays: 3, // Faster alerts for e-commerce
          overstockDays: 60,
          discontinuedMonths: 2
        }
      }
    });
  }

  /**
   * Setup for manufacturing analytics
   */
  static createManufacturingAnalytics() {
    return SupplyChainAnalyticsFactory.createCustomSupplyChainAnalytics({
      processors: ['inventory', 'sales'],
      calculators: [
        'supply-chain-health',
        'inventory-turnover',
        'days-in-inventory',
        'inventory-carrying-cost'
      ],
      alerters: [
        'out-of-stock',
        'low-stock',
        'lead-time-risk',
        'supplier-risk'
      ],
      config: {
        safetyStockMultiplier: 0.7, // Higher for manufacturing
        alertThresholds: {
          lowStockDays: 14, // Longer lead times
          overstockDays: 120,
          discontinuedMonths: 6
        }
      }
    });
  }

  /**
   * Setup for retail analytics
   */
  static createRetailAnalytics() {
    return SupplyChainAnalyticsFactory.createCustomSupplyChainAnalytics({
      processors: ['inventory', 'sales'],
      calculators: [
        'supply-chain-health',
        'total-revenue',
        'avg-gross-margin',
        'stock-status-distribution'
      ],
      alerters: [
        'out-of-stock',
        'low-stock',
        'overstock',
        'seasonal-demand'
      ],
      config: {
        safetyStockMultiplier: 0.5,
        alertThresholds: {
          lowStockDays: 7,
          overstockDays: 90,
          discontinuedMonths: 3
        }
      }
    });
  }
}

// Example 4: Performance Monitoring
export class AnalyticsPerformanceMonitor {
  private analytics: SupplyChainAnalyticsModule;
  private performanceMetrics: Map<string, number> = new Map();

  constructor() {
    this.analytics = SupplyChainAnalyticsFactory.createSupplyChainAnalytics();
  }

  /**
   * Monitor performance of analytics operations
   */
  async monitorOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.performanceMetrics.set(operationName, duration);
      console.log(`${operationName} completed in ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.performanceMetrics.set(`${operationName}_error`, duration);
      console.error(`${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      
      throw error;
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const report = {
      operations: Object.fromEntries(this.performanceMetrics),
      averageTime: this.calculateAverageTime(),
      slowestOperation: this.findSlowestOperation(),
      fastestOperation: this.findFastestOperation()
    };

    return report;
  }

  private calculateAverageTime(): number {
    const times = Array.from(this.performanceMetrics.values());
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  private findSlowestOperation(): { name: string; time: number } | null {
    let slowest = null;
    let maxTime = 0;

    for (const [name, time] of this.performanceMetrics) {
      if (time > maxTime) {
        maxTime = time;
        slowest = { name, time };
      }
    }

    return slowest;
  }

  private findFastestOperation(): { name: string; time: number } | null {
    let fastest = null;
    let minTime = Infinity;

    for (const [name, time] of this.performanceMetrics) {
      if (time < minTime) {
        minTime = time;
        fastest = { name, time };
      }
    }

    return fastest;
  }
}

// Example 5: Integration with Existing Dashboard Components
export function createDashboardIntegration() {
  const analytics = new DashboardAnalyticsIntegration();
  const performanceMonitor = new AnalyticsPerformanceMonitor();

  return {
    // Replace existing useSupplyChainData hook
    async processDashboardData(inventoryData: any[], salesData: any[]) {
      return await performanceMonitor.monitorOperation(
        'process_dashboard_data',
        async () => {
              // Process data using the new engine
    const processedInventory = await analytics.analyticsEngine.processData('inventory', inventoryData);
    const processedSales = await analytics.analyticsEngine.processData('sales', salesData);

    // Calculate all metrics
    const metrics = await analytics.calculateKPIs(processedInventory);
    const alerts = await analytics.generateAlerts(processedInventory);

    return {
      products: processedInventory.records,
      metrics,
      alerts,
      timeSeries: analytics.createTimeSeriesData(processedInventory, 'period', 'value')
    };
        }
      );
    },

    // Health check for the analytics engine
    getAnalyticsHealth() {
      return analytics.analyticsEngine.getHealthStatus();
    },

    // Performance monitoring
    getPerformanceReport() {
      return performanceMonitor.getPerformanceReport();
    },

    // Export functionality
    async exportDashboardData(format: 'json' | 'csv' | 'excel') {
      // Implementation would depend on current dashboard state
      return await analytics.exportResults({}, format);
    }
  };
}

// Example 6: Migration Helper
export class AnalyticsMigrationHelper {
  /**
   * Migrate from existing analytics to new modular engine
   */
  static async migrateFromExisting(
    existingData: any,
    existingCalculations: any
  ) {
    const analytics = SupplyChainAnalyticsFactory.createSupplyChainAnalytics();

    // Convert existing data format to new format
    const convertedData = this.convertExistingData(existingData);

    // Process with new engine
    const processedData = await analytics.engine.processData('inventory', convertedData);

    // Compare results
    const newMetrics = await analytics.engine.calculateMetrics(processedData, [
      { id: 'supply-chain-health', name: 'Health Score', type: 'kpi', formula: '', inputs: [], outputs: [] }
    ]);

    const comparison = this.compareResults(existingCalculations, newMetrics);

    return {
      success: comparison.withinTolerance,
      differences: comparison.differences,
      newMetrics,
      recommendations: comparison.recommendations
    };
  }

  private static convertExistingData(existingData: any) {
    // Convert existing data format to new format
    // This would depend on your current data structure
    return existingData;
  }

  private static compareResults(existing: any, newResults: any) {
    // Compare existing calculations with new engine results
    // Return comparison report
    return {
      withinTolerance: true,
      differences: [],
      recommendations: []
    };
  }
} 