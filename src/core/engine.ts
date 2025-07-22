import type {
  AnalyticsEngine,
  AnalyticsConfig,
  DataSource,
  DataProcessor,
  Calculator,
  Alerter,
  ProcessedData,
  ValidationResult,
  CalculationConfig,
  AlertConfig,
  MetricResult,
  Alert,
  AnalyticsResults,
  TimeSeriesPoint
} from './types';

/**
 * Core Analytics Engine - Implements SOLID principles
 * 
 * Single Responsibility: Each component has one clear purpose
 * Open/Closed: Extensible through registration of new processors, calculators, alerters
 * Liskov Substitution: All implementations follow the same interfaces
 * Interface Segregation: Clean, focused interfaces
 * Dependency Inversion: Depends on abstractions, not concrete implementations
 */
export class CoreAnalyticsEngine implements AnalyticsEngine {
  public config: AnalyticsConfig;
  public dataSources: Map<string, DataSource>;
  public processors: Map<string, DataProcessor>;
  public calculators: Map<string, Calculator>;
  public alerters: Map<string, Alerter>;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.dataSources = new Map();
    this.processors = new Map();
    this.calculators = new Map();
    this.alerters = new Map();
    
    // Register configured data sources
    config.dataSources.forEach(source => this.registerDataSource(source));
  }

  // Registration methods - Open for extension
  registerDataSource(source: DataSource): void {
    this.dataSources.set(source.id, source);
  }

  registerProcessor(id: string, processor: DataProcessor): void {
    this.processors.set(id, processor);
  }

  registerCalculator(id: string, calculator: Calculator): void {
    this.calculators.set(id, calculator);
  }

  registerAlerter(id: string, alerter: Alerter): void {
    this.alerters.set(id, alerter);
  }

  // Data processing - Single responsibility
  async processData(sourceId: string, data: unknown[]): Promise<ProcessedData> {
    const source = this.dataSources.get(sourceId);
    if (!source) {
      throw new Error(`Data source '${sourceId}' not found`);
    }

    const processor = this.processors.get(sourceId);
    if (!processor) {
      throw new Error(`Processor for source '${sourceId}' not found`);
    }

    const validationResult = processor.validate(data);
    const processedRecords = processor.process(data);

    return {
      sourceId,
      records: processedRecords,
      metadata: {
        processedAt: new Date().toISOString(),
        rowCount: processedRecords.length,
        validationResult
      }
    };
  }

  validateData(sourceId: string, data: unknown[]): ValidationResult {
    const processor = this.processors.get(sourceId);
    if (!processor) {
      return {
        isValid: false,
        errors: [`Processor for source '${sourceId}' not found`],
        warnings: [],
        rowCount: 0,
        columnCount: 0,
        preview: []
      };
    }

    return processor.validate(data);
  }

  // Analytics calculations - Interface segregation
  async calculateMetrics(data: ProcessedData, configs: CalculationConfig[]): Promise<MetricResult[]> {
    const results: MetricResult[] = [];

    for (const config of configs) {
      const calculator = this.calculators.get(config.id);
      if (!calculator) {
        console.warn(`Calculator '${config.id}' not found, skipping calculation`);
        continue;
      }

      try {
        const result = await calculator.calculate(data, config);
        results.push(result);
      } catch (error) {
        console.error(`Error calculating metric '${config.id}':`, error);
        // Continue with other calculations
      }
    }

    return results;
  }

  async generateAlerts(data: ProcessedData, configs: AlertConfig[]): Promise<Alert[]> {
    const alerts: Alert[] = [];

    for (const config of configs) {
      const alerter = this.alerters.get(config.id);
      if (!alerter) {
        console.warn(`Alerter '${config.id}' not found, skipping alert generation`);
        continue;
      }

      try {
        const result = await alerter.check(data, config);
        alerts.push(...result);
      } catch (error) {
        console.error(`Error generating alerts for '${config.id}':`, error);
        // Continue with other alerters
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // Time series creation - Single responsibility
  createTimeSeries(data: ProcessedData, timeField: string, valueField: string): TimeSeriesPoint[] {
    const timeSeries: TimeSeriesPoint[] = [];
    const grouped = new Map<string, number[]>();

    // Group values by timestamp
    data.records.forEach((record: any) => {
      const timestamp = record[timeField];
      const value = record[valueField];

      if (timestamp && typeof value === 'number') {
        if (!grouped.has(timestamp)) {
          grouped.set(timestamp, []);
        }
        grouped.get(timestamp)!.push(value);
      }
    });

    // Calculate average for each timestamp
    grouped.forEach((values, timestamp) => {
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      timeSeries.push({
        timestamp,
        value: average,
        metadata: {
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        }
      });
    });

    return timeSeries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  // Export functionality - Single responsibility
  async exportResults(results: AnalyticsResults, format: 'json' | 'csv' | 'excel'): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2);
      
      case 'csv':
        return this.exportToCSV(results);
      
      case 'excel':
        return this.exportToExcel(results);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private exportToCSV(results: AnalyticsResults): string {
    const lines: string[] = [];
    
    // Metrics CSV
    lines.push('Metrics');
    lines.push('ID,Name,Value,Unit,Timestamp');
    results.metrics.forEach(metric => {
      lines.push(`${metric.id},${metric.name},${metric.value},${metric.unit || ''},${metric.timestamp}`);
    });
    
    lines.push(''); // Empty line
    
    // Alerts CSV
    lines.push('Alerts');
    lines.push('ID,Type,Severity,Title,Message,Timestamp');
    results.alerts.forEach(alert => {
      lines.push(`${alert.id},${alert.type},${alert.severity},${alert.title},${alert.message},${alert.timestamp}`);
    });
    
    return lines.join('\n');
  }

  private exportToExcel(results: AnalyticsResults): string {
    // Simplified Excel export - in real implementation, use a library like xlsx
    return this.exportToCSV(results); // Fallback to CSV for now
  }

  // Utility methods
  getDataSource(id: string): DataSource | undefined {
    return this.dataSources.get(id);
  }

  getProcessor(id: string): DataProcessor | undefined {
    return this.processors.get(id);
  }

  getCalculator(id: string): Calculator | undefined {
    return this.calculators.get(id);
  }

  getAlerter(id: string): Alerter | undefined {
    return this.alerters.get(id);
  }

  // Configuration management
  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Health check
  getHealthStatus(): { status: 'healthy' | 'warning' | 'error'; issues: string[] } {
    const issues: string[] = [];
    
    // Check data sources
    this.config.dataSources.forEach(source => {
      if (!this.dataSources.has(source.id)) {
        issues.push(`Data source '${source.id}' not registered`);
      }
    });
    
    // Check processors
    this.config.dataSources.forEach(source => {
      if (!this.processors.has(source.id)) {
        issues.push(`Processor for source '${source.id}' not registered`);
      }
    });
    
    // Check calculators
    this.config.calculations.forEach(calc => {
      if (!this.calculators.has(calc.id)) {
        issues.push(`Calculator '${calc.id}' not registered`);
      }
    });
    
    // Check alerters
    this.config.alerts.forEach(alert => {
      if (!this.alerters.has(alert.id)) {
        issues.push(`Alerter '${alert.id}' not registered`);
      }
    });
    
    const status = issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'warning' : 'error';
    
    return { status, issues };
  }
} 