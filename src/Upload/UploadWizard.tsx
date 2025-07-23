import React, { useState, useCallback } from 'react';
import { Check, ChevronRight, Settings, CheckCircle, ArrowLeft, Home } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { DataPreview } from './DataPreview';
import { 
  validateInventoryCSV, 
  validateSalesCSV, 
  processInventoryData, 
  processSalesData 
} from '@/csvProcessor';
import { databaseService } from '@/database';
import type { UploadStep, CSVValidationResult } from '@/types';

interface UploadWizardProps {
  onComplete: () => void;
  onBack?: () => void;
}

export const UploadWizard: React.FC<UploadWizardProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [inventoryData, setInventoryData] = useState<Record<string, unknown>[] | null>(null);
  const [salesData, setSalesData] = useState<Record<string, unknown>[] | null>(null);
  const [inventoryFile, setInventoryFile] = useState<string>('');
  const [salesFile, setSalesFile] = useState<string>('');
  const [inventoryValidation, setInventoryValidation] = useState<CSVValidationResult | null>(null);
  const [salesValidation, setSalesValidation] = useState<CSVValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const steps: UploadStep[] = [
    {
      id: 1,
      title: 'Upload Inventory',
      description: 'Upload your inventory CSV file',
      status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'pending'
    },
    {
      id: 2,
      title: 'Upload Sales',
      description: 'Upload your sales data CSV file',
      status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'pending'
    },
    {
      id: 3,
      title: 'Confirm Data',
      description: 'Review and confirm your uploaded data',
      status: currentStep === 3 ? 'current' : currentStep > 3 ? 'completed' : 'pending'
    },
    {
      id: 4,
      title: 'Calculate Levels',
      description: 'Auto-calculate min/max inventory levels',
      status: currentStep === 4 ? 'current' : currentStep > 4 ? 'completed' : 'pending'
    }
  ];

  const handleInventoryUpload = useCallback((data: Record<string, unknown>[], filename: string) => {
    console.log('Processing inventory upload:', filename, 'Rows:', data.length);
    
    // Check if this is an error from file processing
    if (filename.startsWith('Error:')) {
      setError(filename);
      return;
    }
    
    try {
      const validation = validateInventoryCSV(data);
      console.log('Inventory validation result:', validation);
      setInventoryValidation(validation);
      
      if (validation.isValid) {
        setInventoryData(data);
        setInventoryFile(filename);
        setError('');
        console.log('Inventory data accepted successfully');
      } else {
        const errorMessage = validation.errors.slice(0, 3).join('; ');
        setError(errorMessage + (validation.errors.length > 3 ? '...' : ''));
        console.log('Inventory validation failed:', validation.errors);
      }
    } catch (error) {
      console.error('Error during inventory validation:', error);
      setError('Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, []);

  const handleSalesUpload = useCallback((data: Record<string, unknown>[], filename: string) => {
    console.log('Processing sales upload:', filename, 'Rows:', data.length);
    
    // Check if this is an error from file processing
    if (filename.startsWith('Error:')) {
      setError(filename);
      return;
    }
    
    try {
      const validation = validateSalesCSV(data);
      console.log('Sales validation result:', validation);
      setSalesValidation(validation);
      
      if (validation.isValid) {
        setSalesData(data);
        setSalesFile(filename);
        setError('');
        console.log('Sales data accepted successfully');
      } else {
        const errorMessage = validation.errors.slice(0, 3).join('; ');
        setError(errorMessage + (validation.errors.length > 3 ? '...' : ''));
        console.log('Sales validation failed:', validation.errors);
      }
    } catch (error) {
      console.error('Error during sales validation:', error);
      setError('Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, []);

  const canProceedToNext = useCallback(() => {
    switch (currentStep) {
      case 1:
        return inventoryData && inventoryValidation?.isValid;
      case 2:
        return salesData && salesValidation?.isValid;
      case 3:
        return inventoryData && salesData;
      case 4:
        return false; // Final step
      default:
        return false;
    }
  }, [currentStep, inventoryData, salesData, inventoryValidation, salesValidation]);

  const handleNext = useCallback(() => {
    if (canProceedToNext() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  }, [currentStep, canProceedToNext]);

  const handleComplete = useCallback(async () => {
    if (!inventoryData || !salesData) return;
    
    setIsProcessing(true);
    
    try {
      // Process and save data to Supabase
      const processedInventory = processInventoryData(inventoryData);
      const processedSales = processSalesData(salesData);

      // Convert legacy inventory data to new format
      const convertedInventory = processedInventory.map(item => ({
        code: item.k_sc_codigo_articulo,
        name: item.sc_detalle_articulo,
        group: item.sc_detalle_grupo,
        currentStock: item.n_saldo_actual,
        cost: item.n_costo_promedio,
        // Include legacy fields for backward compatibility
        ...item
      }));

      // Convert legacy sales data to new format
      const convertedSales = processedSales.map(item => ({
        productCode: item.k_sc_codigo_articulo,
        date: item.d_fecha_documento,
        quantity: item.n_cantidad,
        value: item.n_valor,
        // Include legacy fields for backward compatibility
        ...item
      }));

      console.log('🚀 Starting data upload to Supabase...');
      
      // Save both datasets to Supabase in parallel for better performance
      await Promise.all([
        databaseService.saveInventoryData(convertedInventory, inventoryFile),
        databaseService.saveSalesData(convertedSales, salesFile)
      ]);

      console.log('✅ All data uploaded successfully to Supabase!');

      // Brief delay to show completion animation
      setTimeout(() => {
        setIsProcessing(false);
        onComplete();
      }, 1500);
      
    } catch (error) {
      console.error('Error saving data to Supabase:', error);
      setError(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  }, [inventoryData, salesData, inventoryFile, salesFile, onComplete]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {inventoryData && inventoryValidation?.isValid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Inventory Data Uploaded Successfully!</h4>
                    <p className="text-sm text-green-700 mt-1">
                      {inventoryFile} • {inventoryValidation.rowCount.toLocaleString()} records processed
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <FileUpload
                title="Upload Inventory CSV"
                description="Upload your inventory data file with product details and stock levels"
                onFileUpload={handleInventoryUpload}
                error={error}
              />
            )}
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            {salesData && salesValidation?.isValid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Sales Data Uploaded Successfully!</h4>
                    <p className="text-sm text-green-700 mt-1">
                      {salesFile} • {salesValidation.rowCount.toLocaleString()} records processed
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <FileUpload
                title="Upload Sales CSV"
                description="Upload your sales transaction data file"
                onFileUpload={handleSalesUpload}
                error={error}
              />
            )}
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Your Data</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {inventoryValidation && (
                <DataPreview
                  validationResult={inventoryValidation}
                  filename={inventoryFile}
                  title="Inventory Data"
                />
              )}
              {salesValidation && (
                <DataPreview
                  validationResult={salesValidation}
                  filename={salesFile}
                  title="Sales Data"
                />
              )}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              {isProcessing ? (
                <Settings className="h-8 w-8 text-blue-600 animate-spin" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-600" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isProcessing ? 'Calculating Optimal Levels...' : 'Setup Complete!'}
              </h3>
              <p className="text-gray-600 mt-2">
                {isProcessing 
                  ? 'Analyzing your data and calculating minimum/maximum stock levels based on sales patterns and lead times.'
                  : 'Your data has been processed and inventory levels have been calculated.'
                }
              </p>
            </div>

            {isProcessing && (
              <div className="max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }} />
                </div>
                <p className="text-sm text-gray-500 mt-2">Processing your supply chain data...</p>
              </div>
            )}
          </div>
        );
      
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Home className="h-4 w-4" />
            <span>/</span>
            <span className="font-medium text-gray-900">Data Upload</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          Step {currentStep} of {steps.length}
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Upload</h2>
        <p className="text-gray-600">Follow these steps to upload and process your supply chain data</p>
      </div>

      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {steps.map((step, stepIdx) => (
              <li key={step.id} className="relative flex-1">
                <div className="flex items-center">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === 'completed'
                          ? 'bg-green-600 text-white'
                          : step.status === 'current'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step.status === 'completed' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        step.status === 'current' ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {stepIdx < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {renderStepContent()}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          className={`btn-secondary ${currentStep === 1 ? 'invisible' : ''}`}
          disabled={currentStep === 1}
        >
          Previous
        </button>
        
        <div>
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className={`btn-primary ${!canProceedToNext() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isProcessing}
              className={`btn-primary ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? 'Processing...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};