'use client';

import React, { useState } from 'react';
import { Plus, Bot, Activity, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentCreationWizard } from '@/components/agents/AgentCreationWizard';
import { AgentMonitoringDashboard } from '@/components/agents/AgentMonitoringDashboard';
import { AgentPerformanceAnalytics } from '@/components/agents/AgentPerformanceAnalytics';
import { AgentLogsInterface } from '@/components/agents/AgentLogsInterface';

export const dynamic = 'force-dynamic';

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreationWizard, setShowCreationWizard] = useState(false);

  // Mock data - will be replaced with real API calls
  const agentSummary = {
    total: 12,
    active: 8,
    paused: 3,
    error: 1,
    totalExecutions: 2847,
    successRate: 94.2,
    avgExecutionTime: 3.4,
    costSavings: 45600
  };

  const recentAgents = [
    {
      id: 'agent-001',
      name: 'Inventory Monitor Alpha',
      type: 'inventory_monitor',
      status: 'active',
      lastRun: '2 minutes ago',
      successRate: 98.5,
      executions: 145
    },
    {
      id: 'agent-002',
      name: 'Supplier Performance Tracker',
      type: 'supplier_evaluator',
      status: 'active',
      lastRun: '15 minutes ago',
      successRate: 92.1,
      executions: 89
    },
    {
      id: 'agent-003',
      name: 'Demand Forecaster Beta',
      type: 'demand_forecaster',
      status: 'paused',
      lastRun: '2 hours ago',
      successRate: 87.3,
      executions: 234
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgentTypeLabel = (type: string) => {
    switch (type) {
      case 'inventory_monitor': return 'Inventory Monitor';
      case 'supplier_evaluator': return 'Supplier Evaluator';
      case 'demand_forecaster': return 'Demand Forecaster';
      default: return type;
    }
  };

  if (showCreationWizard) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AgentCreationWizard 
          onClose={() => setShowCreationWizard(false)}
          onAgentCreated={() => {
            setShowCreationWizard(false);
            // Refresh agent list
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agent Management</h1>
            <p className="text-gray-600 mt-2">
              Create, monitor, and manage AI agents for supply chain automation
            </p>
          </div>
          <Button 
            onClick={() => setShowCreationWizard(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Bot className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentSummary.total}</div>
                <div className="flex items-center mt-2 space-x-2">
                  <Badge className={getStatusColor('active')}>
                    {agentSummary.active} Active
                  </Badge>
                  <Badge className={getStatusColor('paused')}>
                    {agentSummary.paused} Paused
                  </Badge>
                  {agentSummary.error > 0 && (
                    <Badge className={getStatusColor('error')}>
                      {agentSummary.error} Error
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentSummary.totalExecutions.toLocaleString()}</div>
                <p className="text-xs text-green-600 mt-1">
                  {agentSummary.successRate}% Success Rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
                <Settings className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentSummary.avgExecutionTime}s</div>
                <p className="text-xs text-purple-600 mt-1">
                  -12% from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${agentSummary.costSavings.toLocaleString()}</div>
                <p className="text-xs text-orange-600 mt-1">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Agents */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Agents</CardTitle>
              <CardDescription>
                Your most recently created or modified agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Bot className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-gray-500">
                          {getAgentTypeLabel(agent.type)} • {agent.executions} executions
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{agent.successRate}%</div>
                        <div className="text-xs text-gray-500">Success Rate</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{agent.lastRun}</div>
                        <Badge className={getStatusColor(agent.status)}>
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <AgentMonitoringDashboard />
        </TabsContent>

        <TabsContent value="analytics">
          <AgentPerformanceAnalytics />
        </TabsContent>

        <TabsContent value="logs">
          <AgentLogsInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
}