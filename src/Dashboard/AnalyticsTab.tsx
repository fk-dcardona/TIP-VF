import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Target, Zap } from 'lucide-react';
import { StockEfficiencyMatrix } from '@/components/Charts/StockEfficiencyMatrix';
import { EnhancedProductTable } from './EnhancedProductTable';
import { CollapsibleProcurementRecommendations } from './CollapsibleProcurementRecommendations';
import { KPICard } from './KPICard';
import type { ProcessedProduct } from '@/types';
import { calculateStockEfficiency, generateProcurementRecommendations } from '@/utils/calculations';
import { TimePeriodSelector } from '@/components/UI/TimePeriodSelector';
import { ProductDetailModal } from './ProductDetailModal';
import { generateCSVFromData } from '@/utils/csvProcessor';

interface AnalyticsTabProps {
  /** Full list across all periods for historical visualisations */
  productsAllPeriods: ProcessedProduct[];
  /** Dataset for the currently selected inventory period */
  productsCurrentPeriod: ProcessedProduct[];
  /** Currently selected period value */
  selectedPeriod?: string;
  /** All available periods (sorted desc) */
  availablePeriods: string[];
  /** Callback to change period */
  onPeriodChange: (period: string) => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ 
  productsAllPeriods, 
  productsCurrentPeriod, 
  selectedPeriod, 
  availablePeriods, 
  onPeriodChange 
}) => {
  // Filter products to match matrix criteria - only valid products with complete data
  const validProducts = useMemo(() => {
    return productsCurrentPeriod.filter(product => 
      product.currentStock > 0 &&
      !isNaN(product.turnoverRate) &&
      !isNaN(product.margin) &&
      product.turnoverRate > 0 &&
      product.margin > 0 &&
      isFinite(product.turnoverRate) &&
      isFinite(product.margin) &&
      product.revenue > 0
    );
  }, [productsCurrentPeriod]);

  const stockEfficiencyData = useMemo(() => {
    try {
      return calculateStockEfficiency(validProducts);
    } catch (error) {
      console.error('Error calculating stock efficiency:', error);
      return [];
    }
  }, [validProducts]);

  const procurementRecommendations = useMemo(() => {
    try {
      return generateProcurementRecommendations(validProducts);
    } catch (error) {
      console.error('Error generating procurement recommendations:', error);
      return [];
    }
  }, [validProducts]);

  // Calculate analytics KPIs
  const analyticsKPIs = useMemo(() => {
    try {
      const totalStockValue = validProducts.reduce((sum, p) => {
        return sum + (p.currentStock * p.averageCost);
      }, 0);
      
      const totalRevenue = validProducts.reduce((sum, p) => {
        return sum + p.revenue;
      }, 0);
      
      const avgTurnover = validProducts.length > 0 ? 
        validProducts.reduce((sum, p) => {
          return sum + p.turnoverRate;
        }, 0) / validProducts.length : 0;
        
      const cashFlowEfficiency = totalStockValue > 0 ? (totalRevenue / totalStockValue) * 100 : 0;

      const highEfficiencyProducts = stockEfficiencyData.filter(p => p.efficiency === 'high').length;
      const immediateActions = procurementRecommendations.filter(r => r.action === 'immediate').length;

      return {
        totalStockValue,
        cashFlowEfficiency,
        avgTurnover,
        highEfficiencyProducts,
        immediateActions
      };
    } catch (error) {
      console.error('Error calculating analytics KPIs:', error);
      return {
        totalStockValue: 0,
        cashFlowEfficiency: 0,
        avgTurnover: 0,
        highEfficiencyProducts: 0,
        immediateActions: 0
      };
    }
  }, [validProducts, stockEfficiencyData, procurementRecommendations]);

  // State to manage historical modal
  const [selectedProductCode, setSelectedProductCode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProductClick = (productCode: string) => {
    setSelectedProductCode(productCode);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProductCode(null);
  };

  // CSV export handler
  const handleExportProducts = (data: ProcessedProduct[]) => {
    const filename = `products_${selectedPeriod || 'all'}.csv`;
    generateCSVFromData(data as unknown as Record<string, unknown>[], filename);
  };

  // Debug logging
  console.log('AnalyticsTab render:', { 
    productsCurrentPeriod: productsCurrentPeriod?.length, 
    validProducts: validProducts?.length,
    stockEfficiencyData: stockEfficiencyData?.length,
    procurementRecommendations: procurementRecommendations?.length,
    analyticsKPIs 
  });

  // Early return for missing data
  if (!productsCurrentPeriod || productsCurrentPeriod.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">Please ensure you have uploaded inventory data and selected a valid period.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inventory Period selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <TimePeriodSelector
          selectedPeriod={selectedPeriod}
          availablePeriods={availablePeriods}
          onPeriodChange={onPeriodChange}
        />
      </div>
      {/* Analytics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Stock Value"
          value={analyticsKPIs.totalStockValue}
          icon={DollarSign}
          color="blue"
          format="currency"
          change={5.2}
          changeLabel="from last month"
        />
        <KPICard
          title="Cash Flow Efficiency"
          value={analyticsKPIs.cashFlowEfficiency.toFixed(1)}
          icon={TrendingUp}
          color="green"
          format="percentage"
          change={12.3}
          changeLabel="improvement"
        />
        <KPICard
          title="Avg Turnover Rate"
          value={analyticsKPIs.avgTurnover.toFixed(1) + 'x'}
          icon={Zap}
          color="purple"
          format="number"
          change={8.7}
          changeLabel="from last quarter"
        />
        <KPICard
          title="High Efficiency Products"
          value={analyticsKPIs.highEfficiencyProducts}
          icon={Target}
          color="yellow"
          format="number"
          change={15.4}
          changeLabel="growth"
        />
      </div>

      {/* Stock Efficiency Matrix */}
      <StockEfficiencyMatrix
        data={stockEfficiencyData}
        onProductClick={handleProductClick}
      />

      {/* Cash Flow Analysis and Procurement Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Analysis</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Inventory Investment</span>
              <span className="text-lg font-medium">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                  .format(analyticsKPIs.totalStockValue)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly Revenue Generated</span>
              <span className="text-lg font-medium text-green-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                  .format(validProducts.reduce((sum, p) => sum + p.revenue, 0))}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Inventory Efficiency Ratio</span>
              <span className="text-lg font-medium">
                {analyticsKPIs.cashFlowEfficiency.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Days in Inventory</span>
              <span className="text-lg font-medium">
                {Math.round(365 / analyticsKPIs.avgTurnover)} days
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Cash Flow Insights</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {analyticsKPIs.highEfficiencyProducts} products are generating optimal cash flow</li>
              <li>• Average inventory turns {analyticsKPIs.avgTurnover.toFixed(1)} times per year</li>
              <li>• Consider reducing slow-moving inventory to improve cash flow</li>
            </ul>
          </div>
        </div>

        <CollapsibleProcurementRecommendations 
          recommendations={procurementRecommendations}
        />
      </div>

      {/* Complete Product Analysis */}
      <EnhancedProductTable
        products={validProducts}
        title="Complete Product Analysis"
        onProductClick={handleProductClick}
        onExport={handleExportProducts}
      />

      {/* Product Detail Modal */}
      {selectedProductCode && (
        <ProductDetailModal
          isOpen={isModalOpen}
          productCode={selectedProductCode}
          productsHistory={productsAllPeriods}
          onClose={closeModal}
        />
      )}
    </div>
  );
};