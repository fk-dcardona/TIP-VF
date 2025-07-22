/**
 * 🚀 Real-Time Dashboard Component - SOLID Principles Implementation
 * Supply Chain Intelligence Platform - Launch Ready
 * 
 * Single Responsibility: Orchestrate dashboard components and handle layout
 * Open/Closed: Extensible through component composition
 * Liskov Substitution: All components follow common interfaces
 * Interface Segregation: Components only receive necessary props
 * Dependency Inversion: Uses service abstraction and custom hooks
 */

'use client';

import React from 'react';
import { Text } from '@tremor/react';
import { AlertCircle } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { MetricsGrid } from './metrics-grid';
import { TriangleAnalytics } from './triangle-analytics';
import { ChartsGrid } from './charts-grid';
import { DocumentIntelligence } from './document-intelligence';

// Main component - Single Responsibility: Orchestrate dashboard components
export function RealTimeDashboard() {
  const { analyticsData, crossReferenceData, loading, error, lastUpdate } = useDashboardData();

  // Loading state
  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <Text>Loading Supply Chain Intelligence...</Text>
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

  const { metrics, charts } = analyticsData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supply Chain Intelligence Dashboard</h1>
          <p className="text-gray-600">Real-time insights and analytics</p>
        </div>
        <div className="text-right">
          <Text className="text-sm text-gray-500">Last updated</Text>
          <Text className="text-sm font-medium">{lastUpdate.toLocaleTimeString()}</Text>
        </div>
      </div>

      {/* Key Metrics Grid - Single Responsibility Component */}
      <MetricsGrid metrics={metrics} />

      {/* Triangle Analytics - Single Responsibility Component */}
      <TriangleAnalytics triangleAnalytics={metrics.triangleAnalytics} />

      {/* Charts Grid - Single Responsibility Component */}
      <ChartsGrid charts={charts} />

      {/* Document Intelligence - Single Responsibility Component */}
      <DocumentIntelligence documentIntelligence={metrics.documentIntelligence} />

      {/* Recent Activity and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {analyticsData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Text className="font-medium">{activity.action}</Text>
                  <Text className="text-sm text-gray-500">{activity.user}</Text>
                </div>
                <Text className="text-sm text-gray-500">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </Text>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Insights & Alerts</h3>
          <div className="space-y-3">
            {analyticsData.insights.map((insight) => (
              <div key={insight.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  insight.priority === 'critical' ? 'bg-red-500' :
                  insight.priority === 'high' ? 'bg-orange-500' :
                  insight.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div className="flex-1">
                  <Text className="font-medium">{insight.message}</Text>
                  <Text className="text-sm text-gray-500 capitalize">{insight.type}</Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}