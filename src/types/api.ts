// API Response Types

export interface Upload {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  upload_date: string;
  user_id: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  row_count: number;
  column_count: number;
  data_summary: {
    columns: string[];
    dtypes: Record<string, string>;
    sample_data: Record<string, any>[];
  } | null;
  error_message: string | null;
}

export interface ProcessedData {
  id: number;
  upload_id: number;
  data_type: string;
  processed_data: any;
  created_date: string;
}

export interface UploadResponse {
  success: boolean;
  upload: Upload;
  analytics?: any;
  agent_result?: any;
  insights?: {
    total_alerts: number;
    critical_items: number;
    key_recommendations: string[];
    agent_confidence: number;
  };
  warning?: string;
}

export interface UploadsListResponse {
  uploads: Upload[];
}

export interface UploadDetailsResponse {
  upload: Upload;
}

export interface AnalysisResponse {
  upload_id: number;
  analytics: {
    summary: {
      analytics: {
        total_inventory: number;
        total_suppliers: number;
      };
    };
  };
}

export interface DashboardMetrics {
  total_inventory: string;
  order_fulfillment: string;
  avg_delivery_time: string;
  active_suppliers: number;
  trends: {
    inventory_change: string;
    fulfillment_change: string;
    delivery_change: string;
    supplier_change: string;
  };
}

export interface DashboardData {
  metrics: DashboardMetrics;
  charts: {
    inventory_trends: Array<{ date: string; value: number }>;
    supplier_performance: Array<{ name: string; performance: number; deliveries: number }>;
  };
  recent_activity: Array<{
    product: string;
    supplier: string;
    quantity: string;
    status: string;
    date: string;
  }>;
}

export interface DashboardResponse {
  metrics: DashboardMetrics;
  charts: any;
  recent_activity: any[];
}

export interface InsightsResponse {
  success: boolean;
  insights?: any;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}