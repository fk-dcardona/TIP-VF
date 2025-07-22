/**
 * SOLID Analytics Dashboard - Test Integration Component
 * 
 * Single Responsibility: Display analytics data from SOLID service
 * Open/Closed: Extensible for new analytics visualizations
 * Dependency Inversion: Uses hook abstractions, not concrete implementations
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { 
  useAllAnalytics, 
  useAnalyticsFallbackStatus,
  useAnalyticsHealth 
} from '../../hooks/useSolidAnalytics';

interface SolidAnalyticsDashboardProps {
  orgId: string;
  className?: string;
}

export function SolidAnalyticsDashboard({ orgId, className = '' }: SolidAnalyticsDashboardProps) {
  const analytics = useAllAnalytics(orgId);
  const fallbackStatus = useAnalyticsFallbackStatus(orgId);
  const { health, refreshHealth } = useAnalyticsHealth();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🔧 SOLID Analytics System Health
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshHealth}
            >
              Refresh Health
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">System Status</p>
              <Badge 
                variant={
                  fallbackStatus.systemHealth === 'healthy' ? 'default' :
                  fallbackStatus.systemHealth === 'degraded' ? 'secondary' : 'destructive'
                }
              >
                {fallbackStatus.systemHealth.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Using Fallback</p>
              <Badge variant={fallbackStatus.isUsingFallback ? 'secondary' : 'default'}>
                {fallbackStatus.isUsingFallback ? 'YES (Self-Repaired)' : 'NO (Direct API)'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Last Health Check</p>
              <p className="text-xs text-muted-foreground">
                {health?.last_check ? new Date(health.last_check).toLocaleTimeString() : 'Never'}
              </p>
            </div>
          </div>

          {health && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Provider Status</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(health.provider_status).map(([provider, status]) => (
                  <Badge 
                    key={provider} 
                    variant={
                      status === 'online' ? 'default' :
                      status === 'degraded' ? 'secondary' : 'destructive'
                    }
                  >
                    {provider}: {status}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Self-Repair Alert */}
      {fallbackStatus.isUsingFallback && (
        <Alert>
          <AlertDescription>
            🛠️ <strong>Self-Repair Active:</strong> The system has automatically switched to fallback providers 
            to ensure continuous service while backend issues are resolved.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Panel */}
      <Card>
        <CardHeader>
          <CardTitle>🎮 System Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={analytics.refetchAll}
              disabled={analytics.overallLoading}
            >
              {analytics.overallLoading ? 'Refreshing...' : 'Refresh All Data'}
            </Button>
            <Badge variant="outline">
              Overall Loading: {analytics.overallLoading ? 'Yes' : 'No'}
            </Badge>
            <Badge variant={analytics.anyError ? 'destructive' : 'default'}>
              Any Errors: {analytics.anyError ? 'Yes' : 'No'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Triangle Analytics */}
      <AnalyticsSection
        title="📊 Triangle Analytics"
        data={analytics.triangle}
        renderData={(data) => (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Service Score" value={`${data.service_score.toFixed(1)}%`} />
            <MetricCard label="Cost Score" value={`${data.cost_score.toFixed(1)}%`} />
            <MetricCard label="Capital Score" value={`${data.capital_score.toFixed(1)}%`} />
            <MetricCard label="Documents Score" value={`${data.documents_score.toFixed(1)}%`} />
          </div>
        )}
      />

      {/* Cross-Reference Analytics */}
      <AnalyticsSection
        title="🔄 Cross-Reference Analytics"
        data={analytics.crossReference}
        renderData={(data) => (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard label="Document Compliance" value={`${data.document_compliance.toFixed(1)}%`} />
            <MetricCard label="Inventory Accuracy" value={`${data.inventory_accuracy.toFixed(1)}%`} />
            <MetricCard label="Compromised Items" value={`${data.compromised_inventory.compromised_count}`} />
          </div>
        )}
      />

      {/* Supplier Analytics */}
      <AnalyticsSection
        title="🏭 Supplier Analytics"
        data={analytics.supplier}
        renderData={(data) => (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Avg Health Score" value={`${data.average_performance.health_score.toFixed(1)}%`} />
              <MetricCard label="Avg Delivery" value={`${data.average_performance.delivery_performance.toFixed(1)}%`} />
              <MetricCard label="Avg Quality" value={`${data.average_performance.quality_score.toFixed(1)}%`} />
              <MetricCard label="Total Suppliers" value={data.suppliers.length.toString()} />
            </div>
          </div>
        )}
      />

      {/* Market Analytics */}
      <AnalyticsSection
        title="📈 Market Intelligence"
        data={analytics.market}
        renderData={(data) => (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard label="Market Segments" value={data.market_segments.length.toString()} />
            <MetricCard label="Demand Growth" value={`${data.market_trends.demand_growth.toFixed(1)}%`} />
            <MetricCard label="Price Trend" value={data.market_trends.price_trends} />
          </div>
        )}
      />
    </div>
  );
}

// ==================== Helper Components ====================

interface AnalyticsSectionProps<T> {
  title: string;
  data: {
    data: T | null;
    loading: boolean;
    error: string | null;
    fallbackUsed: boolean;
    provider: string | null;
    lastFetch: Date | null;
  };
  renderData: (data: T) => React.ReactNode;
}

function AnalyticsSection<T>({ title, data, renderData }: AnalyticsSectionProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="flex gap-2">
            {data.fallbackUsed && (
              <Badge variant="secondary">Fallback</Badge>
            )}
            {data.provider && (
              <Badge variant="outline">{data.provider}</Badge>
            )}
            {data.loading && (
              <Badge variant="secondary">Loading...</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {data.error && !data.loading && (
          <Alert>
            <AlertDescription>
              <strong>Error:</strong> {data.error}
            </AlertDescription>
          </Alert>
        )}

        {data.data && !data.loading && renderData(data.data)}

        {data.lastFetch && (
          <p className="text-xs text-muted-foreground mt-4">
            Last updated: {data.lastFetch.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
}

function MetricCard({ label, value, trend }: MetricCardProps) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-lg font-bold">{value}</p>
        {trend && (
          <span className="text-sm">
            {trend === 'up' && '📈'}
            {trend === 'down' && '📉'}
            {trend === 'stable' && '➡️'}
          </span>
        )}
      </div>
    </div>
  );
}