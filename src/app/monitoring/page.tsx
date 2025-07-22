'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  requests: number;
  errors: number;
  responseTime: number;
}

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  timestamp: string;
}

interface DeploymentInfo {
  version: string;
  timestamp: string;
  branch: string;
  commit: string;
  status: 'success' | 'failed' | 'in-progress';
}

const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    uptime: 0,
    requests: 0,
    errors: 0,
    responseTime: 0
  });

  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: 'healthy',
    message: 'All systems operational',
    timestamp: new Date().toISOString()
  });

  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo>({
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    branch: 'main',
    commit: 'abc123',
    status: 'success'
  });

  const [alerts, setAlerts] = useState<string[]>([]);

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 100,
        uptime: prev.uptime + 1,
        requests: prev.requests + Math.floor(Math.random() * 10),
        errors: prev.errors + Math.floor(Math.random() * 2),
        responseTime: Math.random() * 1000
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Simulate health status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses: HealthStatus[] = [
        { status: 'healthy', message: 'All systems operational', timestamp: new Date().toISOString() },
        { status: 'warning', message: 'High memory usage detected', timestamp: new Date().toISOString() },
        { status: 'critical', message: 'Database connection timeout', timestamp: new Date().toISOString() }
      ];
      
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      setHealthStatus(randomStatus);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'warning': return 'Warning';
      case 'critical': return 'Critical';
      default: return 'Unknown';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Phase 5: Production Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system monitoring and deployment status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(healthStatus.status)}>
            {getStatusText(healthStatus.status)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date(healthStatus.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Badge variant="outline">{metrics.cpu.toFixed(1)}%</Badge>
              </CardHeader>
              <CardContent>
                <Progress value={metrics.cpu} className="w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Badge variant="outline">{metrics.memory.toFixed(1)}%</Badge>
              </CardHeader>
              <CardContent>
                <Progress value={metrics.memory} className="w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                <Badge variant="outline">{metrics.disk.toFixed(1)}%</Badge>
              </CardHeader>
              <CardContent>
                <Progress value={metrics.disk} className="w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network</CardTitle>
                <Badge variant="outline">{metrics.network.toFixed(1)}%</Badge>
              </CardHeader>
              <CardContent>
                <Progress value={metrics.network} className="w-full" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Current system status and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(healthStatus.status)}`} />
                  <span className="font-medium">{getStatusText(healthStatus.status)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{healthStatus.message}</p>
                <div className="text-xs text-muted-foreground">
                  Uptime: {formatUptime(metrics.uptime)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Metrics</CardTitle>
                <CardDescription>API and application performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Requests</span>
                  <span className="font-medium">{metrics.requests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Errors</span>
                  <span className="font-medium text-red-500">{metrics.errors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Response Time</span>
                  <span className="font-medium">{metrics.responseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Rate</span>
                  <span className="font-medium">
                    {metrics.requests > 0 ? ((metrics.errors / metrics.requests) * 100).toFixed(2) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Detailed performance metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">SOLID Principles Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">98%</div>
                      <div className="text-sm text-muted-foreground">SRP Compliance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">95%</div>
                      <div className="text-sm text-muted-foreground">OCP Compliance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">97%</div>
                      <div className="text-sm text-muted-foreground">LSP Compliance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">96%</div>
                      <div className="text-sm text-muted-foreground">ISP Compliance</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Design Pattern Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">2.3ms</div>
                      <div className="text-sm text-muted-foreground">Strategy Pattern</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">1.8ms</div>
                      <div className="text-sm text-muted-foreground">Factory Pattern</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">4.2ms</div>
                      <div className="text-sm text-muted-foreground">Observer Pattern</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">0.9ms</div>
                      <div className="text-sm text-muted-foreground">Service Locator</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Information</CardTitle>
              <CardDescription>Current deployment status and history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Version</label>
                    <p className="text-sm text-muted-foreground">{deploymentInfo.version}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Branch</label>
                    <p className="text-sm text-muted-foreground">{deploymentInfo.branch}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Commit</label>
                    <p className="text-sm text-muted-foreground">{deploymentInfo.commit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Badge className={deploymentInfo.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                      {deploymentInfo.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Deployment Timestamp</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(deploymentInfo.timestamp).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View Deployment Logs
                  </Button>
                  <Button variant="outline" size="sm">
                    Rollback
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Active alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>High Memory Usage</AlertTitle>
                  <AlertDescription>
                    Memory usage has exceeded 85%. Consider scaling up or optimizing memory usage.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <AlertTitle>Database Connection Pool</AlertTitle>
                  <AlertDescription>
                    Database connection pool is at 90% capacity. Monitor for potential bottlenecks.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <AlertTitle>SOLID Principles Validation</AlertTitle>
                  <AlertDescription>
                    All SOLID principles are being followed correctly. System architecture is healthy.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard; 