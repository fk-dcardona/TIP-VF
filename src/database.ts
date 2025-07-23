import { supabase, type InventoryRecord, type SalesRecord, type Dataset } from '@/lib/supabase'
import type { InventoryData, SalesData, TimeSeriesData, DiscontinuedProductAlert, SalesKPIs, SalesPerformanceData } from '@/types'

// Cache interface for performance optimization
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface Cache {
  [key: string]: CacheEntry<any>;
}

// In-memory cache for expensive queries
const cache: Cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default TTL

// Cache utility functions
const getCacheKey = (prefix: string, params: Record<string, any>): string => {
  const sortedParams = Object.keys(params).sort().map(key => `${key}:${params[key]}`).join('|');
  return `${prefix}:${sortedParams}`;
};

const getFromCache = <T>(key: string): T | null => {
  const entry = cache[key];
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    delete cache[key];
    return null;
  }
  
  return entry.data;
};

const setCache = <T>(key: string, data: T, ttl: number = CACHE_TTL): void => {
  cache[key] = {
    data,
    timestamp: Date.now(),
    ttl
  };
};

const clearCache = (prefix?: string): void => {
  if (prefix) {
    Object.keys(cache).forEach(key => {
      if (key.startsWith(prefix)) {
        delete cache[key];
      }
    });
  } else {
    Object.keys(cache).forEach(key => delete cache[key]);
  }
};

// Pagination interface
interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Convert internal types to database types
const convertInventoryToRecord = (item: InventoryData): Omit<InventoryRecord, 'id' | 'created_at' | 'updated_at'> => ({
  product_code: item.k_sc_codigo_articulo,
  product_detail: item.sc_detalle_articulo,
  product_group: item.sc_detalle_grupo,
  product_subgroup: item.sc_detalle_subgrupo,
  period: item.period,
  previous_stock: item.n_saldo_anterior || 0,
  stock_in: item.n_entradas || 0,
  stock_out: item.n_salidas || 0,
  current_stock: item.n_saldo_actual,
  average_cost: item.n_costo_promedio,
  last_cost: item.n_ultimo_costo || 0,
  unit_type: item.sc_tipo_unidad || 'UNIT'
})

const convertRecordToInventory = (record: InventoryRecord): InventoryData => ({
  code: record.product_code,
  name: record.product_detail,
  group: record.product_group,
  currentStock: record.current_stock,
  cost: record.average_cost,
  // Legacy fields for backward compatibility
  k_sc_codigo_articulo: record.product_code,
  sc_detalle_articulo: record.product_detail,
  sc_detalle_grupo: record.product_group,
  sc_detalle_subgrupo: record.product_subgroup || '',
  period: record.period || new Date().toISOString().split('T')[0],
  n_saldo_anterior: record.previous_stock || 0,
  n_entradas: record.stock_in || 0,
  n_salidas: record.stock_out || 0,
  n_saldo_actual: record.current_stock,
  n_costo_promedio: record.average_cost,
  n_ultimo_costo: record.last_cost || 0,
  sc_tipo_unidad: record.unit_type || 'UNIT'
})

const convertSalesToRecord = (item: SalesData): Omit<SalesRecord, 'id' | 'created_at' | 'updated_at'> => ({
  product_source_code: item.k_sc_codigo_fuente || '',
  document_number: item.n_numero_documento || 0,
  movement_type: item.ka_nl_movimiento || '',
  document_date: item.d_fecha_documento,
  customer_name: item.sc_nombre || '',
  customer_id: item.n_nit || 0,
  customer_phone: item.sc_telefono_ppal || '',
  customer_alt_phone: item.sc_telefono_alterno || '',
  source_name: item.sc_nombre_fuente || '',
  brand: item.MARCA || '',
  product_code: item.k_sc_codigo_articulo,
  product_detail: item.sc_detalle_articulo,
  product_quantity: item.n_cantidad,
  product_value: item.n_valor,
  gross_value: item['V. BRUTA'] || 0,
  tax_amount: item.n_iva || 0,
  discount_amount: item.n_descuento || 0,
  discount_percentage: item.DESCUENTO || 0,
  net_value: item['V. NETA'] || 0,
  product_group: item.sc_detalle_grupo || '',
  inventory_sign: item.sc_signo_inventario || '',
  territory: item.zona || '',
  third_party_code: item.ka_nl_tercero || '',
  salesperson_name: item.nombre_vendedor || ''
})

