/**
 * Dashboard Widget Registry - Open/Closed Principle Implementation
 * Open for extension: New widgets can be registered without modifying existing code
 * Closed for modification: Core registry logic doesn't change when adding new widgets
 */

import React from 'react';

// Widget configuration interface
export interface WidgetConfig {
  id: string;
  title: string;
  description: string;
  category: 'metrics' | 'analytics' | 'intelligence' | 'activity';
  priority: number;
  enabled: boolean;
  config?: Record<string, any>;
}

// Widget interface
export interface DashboardWidget {
  id: string;
  component: React.ComponentType<any>;
  config: WidgetConfig;
}

// Widget registry class
export class DashboardWidgetRegistry {
  private static instance: DashboardWidgetRegistry;
  private widgets: Map<string, DashboardWidget> = new Map();

  private constructor() {}

  // Singleton pattern
  static getInstance(): DashboardWidgetRegistry {
    if (!DashboardWidgetRegistry.instance) {
      DashboardWidgetRegistry.instance = new DashboardWidgetRegistry();
    }
    return DashboardWidgetRegistry.instance;
  }

  /**
   * Register a new widget - Open for extension
   */
  register(widget: DashboardWidget): void {
    if (this.widgets.has(widget.id)) {
      console.warn(`Widget with id '${widget.id}' already exists. Overwriting.`);
    }
    this.widgets.set(widget.id, widget);
  }

  /**
   * Get a widget by ID
   */
  getWidget(id: string): DashboardWidget | undefined {
    return this.widgets.get(id);
  }

  /**
   * Get all widgets
   */
  getAllWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Get widgets by category
   */
  getWidgetsByCategory(category: WidgetConfig['category']): DashboardWidget[] {
    return this.getAllWidgets().filter(widget => widget.config.category === category);
  }

  /**
   * Get enabled widgets sorted by priority
   */
  getEnabledWidgets(): DashboardWidget[] {
    return this.getAllWidgets()
      .filter(widget => widget.config.enabled)
      .sort((a, b) => b.config.priority - a.config.priority);
  }

  /**
   * Update widget configuration
   */
  updateWidgetConfig(id: string, config: Partial<WidgetConfig>): boolean {
    const widget = this.widgets.get(id);
    if (widget) {
      widget.config = { ...widget.config, ...config };
      return true;
    }
    return false;
  }

  /**
   * Enable/disable a widget
   */
  setWidgetEnabled(id: string, enabled: boolean): boolean {
    return this.updateWidgetConfig(id, { enabled });
  }

  /**
   * Remove a widget
   */
  unregister(id: string): boolean {
    return this.widgets.delete(id);
  }

  /**
   * Load widgets from configuration
   */
  loadFromConfig(config: Record<string, WidgetConfig>): void {
    Object.entries(config).forEach(([id, widgetConfig]) => {
      const widget = this.widgets.get(id);
      if (widget) {
        widget.config = { ...widget.config, ...widgetConfig };
      }
    });
  }

  /**
   * Export current configuration
   */
  exportConfig(): Record<string, WidgetConfig> {
    const config: Record<string, WidgetConfig> = {};
    this.widgets.forEach((widget, id) => {
      config[id] = widget.config;
    });
    return config;
  }
}

// Export singleton instance
export const widgetRegistry = DashboardWidgetRegistry.getInstance(); 