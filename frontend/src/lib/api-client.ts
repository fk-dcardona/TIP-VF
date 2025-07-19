import type { 
  UploadResponse, 
  UploadsListResponse, 
  AnalysisResponse, 
  UploadDetailsResponse 
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Error types for better error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Retry configuration
interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

// Request cache for GET requests
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to create delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if error is retryable
const isRetryableError = (error: any, retryableStatuses: number[]): boolean => {
  if (error instanceof NetworkError || error instanceof TimeoutError) {
    return true;
  }
  if (error instanceof APIError && error.status) {
    return retryableStatuses.includes(error.status);
  }
  return false;
};

// Enhanced fetch with retry mechanism
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryableStatuses = [408, 429, 500, 502, 503, 504]
  } = retryConfig;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code,
          errorData.details
        );
      }
      
      return response;
      
    } catch (error: any) {
      lastError = error;
      
      // Handle abort error
      if (error.name === 'AbortError') {
        lastError = new TimeoutError('Request timeout after 30 seconds');
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        lastError = new NetworkError('Network request failed. Please check your connection.');
      }
      
      // Check if we should retry
      if (attempt < maxAttempts - 1 && isRetryableError(lastError, retryableStatuses)) {
        const delayTime = Math.min(initialDelay * Math.pow(backoffFactor, attempt), maxDelay);
        console.warn(`Retry attempt ${attempt + 1}/${maxAttempts} after ${delayTime}ms delay`);
        await delay(delayTime);
        continue;
      }
      
      break;
    }
  }
  
  throw lastError || new Error('Unknown error occurred');
}

// API Client class with enhanced features
export class APIClient {
  private static instance: APIClient;
  
  static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }
  
  // Helper to get from cache
  private getFromCache(key: string): any | null {
    const cached = requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    requestCache.delete(key);
    return null;
  }
  
  // Helper to set cache
  private setCache(key: string, data: any): void {
    requestCache.set(key, { data, timestamp: Date.now() });
  }
  
  // Generic GET request with caching
  private async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const cacheKey = url;
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    const response = await fetchWithRetry(url, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
    
    const data = await response.json();
    this.setCache(cacheKey, data);
    return data;
  }
  
  // Generic POST request
  private async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetchWithRetry(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    return response.json();
  }
  
  // Upload file with progress tracking
  async uploadFile(
    file: File, 
    orgId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('org_id', orgId);
    
    // Note: Progress tracking requires XMLHttpRequest or a more advanced solution
    // For now, we'll use the fetch API without progress
    const response = await fetchWithRetry(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  }
  
  // Get dashboard data
  async getDashboardData(orgId: string, role?: string): Promise<any> {
    const endpoint = role 
      ? `/dashboard/${orgId}?role=${role}`
      : `/dashboard/${orgId}`;
    return this.get(endpoint);
  }
  
  // Get insights data
  async getInsights(userId: string, role?: string): Promise<any> {
    const endpoint = role 
      ? `/insights/${userId}?role=${role}`
      : `/insights/${userId}`;
    return this.get(endpoint);
  }
  
  // Get document analytics for organization
  async getDocumentAnalytics(orgId: string): Promise<any> {
    return this.get(`/documents/analytics/${orgId}`);
  }
  
  // Get supply chain analytics
  async getSupplyChainAnalytics(orgId: string): Promise<any> {
    return this.get(`/analytics/${orgId}`);
  }
  
  // Parallel data fetching helper
  async fetchDashboardDataParallel(
    userId: string, 
    role?: string
  ): Promise<{
    dashboard: any;
    insights: any;
    analytics?: any;
  }> {
    try {
      const [dashboard, insights, analytics] = await Promise.all([
        this.getDashboardData(userId, role),
        this.getInsights(userId, role),
        this.getSupplyChainAnalytics(userId).catch(() => null) // Optional, don't fail if missing
      ]);
      
      return {
        dashboard,
        insights,
        analytics
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  }
  
  // Get uploads list
  async getUploads(orgId: string): Promise<UploadsListResponse> {
    return this.get(`/uploads/${orgId}`);
  }
  
  // Get analysis
  async getAnalysis(uploadId: string): Promise<AnalysisResponse> {
    return this.get(`/analysis/${uploadId}`);
  }
  
  // Download template
  async downloadTemplate(dataType: string): Promise<Blob> {
    const response = await fetchWithRetry(`${API_BASE_URL}/template/${dataType}`);
    return response.blob();
  }
  
  // Clear cache
  clearCache(): void {
    requestCache.clear();
  }
  
  // Invalidate specific cache entry
  invalidateCache(endpoint: string): void {
    const key = `${API_BASE_URL}${endpoint}`;
    requestCache.delete(key);
  }
}

// Export singleton instance
export const apiClient = APIClient.getInstance();

// Error classes are already exported above as classes, not types