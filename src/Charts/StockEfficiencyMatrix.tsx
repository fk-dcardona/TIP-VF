import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Star, TrendingUp, HelpCircle, DollarSign } from 'lucide-react';
import type { StockEfficiencyData } from '@/types';

interface StockEfficiencyMatrixProps {
  data: StockEfficiencyData[];
  title?: string;
  onProductClick?: (productCode: string) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: StockEfficiencyData }>;
}

type EfficiencyCategory = 'all' | 'stars' | 'cash_cows' | 'question_marks' | 'dogs';

export const StockEfficiencyMatrix: React.FC<StockEfficiencyMatrixProps> = ({
  data,
  title = "Stock Efficiency Matrix",
  onProductClick
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EfficiencyCategory>('all');

  // Calculate quadrant thresholds
  const avgTurnover = data.length > 0 ? data.reduce((sum, item) => sum + item.turnoverRate, 0) / data.length : 6;
  const avgMargin = data.length > 0 ? data.reduce((sum, item) => sum + item.marginPercentage, 0) / data.length : 15;

  // Categorize products
  const categorizeProduct = (item: StockEfficiencyData): EfficiencyCategory => {
    if (item.turnoverRate > avgTurnover && item.marginPercentage > avgMargin) return 'stars';
    if (item.turnoverRate > avgTurnover && item.marginPercentage <= avgMargin) return 'cash_cows';
    if (item.turnoverRate <= avgTurnover && item.marginPercentage > avgMargin) return 'question_marks';
    return 'dogs';
  };

  // Filter data based on selected category
  const filteredData = useMemo(() => {
    let filtered = data;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => categorizeProduct(item) === selectedCategory);
    }

    return filtered;
  }, [data, selectedCategory, avgTurnover, avgMargin]);

  const getEfficiencyColor = (item: StockEfficiencyData) => {
    const category = categorizeProduct(item);
    switch (category) {
      case 'stars': return '#10B981'; // Green
      case 'cash_cows': return '#F59E0B'; // Yellow
      case 'question_marks': return '#3B82F6'; // Blue
      case 'dogs': return '#EF4444'; // Red
      default: return '#6B7280';
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

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const category = categorizeProduct(item);
      const categoryLabels = {
        stars: 'Star',
        cash_cows: 'Cash Cow',
        question_marks: 'Question Mark',
        dogs: 'Dog'
      };

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">{item.productName}</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Code:</span>
              <span className="font-medium">{item.productCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium capitalize" style={{ color: getEfficiencyColor(item) }}>
                {categoryLabels[category as keyof typeof categoryLabels] || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Turnover:</span>
              <span className="font-medium">{item.turnoverRate.toFixed(1)}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Margin:</span>
              <span className="font-medium">{item.marginPercentage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-medium">{formatCurrency(item.revenue)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  interface CustomDotProps {
    cx: number;
    cy: number;
    payload: StockEfficiencyData;
  }

  const CustomDot = (props: Partial<CustomDotProps>) => {
    const { cx, cy, payload } = props;
    if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) return null;
    
    // Improved circle sizing - more consistent and readable
    const revenue = Math.max(payload.revenue, 1000);
    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const normalizedSize = (revenue / maxRevenue) * 8 + 4; // Range: 4-12px
    const size = Math.max(4, Math.min(12, normalizedSize));
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={size}
        fill={getEfficiencyColor(payload)}
        fillOpacity={0.8}
        stroke={getEfficiencyColor(payload)}
        strokeWidth={2}
        className="cursor-pointer hover:stroke-width-3 transition-all"
        onClick={() => onProductClick?.(payload.productCode)}
      />
    );
  };

  const categoryStats = useMemo(() => {
    const stats = {
      stars: data.filter(item => categorizeProduct(item) === 'stars').length,
      cash_cows: data.filter(item => categorizeProduct(item) === 'cash_cows').length,
      question_marks: data.filter(item => categorizeProduct(item) === 'question_marks').length,
      dogs: data.filter(item => categorizeProduct(item) === 'dogs').length,
    };
    return stats;
  }, [data, avgTurnover, avgMargin]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header with Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="text-sm text-gray-500">
            {filteredData.length} of {data.length} products
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
              selectedCategory === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            All ({data.length})
          </button>
          
          <button
            onClick={() => setSelectedCategory('stars')}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors flex items-center space-x-1 ${
              selectedCategory === 'stars'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Star className="h-3 w-3" />
            <span>Stars ({categoryStats.stars})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('cash_cows')}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors flex items-center space-x-1 ${
              selectedCategory === 'cash_cows'
                ? 'bg-yellow-600 text-white border-yellow-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="h-3 w-3" />
            <span>Cash Cows ({categoryStats.cash_cows})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('question_marks')}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors flex items-center space-x-1 ${
              selectedCategory === 'question_marks'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <HelpCircle className="h-3 w-3" />
            <span>Question Marks ({categoryStats.question_marks})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('dogs')}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors flex items-center space-x-1 ${
              selectedCategory === 'dogs'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span>Dogs ({categoryStats.dogs})</span>
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              type="number" 
              dataKey="turnoverRate" 
              name="Inventory Turnover Rate"
              axisLine={false}
              tickLine={false}
              className="text-xs text-gray-600"
            />
            <YAxis 
              type="number" 
              dataKey="marginPercentage" 
              name="Gross Margin %"
              axisLine={false}
              tickLine={false}
              className="text-xs text-gray-600"
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines for quadrants */}
            <ReferenceLine x={avgTurnover} stroke="#6B7280" strokeDasharray="5 5" strokeOpacity={0.5} />
            <ReferenceLine y={avgMargin} stroke="#6B7280" strokeDasharray="5 5" strokeOpacity={0.5} />
            
            <Scatter 
              data={filteredData} 
              shape={<CustomDot />}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Improved Quadrant Explanations */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Star className="h-4 w-4 text-green-600" />
            <h4 className="font-semibold text-green-800">Stars (High Turnover, High Margin)</h4>
          </div>
          <p className="text-green-700 text-xs">
            High-performing products that generate strong profits and move quickly. 
            Maintain adequate stock levels and monitor for supply chain disruptions.
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <HelpCircle className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold text-blue-800">Question Marks (Low Turnover, High Margin)</h4>
          </div>
          <p className="text-blue-700 text-xs">
            High-margin but slow-moving products. Consider demand generation strategies, 
            marketing campaigns, or bundling with popular items.
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="h-4 w-4 text-yellow-600" />
            <h4 className="font-semibold text-yellow-800">Cash Cows (High Turnover, Low Margin)</h4>
          </div>
          <p className="text-yellow-700 text-xs">
            Fast-moving but low-margin products. Optimize for efficiency and scale. 
            Look for cost reduction opportunities or premium variants.
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-red-600" />
            <h4 className="font-semibold text-red-800">Dogs (Low Turnover, Low Margin)</h4>
          </div>
          <p className="text-red-700 text-xs">
            Underperforming products draining resources. Consider discontinuation, 
            clearance pricing, or product repositioning strategies.
          </p>
        </div>
      </div>
      
      {/* Additional Info */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Average Turnover: {avgTurnover.toFixed(1)}x</span>
          <span>Average Margin: {avgMargin.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};