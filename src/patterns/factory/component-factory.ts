/**
 * Component Factory Pattern - Advanced SOLID Implementation
 * Creates dashboard components dynamically based on configuration
 * Follows Open/Closed Principle - new component types can be added without modifying existing code
 */

import React from 'react';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { TriangleAnalytics } from '@/components/dashboard/triangle-analytics';
import { ChartsGrid } from '@/components/dashboard/charts-grid';
import { DocumentIntelligence } from '@/components/dashboard/document-intelligence';
import { DynamicDashboard } from '@/components/dashboard/dynamic-dashboard';

// Component configuration interface
export interface ComponentConfig {
  id: string;
  type: string;
  title: string;
  description: string;
  props?: Record<string, any>;
  layout?: {
    width?: number;
    height?: number;
    position?: { x: number; y: number };
  };
  enabled?: boolean;
  priority?: number;
}

// Component factory interface
export interface ComponentFactory {
  createComponent(config: ComponentConfig): React.ComponentType<any> | null;
  getSupportedTypes(): string[];
  validateConfig(config: ComponentConfig): boolean;
}

// Component registry interface
export interface ComponentRegistry {
  registerComponent(type: string, factory: ComponentFactory): void;
  createComponent(config: ComponentConfig): React.ComponentType<any> | null;
  getAvailableTypes(): string[];
  getFactory(type: string): ComponentFactory | undefined;
}

// Dashboard Component Factory
export class DashboardComponentFactory implements ComponentFactory {
  getSupportedTypes(): string[] {
    return [
      'metrics-grid',
      'triangle-analytics',
      'charts-grid',
      'document-intelligence',
      'dynamic-dashboard'
    ];
  }

  createComponent(config: ComponentConfig): React.ComponentType<any> | null {
    switch (config.type) {
      case 'metrics-grid':
        return this.createMetricsGrid(config);
      case 'triangle-analytics':
        return this.createTriangleAnalytics(config);
      case 'charts-grid':
        return this.createChartsGrid(config);
      case 'document-intelligence':
        return this.createDocumentIntelligence(config);
      case 'dynamic-dashboard':
        return this.createDynamicDashboard(config);
      default:
        console.warn(`Unsupported component type: ${config.type}`);
        return null;
    }
  }

  validateConfig(config: ComponentConfig): boolean {
    if (!config.id || !config.type || !config.title) {
      return false;
    }

    if (!this.getSupportedTypes().includes(config.type)) {
      return false;
    }

    return true;
  }

  private createMetricsGrid(config: ComponentConfig): React.ComponentType<any> {
    const MetricsGridComponent = (props: any) => React.createElement('div', 
      { className: 'component-wrapper', 'data-component-id': config.id },
      React.createElement('h3', { className: 'component-title' }, config.title),
      React.createElement(MetricsGrid, { metrics: props.metrics })
    );
    MetricsGridComponent.displayName = 'MetricsGridComponent';
    return MetricsGridComponent;
  }

  private createTriangleAnalytics(config: ComponentConfig): React.ComponentType<any> {
    const TriangleAnalyticsComponent = (props: any) => React.createElement('div', 
      { className: 'component-wrapper', 'data-component-id': config.id },
      React.createElement('h3', { className: 'component-title' }, config.title),
      React.createElement(TriangleAnalytics, { triangleAnalytics: props.metrics?.triangleAnalytics })
    );
    TriangleAnalyticsComponent.displayName = 'TriangleAnalyticsComponent';
    return TriangleAnalyticsComponent;
  }

  private createChartsGrid(config: ComponentConfig): React.ComponentType<any> {
    const ChartsGridComponent = (props: any) => React.createElement('div', 
      { className: 'component-wrapper', 'data-component-id': config.id },
      React.createElement('h3', { className: 'component-title' }, config.title),
      React.createElement(ChartsGrid, { charts: props.charts })
    );
    ChartsGridComponent.displayName = 'ChartsGridComponent';
    return ChartsGridComponent;
  }