// Database service functions
export const databaseService = {
  // Cache management
  clearCache,
  
  // Save inventory data in batches for better performance
  async saveInventoryData(data: InventoryData[], filename: string) {
    try {
      console.log(`Saving ${data.length} inventory records to Supabase...`)
      
      // Clear inventory cache when new data is saved
      clearCache('inventory');
      
      // Create dataset record
      const { data: dataset, error: datasetError } = await supabase
        .from('datasets')
        .insert({
          name: `Inventory - ${filename}`,
          type: 'inventory',
          filename,
          upload_date: new Date().toISOString(),
          record_count: data.length,
          status: 'processing'
        })
        .select()
        .single()
      
      if (datasetError) throw datasetError
      
      // Convert and save inventory records in batches
      const batchSize = 1000
      const records = data.map(item => convertInventoryToRecord(item))
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        const { error: insertError } = await supabase
          .from('inventory')
          .upsert(batch, { 
            onConflict: 'k_sc_codigo_articulo,period',
            ignoreDuplicates: false 
          })
        
        if (insertError) throw insertError
        console.log(`Saved batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`)
      }
      
      // Update dataset status
      await supabase
        .from('datasets')
        .update({ status: 'completed' })
        .eq('id', dataset.id)
      
      console.log('✅ Inventory data saved successfully')
      return dataset
    } catch (error) {
      console.error('Error saving inventory data:', error)
      throw error
    }
  },

  async saveSalesData(data: SalesData[], filename: string) {
    try {
      console.log(`Saving ${data.length} sales records to Supabase...`)
      
      // Clear sales cache when new data is saved
      clearCache('sales');
      
      // Create dataset record
      const { data: dataset, error: datasetError } = await supabase
        .from('datasets')
        .insert({
          name: `Sales - ${filename}`,
          type: 'sales',
          filename,
          upload_date: new Date().toISOString(),
          record_count: data.length,
          status: 'processing'
        })
        .select()
        .single()
      
      if (datasetError) throw datasetError
      
      // Convert and save sales records in batches
      const batchSize = 1000
      const records = data.map(convertSalesToRecord)
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        const { error: insertError } = await supabase
          .from('sales')
          .insert(batch)
        
        if (insertError) throw insertError
        console.log(`Saved batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`)
      }
      
      // Update dataset status
      await supabase
        .from('datasets')
        .update({ status: 'completed' })
        .eq('id', dataset.id)
      
      console.log('✅ Sales data saved successfully')
      return dataset
    } catch (error) {
      console.error('Error saving sales data:', error)
      throw error
    }
  },

  // Enhanced inventory data fetching with caching
  async getInventoryData(): Promise<(InventoryData & { period?: string })[]> {
    const cacheKey = getCacheKey('inventory', { all: true });
    const cached = getFromCache<(InventoryData & { period?: string })[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      
      const result = data.map(record => ({
        ...convertRecordToInventory(record),
        period: record.period || undefined
      }))
      
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching inventory data:', error)
      return []
    }
  },

  async getLatestInventoryPeriod(): Promise<string | undefined> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('period')
        .order('period', { ascending: false })
        .limit(1)
      if (error) throw error
      return data && data.length > 0 ? data[0].period : undefined
    } catch (error) {
      console.error('Error fetching latest inventory period:', error)
      return undefined
    }
  },

  async getInventoryDataByPeriod(period: string): Promise<InventoryData[]> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('period', period)
      if (error) throw error
      return data.map(record => convertRecordToInventory(record))
    } catch (error) {
      console.error('Error fetching inventory data by period:', error)
      return []
    }
  },

  // Enhanced sales data fetching with pagination and caching
  async getSalesData(pagination?: PaginationParams): Promise<PaginatedResult<SalesData> | SalesData[]> {
    const cacheKey = getCacheKey('sales', { 
      page: pagination?.page || 0, 
      pageSize: pagination?.pageSize || 0,
      sortBy: pagination?.sortBy,
      sortOrder: pagination?.sortOrder
    });
    
    const cached = getFromCache<PaginatedResult<SalesData> | SalesData[]>(cacheKey);
    if (cached) return cached;

    try {
      let query = supabase.from('sales').select('*', { count: 'exact' });
      
      // Apply sorting
      if (pagination?.sortBy) {
        query = query.order(pagination.sortBy, { 
          ascending: pagination.sortOrder === 'asc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      // Apply pagination
      if (pagination) {
        const from = pagination.page * pagination.pageSize;
        const to = from + pagination.pageSize - 1;
        query = query.range(from, to);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      const result = data.map(record => ({
        productCode: record.product_code,
        date: record.document_date,
        quantity: record.product_quantity,
        value: record.net_value || 0,
        // Legacy fields for backward compatibility
        k_sc_codigo_fuente: record.product_source_code || '',
        n_numero_documento: record.document_number || 0,
        ka_nl_movimiento: record.movement_type || '',
        d_fecha_documento: record.document_date,
        sc_nombre: record.customer_name || '',
        n_nit: record.customer_id || 0,
        sc_telefono_ppal: record.customer_phone || '',
        sc_telefono_alterno: record.customer_alt_phone || '',
        sc_nombre_fuente: record.source_name || '',
        MARCA: record.brand || '',
        k_sc_codigo_articulo: record.product_code,
        sc_detalle_articulo: record.product_detail,
        n_cantidad: record.product_quantity,
        n_valor: record.product_value,
        'V. BRUTA': record.gross_value || 0,
        n_iva: record.tax_amount || 0,
        n_descuento: record.discount_amount || 0,
        DESCUENTO: record.discount_percentage || 0,
        'V. NETA': record.net_value || 0,
        sc_detalle_grupo: record.product_group || '',
        sc_signo_inventario: record.inventory_sign || '',
        zona: record.territory || '',
        ka_nl_tercero: record.third_party_code || '',
        nombre_vendedor: record.salesperson_name || ''
      }));
      
      if (pagination && count !== null) {
        const paginatedResult: PaginatedResult<SalesData> = {
          data: result,
          total: count,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: Math.ceil(count / pagination.pageSize),
          hasNext: pagination.page < Math.ceil(count / pagination.pageSize) - 1,
          hasPrev: pagination.page > 0
        };
        setCache(cacheKey, paginatedResult);
        return paginatedResult;
      } else {
        setCache(cacheKey, result);
        return result;
      }
    } catch (error) {
      console.error('Error fetching sales data:', error)
      return pagination ? { data: [], total: 0, page: 0, pageSize: 0, totalPages: 0, hasNext: false, hasPrev: false } : []
    }
  },

  async getDatasets(): Promise<Dataset[]> {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching datasets:', error)
      return []
    }
  },

  async clearAllData() {
    try {
      // Clear in order due to foreign key constraints
      await supabase.from('sales').delete().neq('id', 0)
      await supabase.from('inventory').delete().neq('id', 0)
      await supabase.from('datasets').delete().neq('id', 0)
      console.log('✅ All data cleared')
    } catch (error) {
      console.error('Error clearing data:', error)
      throw error
    }
  },

  async getLatestInventoryData(): Promise<InventoryData[]> {
    try {
      // Get the latest period for each SKU
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('period', { ascending: false })
      
      if (error) throw error
      
      // Group by SKU and take the latest period for each
      const latestBySku = new Map<string, InventoryData>();
      data.forEach(record => {
        const sku = record.k_sc_codigo_articulo;
        if (!latestBySku.has(sku)) {
          latestBySku.set(sku, convertRecordToInventory(record));
        } else {
          const existing = latestBySku.get(sku)!;
          if (Date.parse(record.period) > Date.parse(existing.period)) {
            latestBySku.set(sku, convertRecordToInventory(record));
          }
        }
      });
      
      return Array.from(latestBySku.values());
    } catch (error) {
      console.error('Error fetching latest inventory data:', error)
      return []
    }
  },

  async getInventoryTrends(groupBy: 'group' | 'subgroup' = 'group', months: number = 6): Promise<TimeSeriesData[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
      
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .gte('period', cutoffDate.toISOString().split('T')[0])
        .order('period', { ascending: true })
      
      if (error) throw error
      
      // Group by period and product group/subgroup
      const trends = new Map<string, { total: number; count: number }>();
      
      data.forEach(record => {
        const groupKey = groupBy === 'group' ? record.sc_detalle_grupo : record.sc_detalle_subgrupo;
        const periodKey = `${record.period}-${groupKey}`;
        
        if (!trends.has(periodKey)) {
          trends.set(periodKey, { total: 0, count: 0 });
        }
        
        const trend = trends.get(periodKey)!;
        trend.total += record.n_saldo_actual * record.n_costo_promedio; // Stock value
        trend.count += 1;
      });
      
      return Array.from(trends.entries()).map(([key, data]) => {
        const [period, group] = key.split('-', 2);
        return {
          period,
          value: data.total,
          metric: 'stock_value',
          group,
          subgroup: groupBy === 'subgroup' ? group : undefined
        };
      });
    } catch (error) {
      console.error('Error fetching inventory trends:', error)
      return []
    }
  },

  async getDiscontinuedProducts(monthsThreshold: number = 3): Promise<DiscontinuedProductAlert[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsThreshold);
      
      // Get all products and their last seen period
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('period', { ascending: false })
      
      if (error) throw error
      
      // Group by SKU and find last seen period
      const lastSeenBySku = new Map<string, { period: string; productName: string; revenue: number; margin: number }>();
      
      data.forEach(record => {
        const sku = record.k_sc_codigo_articulo;
        if (!lastSeenBySku.has(sku)) {
          lastSeenBySku.set(sku, {
            period: record.period,
            productName: record.sc_detalle_articulo,
            revenue: 0, // Will be calculated from sales data
            margin: 0   // Will be calculated from sales data
          });
        }
      });
      
      // Find discontinued products
      const discontinued: DiscontinuedProductAlert[] = [];
      
      lastSeenBySku.forEach((data, sku) => {
        const lastSeenDate = new Date(data.period);
        const monthsMissing = Math.floor((Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        
        if (monthsMissing >= monthsThreshold) {
          discontinued.push({
            productCode: sku,
            productName: data.productName,
            lastSeenPeriod: data.period,
            monthsMissing,
            previousRevenue: data.revenue,
            previousMargin: data.margin,
            recommendation: data.revenue > 10000 || data.margin > 20 ? 'REVIEW' : 'ELIMINATE',
            reasoning: data.revenue > 10000 ? 
              'High revenue product - review before elimination' : 
              'Low revenue product - consider elimination'
          });
        }
      });
      
      return discontinued;
    } catch (error) {
      console.error('Error fetching discontinued products:', error)
      return []
    }
  },

  // Pre-calculated KPIs with caching
  async getPreCalculatedKPIs(timeRange: { startDate: string; endDate: string }): Promise<SalesKPIs | null> {
    const cacheKey = getCacheKey('kpis', timeRange);
    const cached = getFromCache<SalesKPIs>(cacheKey);
    if (cached) return cached;

    try {
      // Get sales and inventory data for the time range
      const salesData = await this.getSalesData() as SalesData[];
      const inventoryData = await this.getInventoryData();
      
      // Import and calculate KPIs
      const { calculateSalesKPIs } = await import('@/salesAnalytics');
      const kpis = calculateSalesKPIs(salesData, inventoryData, timeRange);
      
      setCache(cacheKey, kpis, 10 * 60 * 1000); // 10 minutes TTL for KPIs
      return kpis;
    } catch (error) {
      console.error('Error calculating KPIs:', error);
      return null;
    }
  },

  // Pre-calculated sales performance data
  async getPreCalculatedSalesPerformance(timeRange: { startDate: string; endDate: string }): Promise<SalesPerformanceData | null> {
    const cacheKey = getCacheKey('sales-performance', timeRange);
    const cached = getFromCache<SalesPerformanceData>(cacheKey);
    if (cached) return cached;

    try {
      const salesData = await this.getSalesData() as SalesData[];
      const inventoryData = await this.getInventoryData();
      
      // Import calculation functions
      const { 
        calculateOutletCoverage, 
        calculateProductLinePerformance, 
        calculateCustomerAnalytics 
      } = await import('@/salesAnalytics');
      
      const outletCoverage = calculateOutletCoverage(salesData, timeRange);
      const productLinePerformance = calculateProductLinePerformance(salesData, inventoryData, timeRange);
      const customerAnalytics = calculateCustomerAnalytics(salesData, timeRange);
      
      // Generate time series data (simplified)
      const monthlyRevenue: TimeSeriesData[] = [];
      const grossMarginTrend: TimeSeriesData[] = [];
      const salesVelocity: TimeSeriesData[] = [];
      
      // Group sales by month
      const salesByMonth = salesData.reduce((acc, sale) => {
        const month = new Date(sale.d_fecha_documento).toISOString().slice(0, 7);
        if (!acc[month]) acc[month] = { revenue: 0, quantity: 0, count: 0 };
        acc[month].revenue += sale['V. NETA'];
        acc[month].quantity += sale.n_cantidad;
        acc[month].count += 1;
        return acc;
      }, {} as Record<string, { revenue: number; quantity: number; count: number }>);
      
      Object.entries(salesByMonth).forEach(([month, data]) => {
        monthlyRevenue.push({
          period: month,
          value: data.revenue,
          metric: 'revenue'
        });
        salesVelocity.push({
          period: month,
          value: data.quantity,
          metric: 'quantity'
        });
      });
      
      const performanceData: SalesPerformanceData = {
        monthlyRevenue,
        grossMarginTrend,
        salesVelocity,
        customerSegmentation: {},
        topProducts: productLinePerformance.slice(0, 10),
        topCustomers: customerAnalytics.slice(0, 10),
        outletCoverage,
        territoryPerformance: {}
      };
      
      setCache(cacheKey, performanceData, 10 * 60 * 1000); // 10 minutes TTL
      return performanceData;
    } catch (error) {
      console.error('Error calculating sales performance:', error);
      return null;
    }
  },
} 