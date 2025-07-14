'use client';

import { useState, useEffect, useCallback } from 'react';
import { uploadFile, getUploads, downloadTemplate } from '@/lib/api';
import type { Upload } from '@/types/api';

interface UploadInterfaceProps {
  orgId: string;
}

export default function UploadInterface({ orgId }: UploadInterfaceProps) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const loadUploads = useCallback(async () => {
    try {
      const response = await getUploads(orgId);
      setUploads(response.uploads);
    } catch (error) {
      console.error('Failed to load uploads:', error);
    }
  }, [orgId]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setUploadProgress('Uploading file...');

    try {
      const response = await uploadFile(file, orgId);
      setUploadProgress('Processing complete!');
      
      // Reload uploads to show the new one
      await loadUploads();
      
      setTimeout(() => {
        setUploadProgress('');
        setUploading(false);
      }, 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => {
        setUploadProgress('');
        setUploading(false);
      }, 3000);
    }
  };

  const handleTemplateDownload = async (dataType: string) => {
    try {
      const blob = await downloadTemplate(dataType);
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataType}_template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Template download failed:', error);
      alert(`Failed to download template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleViewAnalysis = (uploadId: number) => {
    window.open(`/dashboard/analytics?upload=${uploadId}`, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
        <div 
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Drop your CSV files here</h3>
          <p className="text-gray-500 mb-4">or click to browse and select files</p>
          <label className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer inline-block">
            Choose Files
            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
          <p className="text-sm text-gray-400 mt-4">Supports CSV and Excel files up to 50MB</p>
          
          {uploadProgress && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">{uploadProgress}</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Guidelines */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Guidelines</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">File Requirements</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• CSV or Excel format (.csv, .xlsx, .xls)</li>
              <li>• Maximum file size: 50MB</li>
              <li>• Include header row with column names</li>
              <li>• Use consistent date formats</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Data Quality Tips</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Remove empty rows and columns</li>
              <li>• Use standard units (kg, USD, etc.)</li>
              <li>• Ensure data consistency</li>
              <li>• Include all required fields</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sample Data Templates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Sample Data Templates</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Inventory Data</h3>
            <p className="text-sm text-gray-600 mb-4">Product inventory levels and locations</p>
            <button 
              onClick={() => handleTemplateDownload('inventory')}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Download Template
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Supplier Data</h3>
            <p className="text-sm text-gray-600 mb-4">Supplier information and performance metrics</p>
            <button 
              onClick={() => handleTemplateDownload('supplier')}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Download Template
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Shipment Data</h3>
            <p className="text-sm text-gray-600 mb-4">Shipping and logistics information</p>
            <button 
              onClick={() => handleTemplateDownload('shipment')}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Uploads</h2>
        {uploads.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No uploads yet. Upload your first file to get started!</p>
        ) : (
          <div className="space-y-4">
            {uploads.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    upload.status === 'completed' ? 'bg-green-100' : 
                    upload.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {upload.status === 'completed' ? (
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : upload.status === 'error' ? (
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{upload.original_filename}</h3>
                    <p className="text-sm text-gray-500">
                      Uploaded {formatDate(upload.upload_date)} • {upload.row_count} rows • {formatFileSize(upload.file_size)}
                    </p>
                    {upload.error_message && (
                      <p className="text-sm text-red-600 mt-1">{upload.error_message}</p>
                    )}
                  </div>
                </div>
                {upload.status === 'completed' && (
                  <button 
                    onClick={() => handleViewAnalysis(upload.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    View Analysis
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

