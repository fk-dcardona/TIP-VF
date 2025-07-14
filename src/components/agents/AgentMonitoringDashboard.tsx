'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Pause, 
  Play, 
  RefreshCw, 
  TrendingUp, 
  Clock,
  Zap,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Agent, AgentExecution, AgentStatus } from '@/types/agent';
import { agentApiClient } from '@/lib/agent-api-client';

export function AgentMonitoringDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeExecutions, setActiveExecutions] = useState<AgentExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [agentsResponse, executionsResponse] = await Promise.all([
        agentApiClient.listAgents(),
        agentApiClient.getActiveExecutions()
      ]);

      if (agentsResponse.success) {
        setAgents(agentsResponse.agents);
      }

      if (executionsResponse.success) {
        setActiveExecutions(executionsResponse.executions);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentStatusChange = async (agentId: string, newStatus: AgentStatus) => {
    try {
      const response = await agentApiClient.updateAgentStatus(agentId, newStatus);
      if (response.success) {
        setAgents(prev => prev.map(agent => 
          agent.id === agentId ? { ...agent, status: newStatus } : agent
        ));
      }
    } catch (error) {
      console.error('Failed to update agent status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'running': return <Activity className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'inventory_monitor': return '📦';
      case 'supplier_evaluator': return '🏢';
      case 'demand_forecaster': return '📈';
      default: return '🤖';
    }
  };

  const formatExecutionTime = (timeString: string) => {
    const now = new Date();
    const execTime = new Date(timeString);
    const diffMs = now.getTime() - execTime.getTime();
    
    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    return `${Math.floor(diffMs / 86400000)}d ago`;
  };

  const activeAgents = agents.filter(agent => agent.status === 'active');
  const pausedAgents = agents.filter(agent => agent.status === 'paused');
  const errorAgents = agents.filter(agent => agent.status === 'error');

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
          <h2 className="text-2xl font-bold text-gray-900">Agent Monitoring</h2>
          <p className="text-gray-600">Real-time monitoring of all active agents</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeAgents.length}</div>
            <p className="text-xs text-gray-500">Running normally</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Executions</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeExecutions.length}</div>
            <p className="text-xs text-gray-500">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused Agents</CardTitle>
            <Pause className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pausedAgents.length}</div>
            <p className="text-xs text-gray-500">Temporarily stopped</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Agents</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorAgents.length}</div>
            <p className="text-xs text-gray-500">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Executions */}
      {activeExecutions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Executions</CardTitle>
            <CardDescription>Currently running agent executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeExecutions.map((execution) => {
                const agent = agents.find(a => a.id === execution.agent_id);
                return (
                  <div key={execution.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getAgentTypeIcon(agent?.type || '')}</div>
                      <div>
                        <div className="font-medium">{agent?.name || 'Unknown Agent'}</div>
                        <div className="text-sm text-gray-600">
                          Started {formatExecutionTime(execution.start_time)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(execution.status)}>
                        {getStatusIcon(execution.status)}
                        <span className="ml-1">{execution.status}</span>
                      </Badge>
                      <div className="animate-pulse">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
          <CardDescription>Overview of all registered agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getAgentTypeIcon(agent.type)}</div>
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-gray-600">{agent.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Created: {new Date(agent.created_at).toLocaleDateString()}
                      {agent.last_run && ` • Last run: ${formatExecutionTime(agent.last_run)}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Performance Metrics */}
                  <div className="text-right">
                    <div className="flex items-center space-x-4 text-sm">
                      {agent.execution_summary && (
                        <>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span>{agent.execution_summary.success_rate.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span>{agent.execution_summary.avg_execution_time.toFixed(1)}s</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Zap className="h-3 w-3 text-purple-600" />
                            <span>{agent.execution_summary.total_executions}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Status and Controls */}
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(agent.status)}>
                      {getStatusIcon(agent.status)}
                      <span className="ml-1">{agent.status}</span>
                    </Badge>
                    <div className="flex space-x-1">
                      {agent.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAgentStatusChange(agent.id, 'paused' as AgentStatus)}
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}
                      {agent.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAgentStatusChange(agent.id, 'active' as AgentStatus)}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}