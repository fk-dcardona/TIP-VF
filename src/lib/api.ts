import type { 
  UploadResponse, 
  UploadsListResponse, 
  AnalysisResponse, 
  UploadDetailsResponse 
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

export async function uploadFile(file: File, orgId: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('org_id', orgId);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

export async function getUploads(orgId: string): Promise<UploadsListResponse> {
  const response = await fetch(`${API_BASE_URL}/uploads/${orgId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch uploads');
  }

  return response.json();
}

export async function getAnalysis(uploadId: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/analysis/${uploadId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch analysis');
  }

  return response.json();
}

export async function downloadTemplate(dataType: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/template/${dataType}`);
  
  if (!response.ok) {
    throw new Error('Failed to download template');
  }

  return response.blob();
}

