/**
 * Analytics Service Factory
 * 
 * Dependency Inversion Principle: Creates service instances with injected dependencies
 * Single Responsibility: Factory for creating properly configured analytics services
 * Open/Closed: Extensible for new provider configurations without modifying existing code
 */

import { SolidAnalyticsService } from './SolidAnalyticsService';

export interface AnalyticsServiceConfig {
  healthCheckInterval?: number;
}

export class AnalyticsServiceFactory {
  private static instance: SolidAnalyticsService | null = null;

  /**
   * Create a new analytics service instance
   */
  static create(config: AnalyticsServiceConfig = {}): SolidAnalyticsService {
    const {
      healthCheckInterval = 30000
    } = config;

    // Create service with internal provider management
    return new SolidAnalyticsService(undefined, healthCheckInterval);
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
      healthCheckInterval: 10000 // More frequent checks in development
    });
  }

  /**
   * Create analytics service for production environment
   */
  static createProduction(): SolidAnalyticsService {
    return this.create({
      healthCheckInterval: 60000 // Less frequent checks in production
    });
  }

  /**
   * Create analytics service for testing environment
   */
  static createTesting(): SolidAnalyticsService {
    return this.create({
      healthCheckInterval: 5000 // Very frequent checks for testing
    });
  }

  /**
   * Create analytics service optimized for real data demo
   */
  static createRealDataDemo(): SolidAnalyticsService {
    return this.create({
      healthCheckInterval: 15000 // Balanced for demo performance
    });
  }
}

// ==================== Convenience Functions ====================

/**
 * Create analytics service with default configuration
 */
export function createAnalyticsService(): SolidAnalyticsService {
  return AnalyticsServiceFactory.create();
}

/**
 * Get analytics service singleton instance
 */
export function getAnalyticsServiceInstance(): SolidAnalyticsService {
  return AnalyticsServiceFactory.getInstance();
}