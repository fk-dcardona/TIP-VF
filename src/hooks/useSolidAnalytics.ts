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
  AnalyticsData,
  InventoryData,
  SalesData,
  SupplierData,
  CrossReferenceData,
  AnalyticsHealthStatus
} from '../types/analytics-solid';
import { SolidAnalyticsService } from '../services/analytics/SolidAnalyticsService';

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
 * Hook for Inventory Analytics
 */
export function useInventoryAnalytics(orgId: string): AnalyticsHookReturn<InventoryData> {
  return useAnalyticsData<InventoryData>(
    orgId,
    'inventory',
    (service, id) => service.getInventoryData(id)
  );
}

/**
 * Hook for Sales Analytics
 */
export function useSalesAnalytics(orgId: string): AnalyticsHookReturn<SalesData> {
  return useAnalyticsData<SalesData>(
    orgId,
    'sales',
    (service, id) => service.getSalesData(id)
  );
}

/**
 * Hook for Supplier Analytics with product relationships
 */
export function useSupplierAnalytics(orgId: string): AnalyticsHookReturn<SupplierData[]> {
  return useAnalyticsData<SupplierData[]>(
    orgId,
    'supplier',
    (service, id) => service.getSupplierData(id)
  );
}

/**
 * Hook for Cross-Reference Analytics
 */
export function useCrossReferenceAnalytics(orgId: string): AnalyticsHookReturn<CrossReferenceData> {
  return useAnalyticsData<CrossReferenceData>(
    orgId,
    'cross-reference',
    (service, id) => service.getCrossReferenceData(id)
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
  const serviceRef = useRef(new SolidAnalyticsService());

  const refreshHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const healthStatus = await serviceRef.current.getHealthStatus();
      setHealth(healthStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
  
    
    return () => {
      // Cleanup function
    };
  }, [refreshHealth]);

  return { health, loading, error, refreshHealth };
}

// ==================== Comprehensive Analytics Hook ====================

/**
 * Hook for all analytics data with automatic self-repair
 */
export function useAllAnalytics(orgId: string): {
  inventory: AnalyticsHookReturn<InventoryData>;
  sales: AnalyticsHookReturn<SalesData>;
  supplier: AnalyticsHookReturn<SupplierData[]>;
  crossReference: AnalyticsHookReturn<CrossReferenceData>;
  health: AnalyticsHealthStatus | null;
  overallLoading: boolean;
  anyError: boolean;
  refetchAll: () => Promise<void>;
} {
  const inventory = useInventoryAnalytics(orgId);
  const sales = useSalesAnalytics(orgId);
  const supplier = useSupplierAnalytics(orgId);
  const crossReference = useCrossReferenceAnalytics(orgId);
  const { health } = useAnalyticsHealth();

  const overallLoading = inventory.loading || sales.loading || supplier.loading || crossReference.loading;
  const anyError = !!(inventory.error || sales.error || supplier.error || crossReference.error);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      inventory.refetch(),
      sales.refetch(),
      supplier.refetch(),
      crossReference.refetch()
    ]);
  }, [inventory, sales, supplier, crossReference]);

  return {
    inventory,
    sales,
    supplier,
    crossReference,
    health,
    overallLoading,
    anyError,
    refetchAll
  };
}

// ==================== Generic Analytics Data Hook ====================

function useAnalyticsData<T>(
  orgId: string,
  dataType: string,
  fetcher: (service: SolidAnalyticsService, orgId: string) => Promise<T>
): AnalyticsHookReturn<T> {
  const [state, setState] = useState<AnalyticsState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
    fallbackUsed: false,
    provider: null
  });

  const serviceRef = useRef(new SolidAnalyticsService());

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await fetcher(serviceRef.current, orgId);
      const healthStatus = await serviceRef.current.getHealthStatus();
      
      setState({
        data,
        loading: false,
        error: null,
        lastFetch: new Date(),
        fallbackUsed: healthStatus.fallback_active,
        provider: healthStatus.overall_health === 'healthy' ? 'Primary' : 'Fallback'
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastFetch: new Date(),
        fallbackUsed: true,
        provider: 'Fallback'
      }));
    }
  }, [orgId, fetcher]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchData();
  
    
    return () => {
      // Cleanup function
    };
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
    clearError
  };
}

// ==================== Fallback Status Hook ====================

export function useAnalyticsFallbackStatus(orgId: string): {
  isUsingFallback: boolean;
  providers: Record<string, 'online' | 'offline' | 'degraded'>;
  systemHealth: 'healthy' | 'degraded' | 'critical';
} {
  const { health } = useAnalyticsHealth();
  
  return {
    isUsingFallback: health?.fallback_active || false,
    providers: health?.provider_status || {},
    systemHealth: health?.overall_health || 'critical'
  };
}