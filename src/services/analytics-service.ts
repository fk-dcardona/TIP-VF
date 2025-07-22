/**
 * Analytics Service - Single Responsibility Principle Implementation
 * Handles only analytics-related operations and data transformations
 */

import { apiClient } from '@/lib/api-client';
import { RealTimeAnalyticsData, DashboardMetrics, CrossReferenceData } from '@/types/api';

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
    try {
      const response = await apiClient.get<any>(`/analytics/dashboard/${orgId}`);
      
      if (response.success) {
        return response.data;
      } else {
        // Return demo data for development
        return this.createDemoAnalyticsData();
      }
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      // Return demo data for development
      return this.createDemoAnalyticsData();
    }
  }

  /**
   * Fetch cross-reference analytics data
   * Single responsibility: Cross-reference data fetching
   */
  async getCrossReferenceData(orgId: string): Promise<CrossReferenceData | null> {
    try {
      const response = await apiClient.get<any>(`/analytics/cross-reference/${orgId}`);
      
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.log('Cross-reference data not available yet');
      return null;
    }
  }

  /**
   * Fetch triangle analytics data
   * Single responsibility: Triangle analytics data fetching
   */
  async getTriangleAnalytics(orgId: string): Promise<any> {
    try {
      const response = await apiClient.get<any>(`/analytics/triangle/${orgId}`);
      return response.success ? response.data : null;
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
      const response = await apiClient.get<any>(`/analytics/supplier-performance/${orgId}`);
      return response.success ? response.data : null;
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
      const response = await apiClient.get<any>(`/analytics/market-intelligence/${orgId}`);
      return response.success ? response.data : null;
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
}

// Export singleton instance
export const analyticsService = new AnalyticsService(); 