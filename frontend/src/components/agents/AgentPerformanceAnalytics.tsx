'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Zap, 
  Activity,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AgentMetrics, Agent, MetricTrend, AgentType } from '@/types/agent';
import { agentApiClient } from '@/lib/agent-api-client';

export function AgentPerformanceAnalytics() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadData();
  }, [selectedAgent, timeRange]);

  const loadData = async () => {
    try {
      const agents = await agentApiClient.getAgents();
      setAgents(agents);
      if (!selectedAgent && agents.length > 0) {
        setSelectedAgent(agents[0].id);
      }

      if (selectedAgent) {
        const metricsResponse = await agentApiClient.getAgentMetrics(selectedAgent);
        setMetrics({
          agent_id: selectedAgent,
          execution_metrics: metricsResponse.execution_metrics || {
            total_executions: 0,
            success_rate: 0,
            avg_execution_time: 0,
            execution_trend: []
          },
          performance_metrics: {
            avg_memory_usage: 0,
            avg_cpu_usage: 0,
            error_rate: 0,
            throughput: 0,
            latency: 0,
            resource_usage: 0,
            availability: 0
          },
          cost_metrics: metricsResponse.cost_metrics || {
            total_cost: 0,
            cost_per_execution: 0,
            cost_trend: [],
            cost_efficiency: 0
          },
          quality_metrics: metricsResponse.quality_metrics || {
            accuracy: 0,
            precision: 0,
            recall: 0,
            f1_score: 0
          }
        });
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockTrend = (baseValue: number, points: number = 30): MetricTrend[] => {
    const trend: MetricTrend[] = [];
    const now = new Date();
    
    for (let i = points - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const variance = (Math.random() - 0.5) * 0.2;
      const value = baseValue * (1 + variance);
      
      trend.push({
        timestamp: date.toISOString(),
        value,
        change: variance * 100,
        label: date.toLocaleDateString()
      });
    }
    
    return trend;
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent);
  const executionTrend = metrics?.execution_metrics.execution_trend || 
    generateMockTrend(50, 30);
  const costTrend = metrics?.cost_metrics.cost_trend || 
    generateMockTrend(2.5, 30);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPerformanceColor = (value: number, threshold: number, inverse: boolean = false) => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  const getPerformanceIcon = (value: number, threshold: number, inverse: boolean = false) => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
          <p className="text-gray-600">Detailed performance metrics and cost analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <select
            value={selectedAgent || ''}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Agents</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics?.execution_metrics.success_rate.toFixed(1) || '95.4'}%
            </div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+2.3% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.execution_metrics.avg_execution_time.toFixed(1) || '3.2'}s
            </div>
            <div className="flex items-center mt-1">
              <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">-0.5s from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics?.execution_metrics.total_executions.toLocaleString() || '1,247'}
            </div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+15% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(metrics?.cost_metrics.total_cost || 47.83)}
            </div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-orange-600 mr-1" />
              <span className="text-xs text-orange-600">+$12.4 from last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Execution Trend
            </CardTitle>
            <CardDescription>Daily execution volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-1">
              {executionTrend.slice(-14).map((point, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-6 bg-blue-500 rounded-t"
                    style={{ height: `${(point.value / Math.max(...executionTrend.map(p => p.value))) * 200}px` }}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(point.timestamp).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Cost Trend
            </CardTitle>
            <CardDescription>Daily cost breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-1">
              {costTrend.slice(-14).map((point, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-6 bg-orange-500 rounded-t"
                    style={{ height: `${(point.value / Math.max(...costTrend.map(p => p.value))) * 200}px` }}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(point.timestamp).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              System Performance
            </CardTitle>
            <CardDescription>Resource usage and efficiency metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Average Memory Usage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {metrics?.performance_metrics.avg_memory_usage.toFixed(1) || '128.5'} MB
                  </span>
                  <div className={getPerformanceColor(128.5, 200, true)}>
                    {getPerformanceIcon(128.5, 200, true)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Average CPU Usage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {metrics?.performance_metrics.avg_cpu_usage.toFixed(1) || '23.4'}%
                  </span>
                  <div className={getPerformanceColor(23.4, 50, true)}>
                    {getPerformanceIcon(23.4, 50, true)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Error Rate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {metrics?.performance_metrics.error_rate.toFixed(2) || '0.05'}%
                  </span>
                  <div className={getPerformanceColor(0.05, 1, true)}>
                    {getPerformanceIcon(0.05, 1, true)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Throughput</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {metrics?.performance_metrics.throughput.toFixed(1) || '12.7'} exec/min
                  </span>
                  <div className={getPerformanceColor(12.7, 10)}>
                    {getPerformanceIcon(12.7, 10)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Cost Analysis
            </CardTitle>
            <CardDescription>Detailed cost breakdown and efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Cost per Execution</span>
                <span className="font-medium">
                  {formatCurrency(metrics?.cost_metrics.cost_per_execution || 0.038)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Monthly Cost</span>
                <span className="font-medium">
                  {formatCurrency((metrics?.cost_metrics.total_cost || 47.83) * 30)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Cost Efficiency</span>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Cost Optimization Tip</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Consider adjusting execution frequency during low-activity periods to reduce costs by up to 15%.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Comparison */}
      {agents.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance Comparison</CardTitle>
            <CardDescription>Comparative analysis of all agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Agent</th>
                    <th className="text-right p-2">Executions</th>
                    <th className="text-right p-2">Success Rate</th>
                    <th className="text-right p-2">Avg Time</th>
                    <th className="text-right p-2">Cost</th>
                    <th className="text-right p-2">Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className="border-b">
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">
                            {agent.type === AgentType.INVENTORY_MONITOR ? '📦' : 
                             agent.type === AgentType.SUPPLIER_EVALUATOR ? '🏢' : '📈'}
                          </span>
                          <span className="font-medium">{agent.name}</span>
                        </div>
                      </td>
                      <td className="text-right p-2">
                        {agent.execution_summary?.total_executions || 0}
                      </td>
                      <td className="text-right p-2">
                        <span className={(agent.execution_summary?.success_rate ?? 0) >= 95 ? 'text-green-600' : 'text-yellow-600'}>
                          {agent.execution_summary?.success_rate?.toFixed(1) || '0.0'}%
                        </span>
                      </td>
                      <td className="text-right p-2">
                        {agent.execution_summary?.avg_execution_time.toFixed(1) || '0.0'}s
                      </td>
                      <td className="text-right p-2">
                        {formatCurrency(Math.random() * 50 + 20)}
                      </td>
                      <td className="text-right p-2">
                        <Badge className="bg-green-100 text-green-800">
                          {(Math.random() * 20 + 80).toFixed(0)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}