import React from 'react';
import { Filter, X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  showCounts?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  title,
  options,
  selectedValues,
  onChange,
  showCounts = false
}) => {
  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleSelectAll = () => {
    onChange(options.map(opt => opt.value));
  };

  const isAllSelected = selectedValues.length === options.length;
  const hasSelection = selectedValues.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {hasSelection && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {selectedValues.length} selected
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {!isAllSelected && (
            <button
              onClick={handleSelectAll}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Select All
            </button>
          )}
          {hasSelection && (
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-600 hover:text-gray-800 font-medium flex items-center space-x-1"
            >
              <X className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <button
              key={option.value}
              onClick={() => handleToggle(option.value)}
              className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{option.label}</span>
              {showCounts && option.count !== undefined && (
                <span className={`text-xs ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                  ({option.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};