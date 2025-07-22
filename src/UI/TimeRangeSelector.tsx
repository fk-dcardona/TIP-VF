import React from 'react';
import type { TimeRange } from '@/types';

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  timeRanges: TimeRange[];
  className?: string;
  context?: 'sales' | 'general'; // Add context for clarity
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  timeRanges,
  className = '',
  context = 'general'
}) => {
  const getContextLabel = () => {
    switch (context) {
      case 'sales':
        return 'Sales Analysis Period:';
      default:
        return 'Time Range:';
    }
  };

  const getContextDescription = () => {
    switch (context) {
      case 'sales':
        return 'This affects sales calculations and revenue metrics. Inventory data is based on uploaded monthly periods.';
      default:
        return '';
    }
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">
          {getContextLabel()}
        </span>
        <div className="flex rounded-lg border border-gray-300 bg-white">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => onRangeChange(range)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedRange.value === range.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              } ${
                range === timeRanges[0] ? 'rounded-l-lg' : ''
              } ${
                range === timeRanges[timeRanges.length - 1] ? 'rounded-r-lg' : ''
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      {context === 'sales' && (
        <div className="flex items-center">
          <button
            type="button"
            className="ml-2 p-1 text-gray-400 hover:text-gray-600"
            title={getContextDescription()}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      <button
        onClick={() => window.location.reload()}
        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
        title="Refresh data"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
};