  private createDocumentIntelligence(config: ComponentConfig): React.ComponentType<any> {
    const DocumentIntelligenceComponent = (props: any) => React.createElement('div', 
      { className: 'component-wrapper', 'data-component-id': config.id },
      React.createElement('h3', { className: 'component-title' }, config.title),
      React.createElement(DocumentIntelligence, { documentIntelligence: props.metrics?.documentIntelligence })
    );
    DocumentIntelligenceComponent.displayName = 'DocumentIntelligenceComponent';
    return DocumentIntelligenceComponent;
  }

  private createDynamicDashboard(config: ComponentConfig): React.ComponentType<any> {
    const DynamicDashboardComponent = (props: any) => React.createElement('div', 
      { className: 'component-wrapper', 'data-component-id': config.id },
      React.createElement('h3', { className: 'component-title' }, config.title),
      React.createElement(DynamicDashboard, { 
        categories: config.props?.categories || ['metrics', 'analytics'],
        layout: config.props?.layout || 'grid'
      })
    );
    DynamicDashboardComponent.displayName = 'DynamicDashboardComponent';
    return DynamicDashboardComponent;
  }
}

// Component Registry Implementation
export class ComponentRegistryImpl implements ComponentRegistry {
  private factories: Map<string, ComponentFactory> = new Map();
  private defaultFactory: ComponentFactory;

  constructor() {
    this.defaultFactory = new DashboardComponentFactory();
    this.registerDefaultFactories();
  }

  private registerDefaultFactories(): void {
    // Register the default dashboard component factory
    this.registerComponent('dashboard', this.defaultFactory);
  }

  registerComponent(type: string, factory: ComponentFactory): void {
    this.factories.set(type, factory);
    console.log(`Component factory registered for type: ${type}`);
  }

  createComponent(config: ComponentConfig): React.ComponentType<any> | null {
    // Validate configuration
    if (!this.validateConfig(config)) {
      console.error(`Invalid component configuration: ${config.id}`);
      return null;
    }

    // Get factory for component type
    const factory = this.getFactory(config.type);
    if (!factory) {
      console.error(`No factory found for component type: ${config.type}`);
      return null;
    }

    // Create component
    const component = factory.createComponent(config);
    if (!component) {
      console.error(`Failed to create component: ${config.id}`);
      return null;
    }

    console.log(`Component created successfully: ${config.id} (${config.type})`);
    return component;
  }

  getAvailableTypes(): string[] {
    const types: string[] = [];
    for (const [type, factory] of this.factories) {
      types.push(...factory.getSupportedTypes());
    }
    return [...new Set(types)]; // Remove duplicates
  }

  getFactory(type: string): ComponentFactory | undefined {
    // First try to find a specific factory for the type
    for (const [factoryType, factory] of this.factories) {
      if (factory.getSupportedTypes().includes(type)) {
        return factory;
      }
    }
    
    // Fall back to default factory
    return this.defaultFactory;
  }

  private validateConfig(config: ComponentConfig): boolean {
    if (!config.id || !config.type || !config.title) {
      return false;
    }

    const factory = this.getFactory(config.type);
    if (!factory) {
      return false;
    }

    return factory.validateConfig(config);
  }
}

// Dashboard Builder using Factory Pattern
export class DashboardBuilder {
  private registry: ComponentRegistry;
  private components: ComponentConfig[] = [];

  constructor(registry: ComponentRegistry) {
    this.registry = registry;
  }

  /**
   * Add a component to the dashboard
   */
  addComponent(config: ComponentConfig): DashboardBuilder {
    if (this.registry.getFactory(config.type)?.validateConfig(config)) {
      this.components.push(config);
      console.log(`Component added to dashboard: ${config.id}`);
    } else {
      console.error(`Invalid component configuration: ${config.id}`);
    }
    return this;
  }

