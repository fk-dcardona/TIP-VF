import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ExternalLink } from 'lucide-react';
import type { ProcessedProduct } from '@/types';
import { InfoModal } from '@/components/UI/InfoModal';

interface ProductTableProps {
  products: ProcessedProduct[];
  onRowClick?: (product: ProcessedProduct) => void;
  maxRows?: number;
}

type SortField = keyof ProcessedProduct;
type SortDirection = 'asc' | 'desc';

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onRowClick,
  maxRows
}) => {
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-800';
      case 'LOW_STOCK':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERSTOCK':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return 'Out of Stock';
      case 'LOW_STOCK':
        return 'Low Stock';
      case 'OVERSTOCK':
        return 'Overstock';
      default:
        return 'Normal';
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.code.toLowerCase().includes(searchLower) ||
        product.group.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      // Handle string values
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply row limit
    return maxRows ? sorted.slice(0, maxRows) : sorted;
  }, [products, sortField, sortDirection, searchTerm, maxRows]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Product Code</span>
                    <InfoModal
                      title="Product Code"
                      content="Unique identifier for each product in the inventory system"
                      buttonClassName="text-gray-400 hover:text-gray-600"
                    />
                    {getSortIcon('code')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Product Name</span>
                    <InfoModal
                      title="Product Name"
                      content="Full product description as registered in the inventory system"
                      buttonClassName="text-gray-400 hover:text-gray-600"
                    />
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('group')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Group</span>
                    <InfoModal
                      title="Product Group"
                      content="Product category classification used for procurement planning and lead time calculations"
                      buttonClassName="text-gray-400 hover:text-gray-600"
                    />
                    {getSortIcon('group')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('currentStock')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Current Stock</span>
                    <InfoModal
                      title="Current Stock"
                      content="Current inventory quantity on hand as of the selected inventory period"
                      buttonClassName="text-gray-400 hover:text-gray-600"
                    />
                    {getSortIcon('currentStock')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('monthlySales')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Monthly Sales</span>
                    <InfoModal
                      title="Monthly Sales"
                      content="Average monthly sales quantity based on the selected time range"
                      buttonClassName="text-gray-400 hover:text-gray-600"
                    />
                    {getSortIcon('monthlySales')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('revenue')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Revenue</span>
                    <InfoModal
                      title="Monthly Revenue"
                      content="Average monthly revenue generated by this product based on the selected time range"
                      buttonClassName="text-gray-400 hover:text-gray-600"
                    />
                    {getSortIcon('revenue')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('turnoverRate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Turnover</span>
                    <InfoModal
                      title="Inventory Turnover Rate"
                      content="How many times per year the inventory is sold and replaced. Calculated as (Annual Sales / Average Inventory)"
                      buttonClassName="text-gray-400 hover:text-gray-600"
                    />
                    {getSortIcon('turnoverRate')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('daysOfSupply')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Days Supply</span>
                    <InfoModal
                      title="Days of Supply"
                      content="Number of days the current inventory will last at the current sales rate. Calculated as (Current Stock / Daily Sales)"
                      buttonClassName="text-gray-400 hover:text-gray-600"
                    />
                    {getSortIcon('daysOfSupply')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('stockStatus')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <InfoModal
                      title="Stock Status"
                      content="Current stock level status: Normal (adequate stock), Low Stock (below minimum level), Out of Stock (zero inventory), or Overstock (excess inventory)"
                      buttonClassName="text-gray-400 hover:text-gray-600"
                    />
                    {getSortIcon('stockStatus')}
                  </div>
                </th>
                {onRowClick && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedProducts.map((product) => (
                <tr 
                  key={product.code} 
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(product)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={product.name}>
                      {product.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.group}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.currentStock.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.monthlySales.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.turnoverRate.toFixed(1)}x
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.daysOfSupply === 999 ? '∞' : Math.round(product.daysOfSupply)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.stockStatus)}`}>
                      {formatStatus(product.stockStatus)}
                    </span>
                  </td>
                  {onRowClick && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <ExternalLink className="h-4 w-4" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found matching your search criteria.
          </div>
        )}
      </div>
      
      {maxRows && products.length > maxRows && (
        <div className="text-sm text-gray-600 text-center">
          Showing {Math.min(filteredAndSortedProducts.length, maxRows)} of {products.length} products
        </div>
      )}
    </div>
  );
};