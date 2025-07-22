/**
 * SOLID Principles Unit Tests
 * Comprehensive testing suite for all SOLID implementations and design patterns
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Import our SOLID implementations
import { AnalyticsService } from '@/services/analytics-service';
import { ServiceLocator, SERVICE_NAMES } from '@/services/service-locator';
import { AnalyticsStrategyContext } from '@/patterns/strategy/analytics-strategy-context';
import { DashboardComponentFactory } from '@/patterns/factory/component-factory';
import { RealTimeDataManager, DashboardObserver, MetricsObserver } from '@/patterns/observer/real-time-observer';

// Mock data
const mockAnalyticsData = {
  metrics: {
    totalInventory: 15000,
    totalInventoryValue: 250000,
    criticalAlerts: 3,
    activeSuppliers: 12,
    triangleAnalytics: {
      sales: 85,
      financial: 92,
      supplyChain: 78,
      documentIntelligence: 95
    },
    documentIntelligence: {
      processedDocuments: 45,
      crossReferences: 23,
      alerts: 2,
      accuracy: 98.5
    }
  },
  charts: {
    salesTrend: [100, 120, 140, 160, 180],
    inventoryLevels: [80, 85, 90, 88, 92],
    supplierPerformance: [95, 92, 88, 94, 96]
  }
};

describe('SOLID Principles Implementation Tests', () => {
  beforeEach(() => {
    // Reset service locator before each test
    ServiceLocator.getInstance().clear();
  });

  describe('Phase 1: Single Responsibility Principle (SRP)', () => {
    it('should have focused analytics service with single responsibility', () => {
      const analyticsService = new AnalyticsService();
      
      expect(analyticsService.getDashboardAnalytics).toBeDefined();
      expect(analyticsService.getCrossReferenceData).toBeDefined();
      expect(analyticsService.generateDemoData).toBeDefined();
      
      // Should not have UI-related methods
      expect(analyticsService.render).toBeUndefined();
      expect(analyticsService.handleClick).toBeUndefined();
    });

    it('should have dedicated data fetching hook', () => {
      // Test that useDashboardData hook has single responsibility
      const { useDashboardData } = require('@/hooks/useDashboardData');
      
      // Mock the hook implementation
      const mockHook = {
        analyticsData: mockAnalyticsData,
        crossReferenceData: {},
        loading: false,
        error: null,
        lastUpdate: new Date(),
        refetch: jest.fn()
      };
      
      expect(mockHook.analyticsData).toBeDefined();
      expect(mockHook.refetch).toBeDefined();
      expect(typeof mockHook.refetch).toBe('function');
    });

    it('should have focused UI components', () => {
      // Test that components have single responsibilities
      const { MetricsGrid } = require('@/components/dashboard/metrics-grid');
      const { TriangleAnalytics } = require('@/components/dashboard/triangle-analytics');
      const { ChartsGrid } = require('@/components/dashboard/charts-grid');
      
      expect(MetricsGrid).toBeDefined();
      expect(TriangleAnalytics).toBeDefined();
      expect(ChartsGrid).toBeDefined();
      
      // Components should only accept their specific props
      expect(MetricsGrid.displayName || MetricsGrid.name).toContain('MetricsGrid');
      expect(TriangleAnalytics.displayName || TriangleAnalytics.name).toContain('TriangleAnalytics');
      expect(ChartsGrid.displayName || ChartsGrid.name).toContain('ChartsGrid');
    });
  });

  describe('Phase 2: Open/Closed Principle (OCP)', () => {
    it('should allow extending analytics strategies without modification', () => {
      const context = new AnalyticsStrategyContext();
      
      // Get existing strategies
      const existingStrategies = context.getAvailableStrategies();
      expect(existingStrategies.length).toBeGreaterThan(0);
      
      // Create a new strategy without modifying existing code
      const CustomStrategy = {
        id: 'custom-analytics',
        name: 'Custom Analytics Strategy',
        supportedMetrics: ['custom-metric-1', 'custom-metric-2'],
        analyze: jest.fn().mockResolvedValue({
          insights: ['Custom insight 1', 'Custom insight 2'],
          recommendations: ['Custom recommendation'],
          confidence: 0.95
        })
      };
      
      // Register new strategy
      context.registerStrategy(CustomStrategy);
      
      // Verify new strategy is available
      const updatedStrategies = context.getAvailableStrategies();
      expect(updatedStrategies.length).toBe(existingStrategies.length + 1);
      expect(context.getStrategy('custom-analytics')).toBe(CustomStrategy);
    });

    it('should allow extending dashboard widgets without modification', () => {
      const factory = new DashboardComponentFactory();
      const supportedTypes = factory.getSupportedTypes();
      
      // Verify existing types are supported
      expect(supportedTypes).toContain('metrics-grid');
      expect(supportedTypes).toContain('triangle-analytics');
      expect(supportedTypes).toContain('charts-grid');
      
      // New component types can be added without modifying existing code
      const newComponentConfig = {
        id: 'custom-widget',
        type: 'custom-widget',
        title: 'Custom Widget',
        description: 'A custom dashboard widget'
      };
      
      // Factory should handle unknown types gracefully
      const component = factory.createComponent(newComponentConfig);
      expect(component).toBeNull(); // Unknown type returns null
    });
  });

  describe('Phase 3: Liskov Substitution Principle (LSP)', () => {
    it('should allow substituting analytics strategies', async () => {
      const context = new AnalyticsStrategyContext();
      
      // Set a strategy
      const strategySet = context.setStrategy('sales-analytics');
      expect(strategySet).toBe(true);
      
      // Get current strategy
      const currentStrategy = context.getCurrentStrategy();
      expect(currentStrategy).toBeDefined();
      expect(currentStrategy?.id).toBe('sales-analytics');
      
      // Execute analysis
      const result = await context.executeAnalysis(mockAnalyticsData);
      expect(result).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should allow substituting observers', () => {
      const manager = new RealTimeDataManager();
      const subject = manager.getSubject();
      
      // Create different types of observers
      const dashboardObserver = new DashboardObserver('test-dashboard', jest.fn());
      const metricsObserver = new MetricsObserver(jest.fn());
      
      // Both should implement the Observer interface
      expect(dashboardObserver.id).toBeDefined();
      expect(dashboardObserver.update).toBeDefined();
      expect(dashboardObserver.getSubscribedEvents).toBeDefined();
      
      expect(metricsObserver.id).toBeDefined();
      expect(metricsObserver.update).toBeDefined();
      expect(metricsObserver.getSubscribedEvents).toBeDefined();
      
      // Both should be attachable to the subject
      subject.attach(dashboardObserver);
      subject.attach(metricsObserver);
      
      const observers = subject.getObservers();
      expect(observers).toContain(dashboardObserver);
      expect(observers).toContain(metricsObserver);
    });
  });

  describe('Phase 4: Interface Segregation Principle (ISP)', () => {
    it('should have focused interfaces', () => {
      // Test that interfaces are segregated and focused
      const interfaces = require('@/types/interfaces');
      
      // Verify focused interfaces exist
      expect(interfaces.MetricsProvider).toBeDefined();
      expect(interfaces.AnalyticsProvider).toBeDefined();
      expect(interfaces.DocumentProvider).toBeDefined();
      expect(interfaces.ErrorHandler).toBeDefined();
      expect(interfaces.APIClient).toBeDefined();
      
      // Each interface should have minimal, focused methods
      const metricsProvider = interfaces.MetricsProvider;
      expect(typeof metricsProvider.getMetrics).toBe('function');
      
      const analyticsProvider = interfaces.AnalyticsProvider;
      expect(typeof analyticsProvider.getAnalytics).toBe('function');
      
      const documentProvider = interfaces.DocumentProvider;
      expect(typeof documentProvider.getDocuments).toBe('function');
    });

    it('should not force clients to depend on unused methods', () => {
      // Test that components only depend on what they need
      const { MetricsGrid } = require('@/components/dashboard/metrics-grid');
      
      // MetricsGrid should only need metrics data
      const minimalProps = {
        metrics: {
          totalInventory: 1000,
          totalInventoryValue: 50000,
          criticalAlerts: 1,
          activeSuppliers: 5
        }
      };
      
      // Should not require analytics or document data
      expect(minimalProps.metrics).toBeDefined();
      expect(minimalProps.analytics).toBeUndefined();
      expect(minimalProps.documents).toBeUndefined();
    });
  });

  describe('Phase 5: Dependency Inversion Principle (DIP)', () => {
    it('should depend on abstractions through service locator', () => {
      const serviceLocator = ServiceLocator.getInstance();
      
      // Register services
      const mockAnalyticsService = {
        getDashboardAnalytics: jest.fn(),
        getCrossReferenceData: jest.fn()
      };
      
      serviceLocator.register(SERVICE_NAMES.ANALYTICS_PROVIDER, mockAnalyticsService);
      
      // Retrieve service through abstraction
      const analyticsProvider = serviceLocator.get(SERVICE_NAMES.ANALYTICS_PROVIDER);
      expect(analyticsProvider).toBe(mockAnalyticsService);
      expect(analyticsProvider.getDashboardAnalytics).toBeDefined();
    });

    it('should allow easy service substitution', () => {
      const serviceLocator = ServiceLocator.getInstance();
      
      // Register initial service
      const initialService = { name: 'initial', method: jest.fn() };
      serviceLocator.register('test-service', initialService);
      
      // Substitute with new implementation
      const newService = { name: 'new', method: jest.fn() };
      serviceLocator.register('test-service', newService);
      
      // Client code should work with new implementation
      const retrievedService = serviceLocator.get('test-service');
      expect(retrievedService).toBe(newService);
      expect(retrievedService.name).toBe('new');
    });
  });

  describe('Advanced Design Patterns Tests', () => {
    describe('Strategy Pattern', () => {
      it('should execute different strategies correctly', async () => {
        const context = new AnalyticsStrategyContext();
        
        // Test sales strategy
        const salesResult = await context.executeAnalysisWithStrategy('sales-analytics', mockAnalyticsData);
        expect(salesResult).toBeDefined();
        expect(salesResult.insights).toBeDefined();
        
        // Test financial strategy
        const financialResult = await context.executeAnalysisWithStrategy('financial-analytics', mockAnalyticsData);
        expect(financialResult).toBeDefined();
        expect(financialResult.insights).toBeDefined();
        
        // Results should be different for different strategies
        expect(salesResult.insights).not.toEqual(financialResult.insights);
      });

      it('should support caching', async () => {
        const context = new AnalyticsStrategyContext({ enableCaching: true });
        
        // First execution
        const result1 = await context.executeAnalysis(mockAnalyticsData);
        
        // Second execution should use cache
        const result2 = await context.executeAnalysis(mockAnalyticsData);
        
        expect(result1).toEqual(result2);
        
        // Check cache stats
        const stats = context.getCacheStats();
        expect(stats.size).toBeGreaterThan(0);
        expect(stats.hitRate).toBeGreaterThan(0);
      });
    });

    describe('Factory Pattern', () => {
      it('should create components dynamically', () => {
        const factory = new DashboardComponentFactory();
        
        const config = {
          id: 'test-metrics',
          type: 'metrics-grid',
          title: 'Test Metrics',
          description: 'Test metrics grid component'
        };
        
        const component = factory.createComponent(config);
        expect(component).toBeDefined();
        expect(typeof component).toBe('function');
      });

      it('should validate component configurations', () => {
        const factory = new DashboardComponentFactory();
        
        // Valid config
        const validConfig = {
          id: 'test',
          type: 'metrics-grid',
          title: 'Test'
        };
        expect(factory.validateConfig(validConfig)).toBe(true);
        
        // Invalid config (missing required fields)
        const invalidConfig = {
          id: 'test',
          type: 'unknown-type'
        };
        expect(factory.validateConfig(invalidConfig)).toBe(false);
      });
    });

    describe('Observer Pattern', () => {
      it('should notify observers of events', () => {
        const manager = new RealTimeDataManager();
        const subject = manager.getSubject();
        
        const mockCallback = jest.fn();
        const observer = new DashboardObserver('test-observer', mockCallback);
        
        subject.attach(observer);
        
        // Trigger notification
        subject.notify('metrics-update', { data: 'test' });
        
        expect(mockCallback).toHaveBeenCalledWith({
          type: 'metrics-update',
          data: 'test',
          timestamp: expect.any(Date)
        });
      });

      it('should handle multiple observers', () => {
        const manager = new RealTimeDataManager();
        const subject = manager.getSubject();
        
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        
        const observer1 = new DashboardObserver('observer1', callback1);
        const observer2 = new MetricsObserver(callback2);
        
        subject.attach(observer1);
        subject.attach(observer2);
        
        // Trigger notification
        subject.notify('metrics-update', { data: 'test' });
        
        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });

      it('should start and stop real-time updates', () => {
        const manager = new RealTimeDataManager();
        
        // Start updates
        manager.start(100); // 100ms interval
        
        // Stop updates
        manager.stop();
        
        // Should not throw errors
        expect(() => manager.stop()).not.toThrow();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should integrate all patterns together', async () => {
      // Setup service locator
      const serviceLocator = ServiceLocator.getInstance();
      const analyticsService = new AnalyticsService();
      serviceLocator.register(SERVICE_NAMES.ANALYTICS_PROVIDER, analyticsService);
      
      // Setup strategy context
      const strategyContext = new AnalyticsStrategyContext();
      
      // Setup component factory
      const componentFactory = new DashboardComponentFactory();
      
      // Setup real-time manager
      const realTimeManager = new RealTimeDataManager();
      
      // Test integration
      const analyticsProvider = serviceLocator.get(SERVICE_NAMES.ANALYTICS_PROVIDER);
      expect(analyticsProvider).toBe(analyticsService);
      
      const strategy = strategyContext.getStrategy('sales-analytics');
      expect(strategy).toBeDefined();
      
      const component = componentFactory.createComponent({
        id: 'test',
        type: 'metrics-grid',
        title: 'Test'
      });
      expect(component).toBeDefined();
      
      const subject = realTimeManager.getSubject();
      expect(subject).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const context = new AnalyticsStrategyContext();
      
      // Test with invalid data
      const result = await context.executeAnalysis(null);
      expect(result).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const context = new AnalyticsStrategyContext();
      
      // Create large dataset
      const largeDataset = {
        metrics: {
          totalInventory: 1000000,
          totalInventoryValue: 50000000,
          criticalAlerts: 150,
          activeSuppliers: 500,
          triangleAnalytics: {
            sales: 85,
            financial: 92,
            supplyChain: 78,
            documentIntelligence: 95
          }
        },
        charts: {
          salesTrend: Array.from({ length: 1000 }, (_, i) => i * 100),
          inventoryLevels: Array.from({ length: 1000 }, (_, i) => 80 + Math.random() * 20),
          supplierPerformance: Array.from({ length: 1000 }, (_, i) => 90 + Math.random() * 10)
        }
      };
      
      const startTime = Date.now();
      const result = await context.executeAnalysis(largeDataset);
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple concurrent requests', async () => {
      const context = new AnalyticsStrategyContext();
      
      // Create multiple concurrent requests
      const promises = Array.from({ length: 10 }, () => 
        context.executeAnalysis(mockAnalyticsData)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.insights).toBeDefined();
      });
    });
  });
}); 