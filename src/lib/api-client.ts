import { APIResponse, APIError, NetworkError, TimeoutError } from '@/types/api';

// Custom error classes
class NetworkErrorClass extends Error {
  type: 'network';
  status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'NetworkError';
    this.type = 'network';
    this.status = status;
  }
}

class TimeoutErrorClass extends Error {
  type: 'timeout';
  timeout: number;
  
  constructor(message: string, timeout: number) {
    super(message);
    this.name = 'TimeoutError';
    this.type = 'timeout';
    this.timeout = timeout;
  }
}

class APIClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api', timeout: number = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new NetworkErrorClass(`HTTP ${response.status}: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof NetworkErrorClass) {
        throw error;
      }
      
      if (error instanceof TimeoutErrorClass) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutErrorClass(`Request timeout after ${this.timeout}ms`, this.timeout);
      }
      
      throw new NetworkErrorClass(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============ Health Monitoring Enhancement for SOLID Analytics Integration ============
  
  /**
   * Check API health endpoint
   */
  async checkHealth(): Promise<{ status: 'healthy' | 'degraded' | 'critical'; response?: any; error?: string }> {
    try {
      const response = await this.get<{ status: string }>('/health');
      return {
        status: response?.status === 'healthy' ? 'healthy' : 'degraded',
        response
      };
    } catch (error) {
      return {
        status: 'critical',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a specific endpoint is available
   */
  async checkEndpointHealth(endpoint: string): Promise<boolean> {
    try {
      await this.get(endpoint);
      return true;
    } catch (error) {
      console.warn(`[APIClient] Endpoint ${endpoint} health check failed:`, error);
      return false;
    }
  }

  /**
   * Get the base URL being used (for provider identification)
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Get timeout configuration
   */
  getTimeout(): number {
    return this.timeout;
  }

  /**
   * Update configuration (useful for provider switching)
   */
  updateConfig(baseURL?: string, timeout?: number): void {
    if (baseURL) this.baseURL = baseURL;
    if (timeout) this.timeout = timeout;
  }

  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new NetworkErrorClass(`HTTP ${response.status}: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof NetworkErrorClass) {
        throw error;
      }
      
      if (error instanceof TimeoutErrorClass) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutErrorClass(`Request timeout after ${this.timeout}ms`, this.timeout);
      }
      
      throw new NetworkErrorClass(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============ Analytics API Methods ============
  
  /**
   * Get Supply Chain Triangle analytics for an organization
   */
  async getTriangleAnalytics(orgId: string): Promise<any> {
    return this.get(`/analytics/triangle/${orgId}`);
  }

  /**
   * Get cross-reference analytics for an organization
   */
  async getCrossReferenceAnalytics(orgId: string): Promise<any> {
    return this.get(`/analytics/cross-reference/${orgId}`);
  }

  /**
   * Get supplier performance analytics for an organization
   */
  async getSupplierPerformanceAnalytics(orgId: string): Promise<any> {
    return this.get(`/analytics/supplier-performance/${orgId}`);
  }

  /**
   * Get market intelligence analytics for an organization
   */
  async getMarketIntelligenceAnalytics(orgId: string): Promise<any> {
    return this.get(`/analytics/market-intelligence/${orgId}`);
  }

  /**
   * Get uploads analytics for an organization
   */
  async getUploadsAnalytics(orgId: string): Promise<any> {
    return this.get(`/analytics/uploads/${orgId}`);
  }

  /**
   * Get comprehensive dashboard analytics for an organization
   */
  async getDashboardAnalytics(orgId: string): Promise<any> {
    return this.get(`/analytics/dashboard/${orgId}`);
  }

  /**
   * Check analytics service health
   */
  async getAnalyticsHealth(): Promise<any> {
    return this.get('/analytics/health');
  }

  /**
   * Get detailed analytics service status
   */
  async getAnalyticsStatus(): Promise<any> {
    return this.get('/analytics/status');
  }

  /**
   * Get available analytics providers
   */
  async getAnalyticsProviders(): Promise<any> {
    return this.get('/analytics/providers');
  }

  /**
   * Get analytics configuration
   */
  async getAnalyticsConfig(): Promise<any> {
    return this.get('/analytics/config');
  }
}

// Create singleton instance
export const apiClient = new APIClient();

// Export error types and classes
export { NetworkErrorClass as NetworkError, TimeoutErrorClass as TimeoutError };
export type { APIError }; 