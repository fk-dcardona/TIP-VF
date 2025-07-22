/**
 * Service Locator - Dependency Inversion Principle Implementation
 * High-level modules should not depend on low-level modules. Both should depend on abstractions.
 * Abstractions should not depend on details. Details should depend on abstractions.
 */

import { 
  MetricsProvider, 
  AnalyticsProvider, 
  DocumentProvider, 
  ActivityProvider,
  InsightsProvider,
  RealTimeProvider,
  ConfigProvider,
  ErrorHandler,
  LoadingState,
  DataValidator,
  DataTransformer,
  CacheProvider,
  APIClient,
  AuthProvider,
  PermissionProvider,
  NotificationProvider,
  LocalizationProvider,
  ThemeProvider,
  RouterProvider,
  StorageProvider,
  LoggerProvider,
  MetricsCollector,
  DataExporter,
  DataImporter,
  SearchProvider,
  FilterProvider,
  SortProvider,
  PaginationProvider
} from '@/types/interfaces';

// Service locator class
export class ServiceLocator {
  private static instance: ServiceLocator;
  private services: Map<string, any> = new Map();

  private constructor() {}

  // Singleton pattern
  static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  /**
   * Register a service with the locator
   */
  register<T>(serviceName: string, service: T): void {
    this.services.set(serviceName, service);
  }

