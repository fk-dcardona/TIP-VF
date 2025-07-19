'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AnalyticsDisplayProps {
  analytics: any;
  agentInsights: any;
}

export default function AnalyticsDisplay({ analytics, agentInsights }: AnalyticsDisplayProps) {
  if (!analytics) return null;

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {analytics.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
            <CardDescription>Key insights from your supply chain data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p>{analytics.summary.overview || 'Analysis complete. See detailed insights below.'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      {analytics.key_metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(analytics.key_metrics).slice(0, 4).map(([key, value]) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{String(value)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Inventory Alerts */}
      {analytics.inventory_alerts && analytics.inventory_alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>{analytics.inventory_alerts.length} items require attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.inventory_alerts.slice(0, 5).map((alert: any, index: number) => (
                <Alert key={index} variant={getAlertColor(alert.alert_level)}>
                  <div className="flex items-start">
                    {getAlertIcon(alert.alert_level)}
                    <div className="ml-3 flex-1">
                      <AlertTitle className="text-sm font-medium">
                        {alert.product_name} - {alert.alert_type}
                      </AlertTitle>
                      <AlertDescription className="mt-1 text-sm">
                        <p>{alert.recommended_action}</p>
                        {alert.days_until_stockout && (
                          <p className="mt-1">Days until stockout: {alert.days_until_stockout}</p>
                        )}
                      </AlertDescription>
                    </div>
                    <Badge variant={getAlertColor(alert.alert_level)}>
                      {alert.alert_level}
                    </Badge>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Agent Insights */}
      {agentInsights && (
        <Card>
          <CardHeader>
            <CardTitle>AI Agent Analysis</CardTitle>
            <CardDescription>
              Confidence: {(agentInsights.confidence * 100).toFixed(1)}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agentInsights.result && (
              <div className="space-y-4">
                {agentInsights.result.recommendations && (
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {agentInsights.result.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {agentInsights.result.insights && (
                  <div>
                    <h4 className="font-medium mb-2">Key Insights</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {agentInsights.result.insights.map((insight: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600">{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analytics.recommendations && analytics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Actionable steps to improve your supply chain</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analytics.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}