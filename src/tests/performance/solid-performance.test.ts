/**
 * SOLID Principles Performance Tests
 * Comprehensive performance testing for all SOLID implementations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Import our SOLID implementations
import { AnalyticsService } from '@/services/analytics-service';
import { ServiceLocator, SERVICE_NAMES } from '@/services/service-locator';
import { AnalyticsStrategyContext } from '@/patterns/strategy/analytics-strategy-context';
import { DashboardComponentFactory } from '@/patterns/factory/component-factory';
import { RealTimeDataManager } from '@/patterns/observer/real-time-observer';

// Performance test utilities
const measureExecutionTime = async (fn: () => Promise<any>): Promise<number> => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

const generateLargeDataset = (size: number) => ({
  metrics: {
    totalInventory: size * 1000,
    totalInventoryValue: size * 50000,
    criticalAlerts: Math.floor(size / 10),
    activeSuppliers: Math.floor(size / 5),
    triangleAnalytics: {
      sales: 85,
      financial: 92,
      supplyChain: 78,
      documentIntelligence: 95
    },
    documentIntelligence: {
      processedDocuments: size * 10,
      crossReferences: size * 5,
      alerts: Math.floor(size / 20),
      accuracy: 98.5
    }
  },
  charts: {
    salesTrend: Array.from({ length: size }, (_, i) => i * 100),
    inventoryLevels: Array.from({ length: size }, (_, i) => 80 + Math.random() * 20),
    supplierPerformance: Array.from({ length: size }, (_, i) => 90 + Math.random() * 10)
  }
});

describe('SOLID Principles Performance Tests', () => {
  beforeEach(() => {
    ServiceLocator.getInstance().clear();
  });

  describe('Analytics Service Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const analyticsService = new AnalyticsService();
      const largeDataset = generateLargeDataset(1000);
      
      const executionTime = await measureExecutionTime(async () => {
        await analyticsService.getDashboardAnalytics('test_org');
      });
      
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle concurrent requests efficiently', async () => {
      const analyticsService = new AnalyticsService();
      const concurrentRequests = 10;
      
      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        analyticsService.getDashboardAnalytics('test_org')
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(500); // Should complete within 500ms
    });

    it('should maintain performance with caching', async () => {
      const analyticsService = new AnalyticsService();
      
      // First request
      const firstRequestTime = await measureExecutionTime(async () => {
        await analyticsService.getDashboardAnalytics('test_org');
      });
      
      // Second request (should be faster due to caching)
      const secondRequestTime = await measureExecutionTime(async () => {
        await analyticsService.getDashboardAnalytics('test_org');
      });
      
      expect(secondRequestTime).toBeLessThan(firstRequestTime);
    });
  });

  describe('Strategy Pattern Performance', () => {
    it('should execute strategies efficiently', async () => {
      const context = new AnalyticsStrategyContext();
      const largeDataset = generateLargeDataset(500);
      
      const executionTime = await measureExecutionTime(async () => {
        await context.executeAnalysis(largeDataset);
      });
      
      expect(executionTime).toBeLessThan(200); // Should complete within 200ms
    });

    it('should handle multiple strategy execution efficiently', async () => {
      const context = new AnalyticsStrategyContext();
      const dataset = generateLargeDataset(100);
      
      const strategies = ['sales-analytics', 'financial-analytics', 'supply-chain-analytics'];
      
      const executionTime = await measureExecutionTime(async () => {
        await Promise.all(
          strategies.map(strategy => context.executeAnalysisWithStrategy(strategy, dataset))
        );
      });
      
      expect(executionTime).toBeLessThan(300); // Should complete within 300ms
    });

    it('should benefit from caching', async () => {
      const context = new AnalyticsStrategyContext({ enableCaching: true });
      const dataset = generateLargeDataset(100);
      
      // First execution
      const firstExecutionTime = await measureExecutionTime(async () => {
        await context.executeAnalysis(dataset);
      });
      
      // Second execution (should use cache)
      const secondExecutionTime = await measureExecutionTime(async () => {
        await context.executeAnalysis(dataset);
      });
      
      expect(secondExecutionTime).toBeLessThan(firstExecutionTime);
      expect(secondExecutionTime).toBeLessThan(50); // Cached execution should be very fast
    });
  });

  describe('Factory Pattern Performance', () => {
    it('should create components efficiently', () => {
      const factory = new DashboardComponentFactory();
      
      const startTime = performance.now();
      
      // Create multiple components
      for (let i = 0; i < 100; i++) {
        const config = {
          id: `component-${i}`,
          type: 'metrics-grid',
          title: `Component ${i}`,
          description: `Test component ${i}`
        };
        
        factory.createComponent(config);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should validate configurations efficiently', () => {
      const factory = new DashboardComponentFactory();
      
      const startTime = performance.now();
      
      // Validate multiple configurations
      for (let i = 0; i < 1000; i++) {
        const config = {
          id: `test-${i}`,
          type: 'metrics-grid',
          title: `Test ${i}`
        };
        
        factory.validateConfig(config);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(50); // Should complete within 50ms
    });
  });

  describe('Observer Pattern Performance', () => {
    it('should handle many observers efficiently', () => {
      const manager = new RealTimeDataManager();
      const subject = manager.getSubject();
      
      const startTime = performance.now();
      
      // Create and attach many observers
      for (let i = 0; i < 100; i++) {
        const observer = {
          id: `observer-${i}`,
          update: jest.fn(),
          getSubscribedEvents: () => ['metrics-update']
        };
        
        subject.attach(observer);
      }
      
      const endTime = performance.now();
      const setupTime = endTime - startTime;
      
      expect(setupTime).toBeLessThan(50); // Should complete within 50ms
      
      // Test notification performance
      const notificationStartTime = performance.now();
      subject.notify('metrics-update', { data: 'test' });
      const notificationEndTime = performance.now();
      const notificationTime = notificationEndTime - notificationStartTime;
      
      expect(notificationTime).toBeLessThan(10); // Should complete within 10ms
    });

    it('should handle real-time updates efficiently', () => {
      const manager = new RealTimeDataManager();
      
      const startTime = performance.now();
      
      // Start real-time updates
      manager.start(100); // 100ms interval
      
      // Let it run for a short time
      setTimeout(() => {
        manager.stop();
      }, 500);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(600); // Should complete within 600ms
    });
  });

  describe('Service Locator Performance', () => {
    it('should register and retrieve services efficiently', () => {
      const serviceLocator = ServiceLocator.getInstance();
      
      const startTime = performance.now();
      
      // Register many services
      for (let i = 0; i < 100; i++) {
        const service = {
          id: `service-${i}`,
          method: jest.fn()
        };
        
        serviceLocator.register(`service-${i}`, service);
      }
      
      // Retrieve services
      for (let i = 0; i < 100; i++) {
        serviceLocator.get(`service-${i}`);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(50); // Should complete within 50ms
    });

    it('should handle service substitution efficiently', () => {
      const serviceLocator = ServiceLocator.getInstance();
      
      const startTime = performance.now();
      
      // Register and substitute services multiple times
      for (let i = 0; i < 100; i++) {
        const service = { id: i, method: jest.fn() };
        serviceLocator.register('test-service', service);
        serviceLocator.get('test-service');
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(50); // Should complete within 50ms
    });
  });

  describe('Integration Performance', () => {
    it('should handle full workflow efficiently', async () => {
      const serviceLocator = ServiceLocator.getInstance();
      const analyticsService = new AnalyticsService();
      const strategyContext = new AnalyticsStrategyContext();
      const componentFactory = new DashboardComponentFactory();
      const realTimeManager = new RealTimeDataManager();
      
      serviceLocator.register(SERVICE_NAMES.ANALYTICS_PROVIDER, analyticsService);
      
      const largeDataset = generateLargeDataset(100);
      
      const executionTime = await measureExecutionTime(async () => {
        // Get analytics data
        const analyticsData = await analyticsService.getDashboardAnalytics('test_org');
        
        // Execute strategy analysis
        const strategyResult = await strategyContext.executeAnalysis(largeDataset);
        
        // Create dashboard components
        const component = componentFactory.createComponent({
          id: 'test',
          type: 'metrics-grid',
          title: 'Test'
        });
        
        // Setup real-time updates
        const subject = realTimeManager.getSubject();
        const observer = {
          id: 'test-observer',
          update: jest.fn(),
          getSubscribedEvents: () => ['metrics-update']
        };
        subject.attach(observer);
        
        // Trigger notification
        subject.notify('metrics-update', { data: analyticsData });
      });
      
      expect(executionTime).toBeLessThan(500); // Should complete within 500ms
    });

    it('should handle memory usage efficiently', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create many instances
      const services = [];
      const strategies = [];
      const factories = [];
      const managers = [];
      
      for (let i = 0; i < 100; i++) {
        services.push(new AnalyticsService());
        strategies.push(new AnalyticsStrategyContext());
        factories.push(new DashboardComponentFactory());
        managers.push(new RealTimeDataManager());
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with dataset size', async () => {
      const context = new AnalyticsStrategyContext();
      
      const smallDataset = generateLargeDataset(100);
      const mediumDataset = generateLargeDataset(500);
      const largeDataset = generateLargeDataset(1000);
      
      const smallTime = await measureExecutionTime(async () => {
        await context.executeAnalysis(smallDataset);
      });
      
      const mediumTime = await measureExecutionTime(async () => {
        await context.executeAnalysis(mediumDataset);
      });
      
      const largeTime = await measureExecutionTime(async () => {
        await context.executeAnalysis(largeDataset);
      });
      
      // Performance should scale reasonably (not exponentially)
      expect(mediumTime).toBeLessThan(smallTime * 6); // Should be less than 6x
      expect(largeTime).toBeLessThan(smallTime * 12); // Should be less than 12x
    });

    it('should handle increasing concurrent load', async () => {
      const context = new AnalyticsStrategyContext();
      const dataset = generateLargeDataset(50);
      
      const concurrencyLevels = [1, 5, 10, 20];
      const results = [];
      
      for (const concurrency of concurrencyLevels) {
        const startTime = performance.now();
        
        const promises = Array.from({ length: concurrency }, () =>
          context.executeAnalysis(dataset)
        );
        
        await Promise.all(promises);
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        results.push({ concurrency, totalTime });
      }
      
      // Performance should not degrade exponentially
      for (let i = 1; i < results.length; i++) {
        const previous = results[i - 1];
        const current = results[i];
        
        const timeRatio = current.totalTime / previous.totalTime;
        const concurrencyRatio = current.concurrency / previous.concurrency;
        
        // Time increase should be less than concurrency increase
        expect(timeRatio).toBeLessThan(concurrencyRatio * 1.5);
      }
    });
  });
}); 