import React from 'react';
import { CheckCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import type { CSVValidationResult } from '@/types';

interface DataPreviewProps {
  validationResult: CSVValidationResult;
  filename: string;
  title: string;
}

export const DataPreview: React.FC<DataPreviewProps> = ({
  validationResult,
  filename,
  title
}) => {
  const { isValid, errors, warnings, rowCount, columnCount, preview } = validationResult;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">File: {filename}</p>
        </div>
        <div className="flex items-center space-x-2">
          {isValid ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Valid</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Issues Found</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Records</p>
          <p className="text-2xl font-bold text-blue-900">{rowCount.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Columns</p>
          <p className="text-2xl font-bold text-green-900">{columnCount}</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h4 className="text-sm font-medium text-red-800">Errors</h4>
          </div>
          <ul className="text-sm text-red-700 space-y-1 mb-4">
            {errors.slice(0, 10).map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
            {errors.length > 10 && (
              <li className="text-red-600 font-medium">... and {errors.length - 10} more errors</li>
            )}
          </ul>
          
          {/* Data Formatting Guidance */}
          <div className="border-t border-red-200 pt-3">
            <div className="flex items-center mb-2">
              <HelpCircle className="h-4 w-4 text-red-500 mr-2" />
              <h5 className="text-sm font-medium text-red-800">How to Fix Data Format Issues</h5>
            </div>
            <div className="text-xs text-red-700 space-y-1">
              <p>• Remove currency symbols ($, €) and use plain numbers</p>
              <p>• Use only numbers for numeric columns (e.g., 123.45 instead of $123.45)</p>
              <p>• For negative numbers, use minus sign (-123) or parentheses (123)</p>
              <p>• Dates should be in M/D/YYYY format (e.g., 1/15/2024)</p>
              <p>• Empty cells in numeric columns will be treated as zero</p>
            </div>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Info className="h-5 w-5 text-yellow-500 mr-2" />
            <h4 className="text-sm font-medium text-yellow-800">Warnings</h4>
          </div>
          <ul className="text-sm text-yellow-700 space-y-1">
            {warnings.slice(0, 5).map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
            {warnings.length > 5 && (
              <li className="text-yellow-600">... and {warnings.length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">Data Preview (First 5 rows)</h4>
        </div>
        
        {preview.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(preview[0]).map((header) => (
                    <th
                      key={header}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.values(row).map((value: unknown, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate"
                        title={typeof value === 'string' ? value : String(value)}
                      >
                        {typeof value === 'string' ? value : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>No data preview available</p>
          </div>
        )}
      </div>
    </div>
  );
};