/**
 * Backend Analytics Provider
 * Connects to backend API for real-time analytics data
 * Single Responsibility: Fetch analytics from backend services
 */

import { AnalyticsData, InventoryData, SalesData, SupplierData, CrossReferenceData } from '../../../types/analytics-solid';
import { apiClient } from '../../../lib/api-client';

export class BackendAnalyticsProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = '/api', apiKey: string = '') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Get comprehensive analytics from backend
   */
  async getAnalytics(orgId?: string): Promise<AnalyticsData> {
    try {
      const endpoint = orgId ? `${this.baseUrl}/analytics?orgId=${orgId}` : `${this.baseUrl}/analytics`;
      const response = await apiClient.get<AnalyticsData>(endpoint);

      if (!response) {
        throw new Error('No data received from backend');
      }

      return response;
      
    } catch (error) {
      console.error('[BackendAnalyticsProvider] Error fetching analytics:', error);
      throw new Error(`Failed to fetch analytics from backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if backend is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await apiClient.checkHealth();
      return response.status === 'healthy';
    } catch (error) {
      console.warn('[BackendAnalyticsProvider] Backend not available:', error);
      return false;
    }
  }

  /**
   * Get specific analytics section
   */
  async getInventoryData(orgId?: string): Promise<InventoryData> {
    try {
      const endpoint = orgId ? `${this.baseUrl}/analytics/inventory?orgId=${orgId}` : `${this.baseUrl}/analytics/inventory`;
      const response = await apiClient.get<InventoryData>(endpoint);

      return response;
    } catch (error) {
      console.error('[BackendAnalyticsProvider] Error fetching inventory data:', error);
      throw error;
    }
  }

  async getSalesData(orgId?: string): Promise<SalesData> {
    try {
      const endpoint = orgId ? `${this.baseUrl}/analytics/sales?orgId=${orgId}` : `${this.baseUrl}/analytics/sales`;
      const response = await apiClient.get<SalesData>(endpoint);

      return response;
    } catch (error) {
      console.error('[BackendAnalyticsProvider] Error fetching sales data:', error);
      throw error;
    }
  }

  async getSupplierData(orgId?: string): Promise<SupplierData[]> {
    try {
      const endpoint = orgId ? `${this.baseUrl}/analytics/suppliers?orgId=${orgId}` : `${this.baseUrl}/analytics/suppliers`;
      const response = await apiClient.get<SupplierData[]>(endpoint);

      return response;
    } catch (error) {
      console.error('[BackendAnalyticsProvider] Error fetching supplier data:', error);
      throw error;
    }
  }

  async getCrossReferenceData(orgId?: string): Promise<CrossReferenceData> {
    try {
      const endpoint = orgId ? `${this.baseUrl}/analytics/cross-reference?orgId=${orgId}` : `${this.baseUrl}/analytics/cross-reference`;
      const response = await apiClient.get<CrossReferenceData>(endpoint);

      return response;
    } catch (error) {
      console.error('[BackendAnalyticsProvider] Error fetching cross-reference data:', error);
      throw error;
    }
  }

  /**
   * Upload data to backend
   */
  async uploadData(data: any, orgId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const endpoint = orgId ? `${this.baseUrl}/analytics/upload?orgId=${orgId}` : `${this.baseUrl}/analytics/upload`;
      const response = await apiClient.post<{ message: string }>(endpoint, data);

      return {
        success: true,
        message: response.message || 'Data uploaded successfully'
      };
    } catch (error) {
      console.error('[BackendAnalyticsProvider] Error uploading data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload data'
      };
    }
  }
}