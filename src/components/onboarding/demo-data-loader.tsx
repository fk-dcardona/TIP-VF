/**
 * 📊 Demo Data Loader
 * SuperClaude Optimized for Quick Start
 * 
 * Features:
 * - Realistic Colombian import data
 * - Multiple document types
 * - Various operation statuses
 * - Cost breakdowns
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Users,
  Package,
  DollarSign,
  Clock,
  ArrowRight
} from 'lucide-react';

interface DemoDataLoaderProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface DemoDataset {
  id: string;
  name: string;
  description: string;
  size: string;
  records: number;
  type: 'sales' | 'inventory' | 'suppliers' | 'financial';
  icon: React.ComponentType<any>;
}

const DEMO_DATASETS: DemoDataset[] = [
  {
    id: 'sales',
    name: 'Sales Data',
    description: 'Customer orders, revenue, and sales performance metrics',
    size: '2.3 MB',
    records: 1250,
    type: 'sales',
    icon: DollarSign
  },
  {
    id: 'inventory',
    name: 'Inventory Data',
    description: 'Product stock levels, SKUs, and inventory movements',
    size: '1.8 MB',
    records: 890,
    type: 'inventory',
    icon: Package
  },
  {
    id: 'suppliers',
    name: 'Supplier Data',
    description: 'Vendor information, performance metrics, and contact details',
    size: '0.9 MB',
    records: 45,
    type: 'suppliers',
    icon: Users
  },
  {
    id: 'financial',
    name: 'Financial Data',
    description: 'Cash flow, expenses, and financial performance indicators',
    size: '1.2 MB',
    records: 320,
    type: 'financial',
    icon: FileText
  }
];

export function DemoDataLoader({ onComplete, onSkip }: DemoDataLoaderProps) {
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'select' | 'loading' | 'complete'>('select');

  const toggleDataset = (datasetId: string) => {
    setSelectedDatasets(prev => 
      prev.includes(datasetId) 
        ? prev.filter(id => id !== datasetId)
        : [...prev, datasetId]
    );
  };

  const handleLoadData = async () => {
    if (selectedDatasets.length === 0) return;

    setLoading(true);
    setCurrentStep('loading');

    // Simulate loading progress
    const totalSteps = selectedDatasets.length * 3; // 3 steps per dataset
    let currentStep = 0;

    for (const datasetId of selectedDatasets) {
      // Step 1: Upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      currentStep++;
      setProgress((currentStep / totalSteps) * 100);

      // Step 2: Process
      await new Promise(resolve => setTimeout(resolve, 1500));
      currentStep++;
      setProgress((currentStep / totalSteps) * 100);

      // Step 3: Analyze
      await new Promise(resolve => setTimeout(resolve, 800));
      currentStep++;
      setProgress((currentStep / totalSteps) * 100);
    }

    setCurrentStep('complete');
    setLoading(false);
  };

  const getSelectedDatasets = () => {
    return DEMO_DATASETS.filter(dataset => selectedDatasets.includes(dataset.id));
  };

  const getTotalRecords = () => {
    return getSelectedDatasets().reduce((total, dataset) => total + dataset.records, 0);
  };

  const getTotalSize = () => {
    return getSelectedDatasets().reduce((total, dataset) => {
      const size = parseFloat(dataset.size.replace(' MB', ''));
      return total + size;
    }, 0);
  };

  if (currentStep === 'loading') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Database className="h-6 w-6 animate-pulse" />
              <span>Loading Demo Data</span>
            </CardTitle>
            <CardDescription>
              Processing {selectedDatasets.length} dataset{selectedDatasets.length !== 1 ? 's' : ''}...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Loading Steps */}
            <div className="space-y-3">
              {getSelectedDatasets().map((dataset, index) => (
                <div key={dataset.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <dataset.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{dataset.name}</p>
                    <p className="text-sm text-gray-600">{dataset.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Clock className="h-4 w-4 text-gray-400 animate-spin" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'complete') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Demo Data Loaded Successfully!</CardTitle>
            <CardDescription>
              Your demo environment is ready with {getTotalRecords().toLocaleString()} records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{getTotalRecords().toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Records</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{getTotalSize().toFixed(1)} MB</p>
                <p className="text-sm text-gray-600">Data Size</p>
              </div>
            </div>

            {/* Loaded Datasets */}
            <div className="space-y-2">
              <h4 className="font-medium">Loaded Datasets:</h4>
              {getSelectedDatasets().map(dataset => (
                <div key={dataset.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{dataset.name}</p>
                    <p className="text-sm text-gray-600">{dataset.records.toLocaleString()} records</p>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={onComplete} className="w-full">
              Continue to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Load Demo Data</h1>
        <p className="text-gray-600">
          Get started quickly with sample data to explore FinkArgo's capabilities
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Available Datasets</span>
            {selectedDatasets.length > 0 && (
              <Badge variant="secondary">{selectedDatasets.length} selected</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Select the datasets you'd like to load. You can always add more data later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEMO_DATASETS.map(dataset => {
              const Icon = dataset.icon;
              const isSelected = selectedDatasets.includes(dataset.id);
              
              return (
                <div
                  key={dataset.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleDataset(dataset.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{dataset.name}</h3>
                        {isSelected && <CheckCircle className="h-5 w-5 text-blue-600" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{dataset.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{dataset.size}</span>
                        <span>{dataset.records.toLocaleString()} records</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedDatasets.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p><strong>Total Records:</strong> {getTotalRecords().toLocaleString()}</p>
                  <p><strong>Data Size:</strong> {getTotalSize().toFixed(1)} MB</p>
                </div>
                <div>
                  <p><strong>Datasets:</strong> {selectedDatasets.length}</p>
                  <p><strong>Estimated Time:</strong> ~{Math.ceil(selectedDatasets.length * 3.3)}s</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onSkip}>
          Skip Demo Data
        </Button>
        <Button 
          onClick={handleLoadData} 
          disabled={selectedDatasets.length === 0 || loading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Load Selected Data
        </Button>
      </div>
    </div>
  );
}