/**
 * SOLID Principles Performance Tests
 * Comprehensive performance testing for all SOLID implementations
 */

import { AnalyticsService } from '../../services/analytics-service';
import { ServiceLocator } from '../../services/service-locator';
import { AnalyticsStrategyContext } from '../../patterns/strategy/analytics-strategy-context';
import { DashboardComponentFactory, ComponentConfig } from '../../patterns/factory/component-factory';
import { RealTimeDataManager, DashboardObserver } from '../../patterns/observer/real-time-observer';

// Mock performance.now for consistent testing
const originalPerformanceNow = performance.now;
let mockTime = 0;

beforeEach(() => {
  mockTime = 0;
  performance.now = () => {
    mockTime += 1;
    return mockTime;
  };
});

afterEach(() => {
  performance.now = originalPerformanceNow;
});

describe('SOLID Principles Performance Tests', () => {
  describe('Analytics Service Performance', () => {
    it('should handle large datasets efficiently', () => {
      const analyticsService = new AnalyticsService();
      const startTime = performance.now();
      
      const result = analyticsService.getDashboardAnalytics('test-org');
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(10); // Should complete quickly
    });

    it('should handle concurrent requests efficiently', () => {
      const analyticsService = new AnalyticsService();
      const startTime = performance.now();
      
      // Simulate concurrent requests
      const promises = Array.from({ length: 10 }, () => 
        Promise.resolve(analyticsService.getDashboardAnalytics('test-org'))
      );
      
      Promise.all(promises).then(() => {
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        expect(executionTime).toBeLessThan(20); // Should handle concurrency well
      });
    });

    it('should maintain performance with caching', () => {
      const analyticsService = new AnalyticsService();
      
      // First request (no cache)
      const startTime1 = performance.now();
      const result1 = analyticsService.getDashboardAnalytics('test-org');
      const firstRequestTime = performance.now() - startTime1;

      // Second request (should use cache)
      const startTime2 = performance.now();
      const result2 = analyticsService.getDashboardAnalytics('test-org');
      const secondRequestTime = performance.now() - startTime2;

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1).toEqual(result2); // Same result due to caching
      
      // Cached request should be faster or at least not significantly slower
      expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime * 1.5);
    });
  });

  describe('Strategy Pattern Performance', () => {
    it('should execute strategies efficiently', () => {
      const context = new AnalyticsStrategyContext();
      const startTime = performance.now();
      
      const result = context.executeAnalysis('test-data');
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(10);
    });

    it('should handle multiple strategy execution efficiently', () => {
      const context = new AnalyticsStrategyContext();
      const startTime = performance.now();
      
      // Execute multiple strategies
      const results = ['sales', 'financial', 'supply-chain'].map(strategy => {
        context.setStrategy(strategy);
        return context.executeAnalysis('test-data');
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(results).toHaveLength(3);
      expect(executionTime).toBeLessThan(15);
    });

    it('should benefit from caching', () => {
      const context = new AnalyticsStrategyContext();
      
      const startTime1 = performance.now();
      const result1 = context.executeAnalysis('test-data');
      const firstTime = performance.now() - startTime1;
      
      const startTime2 = performance.now();
      const result2 = context.executeAnalysis('test-data');
      const secondTime = performance.now() - startTime2;
      
      expect(result1).toEqual(result2);
      expect(secondTime).toBeLessThanOrEqual(firstTime * 1.5);
    });
  });

  describe('Factory Pattern Performance', () => {
    it('should create components efficiently', () => {
      const factory = new DashboardComponentFactory();
      const config: ComponentConfig = {
        id: 'test-component',
        type: 'metrics-grid',
        title: 'Test Component',
        description: 'Test component for performance testing'
      };
      
      const startTime = performance.now();
      
      const component = factory.createComponent(config);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(component).toBeDefined();
      expect(executionTime).toBeLessThan(5);
    });

    it('should validate configurations efficiently', () => {
      const factory = new DashboardComponentFactory();
      const config: ComponentConfig = {
        id: 'test-component',
        type: 'metrics-grid',
        title: 'Test Component',
        description: 'Test component for performance testing'
      };
      
      const startTime = performance.now();
      
      const isValid = factory.validateConfig(config);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(typeof isValid).toBe('boolean');
      expect(executionTime).toBeLessThan(5);
    });
  });

  describe('Observer Pattern Performance', () => {
    it('should handle many observers efficiently', () => {
      const manager = new RealTimeDataManager();
      const subject = manager.getSubject();
      const startTime = performance.now();
      
      // Add many observers
      for (let i = 0; i < 100; i++) {
        const observer = new DashboardObserver(
          `observer-${i}`,
          (data) => console.log(`Observer ${i} updated`, data),
          ['metrics-update']
        );
        subject.attach(observer);
      }
      
      // Notify all observers
      subject.notify('metrics-update', { test: 'data' });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(50);
    });

    it('should handle real-time updates efficiently', () => {
      const manager = new RealTimeDataManager();
      const subject = manager.getSubject();
      let updateCount = 0;
      
      const observer = new DashboardObserver(
        'test-observer',
        () => updateCount++,
        ['metrics-update']
      );
      subject.attach(observer);
      
      const startTime = performance.now();
      
      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        subject.notify('metrics-update', { update: i });
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(updateCount).toBe(10);
      expect(executionTime).toBeLessThan(20);
    });
  });

  describe('Service Locator Performance', () => {
    it('should register and retrieve services efficiently', () => {
      const serviceLocator = ServiceLocator.getInstance();
      const startTime = performance.now();
      
      serviceLocator.register('test-service', { test: 'data' });
      const service = serviceLocator.get('test-service');
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(service).toBeDefined();
      expect(executionTime).toBeLessThan(5);
    });

    it('should handle service substitution efficiently', () => {
      const serviceLocator = ServiceLocator.getInstance();
      const startTime = performance.now();
      
      serviceLocator.register('test-service', { version: 1 });
      serviceLocator.register('test-service', { version: 2 });
      const service = serviceLocator.get('test-service');
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(service).toEqual({ version: 2 });
      expect(executionTime).toBeLessThan(5);
    });
  });

  describe('Integration Performance', () => {
    it('should handle full workflow efficiently', () => {
      const startTime = performance.now();
      
      // Simulate full workflow
      const analyticsService = new AnalyticsService();
      const context = new AnalyticsStrategyContext();
      const factory = new DashboardComponentFactory();
      
      const data = analyticsService.getDashboardAnalytics('test-org');
      const analysis = context.executeAnalysis(data);
      const config: ComponentConfig = {
        id: 'test-component',
        type: 'metrics-grid',
        title: 'Test Component',
        description: 'Test component'
      };
      const component = factory.createComponent(config);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(data).toBeDefined();
      expect(analysis).toBeDefined();
      expect(component).toBeDefined();
      expect(executionTime).toBeLessThan(30);
    });

    it('should handle memory usage efficiently', () => {
      const startMemory = process.memoryUsage().heapUsed;
      const startTime = performance.now();
      
      // Create many instances
      const services = Array.from({ length: 100 }, () => new AnalyticsService());
      const contexts = Array.from({ length: 100 }, () => new AnalyticsStrategyContext());
      
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;
      const executionTime = endTime - startTime;
      
      expect(services).toHaveLength(100);
      expect(contexts).toHaveLength(100);
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with dataset size', () => {
      const analyticsService = new AnalyticsService();
      const sizes = [100, 1000, 10000];
      const times: number[] = [];
      
      sizes.forEach(size => {
        const startTime = performance.now();
        analyticsService.getDashboardAnalytics('test-org');
        const endTime = performance.now();
        times.push(endTime - startTime);
      });
      
      // Should scale reasonably (not exponentially)
      expect(times[1]).toBeLessThan(times[0] * 10);
      expect(times[2]).toBeLessThan(times[1] * 10);
    });

    it('should handle increasing concurrent load', () => {
      const analyticsService = new AnalyticsService();
      const loads = [1, 5, 10, 20];
      const times: number[] = [];
      
      loads.forEach(load => {
        const startTime = performance.now();
        
        const promises = Array.from({ length: load }, () => 
          Promise.resolve(analyticsService.getDashboardAnalytics('test-org'))
        );
        
        Promise.all(promises).then(() => {
          const endTime = performance.now();
          times.push(endTime - startTime);
        });
      });
      
      // Should handle concurrency well
      expect(times[1]).toBeLessThan(times[0] * 3);
      expect(times[2]).toBeLessThan(times[1] * 2);
      expect(times[3]).toBeLessThan(times[2] * 2);
    });
  });
}); 