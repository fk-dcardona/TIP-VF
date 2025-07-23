/**
 * useDashboardData Hook - Single Responsibility Principle Implementation
 * Single responsibility: Handle dashboard data fetching and state management
 */

import { useState, useEffect, useCallback } from 'react';
import { RealTimeAnalyticsData, CrossReferenceData } from '@/types/api';
import { analyticsService } from '@/services/analytics-service';
import { useOrganization } from './useOrganization';

interface UseDashboardDataReturn {
  analyticsData: RealTimeAnalyticsData | null;
  crossReferenceData: CrossReferenceData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date;
  refetch: () => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const { orgId, isLoaded: orgLoaded } = useOrganization();
  const [analyticsData, setAnalyticsData] = useState<RealTimeAnalyticsData | null>(null);
  const [crossReferenceData, setCrossReferenceData] = useState<CrossReferenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = useCallback(async () => {
    // Wait for organization ID to be loaded
    if (!orgLoaded || !orgId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard analytics
      const dashboardData = await analyticsService.getDashboardAnalytics(orgId);
      setAnalyticsData(dashboardData);
      
      // Fetch cross-reference data
      const crossRefData = await analyticsService.getCrossReferenceData(orgId);
      setCrossReferenceData(crossRefData);
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [orgId, orgLoaded]);

  // Fetch data on mount and set up refresh interval
  useEffect(() => {
    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    analyticsData,
    crossReferenceData,
    loading,
    error,
    lastUpdate,
    refetch: fetchData
  };
} 