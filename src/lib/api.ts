import type { 
  UploadResponse, 
  UploadsListResponse, 
  AnalysisResponse, 
  UploadDetailsResponse 
} from '@/types/api';

// Environment configuration with fallbacks
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_TIMEOUT = 10000; // 10 seconds

// API Error types for better error handling
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
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Health check and diagnostics
export interface APIHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

let healthCache: APIHealth | null = null;
let healthCheckPromise: Promise<APIHealth> | null = null;

export async function checkAPIHealth(): Promise<APIHealth> {
  // Return cached result if recent (less than 30 seconds old)
  if (healthCache && Date.now() - healthCache.lastChecked.getTime() < 30000) {
    return healthCache;
  }

  // Prevent multiple simultaneous health checks
  if (healthCheckPromise) {
    return healthCheckPromise;
  }

  healthCheckPromise = performHealthCheck();
  const result = await healthCheckPromise;
  healthCheckPromise = null;
  return result;
}

async function performHealthCheck(): Promise<APIHealth> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      healthCache = {
        status: 'healthy',
        responseTime,
        lastChecked: new Date(),
      };
      return healthCache;
    } else {
      healthCache = {
        status: 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
      return healthCache;
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    healthCache = {
      status: 'unhealthy',
      responseTime,
      lastChecked: new Date(),
      error: errorMessage,
    };
    return healthCache;
  }
}

// Enhanced fetch wrapper with better error handling
async function apiFetch(
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

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
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails = null;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorDetails = errorData;
      } catch {
        // If error response is not JSON, use the status text
      }

      throw new APIError(errorMessage, response.status, 'HTTP_ERROR', errorDetails);
    }

    return response;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new NetworkError('Request timeout - server may be unreachable', error);
      }
      if (error.message.includes('Failed to fetch')) {
        throw new NetworkError('Cannot connect to server - check if backend is running', error);
      }
    }

    throw new NetworkError('Network error occurred', error instanceof Error ? error : undefined);
  }
}

// Enhanced API functions with better error handling
export async function uploadFile(file: File, orgId: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('org_id', orgId);

  const response = await apiFetch('/upload', {
    method: 'POST',
    body: formData,
    headers: {
      // Don't set Content-Type for FormData, let browser set it with boundary
    },
  });

  return response.json();
}

export async function getUploads(orgId: string): Promise<UploadsListResponse> {
  const response = await apiFetch(`/uploads/${orgId}`);
  return response.json();
}

export async function getAnalysis(uploadId: string): Promise<AnalysisResponse> {
  const response = await apiFetch(`/analysis/${uploadId}`);
  return response.json();
}

export async function downloadTemplate(dataType: string): Promise<Blob> {
  const response = await apiFetch(`/template/${dataType}`);
  return response.blob();
}

// Diagnostic utilities
export function getAPIConfig() {
  return {
    baseUrl: API_BASE_URL,
    timeout: API_TIMEOUT,
    environment: process.env.NODE_ENV,
  };
}

export function clearHealthCache() {
  healthCache = null;
  healthCheckPromise = null;
}

