// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Upload Types
export interface Upload {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedAt: string;
  processedAt?: string;
  organizationId: string;
  metadata?: Record<string, any>;
}

export interface UploadResponse extends APIResponse<Upload> {}

// Analytics Types
export interface AnalyticsData {
  summary: DashboardSummary;
  product_performance: ProductPerformance[];
  inventory_alerts: InventoryAlert[];
  financial_insights: FinancialInsights;
  key_metrics: KeyMetrics;
  recommendations: string[];
}

export interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalSuppliers: number;
  growthRate: number;
  lastUpdated: string;
}

export interface ProductPerformance {
  id: string;
  name: string;
  revenue: number;
  units: number;
  growth: number;
  margin: number;
}

export interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'overstock' | 'expiring' | 'discrepancy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  productId?: string;
  createdAt: string;
}

export interface FinancialInsights {
  cashFlow: number;
  workingCapital: number;
  profitMargin: number;
  debtRatio: number;
  trends: FinancialTrend[];
}

export interface FinancialTrend {
  period: string;
  value: number;
  change: number;
}

export interface KeyMetrics {
  customerSatisfaction: number;
  supplierPerformance: number;
  inventoryTurnover: number;
  orderFulfillment: number;
}

// Health Check Types
export interface APIHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    [service: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
      lastCheck: string;
    };
  };
  database: {
    status: 'connected' | 'disconnected';
    responseTime: number;
  };
  external: {
    [service: string]: {
      status: 'available' | 'unavailable';
      responseTime: number;
    };
  };
}

// Error Types
export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface NetworkError {
  type: 'network';
  message: string;
  status?: number;
}

export interface TimeoutError {
  type: 'timeout';
  message: string;
  timeout: number;
} 