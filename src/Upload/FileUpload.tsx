import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { parseCSVFile } from '@/utils/csvProcessor';

interface FileUploadProps {
  onFileUpload: (data: Record<string, unknown>[], filename: string) => void;
  acceptedFileTypes?: string;
  title: string;
  description: string;
  isUploading?: boolean;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  acceptedFileTypes = '.csv',
  title,
  description,
  isUploading = false,
  error
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      console.error('Invalid file type:', file.name);
      return;
    }

    try {
      setUploadProgress(0);
      console.log('Starting file processing for:', file.name, 'Size:', file.size, 'bytes');
      
      // Simulate chunked processing with progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const data = await parseCSVFile(file);
      console.log('CSV parsed successfully. Rows:', data.length);
      console.log('First row sample:', data[0]);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        onFileUpload(data, file.name);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('File processing error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        fileName: file.name,
        fileSize: file.size
      });
      setUploadProgress(0);
      // Show error to user
      if (error instanceof Error) {
        onFileUpload([], `Error: ${error.message}`);
      }
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${isUploading ? 'pointer-events-none opacity-75' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="space-y-4">
          {isUploading ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <FileText className="h-12 w-12 text-blue-500 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Processing file...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{uploadProgress}% complete</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                {error ? (
                  <AlertCircle className="h-12 w-12 text-red-500" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400" />
                )}
              </div>

              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  {dragActive ? 'Drop your CSV file here' : 'Upload CSV File'}
                </p>
                <p className="text-sm text-gray-500">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Supports CSV files up to 10MB
                </p>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
                          <button
                className="mt-2 text-xs bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                onClick={() => {
                  // Generate appropriate sample data based on title
                  const isSalesUpload = title.includes('Sales');
                  
                  if (isSalesUpload) {
                    // Generate sample sales data
                    const sampleSalesData = Array.from({ length: 20 }, (_, i) => ({
                      k_sc_codigo_articulo: `PROD${(i % 10 + 1).toString().padStart(3, '0')}`,
                      sc_detalle_articulo: `Sample Product ${i % 10 + 1}`,
                      d_fecha_documento: `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/2024`,
                      n_cantidad: Math.floor(Math.random() * 10) + 1,
                      n_valor: (Math.random() * 500 + 50).toFixed(2)
                    }));
                    onFileUpload(sampleSalesData, 'sample-sales-data.csv');
                  } else {
                    // Generate sample inventory data
                    const sampleData = Array.from({ length: 10 }, (_, i) => ({
                      k_sc_codigo_articulo: `PROD${(i + 1).toString().padStart(3, '0')}`,
                      sc_detalle_articulo: `Sample Product ${i + 1}`,
                      sc_detalle_grupo: `Group ${Math.floor(i / 3) + 1}`,
                      n_saldo_actual: Math.floor(Math.random() * 100) + 10,
                      n_costo_promedio: (Math.random() * 50 + 10).toFixed(2)
                    }));
                    onFileUpload(sampleData, 'sample-inventory-data.csv');
                  }
                }}
              >
                Use Sample Data for Testing
              </button>
          </div>
        )}
      </div>
    </div>
  );
};