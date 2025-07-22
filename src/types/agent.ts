// Agent Types
export enum AgentType {
  INVENTORY_MONITOR = 'INVENTORY_MONITOR',
  SUPPLIER_EVALUATOR = 'SUPPLIER_EVALUATOR',
  DEMAND_FORECASTER = 'DEMAND_FORECASTER',
  DOCUMENT_INTELLIGENCE = 'DOCUMENT_INTELLIGENCE',
  ENHANCED_INVENTORY = 'ENHANCED_INVENTORY'
}

export enum AgentStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  STOPPED = 'STOPPED'
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  description: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  execution_summary?: {
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    success_rate: number;
    avg_execution_time: number;
  };
}

export interface AgentExecution {
  id: string;
  agentId: string;
  status: AgentStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  result?: any;
  error?: string;
  parameters: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  timestamp: string;
  evidence?: any[];
  confidence?: number;
}

export interface AgentLogEntry {
  id: string;
  agentId: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AgentTemplate {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  config: Record<string, any>;
  isDefault: boolean;
}

export interface AgentCreationRequest {
  name: string;
  type: AgentType;
  description: string;
  config: Record<string, any>;
  organizationId: string;
}

export interface AgentConfiguration {
  maxConcurrentExecutions: number;
  timeout: number;
  retryAttempts: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  customSettings: Record<string, any>;
}

// Agent Performance Metrics
export interface AgentMetrics {
  agent_id: string;
  execution_metrics: {
    success_rate: number;
    execution_trend: MetricTrend[];
    total_executions: number;
    avg_execution_time: number;
  };
  cost_metrics: {
    total_cost: number;
    cost_per_execution: number;
    cost_trend: MetricTrend[];
    cost_efficiency: number;
  };
  quality_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  performance_metrics: {
    throughput: number;
    latency: number;
    resource_usage: number;
    availability: number;
    avg_memory_usage: number;
    avg_cpu_usage: number;
    error_rate: number;
  };
}

export interface MetricTrend {
  timestamp: string;
  value: number;
  change: number;
  label?: string;
}

// Agent API Client Types
export interface AgentAPIClient {
  getAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent>;
  createAgent(request: AgentCreationRequest): Promise<Agent>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent>;
  deleteAgent(id: string): Promise<void>;
  executeAgent(id: string, parameters: Record<string, any>): Promise<AgentResult>;
  getAgentExecutions(agentId: string): Promise<AgentExecution[]>;
  getAgentLogs(agentId: string): Promise<AgentLogEntry[]>;
  getAgentMetrics(agentId: string): Promise<AgentMetrics>;
  getAgentTemplates(): Promise<AgentTemplate[]>;
} 