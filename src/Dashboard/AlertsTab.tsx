import React, { useState, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import { AlertCard } from './AlertCard';
import { FilterBar } from '@/UI/FilterBar';
import type { ProcessedProduct, Alert } from '@/types';
import { generateAlerts } from '@/calculations';

interface AlertsTabProps {
  /**
   * Products from the latest inventory period only (for critical alerts)
   */
  products: ProcessedProduct[];
  onCreatePO?: (productCode: string) => void;
  onViewDetails?: (productCode: string) => void;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({
  products,
  onCreatePO,
  onViewDetails
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // Generate alerts from products
  const allAlerts = useMemo(() => generateAlerts(products), [products]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const urgencyMap = new Map();
    const typeMap = new Map();
    const groupMap = new Map();

    allAlerts.forEach(alert => {
      // Count by urgency
      const urgencyLabel = alert.urgency === 3 ? 'Critical' : 
                          alert.urgency === 2 ? 'High' : 
                          alert.urgency === 1 ? 'Medium' : 'Low';
      urgencyMap.set(String(alert.urgency), {
        value: String(alert.urgency),
        label: urgencyLabel,
        count: (urgencyMap.get(String(alert.urgency))?.count || 0) + 1
      });

      // Count by type
      const typeLabel = alert.type.replace('_', ' ').toLowerCase()
        .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      typeMap.set(alert.type, {
        value: alert.type,
        label: typeLabel,
        count: (typeMap.get(alert.type)?.count || 0) + 1
      });

      // Count by product group
      const product = products.find(p => p.code === alert.productCode);
      if (product?.group) {
        groupMap.set(product.group, {
          value: product.group,
          label: product.group,
          count: (groupMap.get(product.group)?.count || 0) + 1
        });
      }
    });

    return {
      urgency: Array.from(urgencyMap.values()).sort((a, b) => Number(b.value) - Number(a.value)),
      types: Array.from(typeMap.values()),
      groups: Array.from(groupMap.values()).sort((a, b) => b.count - a.count)
    };
  }, [allAlerts, products]);

  // Filter alerts based on selected filters
  const filteredAlerts = useMemo(() => {
    return allAlerts.filter(alert => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!alert.productName.toLowerCase().includes(searchLower) &&
            !(alert.productCode?.toLowerCase().includes(searchLower) || false)) {
          return false;
        }
      }

      // Urgency filter
      if (selectedUrgency.length > 0 && !selectedUrgency.includes(String(alert.urgency))) {
        return false;
      }

      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(alert.type)) {
        return false;
      }

      // Group filter
      if (selectedGroups.length > 0) {
        const product = products.find(p => p.code === alert.productCode);
        if (!product?.group || !selectedGroups.includes(product.group)) {
          return false;
        }
      }

      return true;
    });
  }, [allAlerts, searchTerm, selectedUrgency, selectedTypes, selectedGroups, products]);

  const handleExportAlerts = () => {
    const csvData = filteredAlerts.map(alert => ({
      'Product Code': alert.productCode,
      'Product Name': alert.productName,
      'Alert Type': alert.type,
      'Urgency': alert.urgency,
      'Current Stock': alert.currentStock,
      'Min Level': alert.minLevel,
      'Monthly Sales': alert.monthlySales.toFixed(2),
      'Revenue Impact': alert.revenueImpact.toFixed(2),
      'Days Left': alert.daysLeft,
      'Action Required': alert.actionRequired
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-chain-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const criticalAlerts = filteredAlerts.filter(alert => alert.urgency >= 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Critical Alerts</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor and manage inventory alerts requiring immediate attention
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportAlerts}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Critical</p>
              <p className="text-2xl font-bold text-red-900">
                {allAlerts.filter(a => a.urgency === 3).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-red-600 rounded-full" />
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">High Priority</p>
              <p className="text-2xl font-bold text-orange-900">
                {allAlerts.filter(a => a.urgency === 2).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-orange-600 rounded-full" />
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Medium Priority</p>
              <p className="text-2xl font-bold text-yellow-900">
                {allAlerts.filter(a => a.urgency === 1).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-600 rounded-full" />
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Alerts</p>
              <p className="text-2xl font-bold text-blue-900">{allAlerts.length}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search alerts by product name or code..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FilterBar
          title="Priority Level"
          options={filterOptions.urgency}
          selectedValues={selectedUrgency}
          onChange={setSelectedUrgency}
          showCounts
        />
        
        <FilterBar
          title="Alert Type"
          options={filterOptions.types}
          selectedValues={selectedTypes}
          onChange={setSelectedTypes}
          showCounts
        />
        
        <FilterBar
          title="Product Group"
          options={filterOptions.groups}
          selectedValues={selectedGroups}
          onChange={setSelectedGroups}
          showCounts
        />
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between py-2">
        <p className="text-sm text-gray-600">
          Showing {filteredAlerts.length} of {allAlerts.length} alerts
          {criticalAlerts.length > 0 && (
            <span className="ml-2 text-red-600 font-medium">
              ({criticalAlerts.length} require immediate attention)
            </span>
          )}
        </p>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert, idx) => (
            <AlertCard
              key={`${alert.id}-${idx}`}
              alerts={[alert]}
              onCreatePO={onCreatePO}
              onViewDetails={onViewDetails}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-600">
              {allAlerts.length === 0 
                ? 'All products are within optimal stock levels.'
                : 'Try adjusting your filters to see more results.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};