'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  X, 
  RefreshCw, 
  Settings,
  Wifi,
  WifiOff,
  Clock,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkAPIHealth, getAPIConfig, APIHealth } from '@/lib/api';

interface DiagnosticsOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DiagnosticsOverlay({ isVisible, onClose }: DiagnosticsOverlayProps) {
  const [health, setHealth] = useState<APIHealth | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [config] = useState(getAPIConfig());

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const healthData = await checkAPIHealth();
      setHealth(healthData);
    } catch (error) {
      setHealth({
        status: 'unhealthy',
        responseTime: 0,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      checkHealth();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getStatusIcon = () => {
    if (isChecking) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (!health) return <Info className="h-4 w-4" />;
    
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    if (!health) return 'bg-gray-100 text-gray-700';
    switch (health.status) {
      case 'healthy':
        return 'bg-green-100 text-green-700';
      case 'unhealthy':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Diagnostics
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* API Health Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                API Health
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkHealth}
                disabled={isChecking}
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge className={getStatusColor()}>
                {health?.status || 'Unknown'}
              </Badge>
              {health?.responseTime && (
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {health.responseTime}ms
                </span>
              )}
            </div>
            
            {health?.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{health.error}</p>
              </div>
            )}
          </div>

          {/* Environment Configuration */}
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Environment
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">API Base URL:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">{config.baseUrl}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <Badge variant="outline">{config.environment}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timeout:</span>
                <span>{config.timeout}ms</span>
              </div>
            </div>
          </div>

          {/* Troubleshooting Tips */}
          {health?.status === 'unhealthy' && (
            <div className="space-y-2">
              <h3 className="font-medium text-red-700">Troubleshooting</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>Check if the backend server is running on {config.baseUrl}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>Verify CORS settings allow requests from this origin</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>Check firewall or network connectivity</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>Review backend logs for error messages</span>
                </div>
              </div>
            </div>
          )}

          {/* Last Check */}
          {health?.lastChecked && (
            <div className="text-xs text-gray-500 text-center">
              Last checked: {health.lastChecked.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 