/**
 * Dynamic Dashboard Component - Open/Closed Principle Implementation
 * Renders widgets dynamically based on registry configuration
 * New widgets can be added without modifying this component
 */

'use client';

import React, { useEffect, useState } from 'react';
import { widgetRegistry, DashboardWidget } from '@/services/dashboard-widget-registry';
import { initializeWidgetSystem } from './widget-registration';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Text } from '@tremor/react';
import { AlertCircle } from 'lucide-react';

interface DynamicDashboardProps {
  categories?: Array<'metrics' | 'analytics' | 'intelligence' | 'activity'>;
  layout?: 'grid' | 'list' | 'custom';
}

export function DynamicDashboard({ 
  categories = ['metrics', 'analytics', 'intelligence', 'activity'],
  layout = 'grid'
}: DynamicDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const { analyticsData, loading, error } = useDashboardData();

  // Initialize widget system on mount
  useEffect(() => {
    initializeWidgetSystem();
    
    // Get enabled widgets for specified categories
    const enabledWidgets: DashboardWidget[] = [];
    categories.forEach(category => {
      const categoryWidgets = widgetRegistry.getWidgetsByCategory(category)
        .filter(widget => widget.config.enabled);
      enabledWidgets.push(...categoryWidgets);
    });
    
    // Sort by priority
    enabledWidgets.sort((a, b) => b.config.priority - a.config.priority);
    setWidgets(enabledWidgets);
  }, [categories]);

  // Loading state
  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <Text>Loading Dynamic Dashboard...</Text>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <Text className="text-red-600">{error}</Text>
        </div>
      </div>
    );
  }

  // No data state
  if (!analyticsData) {
    return null;
  }

  // Render widgets based on layout
  const renderWidgets = () => {
    if (layout === 'grid') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {widgets.map((widget) => {
            const WidgetComponent = widget.component;
            return (
              <div key={widget.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">{widget.config.title}</h3>
                <WidgetComponent 
                  {...analyticsData}
                  config={widget.config.config}
                />
              </div>
            );
          })}
        </div>
      );
    }

    if (layout === 'list') {
      return (
        <div className="space-y-6">
          {widgets.map((widget) => {
            const WidgetComponent = widget.component;
            return (
              <div key={widget.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">{widget.config.title}</h3>
                <p className="text-gray-600 mb-4">{widget.config.description}</p>
                <WidgetComponent 
                  {...analyticsData}
                  config={widget.config.config}
                />
              </div>
            );
          })}
        </div>
      );
    }

    // Custom layout - render widgets in their natural order
    return (
      <div className="space-y-6">
        {widgets.map((widget) => {
          const WidgetComponent = widget.component;
          return (
            <div key={widget.id}>
              <WidgetComponent 
                {...analyticsData}
                config={widget.config.config}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dynamic Supply Chain Dashboard</h1>
          <p className="text-gray-600">Configurable widgets with {widgets.length} active components</p>
        </div>
        <div className="text-right">
          <Text className="text-sm text-gray-500">Layout: {layout}</Text>
          <Text className="text-sm text-gray-500">Categories: {categories.join(', ')}</Text>
        </div>
      </div>

      {/* Dynamic Widgets */}
      {renderWidgets()}
    </div>
  );
} 