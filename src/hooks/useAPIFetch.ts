import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, APIError, NetworkError, TimeoutError } from '@/lib/api-client';

interface UseAPIFetchOptions {
  autoFetch?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  retryOnError?: boolean;
  cacheKey?: string;
}

interface UseAPIFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  retry: () => Promise<void>;
  isRetrying: boolean;
}

export function useAPIFetch<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseAPIFetchOptions = {}
): UseAPIFetchResult<T> {
  const {
    autoFetch = true,
    onSuccess,
    onError,
    retryOnError = true,
    cacheKey
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Use ref to track if component is mounted
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchData = useCallback(async () => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchFunction();
      
      if (isMounted.current) {
        setData(result);
        setLoading(false);
        onSuccess?.(result);
        
        // Cache the result if cacheKey is provided
        if (cacheKey) {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: result,
            timestamp: Date.now()
          }));
        }
      }
    } catch (err: any) {
      if (isMounted.current && err.name !== 'AbortError') {
        setError(err);
        setLoading(false);
        onError?.(err);
        
        // Auto-retry for network errors if enabled
        if (retryOnError && (err.name === 'NetworkError' || err.name === 'TimeoutError')) {
          setTimeout(() => {
            if (isMounted.current) {
              retry();
            }
          }, 3000);
        }
      }
    }
  }, [fetchFunction, onSuccess, onError, retryOnError, cacheKey]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const retry = useCallback(async () => {
    setIsRetrying(true);
    await fetchData();
    setIsRetrying(false);
  }, [fetchData]);

  // Auto fetch on mount and dependency changes
  useEffect(() => {
    if (autoFetch) {
      // Check cache first
      if (cacheKey) {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data: cachedData, timestamp } = JSON.parse(cached);
            // Use cache if less than 5 minutes old
            if (Date.now() - timestamp < 5 * 60 * 1000) {
              setData(cachedData);
              setLoading(false);
              return;
            }
          } catch (e) {
            // Ignore cache errors
          }
        }
      }
      
      fetchData();
    }
  }, [...dependencies, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch,
    retry,
    isRetrying
  };
}

// Specialized hook for dashboard data
export function useDashboardData(userId: string, role?: string) {
  return useAPIFetch(
    () => apiClient.fetchDashboardDataParallel(userId, role),
    [userId, role],
    {
      cacheKey: `dashboard-${userId}-${role}`,
      retryOnError: true
    }
  );
}

// Specialized hook for document analytics
export function useDocumentAnalytics(orgId: string) {
  return useAPIFetch(
    () => apiClient.getDocumentAnalytics(orgId),
    [orgId],
    {
      cacheKey: `doc-analytics-${orgId}`,
      retryOnError: true
    }
  );
}

// Hook for handling API errors with user-friendly messages
export function useAPIError() {
  const getErrorMessage = useCallback((error: Error): string => {
    if (error.name === 'APIError' && 'status' in error) {
      const apiError = error as any;
      switch (apiError.status) {
        case 400:
          return 'Invalid request. Please check your input and try again.';
        case 401:
          return 'You are not authorized. Please sign in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. We are working to fix this issue.';
        default:
          return apiError.message || 'An unexpected error occurred.';
      }
    }
    
    if (error.name === 'NetworkError') {
      return 'Network connection issue. Please check your internet connection.';
    }
    
    if (error.name === 'TimeoutError') {
      return 'Request timed out. Please try again.';
    }
    
    return error.message || 'An unexpected error occurred.';
  }, []);
  
  const getErrorAction = useCallback((error: Error): string => {
    if (error.name === 'NetworkError' || error.name === 'TimeoutError') {
      return 'retry';
    }
    
    if (error.name === 'APIError' && 'status' in error) {
      const apiError = error as any;
      if (apiError.status === 401) {
        return 'signin';
      }
      if (apiError.status >= 500) {
        return 'retry';
      }
    }
    
    return 'dismiss';
  }, []);
  
  return {
    getErrorMessage,
    getErrorAction
  };
}