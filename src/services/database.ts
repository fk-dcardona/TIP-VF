/**
 * Database Service - Re-export from main database module
 * This provides a centralized service interface for database operations
 */

// Re-export the database service from the main database module
export { databaseService } from '../database';

// Also export types that might be needed
export type { 
  InventoryRecord, 
  SalesRecord, 
  Dataset 
} from '../lib/supabase';

export type { 
  InventoryData, 
  SalesData, 
  TimeSeriesData, 
  DiscontinuedProductAlert, 
  SalesKPIs, 
  SalesPerformanceData 
} from '../types'; 