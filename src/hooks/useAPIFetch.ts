import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { LegacyAnalyticsData } from '@/types/api';

// Generic API fetch hook
export function useAPIFetch<T>(
  endpoint: string,
  dependencies: any[] = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.get<T>(endpoint);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    const controller = new AbortController();
    
    fetchData();

    
    

    
    return () => {

    
      controller.abort();

    
    };
  }, [fetchData, dependencies]);

  return { data, loading, error, refetch: fetchData };
}

// Dashboard data hook
export function useDashboardData(orgId: string, dashboardType: string) {
  return useAPIFetch<LegacyAnalyticsData>(`/dashboard/${dashboardType}/${orgId}`, [orgId, dashboardType]);
}

// Document analytics hook
export function useDocumentAnalytics(orgId: string) {
  return useAPIFetch<any>(`/documents/analytics/${orgId}`, [orgId]);
}

// Health check hook
export function useAPIHealth() {
  return useAPIFetch<any>('/health');
}

// Uploads hook
export function useUploads(orgId: string) {
  return useAPIFetch<any[]>(`/uploads?org_id=${orgId}`, [orgId]);
}

// Agents hook
export function useAgents(orgId: string) {
  return useAPIFetch<any[]>(`/agents?org_id=${orgId}`, [orgId]);
}

// Custom hook for retry logic
export function useRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fetchFn();
        setData(result);
        setRetryCount(attempt);
        return;
      } catch (err) {
        if (attempt === maxRetries) {
          setError(err instanceof Error ? err : new Error('Max retries exceeded'));
          setRetryCount(attempt);
        } else {
          await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
        }
      }
    }
    setLoading(false);
  }, [fetchFn, maxRetries, delay]);

  return { data, loading, error, retryCount, execute };
} 