import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Calendar, 
  Users, 
  Package, 
  MapPin, 
  User, 
  Tag, 
  Grid,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { SalesDashboardFilters } from '@/types';

interface AdvancedSalesFiltersProps {
  filters: SalesDashboardFilters;
  onFiltersChange: (filters: SalesDashboardFilters) => void;
  availableOptions: {
    productGroups: string[];
    customerSegments: string[];
    territories: string[];
    salespeople: string[];
    brands: string[];
    categories: string[];
  };
}

export const AdvancedSalesFilters: React.FC<AdvancedSalesFiltersProps> = ({
  filters,
  onFiltersChange,
  availableOptions
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<SalesDashboardFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof SalesDashboardFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleArrayFilterChange = (key: keyof SalesDashboardFilters, value: string, checked: boolean) => {
    const currentArray = localFilters[key] as string[];
    const newArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    handleFilterChange(key, newArray);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SalesDashboardFilters = {
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
        endDate: new Date().toISOString().split('T')[0]
      },
      productGroups: [],
      customerSegments: [],
      territories: [],
      salespeople: [],
      brands: [],
      categories: []
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (localFilters.productGroups.length > 0) count++;
    if (localFilters.customerSegments.length > 0) count++;
    if (localFilters.territories.length > 0) count++;
    if (localFilters.salespeople.length > 0) count++;
    if (localFilters.brands.length > 0) count++;
    if (localFilters.categories.length > 0) count++;
    return count;
  };

  const FilterSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, icon, children }) => (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        {icon}
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const CheckboxGroup: React.FC<{
    options: string[];
    selectedValues: string[];
    onChange: (value: string, checked: boolean) => void;
    placeholder?: string;
  }> = ({ options, selectedValues, onChange, placeholder }) => (
    <div className="space-y-2 max-h-32 overflow-y-auto">
      {options.length === 0 ? (
        <p className="text-sm text-gray-500">{placeholder || 'No options available'}</p>
      ) : (
        options.map(option => (
          <label key={option} className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={(e) => onChange(option, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">{option}</span>
          </label>
        ))
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Advanced Filters</h2>
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {getActiveFilterCount()} active
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Filter - Always Visible */}
      <div className="px-4 py-3 border-b border-gray-200">
        <FilterSection title="Date Range" icon={<Calendar className="h-4 w-4 text-gray-600" />}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={localFilters.dateRange.startDate}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...localFilters.dateRange,
                  startDate: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={localFilters.dateRange.endDate}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...localFilters.dateRange,
                  endDate: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </FilterSection>
      </div>

      {/* Expandable Filters */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Product Groups */}
            <FilterSection title="Product Groups" icon={<Package className="h-4 w-4 text-gray-600" />}>
              <CheckboxGroup
                options={availableOptions.productGroups}
                selectedValues={localFilters.productGroups}
                onChange={(value, checked) => handleArrayFilterChange('productGroups', value, checked)}
                placeholder="No product groups available"
              />
            </FilterSection>

            {/* Customer Segments */}
            <FilterSection title="Customer Segments" icon={<Users className="h-4 w-4 text-gray-600" />}>
              <CheckboxGroup
                options={availableOptions.customerSegments}
                selectedValues={localFilters.customerSegments}
                onChange={(value, checked) => handleArrayFilterChange('customerSegments', value, checked)}
                placeholder="No customer segments available"
              />
            </FilterSection>

            {/* Territories */}
            <FilterSection title="Territories" icon={<MapPin className="h-4 w-4 text-gray-600" />}>
              <CheckboxGroup
                options={availableOptions.territories}
                selectedValues={localFilters.territories}
                onChange={(value, checked) => handleArrayFilterChange('territories', value, checked)}
                placeholder="No territories available"
              />
            </FilterSection>

            {/* Salespeople */}
            <FilterSection title="Salespeople" icon={<User className="h-4 w-4 text-gray-600" />}>
              <CheckboxGroup
                options={availableOptions.salespeople}
                selectedValues={localFilters.salespeople}
                onChange={(value, checked) => handleArrayFilterChange('salespeople', value, checked)}
                placeholder="No salespeople available"
              />
            </FilterSection>

            {/* Brands */}
            <FilterSection title="Brands" icon={<Tag className="h-4 w-4 text-gray-600" />}>
              <CheckboxGroup
                options={availableOptions.brands}
                selectedValues={localFilters.brands}
                onChange={(value, checked) => handleArrayFilterChange('brands', value, checked)}
                placeholder="No brands available"
              />
            </FilterSection>

            {/* Categories */}
            <FilterSection title="Categories" icon={<Grid className="h-4 w-4 text-gray-600" />}>
              <CheckboxGroup
                options={availableOptions.categories}
                selectedValues={localFilters.categories}
                onChange={(value, checked) => handleArrayFilterChange('categories', value, checked)}
                placeholder="No categories available"
              />
            </FilterSection>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Active filters: {getActiveFilterCount()}</span>
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                >
                  <X className="h-3 w-3" />
                  <span>Clear all</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - When Collapsed */}
      {!isExpanded && getActiveFilterCount() > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} applied
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
            >
              <X className="h-3 w-3" />
              <span>Clear all</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 