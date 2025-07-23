import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '@/database';
import type { 
  SalesData, 
  SalesKPIs, 
  SalesPerformanceData, 
  BusinessIntelligenceAlert,
  ExecutiveSummary 
} from '@/types';

interface UseSalesDataOptions {
  timeRange: { startDate: string; endDate: string };
  enablePagination?: boolean;
  pageSize?: number;
}

interface UseSalesDataReturn {
  // Data
  salesData: SalesData[];
  kpis: SalesKPIs | null;
  performanceData: SalesPerformanceData | null;
  alerts: BusinessIntelligenceAlert[];
  executiveSummary: ExecutiveSummary | null;
  
  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  
  // Loading states
  isLoading: boolean;
  isKPIsLoading: boolean;
  isPerformanceLoading: boolean;
  isAlertsLoading: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  refreshData: () => void;
  refreshKPIs: () => void;
  refreshPerformance: () => void;
  refreshAlerts: () => void;
}

export const useSalesData = (options: UseSalesDataOptions): UseSalesDataReturn => {
  const { timeRange, enablePagination = false, pageSize = 50 } = options;
  
  // State
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [kpis, setKpis] = useState<SalesKPIs | null>(null);
  const [performanceData, setPerformanceData] = useState<SalesPerformanceData | null>(null);
  const [alerts, setAlerts] = useState<BusinessIntelligenceAlert[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isKPIsLoading, setIsKPIsLoading] = useState(false);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);
  const [isAlertsLoading, setIsAlertsLoading] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Load sales data
  const loadSalesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (enablePagination) {
        const result = await databaseService.getSalesData({
          page,
          pageSize: currentPageSize,
          sortBy: 'd_fecha_documento',
          sortOrder: 'desc'
        });
        
        if ('data' in result) {
          setSalesData(result.data);
          setTotal(result.total);
          setTotalPages(result.totalPages);
          setHasNext(result.hasNext);
          setHasPrev(result.hasPrev);
        }
      } else {
        const result = await databaseService.getSalesData();
        if (Array.isArray(result)) {
          setSalesData(result);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales data');
    } finally {
      setIsLoading(false);
    }
  }, [enablePagination, page, currentPageSize]);
  
  // Load KPIs
  const loadKPIs = useCallback(async () => {
    setIsKPIsLoading(true);
    setError(null);
    
    try {
      const kpisData = await databaseService.getPreCalculatedKPIs(timeRange);
      setKpis(kpisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KPIs');
    } finally {
      setIsKPIsLoading(false);
    }
  }, [timeRange]);
  
  // Load performance data
  const loadPerformanceData = useCallback(async () => {
    setIsPerformanceLoading(true);
    setError(null);
    
    try {
      const performance = await databaseService.getPreCalculatedSalesPerformance(timeRange);
      setPerformanceData(performance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setIsPerformanceLoading(false);
    }
  }, [timeRange]);
  
  // Load alerts
  const loadAlerts = useCallback(async () => {
    setIsAlertsLoading(true);
    setError(null);
    
    try {
      // Import alert generation function
      const { generateBusinessIntelligenceAlerts } = await import('@/salesAnalytics');
      
      if (kpis && salesData.length > 0) {
        // Get inventory data for alert generation
        const inventoryData = await databaseService.getInventoryData();
        const alertsData = generateBusinessIntelligenceAlerts(salesData, inventoryData, kpis, timeRange);
        setAlerts(alertsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setIsAlertsLoading(false);
    }
  }, [kpis, salesData, timeRange]);
  
  // Generate executive summary
  const generateExecutiveSummary = useCallback(async () => {
    if (kpis && salesData.length > 0) {
      try {
        const { generateExecutiveSummary } = await import('@/salesAnalytics');
        const summary = generateExecutiveSummary(salesData, kpis, alerts, timeRange);
        setExecutiveSummary(summary);
      } catch (err) {
        console.error('Failed to generate executive summary:', err);
      }
    }
  }, [kpis, salesData, alerts, timeRange]);
  
  // Effects
  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);
  
  useEffect(() => {
    loadKPIs();
  }, [loadKPIs]);
  
  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);
  
  useEffect(() => {
    if (kpis && salesData.length > 0) {
      loadAlerts();
    }
  }, [loadAlerts, kpis, salesData.length]);
  
  useEffect(() => {
    generateExecutiveSummary();
  }, [generateExecutiveSummary]);
  
  // Actions
  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);
  
  const handleSetPageSize = useCallback((newPageSize: number) => {
    setCurrentPageSize(newPageSize);
    setPage(0); // Reset to first page
  }, []);
  
  const refreshData = useCallback(() => {
    loadSalesData();
  }, [loadSalesData]);
  
  const refreshKPIs = useCallback(() => {
    loadKPIs();
  }, [loadKPIs]);
  
  const refreshPerformance = useCallback(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);
  
  const refreshAlerts = useCallback(() => {
    loadAlerts();
  }, [loadAlerts]);
  
  return {
    // Data
    salesData,
    kpis,
    performanceData,
    alerts,
    executiveSummary,
    
    // Pagination
    pagination: {
      page,
      pageSize: currentPageSize,
      total,
      totalPages,
      hasNext,
      hasPrev
    },
    
    // Loading states
    isLoading,
    isKPIsLoading,
    isPerformanceLoading,
    isAlertsLoading,
    
    // Error states
    error,
    
    // Actions
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    refreshData,
    refreshKPIs,
    refreshPerformance,
    refreshAlerts
  };
}; 