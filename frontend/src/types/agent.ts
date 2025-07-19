/**
 * Agent Management Type Definitions
 */

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  status: AgentStatus;
  configuration: AgentConfiguration;
  created_at: string;
  updated_at: string;
  last_run?: string;
  is_active: boolean;
  execution_summary?: ExecutionSummary;
  org_id: string;
  user_id?: string;
}

export enum AgentType {
  INVENTORY_MONITOR = 'inventory_monitor',
  SUPPLIER_EVALUATOR = 'supplier_evaluator',
  DEMAND_FORECASTER = 'demand_forecaster',
  DOCUMENT_INTELLIGENCE = 'document_intelligence'
}

export enum AgentStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ERROR = 'error'
}

export interface AgentConfiguration {
  parameters?: Record<string, any>;
  triggers?: AgentTrigger[];
  notifications?: NotificationSettings;
  schedule?: ScheduleSettings;
  thresholds?: Record<string, number>;
  enhanced_engine_settings?: {
    cross_reference_enabled?: boolean;
    compliance_monitoring?: boolean;
    risk_pattern_detection?: boolean;
  };
}

export interface AgentTrigger {
  type: 'schedule' | 'threshold' | 'event';
  condition: Record<string, any>;
  enabled: boolean;
}

export interface NotificationSettings {
  email?: boolean;
  slack?: boolean;
  webhook?: string;
  channels?: string[];
}

export interface ScheduleSettings {
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  time?: string;
  timezone?: string;
  days?: string[];
}

export interface ExecutionSummary {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
  avg_execution_time: number;
  last_execution_time?: string;
  last_execution_status?: 'success' | 'failure';
}

export interface AgentExecution {
  id: string;
  agent_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  start_time: string;
  end_time?: string;
  duration?: number;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  tokens_used?: number;
  cost?: number;
  metrics?: ExecutionMetrics;
}

export interface ExecutionMetrics {
  memory_used_mb?: number;
  cpu_time?: number;
  network_calls?: number;
  file_operations?: number;
  processing_time?: number;
}

export interface AgentMetrics {
  agent_id: string;
  execution_metrics: {
    total_executions: number;
    success_rate: number;
    avg_execution_time: number;
    execution_trend: MetricTrend[];
  };
  performance_metrics: {
    avg_memory_usage: number;
    avg_cpu_usage: number;
    error_rate: number;
    throughput: number;
  };
  cost_metrics: {
    total_cost: number;
    cost_per_execution: number;
    cost_trend: MetricTrend[];
  };
}

export interface MetricTrend {
  timestamp: string;
  value: number;
  label?: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  icon: string;
  category: 'inventory' | 'supplier' | 'demand' | 'finance' | 'document';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_setup_time: number;
  default_configuration: AgentConfiguration;
  features: string[];
  use_cases: string[];
  requirements: string[];
}

// Document Intelligence specific types
export interface DocumentIntelligenceConfig {
  analysis_depth: 'basic' | 'comprehensive';
  enable_predictive_insights: boolean;
  enable_risk_assessment: boolean;
  enable_cost_optimization: boolean;
  max_conversation_length: number;
  enhanced_engine_settings?: {
    cross_reference_enabled: boolean;
    compliance_monitoring: boolean;
    risk_pattern_detection: boolean;
  };
}

export interface FourDTriangleScore {
  service_score: number;
  cost_score: number;
  capital_score: number;
  document_score: number;
  overall_score: number;
  analysis_date: string;
  confidence_level: number;
}

export interface DocumentIntelligenceResult {
  four_d_score: FourDTriangleScore;
  compliance_issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    recommendation: string;
  }>;
  risk_assessment: {
    overall_risk_level: 'low' | 'medium' | 'high' | 'critical';
    risk_factors: Array<{
      factor: string;
      impact: number;
      probability: number;
      mitigation: string;
    }>;
  };
  enhanced_analysis: {
    cross_references: Array<{
      source: string;
      target: string;
      relevance_score: number;
      relationship_type: string;
    }>;
    predictive_insights: Array<{
      insight_type: string;
      confidence: number;
      description: string;
      impact: string;
    }>;
  };
}

export interface AgentCreationRequest {
  name: string;
  type: AgentType;
  description: string;
  org_id: string;
  user_id?: string;
  configuration?: AgentConfiguration;
  template_id?: string;
}

export interface AgentUpdateRequest {
  name?: string;
  description?: string;
  configuration?: AgentConfiguration;
  status?: AgentStatus;
}

export interface AgentExecutionRequest {
  input?: Record<string, any>;
  user_id?: string;
  timeout?: number;
  async?: boolean;
}

export interface AgentListResponse {
  success: boolean;
  agents: Agent[];
  count: number;
  error?: string;
}

export interface AgentResponse {
  success: boolean;
  agent?: Agent;
  error?: string;
}

export interface AgentExecutionResponse {
  success: boolean;
  result?: {
    execution_id: string;
    status: string;
    output: Record<string, any>;
    metrics: ExecutionMetrics;
    duration: number;
    tokens_used: number;
    cost: number;
  };
  error?: string;
}

export interface AgentExecutionHistoryResponse {
  success: boolean;
  executions: AgentExecution[];
  count: number;
  error?: string;
}

export interface AgentMetricsResponse {
  success: boolean;
  execution_metrics?: AgentMetrics['execution_metrics'];
  cost_metrics?: AgentMetrics['cost_metrics'];
  error?: string;
}

export interface AgentStatsResponse {
  success: boolean;
  stats: {
    total_agents: number;
    active_agents: number;
    total_executions: number;
    success_rate: number;
    avg_execution_time: number;
    total_cost: number;
    cost_savings: number;
  };
  error?: string;
}

export interface AgentLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  agent_id: string;
  agent_type: string;
  event_type: string;
  message: string;
  context?: Record<string, any>;
  execution_id?: string;
  user_id?: string;
  org_id?: string;
  duration_ms?: number;
  error_type?: string;
  stack_trace?: string;
}

// Legacy types for backward compatibility
export interface AgentConfig {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  organizationId: string;
  tools: string[];
}

export interface ToolIntegration {
  name: string;
  type: 'extraction' | 'analysis' | 'generation';
  endpoint: string;
  requiredParams: string[];
  timeout: number;
}

export interface MultiTenantContext {
  organizationId: string;
  userId?: string;
  permissions?: string[];
  dataScope?: 'organization' | 'user' | 'global';
}