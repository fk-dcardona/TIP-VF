/**
 * Enhanced Upload Wizard - Integrates analytics dashboard CSV upload with FinkArgo
 * 
 * Uses the working 4-step upload process with FinkArgo's robust backend
 * Maintains the same UX as the working analytics dashboard
 */

'use client';

import React from 'react';
import { Check, ChevronRight, Upload, AlertCircle, CheckCircle, ArrowLeft, RefreshCw, FileText, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { useCSVUpload } from '../../hooks/useCSVUpload';

interface EnhancedUploadWizardProps {
  orgId: string;
  onComplete?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function EnhancedUploadWizard({ 
  orgId, 
  onComplete, 
  onCancel, 
  className = '' 
}: EnhancedUploadWizardProps) {
  const {
    currentStep,
    steps,
    inventoryFile,
    salesFile,
    inventoryValidation,
    salesValidation,
    isProcessing,
    isUploading,
    error,
    success,
    handleInventoryUpload,
    handleSalesUpload,
    processFiles,
    nextStep,
    prevStep,
    reset,
    canProceedToStep2,
    canProceedToStep3,
    canProcess
  } = useCSVUpload(orgId);

  // Handle file selection
  const handleFileSelect = async (file: File, type: 'inventory' | 'sales') => {
    if (type === 'inventory') {
      await handleInventoryUpload(file);
    } else {
      await handleSalesUpload(file);
    }
  };

  // Handle process completion
  const handleComplete = async () => {
    const success = await processFiles();
    if (success && onComplete) {
      onComplete();
    }
  };

  // Calculate progress
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">CSV Analytics Upload</h2>
        <p className="text-gray-600">Upload your inventory and sales data for comprehensive supply chain analytics</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step {currentStep} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Navigation */}
      <div className="flex justify-center">
        <div className="flex space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2
                ${step.status === 'completed' 
                  ? 'bg-green-100 border-green-500 text-green-700' 
                  : step.status === 'current'
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-gray-100 border-gray-300 text-gray-500'
                }
              `}>
                {step.status === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-400 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Title */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900">
          {steps[currentStep - 1]?.title}
        </h3>
        <p className="text-gray-600">{steps[currentStep - 1]?.description}</p>
      </div>

      {/* Error Display */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Files uploaded and processed successfully! Your analytics dashboard is ready.
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <InventoryUploadStep
              onFileSelect={(file) => handleFileSelect(file, 'inventory')}
              validation={inventoryValidation}
              isProcessing={isProcessing}
              file={inventoryFile}
            />
          )}

          {currentStep === 2 && (
            <SalesUploadStep
              onFileSelect={(file) => handleFileSelect(file, 'sales')}
              validation={salesValidation}
              isProcessing={isProcessing}
              file={salesFile}
            />
          )}

          {currentStep === 3 && (
            <DataConfirmationStep
              inventoryFile={inventoryFile}
              salesFile={salesFile}
              inventoryValidation={inventoryValidation}
              salesValidation={salesValidation}
            />
          )}

          {currentStep === 4 && (
            <ProcessingStep
              isProcessing={isUploading}
              inventoryFile={inventoryFile}
              salesFile={salesFile}
            />
          )}

          {success && (
            <CompletionStep 
              onViewDashboard={onComplete}
              onUploadMore={reset}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {!success && (
        <div className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={prevStep} disabled={isProcessing}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" onClick={onCancel} className="ml-2">
                Cancel
              </Button>
            )}
          </div>

          <div>
            {currentStep === 1 && canProceedToStep2 && (
              <Button onClick={nextStep}>
                Next: Upload Sales
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 2 && canProceedToStep3 && (
              <Button onClick={nextStep}>
                Next: Confirm Data
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 3 && canProcess && (
              <Button onClick={handleComplete} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Process Files
                    <BarChart3 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Step Components ====================

interface InventoryUploadStepProps {
  onFileSelect: (file: File) => void;
  validation: any;
  isProcessing: boolean;
  file: File | null;
}

function InventoryUploadStep({ onFileSelect, validation, isProcessing, file }: InventoryUploadStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <FileText className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h4 className="text-lg font-medium">Upload Inventory Data</h4>
        <p className="text-sm text-gray-600">
          Upload your CSV file containing inventory information (products, stock levels, costs)
        </p>
      </div>

      <FileUploadZone
        onFileSelect={onFileSelect}
        accept=".csv"
        isProcessing={isProcessing}
        file={file}
      />

      {validation && (
        <ValidationDisplay validation={validation} />
      )}
    </div>
  );
}

interface SalesUploadStepProps {
  onFileSelect: (file: File) => void;
  validation: any;
  isProcessing: boolean;
  file: File | null;
}

function SalesUploadStep({ onFileSelect, validation, isProcessing, file }: SalesUploadStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <BarChart3 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h4 className="text-lg font-medium">Upload Sales Data</h4>
        <p className="text-sm text-gray-600">
          Upload your CSV file containing sales transactions (dates, quantities, values)
        </p>
      </div>

      <FileUploadZone
        onFileSelect={onFileSelect}
        accept=".csv"
        isProcessing={isProcessing}
        file={file}
      />

      {validation && (
        <ValidationDisplay validation={validation} />
      )}
    </div>
  );
}

interface DataConfirmationStepProps {
  inventoryFile: File | null;
  salesFile: File | null;
  inventoryValidation: any;
  salesValidation: any;
}

function DataConfirmationStep({ 
  inventoryFile, 
  salesFile, 
  inventoryValidation, 
  salesValidation 
}: DataConfirmationStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h4 className="text-lg font-medium">Confirm Your Data</h4>
        <p className="text-sm text-gray-600">
          Review your uploaded files before processing
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {inventoryFile && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Inventory Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm"><strong>File:</strong> {inventoryFile.name}</p>
              <p className="text-sm"><strong>Rows:</strong> {inventoryValidation?.rowCount || 0}</p>
              <p className="text-sm"><strong>Columns:</strong> {inventoryValidation?.columnCount || 0}</p>
              <Badge variant="default">Ready</Badge>
            </CardContent>
          </Card>
        )}

        {salesFile && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sales Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm"><strong>File:</strong> {salesFile.name}</p>
              <p className="text-sm"><strong>Rows:</strong> {salesValidation?.rowCount || 0}</p>
              <p className="text-sm"><strong>Columns:</strong> {salesValidation?.columnCount || 0}</p>
              <Badge variant="default">Ready</Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface ProcessingStepProps {
  isProcessing: boolean;
  inventoryFile: File | null;
  salesFile: File | null;
}

function ProcessingStep({ isProcessing, inventoryFile, salesFile }: ProcessingStepProps) {
  return (
    <div className="text-center space-y-4">
      <div className="mx-auto">
        {isProcessing ? (
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        ) : (
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        )}
      </div>
      
      <h4 className="text-lg font-medium">
        {isProcessing ? 'Processing Your Data' : 'Processing Complete'}
      </h4>
      
      <p className="text-sm text-gray-600">
        {isProcessing 
          ? 'Analyzing your data and generating supply chain insights...'
          : 'Your analytics dashboard is ready!'
        }
      </p>

      {isProcessing && (
        <div className="space-y-2">
          <Progress value={75} className="h-2" />
          <p className="text-xs text-gray-500">
            Processing {inventoryFile ? 'inventory' : ''} 
            {inventoryFile && salesFile ? ' and ' : ''}
            {salesFile ? 'sales' : ''} data...
          </p>
        </div>
      )}
    </div>
  );
}

interface CompletionStepProps {
  onViewDashboard?: () => void;
  onUploadMore: () => void;
}

function CompletionStep({ onViewDashboard, onUploadMore }: CompletionStepProps) {
  return (
    <div className="text-center space-y-6">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      
      <div>
        <h4 className="text-xl font-bold text-green-700">Upload Complete!</h4>
        <p className="text-gray-600 mt-2">
          Your supply chain analytics are ready. View your dashboard to explore insights.
        </p>
      </div>

      <div className="flex justify-center space-x-4">
        {onViewDashboard && (
          <Button onClick={onViewDashboard}>
            <BarChart3 className="w-4 h-4 mr-2" />
            View Dashboard
          </Button>
        )}
        
        <Button variant="outline" onClick={onUploadMore}>
          <Upload className="w-4 h-4 mr-2" />
          Upload More Data
        </Button>
      </div>
    </div>
  );
}

// ==================== Utility Components ====================

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept: string;
  isProcessing: boolean;
  file: File | null;
}

function FileUploadZone({ onFileSelect, accept, isProcessing, file }: FileUploadZoneProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div 
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${file 
          ? 'border-green-300 bg-green-50' 
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }
      `}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {file ? (
        <div className="space-y-2">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
          <p className="font-medium text-green-700">{file.name}</p>
          <p className="text-sm text-gray-600">
            File uploaded successfully
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Upload className="w-8 h-8 text-gray-400 mx-auto" />
          <div>
            <p className="font-medium">Drop your CSV file here</p>
            <p className="text-sm text-gray-600">or click to browse</p>
          </div>
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            disabled={isProcessing}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <Button variant="outline" disabled={isProcessing} asChild>
              <span>
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>
      )}
    </div>
  );
}

interface ValidationDisplayProps {
  validation: any;
}

function ValidationDisplay({ validation }: ValidationDisplayProps) {
  if (!validation) return null;

  return (
    <div className="space-y-2">
      {validation.isValid ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            File validated successfully! {validation.rowCount} rows, {validation.columnCount} columns.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p><strong>Validation Issues:</strong></p>
              {validation.errors?.map((error: string, index: number) => (
                <p key={index} className="text-sm">• {error}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings && validation.warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-1">
              <p><strong>Warnings:</strong></p>
              {validation.warnings.map((warning: string, index: number) => (
                <p key={index} className="text-sm">• {warning}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}