import { useState, useEffect, useMemo, useCallback } from 'react';
import type { 
  ProcessedProduct, 
  TimeRange, 
  InventoryData, 
  SalesData, 
  UploadedDataset,
  TimeSeriesData,
  DiscontinuedProductAlert
} from '@/types';
import { databaseService } from '@/database';
import { processProducts } from '@/calculations';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { withRetry } from '@/utils/retry';

const timeRanges: TimeRange[] = [
  { 
    label: '7 days', 
    days: 7, 
    value: '7d',
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  },
  { 
    label: '30 days', 
    days: 30, 
    value: '30d',
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  },
  { 
    label: '90 days', 
    days: 90, 
    value: '90d',
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    end: new Date()
  },
  { 
    label: '6 months', 
    days: 180, 
    value: '6m',
    start: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    end: new Date()
  },
  { 
    label: '1 year', 
    days: 365, 
    value: '1y',
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    end: new Date()
  }
];

export const useSupplyChainData = () => {
  const { handleError, error: errorState, canRetry, clearError } = useErrorHandler();
  const [inventoryDataset, setInventoryDataset] = useState<UploadedDataset | null>(null);
  const [salesDataset, setSalesDataset] = useState<UploadedDataset | null>(null);
  const [currentTimeRange, setCurrentTimeRange] = useState<TimeRange>(timeRanges[1]); // Default to 30 days
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  // Time-series data state
  const [allInventory, setAllInventory] = useState<InventoryData[]>([]);
  const [latestInventory, setLatestInventory] = useState<InventoryData[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [inventoryTrends, setInventoryTrends] = useState<TimeSeriesData[]>([]);
  const [discontinuedProducts, setDiscontinuedProducts] = useState<DiscontinuedProductAlert[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(undefined);

  // Load data from Supabase on mount
  const loadData = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      // Get all data in parallel with retry logic
      const [allInv, latestInv, salesResult, datasets, trends, discontinued] = await withRetry(
        async () => Promise.all([
          databaseService.getInventoryData(),
          databaseService.getLatestInventoryData(),
          databaseService.getSalesData(),
          databaseService.getDatasets(),
          databaseService.getInventoryTrends('group', 6),
          databaseService.getDiscontinuedProducts(3)
        ]),
        {
          maxAttempts: 3,
          onRetry: (attempt) => {
            console.log(`[SupplyChainData] Retry attempt ${attempt} for loading data`);
          }
        }
      );

      setAllInventory(allInv);
      setLatestInventory(latestInv);
      setSalesData(Array.isArray(salesResult) ? salesResult : salesResult.data);
      setInventoryTrends(trends);
      setDiscontinuedProducts(discontinued);

      // Set the latest period as default
      if (latestInv.length > 0) {
        const latestPeriod = latestInv.reduce((latest, item) => {
          const currentTs = Date.parse(item.period);
          const latestTs = Date.parse(latest);
          return currentTs > latestTs ? item.period : latest;
        }, latestInv[0].period);
        setSelectedPeriod(latestPeriod);
      }

      // Create dataset objects for compatibility with existing code
      const inventoryDataset: UploadedDataset = {
        id: 'inventory-latest',
        name: 'Latest Inventory Data',
        type: 'inventory',
        filename: datasets.find(d => d.type === 'inventory')?.filename || 'inventory.csv',
        uploadedAt: datasets.find(d => d.type === 'inventory')?.uploaded_at || new Date().toISOString(),
        recordCount: allInv.length
      };
      setInventoryDataset(inventoryDataset);

      setSalesDataset({
        id: 'sales-' + Date.now(),
        name: 'Database Sales Data',
        type: 'sales',
        filename: 'Database Sales',
        uploadedAt: new Date().toISOString(),
        recordCount: Array.isArray(salesResult) ? salesResult.length : salesResult.data?.length || 0
      });

      setIsLoading(false);
    } catch (err) {
      handleError(err);
      setInventoryDataset(null);
      setSalesDataset(null);
      setAllInventory([]);
      setLatestInventory([]);
      setInventoryTrends([]);
      setDiscontinuedProducts([]);
      setSelectedPeriod(undefined);
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [clearError, handleError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get inventory data for selected period
  const getInventoryForPeriod = useCallback(async (period: string) => {
    try {
      const data = await databaseService.getInventoryData();
      return data.filter(item => item.period === period);
    } catch (error) {
      console.error('Error fetching inventory for period:', error);
      return [];
    }
  }, []);

  // Products for analytics (all periods)
  const productsAllPeriods = useMemo((): ProcessedProduct[] => {
    if (!allInventory.length || !salesData.length) return [];
    try {
      return processProducts(allInventory, allInventory, salesData, currentTimeRange);
    } catch (error) {
      console.error('Failed to process product data:', error);
      handleError(new Error('Failed to process product data'));
      return [];
    }
  }, [allInventory, salesData, currentTimeRange, handleError]);

  // Products for alerts/KPIs (latest period only)
  const productsLatestPeriod = useMemo((): ProcessedProduct[] => {
    if (!latestInventory.length || !salesData.length) return [];
    try {
      return processProducts(latestInventory, allInventory, salesData, currentTimeRange);
    } catch (error) {
      console.error('Failed to process latest product data:', error);
      handleError(new Error('Failed to process latest product data'));
      return [];
    }
  }, [latestInventory, allInventory, salesData, currentTimeRange, handleError]);

  // Products for selected period
  const productsSelectedPeriod = useMemo((): ProcessedProduct[] => {
    if (!selectedPeriod || !salesData.length) return productsLatestPeriod;
    try {
      const periodInventory = allInventory.filter(item => item.period === selectedPeriod);
      return processProducts(periodInventory, allInventory, salesData, currentTimeRange);
    } catch (error) {
      console.error('Failed to process product data for selected period:', error);
      handleError(new Error('Failed to process product data for selected period'));
      return [];
    }
  }, [selectedPeriod, allInventory, salesData, currentTimeRange, productsLatestPeriod, handleError]);

  const hasData = allInventory.length > 0 && salesDataset;

  const refreshData = useCallback(() => {
    if (!isRetrying) {
      setIsRetrying(true);
      loadData();
    }
  }, [loadData, isRetrying]);

  return {
    // Data
    productsAllPeriods,
    productsLatestPeriod,
    productsSelectedPeriod,
    inventoryDataset,
    salesDataset,
    inventoryTrends,
    discontinuedProducts,
    
    // Time management
    currentTimeRange,
    setCurrentTimeRange,
    timeRanges,
    selectedPeriod,
    setSelectedPeriod,
    getInventoryForPeriod,
    
    // State
    hasData,
    isLoading,
    error: errorState?.message || null,
    refreshData,
    isRetrying,
    retry: refreshData,
    
    // Available periods
    availablePeriods: useMemo(() => {
      const periods = new Set(allInventory.map(item => item.period));
      return Array.from(periods)
        .filter(p => !!p)
        .sort((a, b) => Date.parse(b) - Date.parse(a));
    }, [allInventory])
  };
};