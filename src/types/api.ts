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
export interface LegacyAnalyticsData {
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

// Dashboard Metrics Types
export interface DashboardMetrics {
  totalInventory: number;
  totalInventoryValue: number;
  criticalAlerts: number;
  activeSuppliers: number;
  orderFulfillment: number;
  avgDeliveryTime: number;
  documentIntelligence: {
    totalDocuments: number;
    validatedDocuments: number;
    compromisedInventory: number;
    crossReferenceScore: number;
  };
  triangleAnalytics: {
    salesScore: number;
    financialScore: number;
    supplyChainScore: number;
    documentScore: number;
  };
}

export interface CrossReferenceData {
  supplier_product_impact: {
    supplier_id: string;
    supplier_name: string;
    product_code: string;
    product_name: string;
    lead_time_impact_score: number;
    stockout_risk: number;
    sales_impact: number;
    cost_impact: number;
  }[];
  inventory_supplier_analysis: {
    product_code: string;
    current_stock: number;
    reorder_point: number;
    supplier_lead_times: {
      supplier_id: string;
      supplier_name: string;
      average_lead_time: number;
      risk_level: 'low' | 'medium' | 'high' | 'critical';
    }[];
    stockout_probability: number;
  }[];
  sales_supplier_correlation: {
    product_code: string;
    monthly_sales: number;
    supplier_performance: {
      supplier_id: string;
      supplier_name: string;
      delivery_performance: number;
      quality_score: number;
      impact_on_sales: number;
    }[];
  }[];
}

// Real-time Dashboard Analytics
export interface RealTimeAnalyticsData {
  metrics: DashboardMetrics;
  charts: {
    inventoryTrends: Array<{ date: string; value: number }>;
    supplierPerformance: Array<{ name: string; value: number }>;
    marketIntelligence: Array<{ category: string; value: number }>;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: string;
  }>;
  insights: Array<{
    id: string;
    type: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
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