  /**
   * Remove a component from the dashboard
   */
  removeComponent(componentId: string): DashboardBuilder {
    this.components = this.components.filter(comp => comp.id !== componentId);
    console.log(`Component removed from dashboard: ${componentId}`);
    return this;
  }

  /**
   * Update component configuration
   */
  updateComponent(componentId: string, updates: Partial<ComponentConfig>): DashboardBuilder {
    const index = this.components.findIndex(comp => comp.id === componentId);
    if (index !== -1) {
      this.components[index] = { ...this.components[index], ...updates };
      console.log(`Component updated: ${componentId}`);
    } else {
      console.error(`Component not found: ${componentId}`);
    }
    return this;
  }

  /**
   * Build the dashboard components
   */
  buildComponents(): React.ComponentType<any>[] {
    const builtComponents: React.ComponentType<any>[] = [];

    // Sort components by priority
    const sortedComponents = [...this.components].sort((a, b) => 
      (b.priority || 0) - (a.priority || 0)
    );

    for (const config of sortedComponents) {
      if (config.enabled !== false) {
        const component = this.registry.createComponent(config);
        if (component) {
          builtComponents.push(component);
        }
      }
    }

    return builtComponents;
  }

  /**
   * Get dashboard configuration
   */
  getConfiguration(): ComponentConfig[] {
    return [...this.components];
  }

  /**
   * Load configuration from JSON
   */
  loadConfiguration(configs: ComponentConfig[]): DashboardBuilder {
    this.components = [];
    for (const config of configs) {
      this.addComponent(config);
    }
    return this;
  }

  /**
   * Export configuration to JSON
   */
  exportConfiguration(): string {
    return JSON.stringify(this.components, null, 2);
  }

  /**
   * Get component statistics
   */
  getStats(): { total: number; enabled: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    let enabled = 0;

    for (const component of this.components) {
      byType[component.type] = (byType[component.type] || 0) + 1;
      if (component.enabled !== false) {
        enabled++;
      }
    }

    return {
      total: this.components.length,
      enabled,
      byType
    };
  }
}

// Export singleton instances
export const componentRegistry = new ComponentRegistryImpl();
export const dashboardBuilder = new DashboardBuilder(componentRegistry);

// Predefined dashboard configurations
export const PREDEFINED_DASHBOARDS = {
  'sales-dashboard': [
    {
      id: 'sales-metrics',
      type: 'metrics-grid',
      title: 'Sales Metrics',
      description: 'Key sales performance indicators',
      priority: 100,
      enabled: true
    },
    {
      id: 'sales-analytics',
      type: 'triangle-analytics',
      title: 'Sales Intelligence',
      description: '4D triangle analytics for sales',
      priority: 90,
      enabled: true
    },
    {
      id: 'sales-charts',
      type: 'charts-grid',
      title: 'Sales Trends',
      description: 'Sales performance charts and trends',
      priority: 80,
      enabled: true
    }
  ],
  'financial-dashboard': [
    {
      id: 'financial-metrics',
      type: 'metrics-grid',
      title: 'Financial Metrics',
      description: 'Key financial performance indicators',
      priority: 100,
      enabled: true
    },
    {
      id: 'financial-analytics',
      type: 'triangle-analytics',
      title: 'Financial Intelligence',
      description: '4D triangle analytics for finance',
      priority: 90,
      enabled: true
    },
    {
      id: 'document-intelligence',
      type: 'document-intelligence',
      title: 'Document Intelligence',
      description: 'Document processing and validation',
      priority: 85,
      enabled: true
    }
  ],
  'comprehensive-dashboard': [
    {
      id: 'dynamic-dashboard',
      type: 'dynamic-dashboard',
      title: 'Comprehensive Intelligence',
      description: 'All analytics in one view',
      priority: 100,
      enabled: true,
      props: {
        categories: ['metrics', 'analytics', 'intelligence', 'activity'],
        layout: 'grid'
      }
    }
  ]
}; 