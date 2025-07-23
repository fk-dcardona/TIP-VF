import React, { useState, useCallback } from 'react';
import { Upload, Calendar, TrendingUp, BarChart3, CheckCircle, AlertCircle } from 'lucide-react';
import { validateInventoryCSV, validateSalesCSV, processInventoryData, processSalesData, parseCSVFile } from '@/csvProcessor';
import { databaseService } from '@/services/database';
import type { CSVValidationResult } from '@/types';

interface InventoryPeriod {
  id: string;
  file: File | null;
  month: string;
  year: string;
  status: 'pending' | 'uploaded' | 'processing' | 'completed' | 'error';
  data?: any[];
  recordCount?: number;
  error?: string;
}

interface MultiInventoryUploadProps {
  onComplete: (periods: InventoryPeriod[]) => void;
  onBack: () => void;
}

export const MultiInventoryUpload: React.FC<MultiInventoryUploadProps> = ({ onComplete, onBack }) => {
  const [periods, setPeriods] = useState<InventoryPeriod[]>([
    { id: '1', file: null, month: 'January', year: '2025', status: 'pending' },
    { id: '2', file: null, month: 'February', year: '2025', status: 'pending' },
    { id: '3', file: null, month: 'March', year: '2025', status: 'pending' },
    { id: '4', file: null, month: 'April', year: '2025', status: 'pending' },
    { id: '5', file: null, month: 'May', year: '2025', status: 'pending' },
    { id: '6', file: null, month: 'June', year: '2025', status: 'pending' },
  ]);

  const [currentStep, setCurrentStep] = useState<'inventory' | 'sales' | 'complete'>('inventory');
  const [salesData, setSalesData] = useState<any[] | null>(null);
  const [salesFile, setSalesFile] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (periodId: string, file: File) => {
    try {
      // Parse CSV file to get raw data
      const rawData = await parseCSVFile(file);
      
      // Validate the CSV data
      const validation: CSVValidationResult = validateInventoryCSV(rawData);
      
      if (!validation.isValid) {
        setPeriods(prev => prev.map(p => 
          p.id === periodId 
            ? { ...p, status: 'error', error: `Validation failed: ${validation.errors.slice(0, 3).join(', ')}` }
            : p
        ));
        return;
      }

      // Process the data
      const processedData = processInventoryData(rawData);
      
      setPeriods(prev => prev.map(p => 
        p.id === periodId 
          ? { 
              ...p, 
              file, 
              status: 'uploaded', 
              data: processedData,
              recordCount: processedData.length,
              error: undefined
            }
          : p
      ));

    } catch (error) {
      setPeriods(prev => prev.map(p => 
        p.id === periodId 
          ? { ...p, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
          : p
      ));
    }
  }, []);

    const handleSaveInventoryToDatabase = useCallback(async () => {
    setIsProcessing(true);
    
    const uploadedPeriods = periods.filter(p => p.status === 'uploaded' && p.data);
    
    for (const period of uploadedPeriods) {
      try {
        setCurrentlyProcessing(period.id);
        setPeriods(prev => prev.map(p => 
          p.id === period.id ? { ...p, status: 'processing' } : p
        ));

        // Save to Supabase with period information
        await databaseService.saveInventoryData(
          period.data!,
          `${period.month}_${period.year}_inventory.csv`
        );

        setPeriods(prev => prev.map(p => 
          p.id === period.id ? { ...p, status: 'completed' } : p
        ));

      } catch (error) {
        setPeriods(prev => prev.map(p => 
          p.id === period.id 
            ? { ...p, status: 'error', error: error instanceof Error ? error.message : 'Save failed' }
            : p
        ));
      }
    }
    
    setCurrentlyProcessing(null);
    setIsProcessing(false);
    setCurrentStep('sales');
  }, [periods]);

  const handleSalesUpload = useCallback(async (file: File) => {
    try {
      // Parse CSV file to get raw data
      const rawData = await parseCSVFile(file);
      
      // Validate the CSV data
      const validation: CSVValidationResult = validateSalesCSV(rawData);
      
      if (!validation.isValid) {
        alert(`Sales validation failed: ${validation.errors.slice(0, 3).join(', ')}`);
        return;
      }

      // Process the data
      const processedData = processSalesData(rawData);
      setSalesData(processedData);
      setSalesFile(file.name);

    } catch (error) {
      alert(`Error processing sales file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleCompleteSalesUpload = useCallback(async () => {
    if (!salesData) return;
    
    setIsProcessing(true);
    
    try {
      await databaseService.saveSalesData(salesData, salesFile);
      setCurrentStep('complete');
      setTimeout(() => {
        onComplete(periods);
      }, 1500);
    } catch (error) {
      alert(`Error saving sales data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [salesData, salesFile, periods, onComplete]);

  const uploadedCount = periods.filter(p => p.status === 'uploaded' || p.status === 'completed').length;
  const totalRecords = periods.reduce((sum, p) => sum + (p.recordCount || 0), 0);

  // Sales Upload Step
  if (currentStep === 'sales') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Upload Sales Data</h2>
          </div>
          <p className="text-gray-600">
            Now upload your sales data to complete the multi-period analysis
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-green-800">Inventory Data Uploaded Successfully!</h4>
              <p className="text-sm text-green-700 mt-1">
                {uploadedCount} periods • {totalRecords.toLocaleString()} total records saved to database
              </p>
            </div>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          {!salesData ? (
            <>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSalesUpload(file);
                }}
                className="hidden"
                id="sales-upload"
              />
              <label
                htmlFor="sales-upload"
                className="cursor-pointer flex flex-col items-center space-y-4"
              >
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
                  <span className="text-lg font-medium text-gray-900">Upload Sales CSV</span>
                  <p className="text-gray-600 mt-1">Upload your sales transaction data</p>
                </div>
              </label>
            </>
          ) : (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-green-800">Sales Data Ready!</h3>
                <p className="text-green-600">{salesFile} • {salesData.length.toLocaleString()} records</p>
              </div>
              <button
                onClick={handleCompleteSalesUpload}
                disabled={isProcessing}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2 mx-auto"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving Sales Data...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    <span>Complete Multi-Period Setup</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setCurrentStep('inventory')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Inventory Upload
          </button>
        </div>
      </div>
    );
  }

  // Complete Step
  if (currentStep === 'complete') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-3xl font-bold text-gray-900">Multi-Period Analysis Complete!</h2>
          <p className="text-gray-600">
            Your inventory and sales data has been successfully uploaded and is ready for analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Multi-Period Inventory Analysis</h2>
        </div>
        <p className="text-gray-600">
          Upload inventory files from different months to analyze trends and patterns
        </p>
        <div className="pt-2">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Upload Mode Selection
          </button>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-4">
             <div className="text-sm text-gray-600">
               <span className="font-semibold text-blue-600">{uploadedCount}</span> of 6 periods uploaded
             </div>
             <div className="text-sm text-gray-600">
               <span className="font-semibold text-green-600">{totalRecords.toLocaleString()}</span> total records
             </div>
           </div>
           <div className="flex space-x-2">
                         {uploadedCount > 0 && (
               <button
                 onClick={handleSaveInventoryToDatabase}
                 disabled={isProcessing}
                 className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
               >
                 {isProcessing ? (
                   <>
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                     <span>Saving...</span>
                   </>
                 ) : (
                   <>
                     <TrendingUp className="h-4 w-4" />
                     <span>Save & Continue to Sales</span>
                   </>
                 )}
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Period Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {periods.map((period) => (
          <div key={period.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900">
                  {period.month} {period.year}
                </span>
              </div>
              <div className="flex items-center">
                {period.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {period.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                {period.status === 'processing' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </div>
            </div>

            {period.status === 'pending' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(period.id, file);
                  }}
                  className="hidden"
                  id={`file-${period.id}`}
                />
                <label
                  htmlFor={`file-${period.id}`}
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-600">Upload CSV</span>
                </label>
              </div>
            )}

            {period.status === 'uploaded' && (
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm text-green-800">
                  <div className="font-medium">{period.file?.name}</div>
                  <div className="text-green-600">
                    {period.recordCount?.toLocaleString()} records ready
                  </div>
                </div>
              </div>
            )}

            {period.status === 'processing' && currentlyProcessing === period.id && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">Saving to database...</div>
                  <div className="text-blue-600">Please wait</div>
                </div>
              </div>
            )}

            {period.status === 'completed' && (
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm text-green-800">
                  <div className="font-medium">✅ Saved successfully</div>
                  <div className="text-green-600">
                    {period.recordCount?.toLocaleString()} records in database
                  </div>
                </div>
              </div>
            )}

            {period.status === 'error' && (
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-sm text-red-800">
                  <div className="font-medium">❌ Error</div>
                  <div className="text-red-600 text-xs mt-1">
                    {period.error}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Analytics Preview */}
      {uploadedCount > 1 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🔍 Analytics You'll Get:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span>Inventory level trends over time</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span>Seasonal demand patterns</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span>Month-over-month comparisons</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span>Stock optimization opportunities</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 