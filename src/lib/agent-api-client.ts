import { apiClient } from './api-client';
import { 
  Agent, 
  AgentExecution, 
  AgentResult, 
  AgentLogEntry, 
  AgentMetrics, 
  AgentTemplate, 
  AgentCreationRequest,
  AgentAPIClient as IAgentAPIClient
} from '@/types/agent';

class AgentAPIClient implements IAgentAPIClient {
  private baseURL: string;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') {
    this.baseURL = baseURL;
  }

  async getAgents(): Promise<Agent[]> {
    return apiClient.get<Agent[]>('/agents');
  }

  async getAgent(id: string): Promise<Agent> {
    return apiClient.get<Agent>(`/agents/${id}`);
  }

  async createAgent(request: AgentCreationRequest): Promise<Agent> {
    return apiClient.post<Agent>('/agents', request);
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    return apiClient.put<Agent>(`/agents/${id}`, updates);
  }

  async deleteAgent(id: string): Promise<void> {
    return apiClient.delete<void>(`/agents/${id}`);
  }

  async executeAgent(id: string, parameters: Record<string, any>): Promise<AgentResult> {
    return apiClient.post<AgentResult>(`/agents/${id}/execute`, parameters);
  }

  async getAgentExecutions(agentId: string): Promise<AgentExecution[]> {
    return apiClient.get<AgentExecution[]>(`/agents/${agentId}/executions`);
  }

  async getAgentLogs(agentId: string): Promise<AgentLogEntry[]> {
    return apiClient.get<AgentLogEntry[]>(`/agents/${agentId}/logs`);
  }

  async getAgentMetrics(agentId: string): Promise<AgentMetrics> {
    return apiClient.get<AgentMetrics>(`/agents/${agentId}/metrics`);
  }

  async getAgentTemplates(): Promise<AgentTemplate[]> {
    return apiClient.get<AgentTemplate[]>('/agents/templates');
  }

  // Additional convenience methods
  async getAgentsByType(type: string): Promise<Agent[]> {
    return apiClient.get<Agent[]>(`/agents?type=${type}`);
  }

  async getAgentsByStatus(status: string): Promise<Agent[]> {
    return apiClient.get<Agent[]>(`/agents?status=${status}`);
  }

  async stopAgent(id: string): Promise<void> {
    return apiClient.post<void>(`/agents/${id}/stop`, {});
  }

  async restartAgent(id: string): Promise<void> {
    return apiClient.post<void>(`/agents/${id}/restart`, {});
  }

  async getAgentHealth(id: string): Promise<any> {
    return apiClient.get<any>(`/agents/${id}/health`);
  }

  async updateAgentConfig(id: string, config: Record<string, any>): Promise<Agent> {
    return apiClient.put<Agent>(`/agents/${id}/config`, config);
  }
}

// Create singleton instance
export const agentApiClient = new AgentAPIClient(); 