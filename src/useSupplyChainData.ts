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
import { databaseService } from '@/services/database';
import { processProducts } from '@/utils/calculations';

const timeRanges: TimeRange[] = [
  { label: '7 days', days: 7, value: '7d' },
  { label: '30 days', days: 30, value: '30d' },
  { label: '90 days', days: 90, value: '90d' },
  { label: '6 months', days: 180, value: '6m' },
  { label: '1 year', days: 365, value: '1y' }
];

export const useSupplyChainData = () => {
  const [inventoryDataset, setInventoryDataset] = useState<UploadedDataset | null>(null);
  const [salesDataset, setSalesDataset] = useState<UploadedDataset | null>(null);
  const [currentTimeRange, setCurrentTimeRange] = useState<TimeRange>(timeRanges[1]); // Default to 30 days
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time-series data state
  const [allInventory, setAllInventory] = useState<InventoryData[]>([]);
  const [latestInventory, setLatestInventory] = useState<InventoryData[]>([]);
  const [inventoryTrends, setInventoryTrends] = useState<TimeSeriesData[]>([]);
  const [discontinuedProducts, setDiscontinuedProducts] = useState<DiscontinuedProductAlert[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(undefined);

  // Load data from Supabase on mount
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get all data in parallel
      const [allInv, latestInv, salesData, datasets, trends, discontinued] = await Promise.all([
        databaseService.getInventoryData(),
        databaseService.getLatestInventoryData(),
        databaseService.getSalesData(),
        databaseService.getDatasets(),
        databaseService.getInventoryTrends('group', 6),
        databaseService.getDiscontinuedProducts(3)
      ]);

      setAllInventory(allInv);
      setLatestInventory(latestInv);
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
        type: 'inventory',
        filename: datasets.find(d => d.type === 'inventory')?.filename || 'inventory.csv',
        uploadDate: datasets.find(d => d.type === 'inventory')?.upload_date || new Date().toISOString(),
        recordCount: allInv.length,
        data: allInv
      };
      setInventoryDataset(inventoryDataset);

      setSalesDataset({
        id: 'sales-' + Date.now(),
        type: 'sales',
        filename: 'Database Sales',
        uploadDate: new Date().toISOString(),
        recordCount: Array.isArray(salesData) ? salesData.length : salesData.data.length,
        data: Array.isArray(salesData) ? salesData : salesData.data
      });

      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading data from Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data from database');
      setInventoryDataset(null);
      setSalesDataset(null);
      setAllInventory([]);
      setLatestInventory([]);
      setInventoryTrends([]);
      setDiscontinuedProducts([]);
      setSelectedPeriod(undefined);
      setIsLoading(false);
    }
  }, []);

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
    if (!allInventory.length || !salesDataset) return [];
    try {
      const salesData = salesDataset.data as SalesData[];
      return processProducts(allInventory, allInventory, salesData, currentTimeRange);
    } catch {
      setError('Failed to process product data');
      return [];
    }
  }, [allInventory, salesDataset, currentTimeRange]);

  // Products for alerts/KPIs (latest period only)
  const productsLatestPeriod = useMemo((): ProcessedProduct[] => {
    if (!latestInventory.length || !salesDataset) return [];
    try {
      const salesData = salesDataset.data as SalesData[];
      return processProducts(latestInventory, allInventory, salesData, currentTimeRange);
    } catch {
      setError('Failed to process product data');
      return [];
    }
  }, [latestInventory, allInventory, salesDataset, currentTimeRange]);

  // Products for selected period
  const productsSelectedPeriod = useMemo((): ProcessedProduct[] => {
    if (!selectedPeriod || !salesDataset) return productsLatestPeriod;
    try {
      const periodInventory = allInventory.filter(item => item.period === selectedPeriod);
      const salesData = salesDataset.data as SalesData[];
      return processProducts(periodInventory, allInventory, salesData, currentTimeRange);
    } catch {
      setError('Failed to process product data for selected period');
      return [];
    }
  }, [selectedPeriod, allInventory, salesDataset, currentTimeRange, productsLatestPeriod]);

  const hasData = allInventory.length > 0 && salesDataset;

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

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
    error,
    refreshData,
    
    // Available periods
    availablePeriods: useMemo(() => {
      const periods = new Set(allInventory.map(item => item.period));
      return Array.from(periods)
        .filter(p => !!p)
        .sort((a, b) => Date.parse(b) - Date.parse(a));
    }, [allInventory])
  };
};