  /**
   * Get a service from the locator
   */
  get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not found in service locator`);
    }
    return service as T;
  }

  /**
   * Check if a service is registered
   */
  has(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  /**
   * Remove a service from the locator
   */
  remove(serviceName: string): boolean {
    return this.services.delete(serviceName);
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
  }
}

// Service names constants
export const SERVICE_NAMES = {
  METRICS_PROVIDER: 'metricsProvider',
  ANALYTICS_PROVIDER: 'analyticsProvider',
  DOCUMENT_PROVIDER: 'documentProvider',
  ACTIVITY_PROVIDER: 'activityProvider',
  INSIGHTS_PROVIDER: 'insightsProvider',
  REALTIME_PROVIDER: 'realTimeProvider',
  CONFIG_PROVIDER: 'configProvider',
  ERROR_HANDLER: 'errorHandler',
  LOADING_STATE: 'loadingState',
  DATA_VALIDATOR: 'dataValidator',
  DATA_TRANSFORMER: 'dataTransformer',
  CACHE_PROVIDER: 'cacheProvider',
  API_CLIENT: 'apiClient',
  AUTH_PROVIDER: 'authProvider',
  PERMISSION_PROVIDER: 'permissionProvider',
  NOTIFICATION_PROVIDER: 'notificationProvider',
  LOCALIZATION_PROVIDER: 'localizationProvider',
  THEME_PROVIDER: 'themeProvider',
  ROUTER_PROVIDER: 'routerProvider',
  STORAGE_PROVIDER: 'storageProvider',
  LOGGER_PROVIDER: 'loggerProvider',
  METRICS_COLLECTOR: 'metricsCollector',
  DATA_EXPORTER: 'dataExporter',
  DATA_IMPORTER: 'dataImporter',
  SEARCH_PROVIDER: 'searchProvider',
  FILTER_PROVIDER: 'filterProvider',
  SORT_PROVIDER: 'sortProvider',
  PAGINATION_PROVIDER: 'paginationProvider'
} as const;

// Service locator instance
export const serviceLocator = ServiceLocator.getInstance();

// Convenience functions for getting services
export function getMetricsProvider(): MetricsProvider {
  return serviceLocator.get<MetricsProvider>(SERVICE_NAMES.METRICS_PROVIDER);
}

export function getAnalyticsProvider(): AnalyticsProvider {
  return serviceLocator.get<AnalyticsProvider>(SERVICE_NAMES.ANALYTICS_PROVIDER);
}

export function getDocumentProvider(): DocumentProvider {
  return serviceLocator.get<DocumentProvider>(SERVICE_NAMES.DOCUMENT_PROVIDER);
}

export function getActivityProvider(): ActivityProvider {
  return serviceLocator.get<ActivityProvider>(SERVICE_NAMES.ACTIVITY_PROVIDER);
}

export function getInsightsProvider(): InsightsProvider {
  return serviceLocator.get<InsightsProvider>(SERVICE_NAMES.INSIGHTS_PROVIDER);
}

export function getRealTimeProvider(): RealTimeProvider {
  return serviceLocator.get<RealTimeProvider>(SERVICE_NAMES.REALTIME_PROVIDER);
}

export function getConfigProvider(): ConfigProvider {
  return serviceLocator.get<ConfigProvider>(SERVICE_NAMES.CONFIG_PROVIDER);
}

export function getErrorHandler(): ErrorHandler {
  return serviceLocator.get<ErrorHandler>(SERVICE_NAMES.ERROR_HANDLER);
}

export function getLoadingState(): LoadingState {
  return serviceLocator.get<LoadingState>(SERVICE_NAMES.LOADING_STATE);
}

export function getDataValidator(): DataValidator {
  return serviceLocator.get<DataValidator>(SERVICE_NAMES.DATA_VALIDATOR);
}

export function getDataTransformer(): DataTransformer {
  return serviceLocator.get<DataTransformer>(SERVICE_NAMES.DATA_TRANSFORMER);
}

export function getCacheProvider(): CacheProvider {
  return serviceLocator.get<CacheProvider>(SERVICE_NAMES.CACHE_PROVIDER);
}

export function getAPIClient(): APIClient {
  return serviceLocator.get<APIClient>(SERVICE_NAMES.API_CLIENT);
}

export function getAuthProvider(): AuthProvider {
  return serviceLocator.get<AuthProvider>(SERVICE_NAMES.AUTH_PROVIDER);
}

export function getPermissionProvider(): PermissionProvider {
  return serviceLocator.get<PermissionProvider>(SERVICE_NAMES.PERMISSION_PROVIDER);
}

export function getNotificationProvider(): NotificationProvider {
  return serviceLocator.get<NotificationProvider>(SERVICE_NAMES.NOTIFICATION_PROVIDER);
}

export function getLocalizationProvider(): LocalizationProvider {
  return serviceLocator.get<LocalizationProvider>(SERVICE_NAMES.LOCALIZATION_PROVIDER);
}

export function getThemeProvider(): ThemeProvider {
  return serviceLocator.get<ThemeProvider>(SERVICE_NAMES.THEME_PROVIDER);
}

export function getRouterProvider(): RouterProvider {
  return serviceLocator.get<RouterProvider>(SERVICE_NAMES.ROUTER_PROVIDER);
}

export function getStorageProvider(): StorageProvider {
  return serviceLocator.get<StorageProvider>(SERVICE_NAMES.STORAGE_PROVIDER);
}

export function getLoggerProvider(): LoggerProvider {
  return serviceLocator.get<LoggerProvider>(SERVICE_NAMES.LOGGER_PROVIDER);
}

export function getMetricsCollector(): MetricsCollector {
  return serviceLocator.get<MetricsCollector>(SERVICE_NAMES.METRICS_COLLECTOR);
}

export function getDataExporter(): DataExporter {
  return serviceLocator.get<DataExporter>(SERVICE_NAMES.DATA_EXPORTER);
}

export function getDataImporter(): DataImporter {
  return serviceLocator.get<DataImporter>(SERVICE_NAMES.DATA_IMPORTER);
}

export function getSearchProvider(): SearchProvider {
  return serviceLocator.get<SearchProvider>(SERVICE_NAMES.SEARCH_PROVIDER);
}

export function getFilterProvider(): FilterProvider {
  return serviceLocator.get<FilterProvider>(SERVICE_NAMES.FILTER_PROVIDER);
}

export function getSortProvider(): SortProvider {
  return serviceLocator.get<SortProvider>(SERVICE_NAMES.SORT_PROVIDER);
}

export function getPaginationProvider(): PaginationProvider {
  return serviceLocator.get<PaginationProvider>(SERVICE_NAMES.PAGINATION_PROVIDER);
} 