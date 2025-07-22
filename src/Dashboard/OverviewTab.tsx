import React from 'react';
import { DollarSign, TrendingUp, Package, RotateCcw, HelpCircle } from 'lucide-react';
import type { ProcessedProduct, DiscontinuedProductAlert } from '@/types';
import { KPICard } from './KPICard';
import { ProductTable } from './ProductTable';
import { DiscontinuedProductsAlert } from './DiscontinuedProductsAlert';
import { TimePeriodSelector } from '@/components/UI/TimePeriodSelector';

interface OverviewTabProps {
  products: ProcessedProduct[];
  discontinuedProducts: DiscontinuedProductAlert[];
  selectedPeriod?: string;
  availablePeriods: string[];
  onPeriodChange: (period: string) => void;
  className?: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  products,
  discontinuedProducts,
  selectedPeriod,
  availablePeriods,
  onPeriodChange,
  className = ''
}) => {
  // Calculate KPIs from products
  const totalRevenue = products.reduce((sum, product) => sum + product.revenue, 0);
  const totalCOGS = products.reduce((sum, product) => sum + (product.monthlySales * product.averageCost), 0);
  const totalProfit = totalRevenue - totalCOGS;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const formattedProfitMargin = Math.abs(profitMargin) > 1000 ? 
    (profitMargin > 0 ? '999+' : '-999') : 
    profitMargin.toFixed(1);
  
  // Enhanced inventory metrics
  const totalInventoryValue = products.reduce((sum, product) => 
    sum + (product.averageInventory || product.currentStock) * product.averageCost, 0);
  const totalCarryingCosts = products.reduce((sum, product) => 
    sum + (product.inventoryCarryingCost || 0), 0);
  // Calculate average turnover with NaN handling
  const validTurnoverProducts = products.filter(p => !isNaN(p.turnoverRate) && p.turnoverRate > 0);
  const avgInventoryTurnover = validTurnoverProducts.length > 0 
    ? validTurnoverProducts.reduce((sum, product) => sum + product.turnoverRate, 0) / validTurnoverProducts.length 
    : 0;
  const totalMonthlyUsage = products.reduce((sum, product) => 
    sum + (product.monthlyUsage || product.monthlySales), 0);
    
  const lowStockProducts = products.filter(p => p.stockStatus === 'LOW_STOCK');
  const outOfStockProducts = products.filter(p => p.stockStatus === 'OUT_OF_STOCK');
  const highValueProducts = products
    .filter(p => p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supply Chain Overview</h2>
          <p className="text-sm text-gray-600 mt-1">
            {products.length} products • {availablePeriods.length} periods available
          </p>
        </div>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <TimePeriodSelector
            selectedPeriod={selectedPeriod}
            availablePeriods={availablePeriods}
            onPeriodChange={onPeriodChange}
          />
          <button
            type="button"
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Select the inventory period to analyze. Each period represents the end-of-month inventory snapshot."
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={totalRevenue}
          change={totalRevenue > 0 ? 5 : 0}
          icon={DollarSign}
          color="blue"
          format="currency"
          tooltip="Total sales revenue based on the selected time range and inventory period"
        />
        <KPICard
          title="Profit Margin"
          value={parseFloat(formattedProfitMargin) || 0}
          change={profitMargin > 0 ? 2 : -2}
          icon={TrendingUp}
          color={profitMargin > 0 ? 'green' : 'red'}
          format="percentage"
          tooltip="Calculated as (Revenue - COGS) / Revenue. COGS = Monthly Sales × Average Cost"
        />
        <KPICard
          title="Inventory Investment"
          value={totalInventoryValue}
          icon={Package}
          color="purple"
          format="currency"
          tooltip="Total value of current inventory: Current Stock × Average Cost per product"
        />
        <KPICard
          title="Avg Turnover Rate"
          value={isNaN(avgInventoryTurnover) ? 'N/A' : `${avgInventoryTurnover.toFixed(1)}x`}
          icon={RotateCcw}
          color={avgInventoryTurnover > 6 ? 'green' : avgInventoryTurnover > 3 ? 'blue' : 'yellow'}
          tooltip="Average inventory turnover across all products. Calculated as Monthly Sales / Average Inventory"
        />
      </div>

      {/* Additional metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-medium text-gray-900">Monthly Usage</h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              title="Total units consumed per month across all products"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalMonthlyUsage.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Units consumed per month</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-medium text-gray-900">Carrying Costs</h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              title="Estimated monthly costs of holding inventory (storage, insurance, obsolescence)"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </div>
          <p className="text-2xl font-bold text-orange-600">${totalCarryingCosts.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Monthly inventory holding costs</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-medium text-gray-900">Days in Inventory</h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              title="Average number of days it takes to sell current inventory. Calculated as 365 / Turnover Rate"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {avgInventoryTurnover > 0 ? Math.round(365 / avgInventoryTurnover) : '∞'}
          </p>
          <p className="text-sm text-gray-600">Average days to sell inventory</p>
        </div>
      </div>

      {/* Stock Status Alerts */}
      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outOfStockProducts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Out of Stock ({outOfStockProducts.length})
                </h4>
                <div className="space-y-1">
                  {outOfStockProducts.slice(0, 3).map(product => (
                    <p key={product.code} className="text-sm text-red-700">
                      {product.name}
                    </p>
                  ))}
                  {outOfStockProducts.length > 3 && (
                    <p className="text-sm text-red-600">
                      +{outOfStockProducts.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {lowStockProducts.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  Low Stock ({lowStockProducts.length})
                </h4>
                <div className="space-y-1">
                  {lowStockProducts.slice(0, 3).map(product => (
                    <p key={product.code} className="text-sm text-yellow-700">
                      {product.name} ({Math.round(product.daysOfSupply)} days left)
                    </p>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <p className="text-sm text-yellow-600">
                      +{lowStockProducts.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* High Value Products */}
      {highValueProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Revenue Products</h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              title="Top 5 products by revenue generation based on the selected time range"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {highValueProducts.map((product, index) => (
              <div key={product.code} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${product.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {product.margin.toFixed(1)}% margin
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discontinued Products Alert */}
      {discontinuedProducts.length > 0 && (
        <DiscontinuedProductsAlert discontinuedProducts={discontinuedProducts} />
      )}

      {/* Complete Product Analysis Table */}
      <ProductTable
        products={products}
        title="Complete Product Analysis"
        maxHeight="600px"
      />
    </div>
  );
};