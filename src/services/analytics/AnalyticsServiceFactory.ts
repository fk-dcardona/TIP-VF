/**
 * Analytics Service Factory
 * 
 * Dependency Inversion Principle: Creates service instances with injected dependencies
 * Single Responsibility: Factory for creating properly configured analytics services
 * Open/Closed: Extensible for new provider configurations without modifying existing code
 */

import { SolidAnalyticsService } from './SolidAnalyticsService';
import { BackendAnalyticsProvider } from './providers/BackendAnalyticsProvider';
import { FallbackAnalyticsProvider } from './providers/FallbackAnalyticsProvider';
import { RealDataAnalyticsProvider } from './providers/RealDataAnalyticsProvider';
import { IAnalyticsProviderStrategy } from '../../types/analytics-solid';

export interface AnalyticsServiceConfig {
  backendUrl?: string;
  healthCheckInterval?: number;
  requestTimeout?: number;
  enableFallback?: boolean;
  customProviders?: IAnalyticsProviderStrategy[];
}

export class AnalyticsServiceFactory {
  private static instance: SolidAnalyticsService | null = null;

  /**
   * Create a new analytics service instance with dependency injection
   */
  static create(config: AnalyticsServiceConfig = {}): SolidAnalyticsService {
    const {
      backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tip-vf-production.up.railway.app',
      healthCheckInterval = 30000,
      requestTimeout = 10000,
      enableFallback = true,
      customProviders = []
    } = config;

    // Build provider chain following priority order
    const providers: IAnalyticsProviderStrategy[] = [];

    // 1. Primary: Real Data Analytics Provider (Priority 0 - Highest)
    providers.push(new RealDataAnalyticsProvider());

    // 2. Secondary: Backend API Provider (Priority 1)
    providers.push(new BackendAnalyticsProvider(backendUrl, requestTimeout));

    // 3. Custom providers (if any) - Priority determined by provider implementation
    providers.push(...customProviders);

    // 4. Fallback: Reliable mock data provider (Priority 10 - Lowest)
    if (enableFallback) {
      providers.push(new FallbackAnalyticsProvider());
    }

    // Create service with injected dependencies
    return new SolidAnalyticsService(providers, healthCheckInterval);
  }

  /**
   * Get singleton instance (useful for React hooks and shared state)
   */
  static getInstance(config?: AnalyticsServiceConfig): SolidAnalyticsService {
    if (!this.instance) {
      this.instance = this.create(config);
    }
    return this.instance;
  }

  /**
   * Reset singleton instance (useful for testing or configuration changes)
   */
  static resetInstance(): void {
    this.instance = null;
  }

  /**
   * Create analytics service for development environment
   */
  static createDevelopment(): SolidAnalyticsService {
    return this.create({
      backendUrl: 'http://localhost:5000',
      healthCheckInterval: 10000, // More frequent checks in development
      requestTimeout: 5000,
      enableFallback: true
    });
  }

  /**
   * Create analytics service for production environment
   */
  static createProduction(): SolidAnalyticsService {
    return this.create({
      backendUrl: 'https://tip-vf-production.up.railway.app',
      healthCheckInterval: 60000, // Less frequent checks in production
      requestTimeout: 15000,
      enableFallback: true
    });
  }

  /**
   * Create analytics service for testing (real data + fallback)
   */
  static createTesting(): SolidAnalyticsService {
    return this.create({
      enableFallback: true,
      customProviders: [], // Real data provider is included by default
      healthCheckInterval: 1000 // Rapid health checks for testing
    });
  }

  /**
   * Create analytics service for real data demo
   */
  static createRealDataDemo(): SolidAnalyticsService {
    return this.create({
      enableFallback: false, // Only real data, no fallback
      customProviders: [],
      healthCheckInterval: 5000
    });
  }

  /**
   * Create analytics service with custom backend URL
   */
  static createWithCustomBackend(backendUrl: string, timeout?: number): SolidAnalyticsService {
    return this.create({
      backendUrl,
      requestTimeout: timeout || 10000,
      enableFallback: true
    });
  }
}

// ==================== Environment-Aware Factory ====================

/**
 * Environment-aware factory function
 * Automatically configures service based on environment
 */
export function createAnalyticsService(): SolidAnalyticsService {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';

  if (isTest) {
    console.log('[AnalyticsServiceFactory] Creating testing analytics service');
    return AnalyticsServiceFactory.createTesting();
  }

  if (isDevelopment) {
    console.log('[AnalyticsServiceFactory] Creating development analytics service');
    return AnalyticsServiceFactory.createDevelopment();
  }

  console.log('[AnalyticsServiceFactory] Creating production analytics service');
  return AnalyticsServiceFactory.createProduction();
}

// ==================== React Hook Integration Helper ====================

/**
 * Get analytics service instance for React hooks
 * Ensures consistent instance across component renders
 */
export function getAnalyticsServiceInstance(): SolidAnalyticsService {
  return AnalyticsServiceFactory.getInstance();
}