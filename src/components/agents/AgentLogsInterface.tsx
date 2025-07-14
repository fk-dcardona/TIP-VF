'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  Bug,
  Calendar,
  Clock,
  Bot,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AgentLogEntry, Agent } from '@/types/agent';
import { agentApiClient } from '@/lib/agent-api-client';

export function AgentLogsInterface() {
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AgentLogEntry[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedAgent]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedAgent]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, selectedLevel]);

  const loadData = async () => {
    try {
      const [agentsResponse, logsData] = await Promise.all([
        agentApiClient.listAgents(),
        agentApiClient.getAgentLogs(selectedAgent || undefined, 1000)
      ]);

      if (agentsResponse.success) {
        setAgents(agentsResponse.agents);
      }

      setLogs(logsData);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.agent_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLevel) {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    setFilteredLogs(filtered);
  };

  const toggleLogExpansion = (logIndex: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logIndex)) {
      newExpanded.delete(logIndex);
    } else {
      newExpanded.add(logIndex);
    }
    setExpandedLogs(newExpanded);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO': return 'bg-blue-100 text-blue-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'DEBUG': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'INFO': return <Info className="h-4 w-4" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4" />;
      case 'ERROR': return <AlertCircle className="h-4 w-4" />;
      case 'DEBUG': return <Bug className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.name || agentId;
  };

  const getAgentTypeIcon = (agentType: string) => {
    switch (agentType) {
      case 'inventory_monitor': return '📦';
      case 'supplier_evaluator': return '🏢';
      case 'demand_forecaster': return '📈';
      default: return '🤖';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const downloadLogs = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Agent', 'Event Type', 'Message', 'Execution ID', 'Duration'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level,
        getAgentName(log.agent_id),
        log.event_type,
        `"${log.message.replace(/"/g, '""')}"`,
        log.execution_id || '',
        log.duration_ms || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const logCounts = {
    total: logs.length,
    info: logs.filter(log => log.level === 'INFO').length,
    warning: logs.filter(log => log.level === 'WARNING').length,
    error: logs.filter(log => log.level === 'ERROR').length,
    debug: logs.filter(log => log.level === 'DEBUG').length
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
          <h2 className="text-2xl font-bold text-gray-900">Agent Logs</h2>
          <p className="text-gray-600">Debug and monitor agent execution logs</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-blue-50 border-blue-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto Refresh' : 'Manual Refresh'}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logCounts.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
            <Info className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{logCounts.info}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{logCounts.warning}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{logCounts.error}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Debug</CardTitle>
            <Bug className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{logCounts.debug}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Agents</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Levels</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="DEBUG">Debug</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
          <CardDescription>
            {filteredLogs.length} of {logs.length} logs shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLogs.map((log, index) => {
              const logKey = `${log.timestamp}-${index}`;
              const isExpanded = expandedLogs.has(logKey);
              const timestamp = formatTimestamp(log.timestamp);

              return (
                <div key={logKey} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLogExpansion(logKey)}
                        className="p-1 h-auto"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <Badge className={getLevelColor(log.level)}>
                            {getLevelIcon(log.level)}
                            <span className="ml-1">{log.level}</span>
                          </Badge>
                          
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="text-xl">{getAgentTypeIcon(log.agent_type)}</span>
                            <span>{getAgentName(log.agent_id)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{timestamp.date}</span>
                            <Clock className="h-3 w-3" />
                            <span>{timestamp.time}</span>
                          </div>
                          
                          {log.duration_ms && (
                            <Badge variant="outline" className="text-xs">
                              {log.duration_ms}ms
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm font-medium mb-1">{log.event_type}</div>
                        <div className="text-sm text-gray-700">{log.message}</div>
                        
                        {isExpanded && (
                          <div className="mt-3 space-y-2">
                            {log.execution_id && (
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="font-medium">Execution ID:</span>
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  {log.execution_id}
                                </code>
                              </div>
                            )}
                            
                            {log.context && Object.keys(log.context).length > 0 && (
                              <div className="text-sm">
                                <span className="font-medium">Context:</span>
                                <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto">
                                  {JSON.stringify(log.context, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {log.stack_trace && (
                              <div className="text-sm">
                                <span className="font-medium">Stack Trace:</span>
                                <pre className="bg-red-50 p-2 rounded text-xs mt-1 overflow-x-auto text-red-800">
                                  {log.stack_trace}
                                </pre>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {log.user_id && (
                                <span>User: {log.user_id}</span>
                              )}
                              {log.org_id && (
                                <span>Org: {log.org_id}</span>
                              )}
                              {log.error_type && (
                                <span>Error Type: {log.error_type}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No logs found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}