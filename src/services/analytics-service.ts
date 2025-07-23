/**
 * Analytics Service - Single Responsibility Principle Implementation
 * Handles only analytics-related operations and data transformations
 */

import { apiClient } from '@/lib/api-client';
import { RealTimeAnalyticsData, DashboardMetrics, CrossReferenceData } from '@/types/api';
import { withRetry } from '@/utils/retry';

export interface AnalyticsServiceInterface {
  getDashboardAnalytics(orgId: string): Promise<RealTimeAnalyticsData>;
  getCrossReferenceData(orgId: string): Promise<CrossReferenceData | null>;
  getTriangleAnalytics(orgId: string): Promise<any>;
  getSupplierPerformance(orgId: string): Promise<any>;
  getMarketIntelligence(orgId: string): Promise<any>;
}

export class AnalyticsService implements AnalyticsServiceInterface {
  /**
   * Fetch comprehensive dashboard analytics data
   * Single responsibility: Data fetching for dashboard
   */
  async getDashboardAnalytics(orgId: string): Promise<RealTimeAnalyticsData> {
    return withRetry(async () => {
      console.log('[AnalyticsService] Fetching real dashboard analytics for:', orgId);
      const response = await apiClient.getDashboardAnalytics(orgId);
      
      if (response && response.success) {
        // Transform the real API data to match RealTimeAnalyticsData structure
        return this.transformDashboardData(response.data);
      } else if (response && response.data) {
        // Handle the case where API returns data directly
        return this.transformDashboardData(response.data);
      } else {
        // Fallback to demo data only if explicitly enabled
        if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true') {
          console.log('[AnalyticsService] Demo mode enabled, returning demo data');
          return this.createDemoAnalyticsData();
        }
        throw new Error('No data received from API');
      }
    }, {
      maxAttempts: 3,
      onRetry: (attempt, error) => {
        console.warn(`[AnalyticsService] Retry attempt ${attempt} for dashboard analytics:`, error);
      }
    }).catch(error => {
      console.error('Error fetching dashboard analytics after retries:', error);
      // Only return demo data if explicitly in demo mode
      if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true') {
        return this.createDemoAnalyticsData();
      }
      throw error;
    });
  }

  /**
   * Fetch cross-reference analytics data
   * Single responsibility: Cross-reference data fetching
   */
  async getCrossReferenceData(orgId: string): Promise<CrossReferenceData | null> {
    try {
      console.log('[AnalyticsService] Fetching real cross-reference data for:', orgId);
      const response = await apiClient.getCrossReferenceAnalytics(orgId);
      
      if (response && response.success) {
        return response.data;
      } else if (response && response.data) {
        return response.data;
      }
      
      // Only return demo data if explicitly in demo mode
      if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true') {
        console.log('[AnalyticsService] Demo mode enabled, returning demo cross-reference data');
        return this.createDemoCrossReferenceData();
      }
      
      return null;
    } catch (error) {
      console.log('Cross-reference data not available yet:', error);
      if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true') {
        return this.createDemoCrossReferenceData();
      }
      return null;
    }
  }

  /**
   * Fetch triangle analytics data
   * Single responsibility: Triangle analytics data fetching
   */
  async getTriangleAnalytics(orgId: string): Promise<any> {
    try {
      console.log('[AnalyticsService] Fetching real triangle analytics for:', orgId);
      const response = await apiClient.getTriangleAnalytics(orgId);
      return response && response.success ? response.data : response;
    } catch (error) {
      console.error('Error fetching triangle analytics:', error);
      return null;
    }
  }

  /**
   * Fetch supplier performance data
   * Single responsibility: Supplier performance data fetching
   */
  async getSupplierPerformance(orgId: string): Promise<any> {
    try {
      console.log('[AnalyticsService] Fetching real supplier performance for:', orgId);
      const response = await apiClient.getSupplierPerformanceAnalytics(orgId);
      return response && response.success ? response.data : response;
    } catch (error) {
      console.error('Error fetching supplier performance:', error);
      return null;
    }
  }

  /**
   * Fetch market intelligence data
   * Single responsibility: Market intelligence data fetching
   */
  async getMarketIntelligence(orgId: string): Promise<any> {
    try {
      console.log('[AnalyticsService] Fetching real market intelligence for:', orgId);
      const response = await apiClient.getMarketIntelligenceAnalytics(orgId);
      return response && response.success ? response.data : response;
    } catch (error) {
      console.error('Error fetching market intelligence:', error);
      return null;
    }
  }

  /**
   * Create demo analytics data for development
   * Single responsibility: Demo data generation
   */
  private createDemoAnalyticsData(): RealTimeAnalyticsData {
    return {
      metrics: {
        totalInventory: 1250,
        totalInventoryValue: 450000,
        criticalAlerts: 3,
        activeSuppliers: 12,
        orderFulfillment: 94.5,
        avgDeliveryTime: 8.2,
        documentIntelligence: {
          totalDocuments: 45,
          validatedDocuments: 42,
          compromisedInventory: 2,
          crossReferenceScore: 87.5
        },
        triangleAnalytics: {
          salesScore: 92.3,
          financialScore: 88.7,
          supplyChainScore: 85.4,
          documentScore: 87.5
        }
      },
      charts: {
        inventoryTrends: [
          { date: '2025-01-15', value: 1200 },
          { date: '2025-01-16', value: 1250 },
          { date: '2025-01-17', value: 1180 },
          { date: '2025-01-18', value: 1320 },
          { date: '2025-01-19', value: 1280 },
          { date: '2025-01-20', value: 1350 },
          { date: '2025-01-21', value: 1250 }
        ],
        supplierPerformance: [
          { name: 'TechCorp Industries', value: 95.2 },
          { name: 'Global Supply Co', value: 88.7 },
          { name: 'Premium Parts Ltd', value: 92.1 },
          { name: 'Fast Logistics Inc', value: 85.9 },
          { name: 'Quality Materials', value: 90.3 }
        ],
        marketIntelligence: [
          { category: 'Market Demand', value: 87.5 },
          { category: 'Competition', value: 72.3 },
          { category: 'Pricing Trends', value: 91.2 },
          { category: 'Supply Availability', value: 84.7 }
        ]
      },
      recentActivity: [
        { id: '1', action: 'Invoice uploaded', timestamp: '2025-01-21T14:30:00Z', user: 'Juan Pérez' },
        { id: '2', action: 'Inventory updated', timestamp: '2025-01-21T13:15:00Z', user: 'María García' },
        { id: '3', action: 'Supplier alert resolved', timestamp: '2025-01-21T12:45:00Z', user: 'Carlos López' },
        { id: '4', action: 'BOL processed', timestamp: '2025-01-21T11:20:00Z', user: 'Ana Rodríguez' }
      ],
      insights: [
        { id: '1', type: 'inventory', message: 'Low stock alert: Product XYZ-123', priority: 'high' },
        { id: '2', type: 'supplier', message: 'Supplier TechCorp performance improved 15%', priority: 'medium' },
        { id: '3', type: 'financial', message: 'Cash conversion cycle optimized by 2.3 days', priority: 'medium' },
        { id: '4', type: 'document', message: 'Document validation rate: 93.3%', priority: 'low' }
      ]
    };
  }

  /**
   * Create demo cross-reference data for development
   * Single responsibility: Demo cross-reference data generation
   */
  private createDemoCrossReferenceData(): CrossReferenceData {
    return {
      supplier_product_impact: [
        {
          supplier_id: 'supplier_001',
          supplier_name: 'TechCorp Industries',
          product_code: 'TECH-001',
          product_name: 'Advanced Microprocessor',
          lead_time_impact_score: 92.5,
          stockout_risk: 3.2,
          sales_impact: 95.8,
          cost_impact: 88.3
        },
        {
          supplier_id: 'supplier_002',
          supplier_name: 'Global Supply Co',
          product_code: 'GLOB-002',
          product_name: 'Industrial Sensors',
          lead_time_impact_score: 87.1,
          stockout_risk: 2.8,
          sales_impact: 89.2,
          cost_impact: 91.5
        }
      ],
      inventory_supplier_analysis: [
        {
          product_code: 'TECH-001',
          current_stock: 150,
          reorder_point: 50,
          supplier_lead_times: [
            {
              supplier_id: 'supplier_001',
              supplier_name: 'TechCorp Industries',
              average_lead_time: 5,
              risk_level: 'low'
            }
          ],
          stockout_probability: 5.2
        },
        {
          product_code: 'GLOB-002',
          current_stock: 75,
          reorder_point: 30,
          supplier_lead_times: [
            {
              supplier_id: 'supplier_002',
              supplier_name: 'Global Supply Co',
              average_lead_time: 3,
              risk_level: 'medium'
            }
          ],
          stockout_probability: 12.8
        }
      ],
      sales_supplier_correlation: [
        {
          product_code: 'TECH-001',
          monthly_sales: 125000,
          supplier_performance: [
            {
              supplier_id: 'supplier_001',
              supplier_name: 'TechCorp Industries',
              delivery_performance: 94.2,
              quality_score: 96.5,
              impact_on_sales: 85.3
            }
          ]
        },
        {
          product_code: 'GLOB-002',
          monthly_sales: 89000,
          supplier_performance: [
            {
              supplier_id: 'supplier_002',
              supplier_name: 'Global Supply Co',
              delivery_performance: 87.8,
              quality_score: 89.1,
              impact_on_sales: 72.1
            }
          ]
        }
      ]
    };
  }

  /**
   * Transform API response data to match RealTimeAnalyticsData structure
   * Single responsibility: Data transformation
   */
  private transformDashboardData(apiData: any): RealTimeAnalyticsData {
    // Handle different possible API response structures
    if (!apiData) {
      return this.createDemoAnalyticsData();
    }

    // If the data already has the correct structure, return it
    if (apiData.metrics && apiData.charts) {
      return apiData;
    }

    // Transform the consolidated API response to match the frontend structure
    const triangleAnalytics = apiData.triangle_analytics || {};
    const crossReference = apiData.cross_reference || {};
    const supplierPerformance = apiData.supplier_performance || {};
    const marketIntelligence = apiData.market_intelligence || {};
    const documentIntelligence = apiData.document_intelligence || {};

    return {
      metrics: {
        totalInventory: apiData.uploads?.total_uploads || 0,
        totalInventoryValue: triangleAnalytics.cost_score ? triangleAnalytics.cost_score * 5000 : 0,
        criticalAlerts: crossReference.discrepancies?.filter((d: any) => d.severity === 'high')?.length || 0,
        activeSuppliers: supplierPerformance.suppliers?.length || 0,
        orderFulfillment: triangleAnalytics.service_score || 0,
        avgDeliveryTime: supplierPerformance.average_performance?.delivery_performance || 0,
        documentIntelligence: {
          totalDocuments: documentIntelligence.total_documents || apiData.uploads?.total_uploads || 0,
          validatedDocuments: documentIntelligence.validated_documents || apiData.uploads?.successful_uploads || 0,
          compromisedInventory: crossReference.compromised_inventory?.compromised_count || 0,
          crossReferenceScore: crossReference.document_compliance || 0
        },
        triangleAnalytics: {
          salesScore: triangleAnalytics.service_score || 0,
          financialScore: triangleAnalytics.cost_score || 0,
          supplyChainScore: triangleAnalytics.capital_score || 0,
          documentScore: triangleAnalytics.documents_score || 0
        }
      },
      charts: {
        inventoryTrends: this.generateTrendData(triangleAnalytics.trends),
        supplierPerformance: supplierPerformance.suppliers?.map((s: any) => ({
          name: s.name,
          value: s.health_score
        })) || [],
        marketIntelligence: [
          { category: 'Market Demand', value: marketIntelligence.demand_trends?.growth_rate || 0 },
          { category: 'Competition', value: marketIntelligence.competitive_landscape?.competitive_intensity === 'high' ? 85 : 65 },
          { category: 'Pricing Trends', value: marketIntelligence.pricing_trends?.price_volatility ? (1 - marketIntelligence.pricing_trends.price_volatility) * 100 : 0 },
          { category: 'Supply Availability', value: 100 - (crossReference.compromised_inventory?.compromised_percentage || 0) }
        ]
      },
      recentActivity: apiData.uploads?.recent_uploads?.map((upload: any, index: number) => ({
        id: index.toString(),
        action: `${upload.filename} ${upload.status}`,
        timestamp: upload.timestamp,
        user: 'System'
      })) || [],
      insights: this.generateInsights(triangleAnalytics, crossReference, supplierPerformance)
    };
  }

  /**
   * Generate trend data from API response
   */
  private generateTrendData(trends: any): Array<{ date: string; value: number }> {
    if (!trends) {
      // Generate dummy trend data for the last 7 days
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString().split('T')[0],
          value: Math.floor(Math.random() * 200) + 1150
        });
      }
      return data;
    }

    // Transform API trends data
    return Object.entries(trends).map(([key, data]: [string, any]) => ({
      date: new Date().toISOString().split('T')[0],
      value: data.change || 0
    }));
  }

  /**
   * Generate insights from analytics data
   */
  private generateInsights(triangle: any, crossRef: any, supplier: any): Array<any> {
    const insights = [];

    if (triangle.recommendations) {
      triangle.recommendations.forEach((rec: string, index: number) => {
        insights.push({
          id: index.toString(),
          type: 'analytics',
          message: rec,
          priority: index === 0 ? 'high' : 'medium'
        });
      });
    }

    if (crossRef.discrepancies) {
      crossRef.discrepancies.forEach((disc: any, index: number) => {
        if (disc.severity !== 'none') {
          insights.push({
            id: `disc-${index}`,
            type: 'document',
            message: `${disc.type}: ${disc.count} issues found`,
            priority: disc.severity
          });
        }
      });
    }

    return insights.slice(0, 4); // Return top 4 insights
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService(); 