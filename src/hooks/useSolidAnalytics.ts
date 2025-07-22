/**
 * SOLID Analytics React Hook
 * 
 * Single Responsibility: Manage analytics state and data fetching in React components
 * Dependency Inversion: Uses injected analytics service, not concrete implementations
 * Open/Closed: Extensible for new analytics types without modifying existing code
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AnalyticsResponse,
  TriangleAnalyticsData,
  CrossReferenceData,
  SupplierData,
  MarketData,
  AnalyticsHealthStatus
} from '../types/analytics-solid';
import { getAnalyticsServiceInstance } from '../services/analytics/AnalyticsServiceFactory';

// ==================== Hook State Management ====================

interface AnalyticsState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
  fallbackUsed: boolean;
  provider: string | null;
}

interface AnalyticsHookReturn<T> extends AnalyticsState<T> {
  refetch: () => Promise<void>;
  clearError: () => void;
}

// ==================== Individual Analytics Hooks ====================

/**
 * Hook for Triangle Analytics with automatic self-repair
 */
export function useTriangleAnalytics(orgId: string): AnalyticsHookReturn<TriangleAnalyticsData> {
  return useAnalyticsData<TriangleAnalyticsData>(
    orgId,
    'triangle',
    (service, id) => service.getTriangleAnalytics(id)
  );
}

/**
 * Hook for Cross-Reference Analytics with automatic self-repair
 */
export function useCrossReferenceAnalytics(orgId: string): AnalyticsHookReturn<CrossReferenceData> {
  return useAnalyticsData<CrossReferenceData>(
    orgId,
    'cross-reference',
    (service, id) => service.getCrossReferenceAnalytics(id)
  );
}

/**
 * Hook for Supplier Analytics with automatic self-repair
 */
export function useSupplierAnalytics(orgId: string): AnalyticsHookReturn<SupplierData> {
  return useAnalyticsData<SupplierData>(
    orgId,
    'supplier',
    (service, id) => service.getSupplierAnalytics(id)
  );
}

/**
 * Hook for Market Intelligence with automatic self-repair
 */
export function useMarketAnalytics(orgId: string): AnalyticsHookReturn<MarketData> {
  return useAnalyticsData<MarketData>(
    orgId,
    'market',
    (service, id) => service.getMarketAnalytics(id)
  );
}

// ==================== System Health Hook ====================

/**
 * Hook for Analytics System Health Monitoring
 */
export function useAnalyticsHealth(): {
  health: AnalyticsHealthStatus | null;
  loading: boolean;
  error: string | null;
  refreshHealth: () => Promise<void>;
} {
  const [health, setHealth] = useState<AnalyticsHealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef(getAnalyticsServiceInstance());

  const refreshHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const healthStatus = await serviceRef.current.getHealthStatus();
      setHealth(healthStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch health status';
      setError(errorMessage);
      console.error('[useAnalyticsHealth] Error fetching health status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    
    // Set up periodic health checks
    const interval = setInterval(refreshHealth, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [refreshHealth]);

  return { health, loading, error, refreshHealth };
}

// ==================== Comprehensive Analytics Hook ====================

/**
 * Hook that fetches all analytics data types for comprehensive dashboards
 */
export function useAllAnalytics(orgId: string): {
  triangle: AnalyticsHookReturn<TriangleAnalyticsData>;
  crossReference: AnalyticsHookReturn<CrossReferenceData>;
  supplier: AnalyticsHookReturn<SupplierData>;
  market: AnalyticsHookReturn<MarketData>;
  health: AnalyticsHealthStatus | null;
  overallLoading: boolean;
  anyError: boolean;
  refetchAll: () => Promise<void>;
} {
  const triangle = useTriangleAnalytics(orgId);
  const crossReference = useCrossReferenceAnalytics(orgId);
  const supplier = useSupplierAnalytics(orgId);
  const market = useMarketAnalytics(orgId);
  const { health } = useAnalyticsHealth();

  const overallLoading = triangle.loading || crossReference.loading || supplier.loading || market.loading;
  const anyError = !!(triangle.error || crossReference.error || supplier.error || market.error);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      triangle.refetch(),
      crossReference.refetch(),
      supplier.refetch(),
      market.refetch()
    ]);
  }, [triangle, crossReference, supplier, market]);

  return {
    triangle,
    crossReference,
    supplier,
    market,
    health,
    overallLoading,
    anyError,
    refetchAll
  };
}

// ==================== Core Hook Implementation ====================

/**
 * Generic analytics data hook with self-repair capabilities
 */
function useAnalyticsData<T>(
  orgId: string,
  dataType: string,
  fetcher: (service: any, orgId: string) => Promise<AnalyticsResponse<T>>
): AnalyticsHookReturn<T> {
  const [state, setState] = useState<AnalyticsState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
    fallbackUsed: false,
    provider: null
  });

  const serviceRef = useRef(getAnalyticsServiceInstance());
  const fetchInProgressRef = useRef(false);

  const fetchData = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      return;
    }

    fetchInProgressRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetcher(serviceRef.current, orgId);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          data: response.data!,
          loading: false,
          error: null,
          lastFetch: new Date(),
          fallbackUsed: response.fallback_used,
          provider: response.provider
        }));

        // Log self-repair activity
        if (response.fallback_used) {
          console.warn(`[useSolidAnalytics] ${dataType} using fallback provider: ${response.provider}`);
        } else {
          console.info(`[useSolidAnalytics] ${dataType} fetched successfully from: ${response.provider}`);
        }
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || `Failed to fetch ${dataType} analytics`,
          lastFetch: new Date(),
          fallbackUsed: response.fallback_used,
          provider: response.provider
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Unknown error fetching ${dataType}`;
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        lastFetch: new Date(),
        fallbackUsed: false,
        provider: null
      }));
      console.error(`[useSolidAnalytics] Error fetching ${dataType}:`, error);
    } finally {
      fetchInProgressRef.current = false;
    }
  }, [orgId, dataType, fetcher]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-fetch on mount and orgId change
  useEffect(() => {
    if (orgId) {
      fetchData();
    }
  }, [orgId, fetchData]);

  return {
    ...state,
    refetch: fetchData,
    clearError
  };
}

// ==================== Utility Hooks ====================

/**
 * Hook for checking if analytics system is using fallback providers
 */
export function useAnalyticsFallbackStatus(orgId: string): {
  isUsingFallback: boolean;
  providers: Record<string, boolean>;
  systemHealth: 'healthy' | 'degraded' | 'critical';
} {
  const { health } = useAnalyticsHealth();
  const triangle = useTriangleAnalytics(orgId);
  const crossReference = useCrossReferenceAnalytics(orgId);
  const supplier = useSupplierAnalytics(orgId);
  const market = useMarketAnalytics(orgId);

  const isUsingFallback = triangle.fallbackUsed || crossReference.fallbackUsed || 
                         supplier.fallbackUsed || market.fallbackUsed;

  const providers = {
    triangle: triangle.fallbackUsed,
    crossReference: crossReference.fallbackUsed,
    supplier: supplier.fallbackUsed,
    market: market.fallbackUsed
  };

  const systemHealth = health?.overall_health || 'healthy';

  return { isUsingFallback, providers, systemHealth };
}