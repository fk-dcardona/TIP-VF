import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Star, TrendingDown, Eye, ChevronDown, MoreHorizontal } from 'lucide-react';
import { AdvancedFilters } from '@/components/UI/AdvancedFilters';
import type { ProcessedProduct } from '@/types';
import { generateCSVFromData } from '@/utils/csvProcessor';

interface EnhancedProductTableProps {
  products: ProcessedProduct[];
  title?: string;
  onProductClick?: (productCode: string) => void;
  onExport?: (data: ProcessedProduct[]) => void;
}

type ViewMode = 'all' | 'top_performers' | 'underperformers' | 'critical_stock';
type SortField = keyof ProcessedProduct;
type SortDirection = 'asc' | 'desc';

export const EnhancedProductTable: React.FC<EnhancedProductTableProps> = ({
  products,
  title = "Product Analysis",
  onProductClick,
  onExport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [filteredProducts, setFilteredProducts] = useState<ProcessedProduct[]>(products);

  // Filter products based on view mode and search
  const processedProducts = useMemo(() => {
    let filtered = filteredProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.group.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply view mode filters
    switch (viewMode) {
      case 'top_performers':
        filtered = filtered
          .filter(p => p.turnoverRate > 6 && p.margin > 20)
          .sort((a, b) => (b.turnoverRate + b.margin) - (a.turnoverRate + a.margin));
        break;
      case 'underperformers':
        filtered = filtered
          .filter(p => p.turnoverRate < 3 || p.margin < 10)
          .sort((a, b) => (a.turnoverRate + a.margin) - (b.turnoverRate + b.margin));
        break;
      case 'critical_stock':
        filtered = filtered
          .filter(p => p.stockStatus === 'OUT_OF_STOCK' || p.stockStatus === 'LOW_STOCK')
          .sort((a, b) => b.revenue - a.revenue);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortDirection === 'desc' ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
    });

    return filtered;
  }, [filteredProducts, searchTerm, viewMode, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
  const paginatedProducts = processedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport(processedProducts);
    } else {
      // Default CSV export
      const filename = `${title.replace(/\s+/g, '_').toLowerCase()}.csv`;
      generateCSVFromData(processedProducts as unknown as Record<string, unknown>[], filename);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'NORMAL': 'bg-green-100 text-green-800 border-green-200',
      'LOW_STOCK': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'OUT_OF_STOCK': 'bg-red-100 text-red-800 border-red-200',
      'OVERSTOCK': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    
    const label = status.replace('_', ' ').toLowerCase()
      .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
        {label}
      </span>
    );
  };

  const getPerformanceBadge = (product: ProcessedProduct) => {
    if (product.turnoverRate > 6 && product.margin > 20) {
      return <Star className="h-4 w-4 text-yellow-500" />;
    }
    if (product.turnoverRate < 3 || product.margin < 10) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  // Available filters for the AdvancedFilters component
  const availableFilters = [
    { id: 'group', label: 'Product Group', type: 'select' as const, field: 'group' as keyof ProcessedProduct },
    { id: 'stockStatus', label: 'Stock Status', type: 'select' as const, field: 'stockStatus' as keyof ProcessedProduct },
    { id: 'margin', label: 'Margin %', type: 'range' as const, field: 'margin' as keyof ProcessedProduct },
    { id: 'turnoverRate', label: 'Turnover Rate', type: 'range' as const, field: 'turnoverRate' as keyof ProcessedProduct },
    { id: 'revenue', label: 'Revenue', type: 'range' as const, field: 'revenue' as keyof ProcessedProduct },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Search and View Mode */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, codes, or groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex items-center border border-gray-200 rounded-lg">
              {[
                { id: 'all', label: 'All Products', icon: null },
                { id: 'top_performers', label: 'Top Performers', icon: Star },
                { id: 'underperformers', label: 'Underperformers', icon: TrendingDown },
                { id: 'critical_stock', label: 'Critical Stock', icon: Eye }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as ViewMode)}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm transition-colors ${
                    viewMode === mode.id
                      ? 'bg-blue-50 text-blue-700 border-r border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 border-r border-gray-200'
                  } ${mode.id === 'critical_stock' ? 'border-r-0' : ''}`}
                >
                  {mode.icon && <mode.icon className="h-4 w-4" />}
                  <span className="hidden md:inline">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {paginatedProducts.length} of {processedProducts.length} products
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <AdvancedFilters
            products={products}
            onFilterChange={setFilteredProducts}
            availableFilters={availableFilters}
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                { field: 'code', label: 'Code', width: 'w-24' },
                { field: 'name', label: 'Product Name', width: 'w-64' },
                { field: 'group', label: 'Group', width: 'w-48' },
                { field: 'currentStock', label: 'Stock', width: 'w-20' },
                { field: 'monthlySales', label: 'Monthly Sales', width: 'w-24' },
                { field: 'revenue', label: 'Revenue', width: 'w-28' },
                { field: 'margin', label: 'Margin %', width: 'w-20' },
                { field: 'turnoverRate', label: 'Turnover', width: 'w-20' },
                { field: 'stockStatus', label: 'Status', width: 'w-24' },
                { field: 'daysOfSupply', label: 'Days Supply', width: 'w-24' }
              ].map((column) => (
                <th
                  key={column.field}
                  onClick={() => handleSort(column.field as SortField)}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${column.width}`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {sortField === column.field && (
                      <ChevronDown className={`h-3 w-3 transform transition-transform ${
                        sortDirection === 'asc' ? 'rotate-180' : ''
                      }`} />
                    )}
                  </div>
                </th>
              ))}
              <th className="relative px-4 py-3 w-12">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedProducts.map((product) => (
              <tr
                key={`${product.code}-${product.period}`}
                onClick={() => onProductClick?.(product.code)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-4 text-sm font-mono text-gray-900">
                  {product.code}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  <div className="flex items-center space-x-2">
                    <span className="truncate max-w-xs" title={product.name}>
                      {product.name}
                    </span>
                    {getPerformanceBadge(product)}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 truncate max-w-xs" title={product.group}>
                  {product.group}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {product.currentStock.toLocaleString()}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {product.monthlySales.toFixed(0)}
                </td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                  {formatCurrency(product.revenue)}
                </td>
                <td className="px-4 py-4 text-sm">
                  <span className={`font-medium ${
                    product.margin > 20 ? 'text-green-600' : 
                    product.margin < 10 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {product.margin.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-4 text-sm">
                  <span className={`font-medium ${
                    product.turnoverRate > 6 ? 'text-green-600' : 
                    product.turnoverRate < 3 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {product.turnoverRate.toFixed(1)}x
                  </span>
                </td>
                <td className="px-4 py-4 text-sm">
                  {getStatusBadge(product.stockStatus)}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {product.daysOfSupply.toFixed(0)} days
                </td>
                <td className="px-4 py-4 text-sm text-gray-400">
                  <MoreHorizontal className="h-4 w-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm border rounded transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 