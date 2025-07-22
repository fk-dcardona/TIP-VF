// Core Analytics Types - Foundation for modular analytics engine

// Base data interfaces
export interface BaseDataRecord {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'csv' | 'api' | 'database' | 'file';
  schema: Record<string, 'string' | 'number' | 'date' | 'boolean'>;
  validationRules?: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  value?: unknown;
  message: string;
}

// Analytics Configuration
export interface AnalyticsConfig {
  dataSources: DataSource[];
  calculations: CalculationConfig[];
  alerts: AlertConfig[];
  timeRanges: TimeRangeConfig[];
  customFields?: Record<string, unknown>;
}

export interface CalculationConfig {
  id: string;
  name: string;
  type: 'kpi' | 'metric' | 'formula' | 'aggregation';
  formula: string;
  inputs: string[];
  outputs: string[];
  description?: string;
}

export interface AlertConfig {
  id: string;
  name: string;
  type: 'threshold' | 'trend' | 'anomaly' | 'custom';
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actions?: string[];
  value?: number; // Threshold value for the alert
}

export interface TimeRangeConfig {
  id: string;
  label: string;
  days: number;
  default?: boolean;
}

// Data Processing
export interface DataProcessor<T = unknown> {
  process(data: unknown[]): T[];
  validate(data: unknown[]): ValidationResult;
  transform(data: T[]): unknown[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  columnCount: number;
  preview: unknown[];
}

// Analytics Engine Core
export interface AnalyticsEngine {
  config: AnalyticsConfig;
  dataSources: Map<string, DataSource>;
  processors: Map<string, DataProcessor>;
  calculators: Map<string, Calculator>;
  alerters: Map<string, Alerter>;
  
  // Core methods
  registerDataSource(source: DataSource): void;
  registerProcessor(id: string, processor: DataProcessor): void;
  registerCalculator(id: string, calculator: Calculator): void;
  registerAlerter(id: string, alerter: Alerter): void;
  
  // Data processing
  processData(sourceId: string, data: unknown[]): Promise<ProcessedData>;
  validateData(sourceId: string, data: unknown[]): ValidationResult;
  
  // Analytics
  calculateMetrics(data: ProcessedData, config: CalculationConfig[]): Promise<MetricResult[]>;
  generateAlerts(data: ProcessedData, config: AlertConfig[]): Promise<Alert[]>;
  
  // Time series
  createTimeSeries(data: ProcessedData, timeField: string, valueField: string): TimeSeriesPoint[];
  
  // Export
  exportResults(results: AnalyticsResults, format: 'json' | 'csv' | 'excel'): Promise<string>;
}

export interface ProcessedData {
  sourceId: string;
  records: unknown[];
  metadata: {
    processedAt: string;
    rowCount: number;
    validationResult: ValidationResult;
  };
}

export interface Calculator {
  id: string;
  name: string;
  calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult>;
}

export interface Alerter {
  id: string;
  name: string;
  check(data: ProcessedData, config: AlertConfig): Promise<Alert[]>;
}

export interface MetricResult {
  id: string;
  name: string;
  value: number;
  unit?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  affectedEntity?: string;
  currentValue?: number;
  thresholdValue?: number;
  timestamp: string;
  isAcknowledged: boolean;
  actions?: string[];
}

export interface AnalyticsResults {
  metrics: MetricResult[];
  alerts: Alert[];
  timeSeries: TimeSeriesPoint[];
  metadata: {
    generatedAt: string;
    dataSource: string;
    timeRange: string;
  };
}

// Dashboard Configuration
export interface DashboardConfig {
  id: string;
  name: string;
  layout: DashboardLayout;
  widgets: WidgetConfig[];
  filters: FilterConfig[];
  refreshInterval?: number;
}

export interface DashboardLayout {
  type: 'grid' | 'flexible' | 'custom';
  columns: number;
  rows: number;
  widgets: WidgetPosition[];
}

export interface WidgetPosition {
  widgetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetConfig {
  id: string;
  type: 'chart' | 'kpi' | 'table' | 'alert' | 'custom';
  title: string;
  dataSource: string;
  metrics: string[];
  visualization?: VisualizationConfig;
  refreshInterval?: number;
}

export interface VisualizationConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'table' | 'gauge';
  options?: Record<string, unknown>;
  colors?: string[];
  thresholds?: ThresholdConfig[];
}

export interface ThresholdConfig {
  value: number;
  color: string;
  label?: string;
}

export interface FilterConfig {
  id: string;
  name: string;
  type: 'date' | 'select' | 'multiselect' | 'range' | 'search';
  field: string;
  defaultValue?: unknown;
  options?: unknown[];
}

// Export interfaces for external use
export interface AnalyticsModule {
  engine: AnalyticsEngine;
  dashboard: DashboardConfig;
  types: {
    ProcessedData: ProcessedData;
    MetricResult: MetricResult;
    Alert: Alert;
    AnalyticsResults: AnalyticsResults;
  };
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>; 