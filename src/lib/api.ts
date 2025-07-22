import { apiClient } from './api-client';
import { APIHealth, Upload, UploadResponse, AnalyticsData } from '@/types/api';

// Health check functions
export async function checkAPIHealth(): Promise<APIHealth> {
  return apiClient.get<APIHealth>('/health');
}

export async function getAPIConfig(): Promise<any> {
  return apiClient.get('/config');
}

// Upload functions
export async function uploadFile(file: File, orgId: string): Promise<UploadResponse> {
  return apiClient.upload<UploadResponse>('/upload', file, { org_id: orgId });
}

export async function getUploads(orgId: string): Promise<Upload[]> {
  return apiClient.get<Upload[]>(`/uploads?org_id=${orgId}`);
}

export async function downloadTemplate(templateType: string): Promise<Blob> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates/${templateType}`);
  if (!response.ok) {
    throw new Error(`Failed to download template: ${response.statusText}`);
  }
  return response.blob();
}

// Analytics functions
export async function getAnalyticsData(orgId: string): Promise<AnalyticsData> {
  return apiClient.get<AnalyticsData>(`/analytics/${orgId}`);
}

export async function getDashboardData(orgId: string, dashboardType: string): Promise<AnalyticsData> {
  return apiClient.get<AnalyticsData>(`/dashboard/${dashboardType}/${orgId}`);
}

// Document intelligence functions
export async function getDocumentAnalytics(orgId: string): Promise<any> {
  return apiClient.get(`/documents/analytics/${orgId}`);
}

export async function processDocument(file: File, orgId: string): Promise<any> {
  return apiClient.upload('/documents/upload', file, { org_id: orgId });
}

// Agent functions
export async function getAgents(orgId: string): Promise<any[]> {
  return apiClient.get<any[]>(`/agents?org_id=${orgId}`);
}

export async function executeAgent(agentId: string, params: any): Promise<any> {
  return apiClient.post(`/agents/${agentId}/execute`, params);
}

// Utility functions
export function getAPIBaseURL(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
}

export function isAPIHealthy(health: APIHealth): boolean {
  return health.status === 'healthy';
} 