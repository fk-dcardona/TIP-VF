/**
 * CSV Analytics Provider - Connects to FinkArgo CSV Analytics API
 * 
 * Integrates the working analytics dashboard CSV processing with FinkArgo backend
 * Follows SOLID principles and provider pattern from existing architecture
 */

import { 
  AnalyticsData,
  InventoryData,
  SalesData,
  SupplierData,
  CrossReferenceData
} from '../../../types/analytics-solid';

export class CSVAnalyticsProvider {
  private readonly baseUrl: string;
  private readonly orgId: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(orgId: string, baseUrl?: string) {
    this.orgId = orgId;
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  // ==================== Provider Interface Implementation ====================

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getAnalytics(orgId?: string): Promise<AnalyticsData> {
    const targetOrgId = orgId || this.orgId;
    const cacheKey = `analytics_${targetOrgId}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/csv/analytics/${targetOrgId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': targetOrgId,
        },
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analytics request failed');
      }

      // Transform to match analytics-solid types
      const analyticsData: AnalyticsData = this.transformAnalyticsData(result.analytics);
      
      // Cache the result
      this.setCache(cacheKey, analyticsData);
      
      return analyticsData;
    } catch (error) {
      console.error('[CSVAnalyticsProvider] Error fetching analytics:', error);
      throw error;
    }
  }

  // ==================== CSV Upload Methods ====================

  async uploadCSVFiles(files: { inventory?: File; sales?: File }): Promise<{ success: boolean; message: string }> {
    try {
      const formData = new FormData();
      formData.append('org_id', this.orgId);
      formData.append('user_id', 'csv_user'); // TODO: Get from auth context

      if (files.inventory) {
        formData.append('inventory_file', files.inventory);
      }
      
      if (files.sales) {
        formData.append('sales_file', files.sales);
      }

      const response = await fetch(`${this.baseUrl}/csv/process`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Clear cache after successful upload
      this.clearCache();

      return {
        success: result.success,
        message: result.message || 'Files uploaded and processed successfully'
      };
    } catch (error) {
      console.error('[CSVAnalyticsProvider] Upload error:', error);
      throw error;
    }
  }

  async validateCSV(file: File, csvType?: 'inventory' | 'sales' | 'auto'): Promise<{
    success: boolean;
    csv_type: string;
    validation: any;
    preview: any[];
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('csv_type', csvType || 'auto');

      const response = await fetch(`${this.baseUrl}/csv/validate`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Validation failed');
      }

      return result;
    } catch (error) {
      console.error('[CSVAnalyticsProvider] Validation error:', error);
      throw error;
    }
  }

  // ==================== Data Transformation ====================

  private transformAnalyticsData(apiData: any): AnalyticsData {
    return {
      inventory: this.transformInventoryData(apiData),
      sales: this.transformSalesData(apiData),
      suppliers: this.transformSupplierData(apiData),
      crossReference: this.transformCrossReferenceData(apiData),
      timestamp: new Date().toISOString()
    };
  }

  private transformInventoryData(apiData: any): InventoryData {
    const keyMetrics = apiData.key_metrics || {};
    
    return {
      total_items: keyMetrics.total_products || 0,
      low_stock_items: keyMetrics.low_stock_alerts || 0,
      out_of_stock_items: keyMetrics.out_of_stock_alerts || 0,
      high_value_items: keyMetrics.high_value_items || 0,
      average_stock_level: keyMetrics.average_stock_level || 0,
      stock_turnover_rate: keyMetrics.average_turnover || 0,
      inventory_value: keyMetrics.total_inventory_value || 0,
      reorder_alerts: keyMetrics.reorder_alerts || 0,
      items_by_category: this.extractCategoryData(apiData.product_performance || []),
      stock_levels: this.extractStockLevels(apiData.product_performance || []),
      recent_movements: []
    };
  }

  private transformSalesData(apiData: any): SalesData {
    const keyMetrics = apiData.key_metrics || {};
    
    return {
      total_revenue: keyMetrics.total_revenue || 0,
      total_orders: keyMetrics.total_transactions || 0,
      average_order_value: keyMetrics.average_transaction_value || 0,
      conversion_rate: keyMetrics.sales_growth_rate || 0,
      top_selling_products: this.extractTopProducts(apiData.product_performance || []),
      sales_by_category: this.extractSalesByCategory(apiData.product_performance || []),
      monthly_trends: [],
      customer_segments: []
    };
  }

  private transformSupplierData(apiData: any): SupplierData[] {
    // Extract supplier data from product performance
    const productPerformance = apiData.product_performance || [];
    const supplierMap = new Map();

    productPerformance.forEach((product: any) => {
      const supplierId = product.supplier_id || 'unknown';
      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          id: supplierId,
          name: product.supplier_name || `Supplier ${supplierId}`,
          health_score: 85, // Default score
          delivery_performance: 90,
          quality_score: 88,
          cost_efficiency: 82,
          products: [],
          total_value: 0
        });
      }
      
      const supplier = supplierMap.get(supplierId);
      supplier.products.push(product);
      supplier.total_value += product.total_sales_value || 0;
    });

    return Array.from(supplierMap.values());
  }

  private transformCrossReferenceData(apiData: any): CrossReferenceData {
    return {
      supplier_product_impact: [],
      inventory_supplier_analysis: [],
      sales_supplier_correlation: []
    };
  }

  // ==================== Utility Methods ====================

  private extractCategoryData(productPerformance: any[]): Array<{ category: string; count: number; value: number }> {
    const categoryMap = new Map();
    
    productPerformance.forEach(product => {
      const category = product.product_group || 'Unknown';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { category, count: 0, value: 0 });
      }
      
      const cat = categoryMap.get(category);
      cat.count += 1;
      cat.value += product.total_sales_value || 0;
    });

    return Array.from(categoryMap.values());
  }

  private extractTopProducts(productPerformance: any[]): Array<{ product_code: string; product_name: string; units_sold: number; revenue: number }> {
    return productPerformance
      .sort((a, b) => (b.total_sales_value || 0) - (a.total_sales_value || 0))
      .slice(0, 10)
      .map(product => ({
        product_code: product.product_id || '',
        product_name: product.product_name || '',
        units_sold: product.total_quantity_sold || 0,
        revenue: product.total_sales_value || 0
      }));
  }

  private extractSalesByCategory(productPerformance: any[]): Array<{ category: string; revenue: number; units: number }> {
    const categoryMap = new Map();
    
    productPerformance.forEach(product => {
      const category = product.product_group || 'Unknown';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { category, revenue: 0, units: 0 });
      }
      
      const cat = categoryMap.get(category);
      cat.revenue += product.total_sales_value || 0;
      cat.units += product.total_quantity_sold || 0;
    });

    return Array.from(categoryMap.values());
  }

  private extractStockLevels(productPerformance: any[]): Array<{ product_code: string; product_name: string; current_stock: number; reorder_point: number; max_stock: number }> {
    return productPerformance.map(product => ({
      product_code: product.product_id || '',
      product_name: product.product_name || '',
      current_stock: product.current_stock || 0,
      reorder_point: product.reorder_point || 0,
      max_stock: product.max_stock || 0
    }));
  }

  private extractInventoryTrends(chartsData: any): Array<{ date: string; value: number }> {
    return chartsData.revenue_trend || [];
  }

  private extractSalesByPeriod(chartsData: any): Array<{ period: string; revenue: number; orders: number }> {
    const revenueTrend = chartsData.revenue_trend || [];
    return revenueTrend.map((item: any) => ({
      period: item.date || item.period,
      revenue: item.value || item.revenue || 0,
      orders: item.orders || 1
    }));
  }

  // ==================== Cache Management ====================

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // ==================== Health and Status ====================

  async getHealthStatus(): Promise<{
    status: 'online' | 'offline' | 'degraded';
    last_updated?: string;
    org_data_available: boolean;
  }> {
    try {
      const isAvailable = await this.isAvailable();
      
      if (!isAvailable) {
        return {
          status: 'offline',
          org_data_available: false
        };
      }

      // Check if org has data
      try {
        await this.getAnalytics();
        return {
          status: 'online',
          last_updated: new Date().toISOString(),
          org_data_available: true
        };
      } catch {
        return {
          status: 'online',
          last_updated: new Date().toISOString(),
          org_data_available: false
        };
      }
    } catch {
      return {
        status: 'degraded',
        org_data_available: false
      };
    }
  }
}