import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import type { ProcessedProduct } from '@/types';

interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'boolean';
  options?: { value: string; label: string; color?: string }[];
  field: keyof ProcessedProduct;
}

interface ActiveFilter {
  id: string;
  field: keyof ProcessedProduct;
  operator: string;
  value: any;
  label: string;
}

interface AdvancedFiltersProps {
  products: ProcessedProduct[];
  onFilterChange: (filteredProducts: ProcessedProduct[]) => void;
  availableFilters: FilterOption[];
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  products,
  onFilterChange,
  availableFilters
}) => {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const applyFilters = (filters: ActiveFilter[]) => {
    let filtered = [...products];

    filters.forEach(filter => {
      filtered = filtered.filter(product => {
        const value = product[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'greater_than':
            return Number(value) > Number(filter.value);
          case 'less_than':
            return Number(value) < Number(filter.value);
          case 'is_in':
            return Array.isArray(filter.value) ? filter.value.includes(value) : value === filter.value;
          case 'is_not_empty':
            return value !== null && value !== undefined && value !== '';
          default:
            return true;
        }
      });
    });

    onFilterChange(filtered);
  };

  const addFilter = (filterOption: FilterOption, operator: string, value: any) => {
    const newFilter: ActiveFilter = {
      id: `${filterOption.field}-${Date.now()}`,
      field: filterOption.field,
      operator,
      value,
      label: `${filterOption.label} ${operator} ${Array.isArray(value) ? value.join(', ') : value}`
    };

    const updatedFilters = [...activeFilters, newFilter];
    setActiveFilters(updatedFilters);
    applyFilters(updatedFilters);
    setShowFilterDropdown(false);
  };

  const removeFilter = (filterId: string) => {
    const updatedFilters = activeFilters.filter(f => f.id !== filterId);
    setActiveFilters(updatedFilters);
    applyFilters(updatedFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    onFilterChange(products);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Add Filter</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                {availableFilters.map(filter => (
                  <FilterOptionItem
                    key={filter.id}
                    filter={filter}
                    products={products}
                    onSelect={addFilter}
                  />
                ))}
              </div>
            )}
          </div>

          {activeFilters.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="text-sm text-gray-500">
          {products.length} results
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(filter => (
            <div
              key={filter.id}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-sm"
            >
              <span className="text-blue-800">{filter.label}</span>
              <button
                onClick={() => removeFilter(filter.id)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface FilterOptionItemProps {
  filter: FilterOption;
  products: ProcessedProduct[];
  onSelect: (filter: FilterOption, operator: string, value: any) => void;
}

const FilterOptionItem: React.FC<FilterOptionItemProps> = ({ filter, products, onSelect }) => {
  const [showOperators, setShowOperators] = useState(false);

  const getUniqueValues = (field: keyof ProcessedProduct) => {
    const values = [...new Set(products.map(p => p[field]))];
    return values.filter(v => v !== null && v !== undefined);
  };

  const handleOperatorSelect = (operator: string) => {
    if (filter.type === 'boolean') {
      onSelect(filter, operator, true);
    } else if (filter.type === 'select') {
      // For now, select first available value - in real implementation, show value selector
      const values = getUniqueValues(filter.field);
      if (values.length > 0) {
        onSelect(filter, operator, values[0]);
      }
    } else {
      // For other types, you'd show appropriate input controls
      onSelect(filter, operator, '');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOperators(!showOperators)}
        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
      >
        {filter.label}
      </button>

      {showOperators && (
        <div className="absolute left-full top-0 ml-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <button
            onClick={() => handleOperatorSelect('equals')}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            Equals
          </button>
          <button
            onClick={() => handleOperatorSelect('contains')}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            Contains
          </button>
          <button
            onClick={() => handleOperatorSelect('is_not_empty')}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
          >
            Is not empty
          </button>
        </div>
      )}
    </div>
  );
}; 