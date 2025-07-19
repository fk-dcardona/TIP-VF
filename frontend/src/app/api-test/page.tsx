'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Play, RefreshCw, AlertCircle } from 'lucide-react';

interface TestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  response?: any;
  error?: string;
  duration?: number;
}

export default function APITestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testEndpoints = [
    {
      name: 'Dashboard Data',
      test: async () => {
        const start = Date.now();
        const result = await apiClient.getDashboardData('test-user-123', 'general_manager');
        return { response: result, duration: Date.now() - start };
      }
    },
    {
      name: 'Insights',
      test: async () => {
        const start = Date.now();
        const result = await apiClient.getInsights('test-user-123');
        return { response: result, duration: Date.now() - start };
      }
    },
    {
      name: 'Document Analytics',
      test: async () => {
        const start = Date.now();
        const result = await apiClient.getDocumentAnalytics('test-org-123');
        return { response: result, duration: Date.now() - start };
      }
    },
    {
      name: 'Supply Chain Analytics',
      test: async () => {
        const start = Date.now();
        const result = await apiClient.getSupplyChainAnalytics('test-org-123');
        return { response: result, duration: Date.now() - start };
      }
    },
    {
      name: 'Parallel Dashboard Fetch',
      test: async () => {
        const start = Date.now();
        const result = await apiClient.fetchDashboardDataParallel('test-user-123', 'finance');
        return { response: result, duration: Date.now() - start };
      }
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    for (const { name, test } of testEndpoints) {
      // Set test as pending
      setTestResults(prev => [...prev, { endpoint: name, status: 'pending' }]);

      try {
        const { response, duration } = await test();
        
        // Update test result
        setTestResults(prev => 
          prev.map(result => 
            result.endpoint === name 
              ? { ...result, status: 'success', response, duration }
              : result
          )
        );
      } catch (error: any) {
        // Update test result with error
        setTestResults(prev => 
          prev.map(result => 
            result.endpoint === name 
              ? { 
                  ...result, 
                  status: 'error', 
                  error: error.message || 'Unknown error'
                }
              : result
          )
        );
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const clearCache = () => {
    apiClient.clearCache();
    alert('API cache cleared successfully!');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Integration Test Suite</h1>
          <p className="text-gray-600">
            Test all API endpoints to verify data connections are working correctly.
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>

          <Button
            onClick={clearCache}
            variant="outline"
            disabled={isRunning}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear Cache
          </Button>
        </div>

        {/* API Configuration */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">API Configuration</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Base URL:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}
              </code>
            </div>
            <div>
              <span className="font-medium">Retry Attempts:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">3</code>
            </div>
            <div>
              <span className="font-medium">Cache TTL:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">5 minutes</code>
            </div>
          </div>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Test Results</h2>
            
            {testResults.map((result, index) => (
              <Card
                key={index}
                className={`p-4 border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">{result.endpoint}</h3>
                      
                      {result.status === 'success' && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            Response time: <span className="font-medium">{result.duration}ms</span>
                          </p>
                          <details className="text-sm">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              View Response
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                              {JSON.stringify(result.response, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                      
                      {result.status === 'error' && (
                        <p className="text-sm text-red-600 mt-1">{result.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {testResults.length > 0 && !isRunning && (
          <Alert className={
            testResults.every(r => r.status === 'success')
              ? 'border-green-200 bg-green-50'
              : 'border-orange-200 bg-orange-50'
          }>
            {testResults.every(r => r.status === 'success') ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">All Tests Passed!</AlertTitle>
                <AlertDescription className="text-green-700">
                  All API endpoints are responding correctly. Average response time:{' '}
                  {Math.round(
                    testResults
                      .filter(r => r.duration)
                      .reduce((sum, r) => sum + r.duration!, 0) / 
                    testResults.filter(r => r.duration).length
                  )}ms
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Some Tests Failed</AlertTitle>
                <AlertDescription className="text-orange-700">
                  {testResults.filter(r => r.status === 'success').length} of{' '}
                  {testResults.length} tests passed. Check the failed tests above for details.
                </AlertDescription>
              </>
            )}
          </Alert>
        )}
      </div>
    </div>
  );
}