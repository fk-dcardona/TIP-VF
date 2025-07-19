import { 
  Agent, 
  AgentCreationRequest, 
  AgentUpdateRequest, 
  AgentExecutionRequest,
  AgentListResponse,
  AgentResponse,
  AgentExecutionResponse,
  AgentExecutionHistoryResponse,
  AgentMetricsResponse,
  AgentStatsResponse,
  AgentLogEntry
} from '@/types/agent';

class AgentApiClient {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/agents${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Agent CRUD operations
  async listAgents(orgId?: string): Promise<AgentListResponse> {
    const params = orgId ? `?org_id=${orgId}` : '';
    return this.request<AgentListResponse>(`${params}`);
  }

  async getAgent(agentId: string): Promise<AgentResponse> {
    return this.request<AgentResponse>(`/${agentId}`);
  }

  async createAgent(data: AgentCreationRequest): Promise<AgentResponse> {
    return this.request<AgentResponse>('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgent(agentId: string, data: AgentUpdateRequest): Promise<AgentResponse> {
    return this.request<AgentResponse>(`/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAgent(agentId: string): Promise<{ success: boolean; error?: string }> {
    return this.request<{ success: boolean; error?: string }>(`/${agentId}`, {
      method: 'DELETE',
    });
  }

  // Agent execution
  async executeAgent(agentId: string, data: AgentExecutionRequest): Promise<AgentExecutionResponse> {
    return this.request<AgentExecutionResponse>(`/${agentId}/execute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgentStatus(agentId: string, status: string): Promise<AgentResponse> {
    return this.request<AgentResponse>(`/${agentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Execution history and monitoring
  async getExecutionHistory(agentId?: string, limit?: number): Promise<AgentExecutionHistoryResponse> {
    const params = new URLSearchParams();
    if (agentId) params.append('agent_id', agentId);
    if (limit) params.append('limit', limit.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<AgentExecutionHistoryResponse>(`/executions${query}`);
  }

  async getActiveExecutions(agentId?: string): Promise<AgentExecutionHistoryResponse> {
    const params = agentId ? `?agent_id=${agentId}` : '';
    return this.request<AgentExecutionHistoryResponse>(`/executions/active${params}`);
  }

  // Metrics and analytics
  async getAgentMetrics(agentId?: string): Promise<AgentMetricsResponse> {
    const params = agentId ? `?agent_id=${agentId}` : '';
    return this.request<AgentMetricsResponse>(`/metrics${params}`);
  }

  async getExecutorStats(): Promise<AgentStatsResponse> {
    return this.request<AgentStatsResponse>('/stats');
  }

  // Logs and debugging
  async getAgentLogs(agentId?: string, limit?: number): Promise<AgentLogEntry[]> {
    try {
      // This endpoint might not exist in the current backend, so we'll simulate it
      const params = new URLSearchParams();
      if (agentId) params.append('agent_id', agentId);
      if (limit) params.append('limit', limit.toString());
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await this.request<{ logs: AgentLogEntry[] }>(`/logs${query}`);
      return response.logs;
    } catch (error) {
      // Fallback to mock data if endpoint doesn't exist
      return this.getMockLogs(agentId, limit);
    }
  }

  // Mock data for development
  private getMockLogs(agentId?: string, limit: number = 100): AgentLogEntry[] {
    const mockLogs: AgentLogEntry[] = [
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'INFO',
        agent_id: agentId || 'agent-001',
        agent_type: 'inventory_monitor',
        event_type: 'execution_start',
        message: 'Agent execution started',
        context: { input_data: { threshold: 100 } },
        execution_id: 'exec-001',
        user_id: 'user-123',
        org_id: 'org-456',
        duration_ms: 2500
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'INFO',
        agent_id: agentId || 'agent-001',
        agent_type: 'inventory_monitor',
        event_type: 'execution_completed',
        message: 'Agent execution completed successfully',
        context: { output_data: { alerts: 3, recommendations: 5 } },
        execution_id: 'exec-001',
        user_id: 'user-123',
        org_id: 'org-456',
        duration_ms: 2500
      },
      {
        timestamp: new Date(Date.now() - 180000).toISOString(),
        level: 'WARNING',
        agent_id: agentId || 'agent-001',
        agent_type: 'inventory_monitor',
        event_type: 'threshold_exceeded',
        message: 'Inventory threshold exceeded for item SKU-789',
        context: { item_id: 'SKU-789', current_level: 45, threshold: 100 },
        execution_id: 'exec-002',
        user_id: 'user-123',
        org_id: 'org-456'
      }
    ];

    return mockLogs.slice(0, limit);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const data = await response.json();
      return {
        status: data.status || 'unknown',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const agentApiClient = new AgentApiClient();
export default agentApiClient;