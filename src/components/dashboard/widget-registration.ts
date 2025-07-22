/**
 * Widget Registration System - Open/Closed Principle Implementation
 * Automatically registers dashboard components as widgets
 * New components can be added without modifying existing registration logic
 */

import React from 'react';
import { widgetRegistry, DashboardWidget, WidgetConfig } from '@/services/dashboard-widget-registry';
import { MetricsGrid } from './metrics-grid';
import { TriangleAnalytics } from './triangle-analytics';
import { ChartsGrid } from './charts-grid';
import { DocumentIntelligence } from './document-intelligence';

// Widget configurations - can be extended without modifying core logic
const WIDGET_CONFIGS: Record<string, WidgetConfig> = {
  'metrics-grid': {
    id: 'metrics-grid',
    title: 'Key Metrics',
    description: 'Display key performance metrics in a grid layout',
    category: 'metrics',
    priority: 100,
    enabled: true,
    config: {
      layout: 'grid',
      columns: 4
    }
  },
  'triangle-analytics': {
    id: 'triangle-analytics',
    title: '4D Triangle Analytics',
    description: 'Display 4D triangle analytics scores',
    category: 'analytics',
    priority: 90,
    enabled: true,
    config: {
      layout: 'grid',
      columns: 4
    }
  },
  'charts-grid': {
    id: 'charts-grid',
    title: 'Analytics Charts',
    description: 'Display inventory trends and supplier performance charts',
    category: 'analytics',
    priority: 80,
    enabled: true,
    config: {
      layout: 'grid',
      columns: 2
    }
  },
  'document-intelligence': {
    id: 'document-intelligence',
    title: 'Document Intelligence',
    description: 'Display document intelligence metrics and validation status',
    category: 'intelligence',
    priority: 85,
    enabled: true,
    config: {
      layout: 'grid',
      columns: 4
    }
  }
};

// Widget components mapping
const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'metrics-grid': MetricsGrid,
  'triangle-analytics': TriangleAnalytics,
  'charts-grid': ChartsGrid,
  'document-intelligence': DocumentIntelligence
};

/**
 * Register all dashboard widgets
 * This function can be extended to register new widgets without modifying existing logic
 */
export function registerDashboardWidgets(): void {
  // Register each widget
  Object.entries(WIDGET_CONFIGS).forEach(([id, config]) => {
    const component = WIDGET_COMPONENTS[id];
    if (component) {
      const widget: DashboardWidget = {
        id,
        component,
        config
      };
      widgetRegistry.register(widget);
    }
  });
}

/**
 * Get widget component by ID
 */
export function getWidgetComponent(id: string): React.ComponentType<any> | null {
  const widget = widgetRegistry.getWidget(id);
  return widget ? widget.component : null;
}

/**
 * Get widget configuration by ID
 */
export function getWidgetConfig(id: string): WidgetConfig | null {
  const widget = widgetRegistry.getWidget(id);
  return widget ? widget.config : null;
}

/**
 * Get all enabled widgets for a specific category
 */
export function getEnabledWidgetsByCategory(category: WidgetConfig['category']): DashboardWidget[] {
  return widgetRegistry.getWidgetsByCategory(category).filter(widget => widget.config.enabled);
}

/**
 * Initialize widget system
 */
export function initializeWidgetSystem(): void {
  registerDashboardWidgets();
  console.log('Dashboard widget system initialized');
} 