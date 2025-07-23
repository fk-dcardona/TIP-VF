/**
 * CSV Upload Hook - Integrates analytics dashboard CSV upload with FinkArgo
 * 
 * Provides the 4-step upload wizard functionality using FinkArgo's backend
 * Maintains the same interface as the working analytics dashboard
 */

import { useState, useCallback } from 'react';
import { SolidAnalyticsService } from '../services/analytics/SolidAnalyticsService';

interface UploadStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed' | 'error';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  columnCount: number;
  preview: any[];
}

export function useCSVUpload(orgId: string) {
  const [currentStep, setCurrentStep] = useState(1);
  const [analyticsService] = useState(() => new SolidAnalyticsService(orgId));
  
  // File states
  const [inventoryFile, setInventoryFile] = useState<File | null>(null);
  const [salesFile, setSalesFile] = useState<File | null>(null);
  
  // Validation states
  const [inventoryValidation, setInventoryValidation] = useState<ValidationResult | null>(null);
  const [salesValidation, setSalesValidation] = useState<ValidationResult | null>(null);
  
  // Process states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Upload steps configuration
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
      title: 'Process & Calculate',
      description: 'Auto-calculate analytics and generate insights',
      status: currentStep === 4 ? 'current' : currentStep > 4 ? 'completed' : 'pending'
    }
  ];

  // ==================== File Validation ====================

  const validateFile = useCallback(async (file: File, type: 'inventory' | 'sales') => {
    try {
      setIsProcessing(true);
      setError('');

      const result = await analyticsService.validateCSV(file, type);
      
      const validation: ValidationResult = {
        isValid: result.validation.is_valid,
        errors: result.validation.errors || [],
        warnings: result.validation.warnings || [],
        rowCount: result.validation.row_count || 0,
        columnCount: result.validation.column_count || 0,
        preview: result.preview || []
      };

      if (type === 'inventory') {
        setInventoryValidation(validation);
      } else {
        setSalesValidation(validation);
      }

      return validation;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Validation failed';
      setError(errorMsg);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [analyticsService]);

  // ==================== File Upload Handlers ====================

  const handleInventoryUpload = useCallback(async (file: File) => {
    setInventoryFile(file);
    const validation = await validateFile(file, 'inventory');
    
    if (validation?.isValid) {
      setCurrentStep(2);
    }
    
    return validation;
  }, [validateFile]);

  const handleSalesUpload = useCallback(async (file: File) => {
    setSalesFile(file);
    const validation = await validateFile(file, 'sales');
    
    if (validation?.isValid) {
      setCurrentStep(3);
    }
    
    return validation;
  }, [validateFile]);

  // ==================== Process & Upload ====================

  const processFiles = useCallback(async () => {
    if (!inventoryFile && !salesFile) {
      setError('At least one file is required');
      return false;
    }

    try {
      setIsUploading(true);
      setIsProcessing(true);
      setError('');
      setCurrentStep(4);

      const files: { inventory?: File; sales?: File } = {};
      if (inventoryFile) files.inventory = inventoryFile;
      if (salesFile) files.sales = salesFile;

      const result = await analyticsService.uploadCSVFiles(files);

      if (result.success) {
        setSuccess(true);
        setCurrentStep(5); // Completion step
        return true;
      } else {
        setError(result.message || 'Upload failed');
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      return false;
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  }, [inventoryFile, salesFile, analyticsService]);

  // ==================== Navigation ====================

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
      setError('');
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  }, [currentStep]);

  // ==================== Reset ====================

  const reset = useCallback(() => {
    setCurrentStep(1);
    setInventoryFile(null);
    setSalesFile(null);
    setInventoryValidation(null);
    setSalesValidation(null);
    setIsProcessing(false);
    setIsUploading(false);
    setError('');
    setSuccess(false);
  }, []);

  // ==================== Status Checks ====================

  const canProceedToStep2 = inventoryFile && inventoryValidation?.isValid;
  const canProceedToStep3 = canProceedToStep2 && salesFile && salesValidation?.isValid;
  const canProcess = (inventoryFile && inventoryValidation?.isValid) || (salesFile && salesValidation?.isValid);

  return {
    // State
    currentStep,
    steps,
    
    // Files
    inventoryFile,
    salesFile,
    
    // Validation
    inventoryValidation,
    salesValidation,
    
    // Status
    isProcessing,
    isUploading,
    error,
    success,
    
    // Actions
    handleInventoryUpload,
    handleSalesUpload,
    processFiles,
    
    // Navigation
    goToStep,
    nextStep,
    prevStep,
    reset,
    
    // Conditional flags
    canProceedToStep2,
    canProceedToStep3,
    canProcess,
    
    // Analytics service (for advanced usage)
    analyticsService
  };
}