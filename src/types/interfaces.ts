/**
 * Segregated Interfaces - Interface Segregation Principle Implementation
 * Clients should not be forced to depend on interfaces they do not use
 */

// Base interface for all data providers
export interface DataProvider {
  id: string;
  name: string;
}

// Interface for metrics data only
export interface MetricsProvider extends DataProvider {
  getMetrics(): Promise<any>;
  getMetricsSummary(): Promise<any>;
}

// Interface for analytics data only
export interface AnalyticsProvider extends DataProvider {
  getAnalytics(): Promise<any>;
  getAnalyticsSummary(): Promise<any>;
}

// Interface for document data only
export interface DocumentProvider extends DataProvider {
  getDocuments(): Promise<any>;
  getDocumentSummary(): Promise<any>;
}

// Interface for activity data only
export interface ActivityProvider extends DataProvider {
  getRecentActivity(): Promise<any>;
  getActivitySummary(): Promise<any>;
}

// Interface for insights data only
export interface InsightsProvider extends DataProvider {
  getInsights(): Promise<any>;
  getInsightsSummary(): Promise<any>;
}

// Interface for real-time updates only
export interface RealTimeProvider extends DataProvider {
  subscribeToUpdates(callback: (data: any) => void): void;
  unsubscribeFromUpdates(callback: (data: any) => void): void;
}

// Interface for configuration management only
export interface ConfigProvider extends DataProvider {
  getConfig(): Promise<any>;
  updateConfig(config: any): Promise<void>;
}

// Interface for error handling only
export interface ErrorHandler {
  handleError(error: Error): void;
  logError(error: Error): void;
}

// Interface for loading states only
export interface LoadingState {
  isLoading: boolean;
  setLoading(loading: boolean): void;
}

// Interface for data validation only
export interface DataValidator {
  validate(data: any): boolean;
  getValidationErrors(): string[];
}

// Interface for data transformation only
export interface DataTransformer {
  transform(data: any): any;
  transformBatch(data: any[]): any[];
}

// Interface for caching only
export interface CacheProvider {
  get(key: string): any;
  set(key: string, value: any, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
}

// Interface for API communication only
export interface APIClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: any): Promise<T>;
  put<T>(url: string, data: any): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

// Interface for authentication only
export interface AuthProvider {
  isAuthenticated(): boolean;
  getCurrentUser(): any;
  login(credentials: any): Promise<void>;
  logout(): Promise<void>;
}

// Interface for permissions only
export interface PermissionProvider {
  hasPermission(permission: string): boolean;
  getUserPermissions(): string[];
}

// Interface for notifications only
export interface NotificationProvider {
  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void;
  subscribeToNotifications(callback: (notification: any) => void): void;
}

// Interface for localization only
export interface LocalizationProvider {
  getText(key: string): string;
  getCurrentLocale(): string;
  setLocale(locale: string): void;
}

// Interface for theme management only
export interface ThemeProvider {
  getCurrentTheme(): string;
  setTheme(theme: string): void;
  getThemeColors(): Record<string, string>;
}

// Interface for routing only
export interface RouterProvider {
  navigate(path: string): void;
  getCurrentPath(): string;
  getQueryParams(): Record<string, string>;
}

// Interface for storage only
export interface StorageProvider {
  get(key: string): any;
  set(key: string, value: any): void;
  remove(key: string): void;
  clear(): void;
}

// Interface for logging only
export interface LoggerProvider {
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void;
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
}

// Interface for metrics collection only
export interface MetricsCollector {
  trackEvent(eventName: string, properties?: Record<string, any>): void;
  trackPageView(pageName: string): void;
  trackError(error: Error): void;
}

// Interface for data export only
export interface DataExporter {
  exportToCSV(data: any[], filename: string): void;
  exportToJSON(data: any, filename: string): void;
  exportToPDF(data: any, filename: string): void;
}

// Interface for data import only
export interface DataImporter {
  importFromCSV(file: File): Promise<any[]>;
  importFromJSON(file: File): Promise<any>;
  validateImportData(data: any): boolean;
}

// Interface for search functionality only
export interface SearchProvider {
  search(query: string): Promise<any[]>;
  searchAdvanced(filters: Record<string, any>): Promise<any[]>;
  getSearchSuggestions(query: string): Promise<string[]>;
}

// Interface for filtering only
export interface FilterProvider {
  applyFilters(data: any[], filters: Record<string, any>): any[];
  getAvailableFilters(): string[];
  getFilterOptions(filterName: string): any[];
}

// Interface for sorting only
export interface SortProvider {
  sort(data: any[], field: string, direction: 'asc' | 'desc'): any[];
  getSortableFields(): string[];
}

// Interface for pagination only
export interface PaginationProvider {
  paginate(data: any[], page: number, pageSize: number): any[];
  getTotalPages(totalItems: number, pageSize: number): number;
  getPageInfo(currentPage: number, pageSize: number, totalItems: number): any;
} 