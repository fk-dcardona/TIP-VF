/**
 * useDashboardData Hook - Single Responsibility Principle Implementation
 * Single responsibility: Handle dashboard data fetching and state management
 */

import { useState, useEffect, useCallback } from 'react';
import { RealTimeAnalyticsData, CrossReferenceData } from '@/types/api';
import { analyticsService } from '@/services/analytics-service';
import { useOrganization } from './useOrganization';
import { useErrorHandler } from './useErrorHandler';

interface UseDashboardDataReturn {
  analyticsData: RealTimeAnalyticsData | null;
  crossReferenceData: CrossReferenceData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date;
  refetch: () => void;
  isRetrying: boolean;
  retry: () => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const { orgId, isLoaded: orgLoaded } = useOrganization();
  const { handleError, error: errorState, canRetry, clearError } = useErrorHandler();
  const [analyticsData, setAnalyticsData] = useState<RealTimeAnalyticsData | null>(null);
  const [crossReferenceData, setCrossReferenceData] = useState<CrossReferenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchData = useCallback(async () => {
    // Wait for organization ID to be loaded
    if (!orgLoaded || !orgId) {
      return;
    }

    try {
      setLoading(true);
      clearError();
      
      // Fetch dashboard analytics
      const dashboardData = await analyticsService.getDashboardAnalytics(orgId);
      setAnalyticsData(dashboardData);
      
      // Fetch cross-reference data
      const crossRefData = await analyticsService.getCrossReferenceData(orgId);
      setCrossReferenceData(crossRefData);
      
      setLastUpdate(new Date());
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [orgId, orgLoaded, handleError, clearError]);

  // Fetch data on mount and set up refresh interval
  useEffect(() => {
    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  const retry = useCallback(() => {
    if (canRetry && !isRetrying) {
      setIsRetrying(true);
      fetchData();
    }
  }, [canRetry, isRetrying, fetchData]);

  return {
    analyticsData,
    crossReferenceData,
    loading,
    error: errorState?.message || null,
    lastUpdate,
    refetch: fetchData,
    isRetrying,
    retry
  };
} 